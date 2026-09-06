import { prisma } from "@/lib/db";
import { buildDependencyEdges, expandDependencyPaths, type RepositoryDependencyEdge } from "@/lib/repository-dependencies";
import { parseRepositorySource, type ParsedRepositoryFile, type RepositorySymbol } from "@/lib/repository-symbols";
import { isRepositoryIndexingConfigured } from "@/lib/services/repository-analysis-jobs";

export type RepositorySourceFile = {
    path: string;
    sha?: string;
    size?: number;
    content: string;
};

export type PreparedRepositoryFile = RepositorySourceFile & {
    language: "typescript" | "javascript";
    parsed: ParsedRepositoryFile;
};

export type PreparedRepositoryArtifacts = {
    files: PreparedRepositoryFile[];
    dependencies: RepositoryDependencyEdge[];
    processedFiles: number;
    failedFiles: number;
};

function languageForPath(path: string): "typescript" | "javascript" {
    return /\.tsx?$/i.test(path) ? "typescript" : "javascript";
}

export function prepareRepositoryArtifacts(sourceFiles: RepositorySourceFile[]): PreparedRepositoryArtifacts {
    const files = sourceFiles
        .filter((file) => /\.(?:[cm]?[jt]sx?)$/i.test(file.path))
        .map((file) => ({
            ...file,
            language: languageForPath(file.path),
            parsed: parseRepositorySource(file.path, file.content),
        }));
    const dependencies = buildDependencyEdges(files.map((file) => ({ path: file.path, imports: file.parsed.imports })));
    return {
        files,
        dependencies,
        processedFiles: files.filter((file) => !file.parsed.parseError).length,
        failedFiles: files.filter((file) => Boolean(file.parsed.parseError)).length,
    };
}

/** Replaces parser-derived facts for one immutable repository index revision. */
export async function saveRepositoryArtifacts(
    repositoryIndexId: string,
    artifacts: PreparedRepositoryArtifacts,
): Promise<void> {
    await prisma.$transaction(async (tx) => {
        await tx.repositoryDependency.deleteMany({ where: { repositoryIndexId } });
        await tx.repositoryIndexedFile.deleteMany({ where: { repositoryIndexId } });

        if (artifacts.files.length > 0) {
            await tx.repositoryIndexedFile.createMany({
                data: artifacts.files.map((file) => ({
                    repositoryIndexId,
                    path: file.path,
                    sha: file.sha ?? null,
                    size: file.size ?? null,
                    language: file.language,
                    parseStatus: file.parsed.parseError ? "FAILED" : "PARSED",
                    parseError: file.parsed.parseError,
                })),
            });
        }

        const storedFiles = await tx.repositoryIndexedFile.findMany({
            where: { repositoryIndexId },
            select: { id: true, path: true },
        });
        const fileIds = new Map(storedFiles.map((file) => [file.path, file.id]));
        const symbols: Array<RepositorySymbol & { fileId: string }> = [];
        for (const file of artifacts.files) {
            const fileId = fileIds.get(file.path);
            if (!fileId) continue;
            for (const symbol of file.parsed.symbols) symbols.push({ ...symbol, fileId });
        }
        if (symbols.length > 0) {
            await tx.repositorySymbol.createMany({
                data: symbols.map((symbol) => ({
                    fileId: symbol.fileId,
                    name: symbol.name,
                    kind: symbol.kind,
                    exported: symbol.exported,
                    startLine: symbol.startLine,
                    startColumn: symbol.startColumn,
                    endLine: symbol.endLine,
                    endColumn: symbol.endColumn,
                })),
            });
        }
        if (artifacts.dependencies.length > 0) {
            await tx.repositoryDependency.createMany({
                data: artifacts.dependencies.map((dependency) => ({
                    repositoryIndexId,
                    sourcePath: dependency.sourcePath,
                    targetPath: dependency.targetPath,
                    importSource: dependency.importSource,
                    importedNames: dependency.importedNames,
                    isTypeOnly: dependency.isTypeOnly,
                    line: dependency.line,
                })),
            });
        }
        await tx.repositoryIndex.update({
            where: { id: repositoryIndexId },
            data: {
                processedFiles: artifacts.processedFiles,
                failedFiles: artifacts.failedFiles,
                skippedFiles: 0,
            },
        });
    });
}

export async function getRepositoryArtifactView(input: {
    owner: string;
    repo: string;
    revision?: string;
    path?: string;
}) {
    const index = await prisma.repositoryIndex.findFirst({
        where: {
            owner: input.owner.toLowerCase(),
            repo: input.repo.toLowerCase(),
            ...(input.revision ? { revision: input.revision } : {}),
            status: "READY",
        },
        orderBy: { updatedAt: "desc" },
        include: {
            files: {
                where: input.path ? { path: input.path } : undefined,
                include: { symbols: { orderBy: { startLine: "asc" } } },
            },
            dependencies: {
                where: input.path ? { OR: [{ sourcePath: input.path }, { targetPath: input.path }] } : undefined,
                orderBy: { sourcePath: "asc" },
            },
        },
    });
    if (!index) return null;
    return {
        id: index.id,
        owner: index.owner,
        repo: index.repo,
        revision: index.revision,
        status: index.status,
        files: index.files,
        dependencies: index.dependencies,
    };
}

/** Returns one-hop graph context for query retrieval, preserving the requested file-tree boundary. */
export async function getRepositoryRelatedPaths(input: {
    owner: string;
    repo: string;
    question: string;
    fileTree: string[];
    limit?: number;
}): Promise<string[]> {
    // Selection tests and local fallback mode must never attempt network-backed DB access.
    if (process.env.NODE_ENV === "test" || !isRepositoryIndexingConfigured()) return [];
    const terms = input.question.toLowerCase().match(/[a-z0-9_]{3,}/g) ?? [];
    if (!terms.length) return [];
    const index = await prisma.repositoryIndex.findFirst({
        where: { owner: input.owner.toLowerCase(), repo: input.repo.toLowerCase(), status: "READY" },
        orderBy: { updatedAt: "desc" },
        include: { files: { select: { path: true, symbols: { select: { name: true } } } }, dependencies: true },
    });
    if (!index) return [];
    const allowed = new Set(input.fileTree);
    const matches = new Set<string>();
    for (const file of index.files) {
        const haystack = `${file.path} ${file.symbols.map((symbol) => symbol.name).join(" ")}`.toLowerCase();
        if (terms.some((term) => haystack.includes(term))) matches.add(file.path);
    }
    const graphEdges: RepositoryDependencyEdge[] = index.dependencies.map((edge) => ({
        sourcePath: edge.sourcePath,
        targetPath: edge.targetPath,
        importSource: edge.importSource,
        importedNames: Array.isArray(edge.importedNames) ? edge.importedNames.filter((name): name is string => typeof name === "string") : [],
        isTypeOnly: edge.isTypeOnly,
        line: edge.line,
    }));
    return expandDependencyPaths(matches, graphEdges, 2)
        .filter((path) => allowed.has(path))
        .slice(0, input.limit ?? 20);
}
