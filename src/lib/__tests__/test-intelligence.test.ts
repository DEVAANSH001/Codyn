import { describe, expect, it } from "vitest";
import { mapSourceToTests } from "@/lib/test-intelligence";

describe("mapSourceToTests", () => {
    it("finds co-located tests with high confidence", () => {
        expect(mapSourceToTests("src/lib/auth.ts", ["src/lib/auth.test.ts", "src/lib/cache.spec.ts"])).toEqual({
            sourcePath: "src/lib/auth.ts", relatedTests: ["src/lib/auth.test.ts"], confidence: "high",
        });
    });
    it("reports the absence of a heuristic match without inventing coverage", () => {
        expect(mapSourceToTests("src/lib/auth.ts", ["tests/cache.test.ts"]).confidence).toBe("none");
    });
});
