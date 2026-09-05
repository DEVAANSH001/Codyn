import * as emoji from "node-emoji";

/**
 * GitHub API repository/profile descriptions may contain shortcode syntax
 * like ":cake:" instead of native emoji glyphs. Convert those shortcodes
 * into display-ready Unicode so UI text matches what users expect on GitHub.
 */
export function emojifyGitHubShortcodes(text: string | null | undefined): string | null {
    if (!text) return null;
    return emoji.emojify(text);
}
