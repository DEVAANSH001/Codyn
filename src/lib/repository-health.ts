import type { RepositoryDependencyEdge } from "@/lib/repository-dependencies";

export type RepositoryHealthReport = {
    score: number;
    grade: "A" | "B" | "C" | "D" | "E";
    metrics: { sourceFiles: number; testFiles: number; documentationFiles: number; dependencyEdges: number; circularDependencies: string[][] };
    limitations: string[];
};

function findCycles(edges: RepositoryDependencyEdge[]): string[][] {
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) {
        if (!edge.targetPath) continue;
        adjacency.set(edge.sourcePath, [...(adjacency.get(edge.sourcePath) ?? []), edge.targetPath]);
    }
    const cycles: string[][] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (node: string, stack: string[]) => {
        if (visiting.has(node)) {
            const start = stack.indexOf(node);
            if (start >= 0) cycles.push([...stack.slice(start), node]);
            return;
        }
        if (visited.has(node)) return;
        visiting.add(node);
        for (const target of adjacency.get(node) ?? []) visit(target, [...stack, node]);
        visiting.delete(node);
        visited.add(node);
    };
    for (const node of adjacency.keys()) visit(node, []);
    return cycles;
}

export function computeRepositoryHealth(paths: string[], dependencies: RepositoryDependencyEdge[] = []): RepositoryHealthReport {
    const sourceFiles = paths.filter((path) => /\.(?:[cm]?[jt]sx?|py|go|java|rb|php)$/i.test(path)).length;
    const testFiles = paths.filter((path) => /(?:^|\/)(?:__tests__\/)?[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$|(?:^|\/)(?:test|tests)\//i.test(path)).length;
    const documentationFiles = paths.filter((path) => /(^|\/)(readme|contributing|architecture|docs?)(?:\.|\/|$)|\.mdx?$/i.test(path)).length;
    const circularDependencies = findCycles(dependencies);
    const testRatio = sourceFiles ? testFiles / sourceFiles : 0;
    let score = 60;
    if (documentationFiles > 0) score += 15;
    if (testRatio >= 0.25) score += 20;
    else if (testRatio >= 0.1) score += 10;
    else if (testFiles > 0) score += 5;
    score -= Math.min(25, circularDependencies.length * 10);
    score = Math.max(0, Math.min(100, score));
    const grade = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : score >= 40 ? "D" : "E";
    return {
        score,
        grade,
        metrics: { sourceFiles, testFiles, documentationFiles, dependencyEdges: dependencies.length, circularDependencies },
        limitations: [
            "This is a structural signal, not a code-quality, coverage, security, or runtime assessment.",
            "Dependency cycles are calculated only from indexed, resolved JavaScript/TypeScript local imports.",
        ],
    };
}
