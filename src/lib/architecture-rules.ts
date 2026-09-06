import type { RepositoryDependencyEdge } from "@/lib/repository-dependencies";

export type ArchitectureViolation = {
    type: "circular_dependency" | "layer_violation";
    severity: "medium" | "high";
    message: string;
    paths: string[];
};

function layerFor(path: string): "presentation" | "api" | "data" | "infrastructure" | "domain" | "other" {
    const lower = path.toLowerCase();
    if (/(^|\/)(components|pages|ui|views)\//.test(lower)) return "presentation";
    if (/(^|\/)api\//.test(lower)) return "api";
    if (/(^|\/)(prisma|db|repositories?|persistence)\//.test(lower)) return "data";
    if (/(^|\/)(worker|infra|infrastructure|deploy)\//.test(lower)) return "infrastructure";
    if (/(^|\/)(lib|services|domain)\//.test(lower)) return "domain";
    return "other";
}

function cycles(edges: RepositoryDependencyEdge[]): string[][] {
    const adjacency = new Map<string, string[]>();
    for (const edge of edges) if (edge.targetPath) adjacency.set(edge.sourcePath, [...(adjacency.get(edge.sourcePath) ?? []), edge.targetPath]);
    const result: string[][] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const walk = (node: string, stack: string[]) => {
        if (visiting.has(node)) { const start = stack.indexOf(node); if (start >= 0) result.push([...stack.slice(start), node]); return; }
        if (visited.has(node)) return;
        visiting.add(node);
        for (const target of adjacency.get(node) ?? []) walk(target, [...stack, node]);
        visiting.delete(node); visited.add(node);
    };
    for (const node of adjacency.keys()) walk(node, []);
    return result;
}

/** Applies conservative default boundaries. Teams can later add explicit repository policy files. */
export function analyzeArchitectureRules(edges: RepositoryDependencyEdge[]): ArchitectureViolation[] {
    const violations: ArchitectureViolation[] = cycles(edges).map((paths) => ({
        type: "circular_dependency", severity: "high", paths,
        message: `Circular local dependency: ${paths.join(" → ")}`,
    }));
    for (const edge of edges) {
        if (!edge.targetPath) continue;
        const sourceLayer = layerFor(edge.sourcePath);
        const targetLayer = layerFor(edge.targetPath);
        const violates = (sourceLayer === "presentation" && ["data", "infrastructure"].includes(targetLayer)) || (sourceLayer === "api" && targetLayer === "presentation");
        if (violates) violations.push({
            type: "layer_violation", severity: "medium", paths: [edge.sourcePath, edge.targetPath],
            message: `${sourceLayer} directly imports ${targetLayer}: ${edge.sourcePath} → ${edge.targetPath}`,
        });
    }
    return violations;
}
