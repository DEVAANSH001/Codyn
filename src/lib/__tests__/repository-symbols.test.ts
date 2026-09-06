import { describe, expect, it } from "vitest";
import { parseRepositorySource } from "@/lib/repository-symbols";

describe("parseRepositorySource", () => {
    it("extracts exported TypeScript symbols, imports, and explicit exports", () => {
        const parsed = parseRepositorySource("src/api.ts", `
            import type { Request } from "./types";
            import main, * as utils from "./utils";
            export interface ApiResponse { ok: boolean }
            export const handler = async () => main();
            class InternalService {}
            export { InternalService as Service };
        `);

        expect(parsed.parseError).toBeNull();
        expect(parsed.symbols).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "ApiResponse", kind: "interface", exported: true }),
            expect.objectContaining({ name: "handler", kind: "function", exported: true }),
            expect.objectContaining({ name: "InternalService", kind: "class", exported: false }),
        ]));
        expect(parsed.imports).toEqual([
            expect.objectContaining({ source: "./types", importedNames: ["Request"], isTypeOnly: true }),
            expect.objectContaining({ source: "./utils", importedNames: ["default", "*"] }),
        ]);
        expect(parsed.exports).toEqual([
            expect.objectContaining({ name: "Service", localName: "InternalService", isReExport: false }),
        ]);
    });

    it("extracts destructured bindings and default exports", () => {
        const parsed = parseRepositorySource("src/config.ts", `
            const { host, nested: { port } } = config;
            export default function bootstrap() { return host + port; }
        `);

        expect(parsed.symbols).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "host", kind: "variable" }),
            expect.objectContaining({ name: "port", kind: "variable" }),
            expect.objectContaining({ name: "bootstrap", kind: "function", exported: true }),
        ]));
        expect(parsed.exports).toEqual([expect.objectContaining({ name: "default", localName: "bootstrap", isDefault: true })]);
    });

    it("returns an explicit coverage error for unsupported or malformed source", () => {
        expect(parseRepositorySource("README.md", "# Codyn").parseError).toContain("JavaScript");
        expect(parseRepositorySource("src/broken.ts", "const = ;").parseError).toBeTruthy();
    });
});
