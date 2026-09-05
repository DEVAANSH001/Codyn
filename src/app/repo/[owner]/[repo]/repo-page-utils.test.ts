import { describe, expect, it } from "vitest";
import { normalizeReadmeForPreview } from "./repo-page-utils";

describe("normalizeReadmeForPreview", () => {
    it("returns an empty string for nullish input", () => {
        expect(normalizeReadmeForPreview(null)).toBe("");
        expect(normalizeReadmeForPreview(undefined)).toBe("");
    });

    it("moves badges that appear inline with the h1 to the next paragraph", () => {
        const readme = "# Codyn [![build](https://img.shields.io/badge/build-passing-brightgreen)]\ntext";
        const normalized = normalizeReadmeForPreview(readme);

        expect(normalized).toContain("# Codyn\n\n[![build]");
    });

    it("keeps markdown unchanged when there is no inline badge pattern", () => {
        const readme = "# Codyn\n\nSome plain description.";
        expect(normalizeReadmeForPreview(readme)).toBe(readme);
    });
});
