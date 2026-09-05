import { describe, expect, it } from "vitest";
import { emojifyGitHubShortcodes } from "@/lib/github-emoji";

describe("emojifyGitHubShortcodes", () => {
    it("converts GitHub-style shortcodes into emoji glyphs", () => {
        expect(emojifyGitHubShortcodes(":cake: Desktop utility")).toBe("🍰 Desktop utility");
    });

    it("preserves nullish and plain text values", () => {
        expect(emojifyGitHubShortcodes(null)).toBeNull();
        expect(emojifyGitHubShortcodes(undefined)).toBeNull();
        expect(emojifyGitHubShortcodes("Plain description")).toBe("Plain description");
    });
});

