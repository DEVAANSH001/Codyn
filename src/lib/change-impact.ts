import type { RepositoryDependencyEdge } from "@/lib/repository-dependencies";

export type ChangeImpact = {
    changedPath: string;
    directDependencies: string[];
    directDependents: string[];
    transitiveDependents: string[];
    risk: "low" | "medium" | "high";
    reasons: string[];
};

export function analyzeChangeImpact(changedPath: string, edges: RepositoryDependencyEdge[]): ChangeImpact {
    const directDependencies = Array.from(new Set(edges.filter((edge) => edge.sourcePath === changedPath && edge.targetPath).map((edge) => edge.targetPath!))).sort();
    const reverse = new Map<string, string[]>();
    for (const edge of edges) {
        if (!edge.targetPath) continue;
        reverse.set(edge.targetPath, [...(reverse.get(edge.targetPath) ?? []), edge.sourcePath]);
    }
    const directDependents = Array.from(new Set(reverse.get(changedPath) ?? [])).sort();
    const visited = new Set<string>([changedPath]);
    let frontier = new Set(directDependents);
    for (const item of frontier) visited.add(item);
    while (frontier.size > 0) {
        const next = new Set<string>();
        for (const file of frontier) {
            for (const dependent of reverse.get(file) ?? []) if (!visited.has(dependent)) next.add(dependent);
        }
        for (const item of next) visited.add(item);
        frontier = next;
    }
    const transitiveDependents = Array.from(visited).filter((path) => path !== changedPath).sort();
    const affectedCount = transitiveDependents.length;
    const risk = affectedCount >= 10 ? "high" : affectedCount >= 3 ? "medium" : "low";
    const reasons = [
        `${directDependents.length} direct importer${directDependents.length === 1 ? "" : "s"}.`,
        `${affectedCount} transitive dependent${affectedCount === 1 ? "" : "s"}.`,
        directDependencies.length === 1 ? "1 direct dependency to review." : `${directDependencies.length} direct dependencies to review.`,
    ];
    return { changedPath, directDependencies, directDependents, transitiveDependents, risk, reasons };
}
