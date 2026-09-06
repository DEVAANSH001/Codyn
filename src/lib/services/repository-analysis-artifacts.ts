import { prisma } from "@/lib/db";
import { buildDependencyEdges, type RepositoryDependencyEdge } from "@/lib/repository-dependencies";
import { parseRepositorySource, type ParsedRepositoryFile, type RepositorySymbol } from "@/lib/repository-symbols";

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
