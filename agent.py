"""Living project context for humans and coding agents working on Codyn.

Run ``python agent.py`` for a concise project briefing. Keep this file updated
when a milestone materially changes the product architecture or delivery state.
"""

PROJECT = {
    "name": "Codyn",
    "product": "AI-native GitHub repository intelligence and security workspace",
    "stack": [
        "Next.js 16 App Router",
        "React 19",
        "TypeScript",
        "Tailwind CSS 4",
        "Motion",
        "Lucide icons",
        "Google Gemini",
    ],
    "brand": {
        "background": "#0c0c0c",
        "accent": "#00d2ff",
        "supporting_blue": "#1769d2",
        "surface": "translucent near-black glass",
        "tone": "precise, technical, calm, and premium",
    },
    "source_of_truth": "The root Next.js app is the only Codyn application.",
    "reference": (
        "repomind-main/ is a local, git-ignored MIT-licensed product reference. "
        "It must not become a second runtime or be committed wholesale."
    ),
    "product_direction": (
        "Keep the existing Codyn landing page. Rebuild RepoMind's dashboard "
        "dashboard and repository-understanding journeys as native Codyn routes, "
        "using Codyn copy, logo, cyan/blue tokens, and current dependencies."
    ),
    "delivery_rules": [
        "Work in reviewable milestone commits rather than one monolithic change.",
        "Preserve the landing page unless a milestone explicitly integrates it.",
        "Prefer real public GitHub data with graceful sample/empty states.",
        "Keep core navigation responsive and keyboard accessible.",
        "Do not expose Gemini or GitHub credentials to client components.",
        "Run TypeScript checks and a production build before final handoff.",
    ],
    "commit_ladder": [
        "1. Document architecture and isolate the RepoMind reference.",
        "2. Add the Codyn dashboard shell and shared visual system.",
        "3. Build overview, scan history, and local activity state.",
        "4. Build repository and starred-repository collections.",
        "5. Build the repository intelligence workspace and server APIs.",
        "6. Connect the landing page and complete responsive/build validation.",
    ],
    "implemented": [
        "Responsive overview, scan history, repository, saved-repository, and settings views.",
        "Live public GitHub metadata, revision-pinned tree/source previews, structure map, and recent commits.",
        "Streaming Gemini chat grounded in bounded, question-ranked public source context.",
        "Deterministic review candidates plus exact-version npm OSV advisory lookups.",
        "Device-local bookmarks, preferences, up to 30 reports, and JSON/Markdown export.",
        "Automated checks for parsing, exclusions, false claims, lockfiles, private data, and storage.",
    ],
    "intentional_limits": [
        "Public repositories only; no private-repository OAuth.",
        "Browser-local state only; no account, cloud sync, billing, team workspace, or database.",
        "AI chat needs a server GEMINI_API_KEY and sends selected public context to Google Gemini.",
        "Security output is bounded triage, not full static analysis, exploit verification, or certification.",
        "Architecture view is structural; deeper dependency relationships come from source-grounded chat.",
    ],
    "current_state": (
        "Milestones 1-6 form a complete public-repository intelligence MVP. The next "
        "phase is private repositories and server-backed accounts, requiring an explicit "
        "identity, storage, deployment, and credential decision."
    ),
}


def briefing() -> str:
    """Return a readable briefing without requiring third-party packages."""
    lines = [f"{PROJECT['name']}: {PROJECT['product']}", ""]
    lines.append(f"Direction: {PROJECT['product_direction']}")
    lines.append(f"Current state: {PROJECT['current_state']}")
    lines.append("\nCommit ladder:")
    lines.extend(f"  {step}" for step in PROJECT["commit_ladder"])
    lines.append("\nDelivery rules:")
    lines.extend(f"  - {rule}" for rule in PROJECT["delivery_rules"])
    return "\n".join(lines)


if __name__ == "__main__":
    print(briefing())
