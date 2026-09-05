"""Authoritative project context for humans and coding agents working on Codyn.

Run ``python agent.py`` for a compact briefing. Update this file whenever a
milestone changes the architecture, operating requirements, or verified state.
"""

PROJECT = {
    "name": "Codyn",
    "product": "Full-context GitHub repository intelligence, review, and security workspace",
    "stack": [
        "Next.js 16 App Router and React 19",
        "TypeScript and Tailwind CSS 4",
        "NextAuth v5 with GitHub OAuth",
        "Prisma 6 with PostgreSQL/Neon",
        "Google Gemini context selection, chat, diagrams, and security analysis",
        "GitHub REST/GraphQL through Octokit",
        "Vercel KV and Blob for optional cache/artifact persistence",
        "Resend for optional transactional email",
        "Vitest, ESLint, and Next.js production validation",
    ],
    "brand": {
        "identity": "Codyn",
        "background": "#0c0c0c",
        "surface": "#121417",
        "accent": "#00d2ff",
        "supporting_blue": "#1769d2",
        "highlight": "#8deaff",
        "tone": "precise, technical, calm, and premium",
    },
    "source_of_truth": (
        "The root Next.js application is the only runtime. repomind-main/ is an ignored, "
        "local upstream snapshot and must never be deployed or treated as a second app."
    ),
    "provenance": (
        "The full product foundation was integrated from the MIT-licensed RepoMind source. "
        "LICENSE and THIRD_PARTY_NOTICES.md preserve the upstream copyright and permission. "
        "Visible product branding, repository links, metadata, prompts, routes, and color tokens "
        "were adapted to Codyn."
    ),
    "architecture": {
        "landing": "src/app/page.tsx and the original Codyn marketing components remain the public entry point.",
        "product_ui": (
            "src/app/dashboard, src/app/chat, src/app/repo, src/app/report, and src/components "
            "provide authenticated history, repository/profile chat, file exploration, diagrams, "
            "scan reports, sharing, and exports."
        ),
        "server": (
            "src/app/actions.ts plus src/app/api contain GitHub, chat-run, dashboard, badge, admin, "
            "email, report, and Mermaid endpoints. /api/repository/chat is the public, revision-grounded "
            "workspace stream; /api/chat persists authenticated conversations; /api/chat/repo and "
            "/api/chat/profile power the richer RepoMind-derived chat surfaces. src/proxy.ts applies "
            "NextAuth and API CORS handling."
        ),
        "analysis": (
            "src/lib/github.ts fetches repository/profile context; generator.ts and search-engine.ts "
            "select files; prompt-builder.ts and gemini.ts run grounded AI workflows; "
            "security-scanner.ts and src/lib/services implement scan, verification, and reporting."
        ),
        "persistence": (
            "Prisma/PostgreSQL stores users, OAuth sessions, conversations, chat runs, scans, share "
            "links, false-positive reviews, analytics, blog posts, and email delivery state. KV/Blob "
            "are optional caching and artifact layers."
        ),
        "content": (
            "Public blog pages prefer PostgreSQL but fall back to bundled posts when DATABASE_URL is "
            "not configured, allowing clean local and CI builds before infrastructure is connected."
        ),
    },
    "routes": [
        "/ — Codyn landing page",
        "/chat and /repo/[owner]/[repo] — profile/repository intelligence",
        "/dashboard, /dashboard/scans, /dashboard/repos, /dashboard/starred, /dashboard/settings",
        "/report/[scan_id] and /report/shared/[token] — reports and signed sharing",
        "/security-scanner plus solution/comparison pages",
        "/blog, /explore, /trending, and /topics/[topic]",
        "/admin, /admin/stats, /admin/blog, and /admin/index",
        "/api/* — authentication, chat, dashboard, reports, badges, admin, and internal jobs",
    ],
    "environment": {
        "core_ai": ["GEMINI_API_KEY", "GEMINI_FILE_SELECTOR_MODEL", "GEMINI_LITE_MODEL", "GEMINI_THINKING_MODEL"],
        "github": ["GITHUB_TOKEN", "AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET", "AUTH_SECRET", "AUTH_TRUST_HOST"],
        "database": ["DATABASE_URL", "DIRECT_URL"],
        "optional_storage": ["KV_REST_API_URL", "KV_REST_API_TOKEN", "BLOB_READ_WRITE_TOKEN"],
        "optional_email": ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET"],
        "operations": ["NEXT_PUBLIC_APP_URL", "ADMIN_GITHUB_USERNAME", "EMAIL_RETRY_JOB_SECRET", "CRON_SECRET"],
    },
    "graceful_degradation": [
        "The application and all static pages build without credentials.",
        "Bundled blog posts are used when PostgreSQL is absent or unavailable.",
        "GitHub works at restrictive anonymous API limits when GITHUB_TOKEN is absent.",
        "AI actions require GEMINI_API_KEY and return explicit configuration errors without it.",
        "Account history, sharing, admin, and durable state require PostgreSQL and the related services.",
    ],
    "delivery_rules": [
        "Preserve the Codyn landing page and cyan/blue visual identity.",
        "Do not expose GitHub, Gemini, database, OAuth, KV, Blob, Resend, or cron secrets to clients.",
        "Keep dynamic Next.js params async and retain src/proxy.ts for Next.js 16.",
        "Use Prisma migrations for schema changes; never mutate production tables ad hoc.",
        "Keep the upstream MIT notice when redistributing substantial imported code.",
        "Run npm run typecheck, npm test, and npm run build before handoff.",
    ],
    "commit_ladder": [
        "45a2bb9 — establish dashboard migration context",
        "719e482 — add the Codyn dashboard shell",
        "2ca7953 — build overview and scan history",
        "6169da2 — connect public repository collections and local history",
        "e23d193 — add revision-pinned repository intelligence",
        "442f54e — connect the landing page and harden the MVP",
        "2c3abb9 — add Next.js 16 agent guidance",
        "e44828a — integrate the complete platform, data model, Codyn identity, and resilient local setup",
        "3443189 — capture the complete operating context and setup guide",
        "0c8b29d — harden local runtime configuration",
    ],
    "verified_state": [
        "TypeScript production typecheck passes.",
        "The imported Vitest suite plus repository-chat regression coverage contains 90 files and 539 tests.",
        "Next.js production build generates more than 300 static/dynamic routes and topic pages.",
        "Prisma Client generation works without local infrastructure by using a CLI-only placeholder URL.",
        "Live checks confirmed GitHub metadata, pinned file reads, quick security triage, the public "
        "repository Gemini stream, and the richer RepoMind-derived repository chat stream.",
    ],
}


def briefing() -> str:
    """Return the high-signal project briefing without third-party packages."""
    lines = [f"{PROJECT['name']}: {PROJECT['product']}", ""]
    lines.append(f"Source of truth: {PROJECT['source_of_truth']}")
    lines.append(f"Provenance: {PROJECT['provenance']}")
    lines.append("\nArchitecture:")
    lines.extend(f"  - {name}: {detail}" for name, detail in PROJECT["architecture"].items())
    lines.append("\nRequired delivery checks:")
    lines.extend(f"  - {rule}" for rule in PROJECT["delivery_rules"])
    lines.append("\nVerified state:")
    lines.extend(f"  - {item}" for item in PROJECT["verified_state"])
    return "\n".join(lines)


if __name__ == "__main__":
    print(briefing())
