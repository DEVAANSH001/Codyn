import type { RepositoryArtifactView } from "@/lib/services/repository-analysis-artifacts";

export type ArchitectureGraph = {
    revision: string;
    nodes: Array<{ path: string; symbolCount: number }>;
    edges: Array<{ source: string; target: string }>;
    truncated: boolean;
};

/** Produces a bounded, self-contained graph suitable for client-side rendering. */
export function buildArchitectureGraph(artifacts: RepositoryArtifactView, nodeLimit = 80, edgeLimit = 180): ArchitectureGraph {
    const nodes = artifacts.files.slice(0, nodeLimit).map((file) => ({ path: file.path, symbolCount: file.symbols.length }));
    const allowedPaths = new Set(nodes.map((node) => node.path));
    const edges = artifacts.dependencies
        .filter((edge) => edge.targetPath && allowedPaths.has(edge.sourcePath) && allowedPaths.has(edge.targetPath))
        .slice(0, edgeLimit)
        .map((edge) => ({ source: edge.sourcePath, target: edge.targetPath! }));

    return { revision: artifacts.revision, nodes, edges, truncated: artifacts.files.length > nodes.length };
}
