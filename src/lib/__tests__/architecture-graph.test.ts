import { describe, expect, it } from "vitest";
import { buildArchitectureGraph } from "@/lib/architecture-graph";
import type { RepositoryArtifactView } from "@/lib/services/repository-analysis-artifacts";

const artifacts = {
    revision: "tree-sha",
    files: [
        { path: "src/a.ts", symbols: [{ name: "a" }] },
        { path: "src/b.ts", symbols: [] },
        { path: "src/c.ts", symbols: [{ name: "c" }, { name: "d" }] },
    ],
    dependencies: [
        { sourcePath: "src/a.ts", targetPath: "src/b.ts" },
        { sourcePath: "src/b.ts", targetPath: "src/c.ts" },
        { sourcePath: "src/c.ts", targetPath: null },
    ],
} as unknown as RepositoryArtifactView;

describe("buildArchitectureGraph", () => {
    it("keeps only visible local dependency edges and reports truncation", () => {
        expect(buildArchitectureGraph(artifacts, 2, 10)).toEqual({
            revision: "tree-sha",
            nodes: [{ path: "src/a.ts", symbolCount: 1 }, { path: "src/b.ts", symbolCount: 0 }],
            edges: [{ source: "src/a.ts", target: "src/b.ts" }],
            truncated: true,
        });
    });

    it("bounds the number of rendered edges", () => {
        expect(buildArchitectureGraph(artifacts, 3, 1).edges).toEqual([{ source: "src/a.ts", target: "src/b.ts" }]);
    });
});
