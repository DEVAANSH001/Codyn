import path from "node:path";
import type { RepositoryImport } from "@/lib/repository-symbols";

export type RepositoryDependencyEdge = {
    sourcePath: string;
    targetPath: string | null;
    importSource: string;
    importedNames: string[];
    isTypeOnly: boolean;
    line: number;
};

const RESOLVABLE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs"];

function normalizePath(value: string): string {
    return value.replace(/\\/g, "/").replace(/^\.\//, "");
}

function candidatesFor(sourcePath: string, importSource: string): string[] {
    const directory = path.posix.dirname(sourcePath);
    const bareTarget = normalizePath(path.posix.normalize(path.posix.join(directory, importSource)));
    const extension = path.posix.extname(bareTarget);

    if (extension) return [bareTarget];
    return [
        ...RESOLVABLE_EXTENSIONS.map((item) => `${bareTarget}${item}`),
        ...RESOLVABLE_EXTENSIONS.map((item) => `${bareTarget}/index${item}`),
    ];
}

/** Resolves only relative imports inside the analyzed repository. */
export function resolveLocalImport(
    sourcePath: string,
    importSource: string,
    repositoryPaths: Iterable<string>,
): string | null {
    if (!importSource.startsWith(".")) return null;
    const paths = new Set(Array.from(repositoryPaths, normalizePath));
    return candidatesFor(normalizePath(sourcePath), importSource).find((candidate) => paths.has(candidate)) ?? null;
}

export function buildDependencyEdges(
    files: Array<{ path: string; imports: RepositoryImport[] }>,
): RepositoryDependencyEdge[] {
    const repositoryPaths = files.map((file) => file.path);
    return files.flatMap((file) => file.imports.map((entry) => ({
        sourcePath: file.path,
        targetPath: resolveLocalImport(file.path, entry.source, repositoryPaths),
        importSource: entry.source,
        importedNames: entry.importedNames,
        isTypeOnly: entry.isTypeOnly,
        line: entry.line,
    })));
}

export function dependencyNeighbors(
    path: string,
    edges: RepositoryDependencyEdge[],
): { imports: string[]; importedBy: string[] } {
    const imports = new Set<string>();
    const importedBy = new Set<string>();
    for (const edge of edges) {
        if (edge.sourcePath === path && edge.targetPath) imports.add(edge.targetPath);
        if (edge.targetPath === path) importedBy.add(edge.sourcePath);
    }
    return { imports: Array.from(imports).sort(), importedBy: Array.from(importedBy).sort() };
}

/** Expands both upstream and downstream dependency neighbors to a bounded depth. */
export function expandDependencyPaths(
    seeds: Iterable<string>,
    edges: RepositoryDependencyEdge[],
    maxDepth = 2,
): string[] {
    const visited = new Set(seeds);
    let frontier = new Set(seeds);
    for (let depth = 0; depth < maxDepth && frontier.size > 0; depth += 1) {
        const next = new Set<string>();
        for (const edge of edges) {
            if (frontier.has(edge.sourcePath) && edge.targetPath && !visited.has(edge.targetPath)) next.add(edge.targetPath);
            if (edge.targetPath && frontier.has(edge.targetPath) && !visited.has(edge.sourcePath)) next.add(edge.sourcePath);
        }
        for (const path of next) visited.add(path);
        frontier = next;
    }
    return Array.from(visited);
}
