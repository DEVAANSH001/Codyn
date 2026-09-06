import { describe, expect, it } from "vitest";
import { prepareRepositoryArtifacts } from "@/lib/services/repository-analysis-artifacts";

describe("prepareRepositoryArtifacts", () => {
    it("prepares parsable files and dependencies while preserving failures", () => {
        const artifacts = prepareRepositoryArtifacts([
            { path: "src/index.ts", sha: "one", content: 'import { service } from "./service"; export const run = () => service();' },
            { path: "src/service.ts", sha: "two", content: "export function service() {}" },
            { path: "src/broken.ts", sha: "three", content: "const = ;" },
            { path: "README.md", sha: "four", content: "Ignored by the JS/TS parser." },
        ]);

        expect(artifacts.files).toHaveLength(3);
        expect(artifacts.processedFiles).toBe(2);
        expect(artifacts.failedFiles).toBe(1);
        expect(artifacts.dependencies).toEqual([
            expect.objectContaining({ sourcePath: "src/index.ts", targetPath: "src/service.ts", importedNames: ["service"] }),
        ]);
        expect(artifacts.files.find((file) => file.path === "src/broken.ts")?.parsed.parseError).toBeTruthy();
    });
});
