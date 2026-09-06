import { describe, expect, it } from "vitest";
import { buildDependencyEdges, dependencyNeighbors, expandDependencyPaths, resolveLocalImport } from "@/lib/repository-dependencies";

describe("repository dependency resolution", () => {
    const paths = ["src/app/page.tsx", "src/lib/auth.ts", "src/lib/utils/index.ts", "src/types.ts"];

    it("resolves relative extensions and index modules without resolving packages", () => {
        expect(resolveLocalImport("src/app/page.tsx", "../lib/auth", paths)).toBe("src/lib/auth.ts");
        expect(resolveLocalImport("src/app/page.tsx", "../lib/utils", paths)).toBe("src/lib/utils/index.ts");
        expect(resolveLocalImport("src/app/page.tsx", "react", paths)).toBeNull();
        expect(resolveLocalImport("src/app/page.tsx", "../missing", paths)).toBeNull();
    });

    it("builds directed edges and bidirectional neighbor views", () => {
        const edges = buildDependencyEdges([
            {
                path: "src/app/page.tsx",
                imports: [
                    { source: "../lib/auth", importedNames: ["getUser"], isTypeOnly: false, line: 1 },
                    { source: "react", importedNames: ["default"], isTypeOnly: false, line: 2 },
                ],
            },
            {
                path: "src/lib/auth.ts",
                imports: [{ source: "../types", importedNames: ["User"], isTypeOnly: true, line: 1 }],
            },
            { path: "src/types.ts", imports: [] },
        ]);

        expect(edges).toEqual(expect.arrayContaining([
            expect.objectContaining({ sourcePath: "src/app/page.tsx", targetPath: "src/lib/auth.ts" }),
            expect.objectContaining({ sourcePath: "src/app/page.tsx", targetPath: null, importSource: "react" }),
            expect.objectContaining({ sourcePath: "src/lib/auth.ts", targetPath: "src/types.ts", isTypeOnly: true }),
        ]));
        expect(dependencyNeighbors("src/lib/auth.ts", edges)).toEqual({
            imports: ["src/types.ts"],
            importedBy: ["src/app/page.tsx"],
        });
    });

    it("expands bounded upstream and downstream dependency paths", () => {
        const edges = [
            { sourcePath: "a.ts", targetPath: "b.ts", importSource: "./b", importedNames: [], isTypeOnly: false, line: 1 },
            { sourcePath: "b.ts", targetPath: "c.ts", importSource: "./c", importedNames: [], isTypeOnly: false, line: 1 },
            { sourcePath: "c.ts", targetPath: "d.ts", importSource: "./d", importedNames: [], isTypeOnly: false, line: 1 },
        ];
        expect(expandDependencyPaths(["b.ts"], edges, 1).sort()).toEqual(["a.ts", "b.ts", "c.ts"]);
        expect(expandDependencyPaths(["b.ts"], edges, 2).sort()).toEqual(["a.ts", "b.ts", "c.ts", "d.ts"]);
    });
});
