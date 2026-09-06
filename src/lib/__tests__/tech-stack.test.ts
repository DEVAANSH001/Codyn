import { describe, expect, it } from "vitest";
import { detectTechStack } from "@/lib/tech-stack";

describe("detectTechStack", () => {
    it("grounds technologies in language data, manifests, and infrastructure files", () => {
        const report = detectTechStack({
            languages: { TypeScript: 1000 },
            files: [
                { path: "package.json", content: JSON.stringify({ dependencies: { next: "16.3.4", react: "19.2.0", "@prisma/client": "6.19.2" } }) },
                { path: "Dockerfile" },
                { path: "prisma/schema.prisma" },
            ],
        });
        expect(report.technologies).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: "TypeScript", category: "language" }),
            expect.objectContaining({ name: "Next.js", version: "16.3.4", evidence: "package.json" }),
            expect.objectContaining({ name: "Prisma", category: "database" }),
            expect.objectContaining({ name: "Docker", category: "infrastructure" }),
        ]));
    });

    it("does not invent technologies from invalid manifests", () => {
        expect(detectTechStack({ files: [{ path: "package.json", content: "not-json" }] }).technologies).toEqual([]);
    });
});
