import { describe, expect, it } from "vitest";
import { analyzeChangeImpact } from "@/lib/change-impact";

describe("analyzeChangeImpact", () => {
    it("traverses importers transitively and reports a transparent risk", () => {
        const result = analyzeChangeImpact("src/core.ts", [
            { sourcePath: "src/service.ts", targetPath: "src/core.ts", importSource: "./core", importedNames: [], isTypeOnly: false, line: 1 },
            { sourcePath: "src/page.tsx", targetPath: "src/service.ts", importSource: "./service", importedNames: [], isTypeOnly: false, line: 1 },
            { sourcePath: "src/core.ts", targetPath: "src/types.ts", importSource: "./types", importedNames: [], isTypeOnly: true, line: 1 },
        ]);
        expect(result).toMatchObject({
            directDependencies: ["src/types.ts"],
            directDependents: ["src/service.ts"],
            transitiveDependents: ["src/page.tsx", "src/service.ts"],
            risk: "low",
        });
    });
});
