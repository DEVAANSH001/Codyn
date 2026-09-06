import { describe, expect, it } from "vitest";
import { selectIndexableSourceFiles } from "@/lib/services/repository-index-worker";

describe("repository-index-worker", () => {
    it("selects only safe JavaScript and TypeScript source files", () => {
        const files = selectIndexableSourceFiles([
            { path: "src/app.ts", type: "blob" as const, mode: "100644", size: 100, sha: "a" },
            { path: "src/page.tsx", type: "blob" as const, mode: "100644", size: 100, sha: "b" },
            { path: "README.md", type: "blob" as const, mode: "100644", size: 100, sha: "c" },
            { path: ".env", type: "blob" as const, mode: "100644", size: 100, sha: "d" },
            { path: "src/link.ts", type: "blob" as const, mode: "120000", size: 100, sha: "e" },
        ]);

        expect(files.map((file) => file.path)).toEqual(["src/app.ts", "src/page.tsx"]);
    });
});
