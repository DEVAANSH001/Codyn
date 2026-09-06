import { describe, expect, it } from "vitest";
import { analyzeArchitectureRules } from "@/lib/architecture-rules";

describe("analyzeArchitectureRules", () => {
    it("reports cycles and conservative presentation/data layer violations", () => {
        const result = analyzeArchitectureRules([
            { sourcePath: "src/components/Profile.tsx", targetPath: "src/db/user.ts", importSource: "../db/user", importedNames: [], isTypeOnly: false, line: 1 },
            { sourcePath: "src/lib/a.ts", targetPath: "src/lib/b.ts", importSource: "./b", importedNames: [], isTypeOnly: false, line: 1 },
            { sourcePath: "src/lib/b.ts", targetPath: "src/lib/a.ts", importSource: "./a", importedNames: [], isTypeOnly: false, line: 1 },
        ]);
        expect(result).toEqual(expect.arrayContaining([
            expect.objectContaining({ type: "layer_violation", paths: ["src/components/Profile.tsx", "src/db/user.ts"] }),
            expect.objectContaining({ type: "circular_dependency", paths: ["src/lib/a.ts", "src/lib/b.ts", "src/lib/a.ts"] }),
        ]));
    });
});
