import { describe, expect, it } from "vitest";
import { computeRepositoryHealth } from "@/lib/repository-health";

describe("computeRepositoryHealth", () => {
    it("reports structural metrics and dependency cycles without overstating coverage", () => {
        const report = computeRepositoryHealth(
            ["README.md", "src/a.ts", "src/b.ts", "src/a.test.ts"],
            [
                { sourcePath: "src/a.ts", targetPath: "src/b.ts", importSource: "./b", importedNames: [], isTypeOnly: false, line: 1 },
                { sourcePath: "src/b.ts", targetPath: "src/a.ts", importSource: "./a", importedNames: [], isTypeOnly: false, line: 1 },
            ],
        );
        expect(report.metrics).toMatchObject({ sourceFiles: 3, testFiles: 1, documentationFiles: 1, dependencyEdges: 2 });
        expect(report.metrics.circularDependencies).toEqual([["src/a.ts", "src/b.ts", "src/a.ts"]]);
        expect(report.score).toBeLessThan(100);
        expect(report.limitations).toHaveLength(2);
    });
});
