# Codyn

Codyn is a Next.js repository-intelligence workspace for public GitHub repositories. The existing marketing landing page opens a working dashboard with public repository discovery, a revision-pinned file explorer, structural maps, Gemini answers grounded in selected files, and bounded source/dependency security triage.

## Run locally

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `GEMINI_API_KEY` to enable Ask Codyn. GitHub browsing and security triage work without Gemini.
4. Optionally set a fine-grained, read-only `GITHUB_TOKEN` to increase GitHub API allowance.
5. Set `APP_URL` to the exact deployment origin in production.
6. Run `npm run dev`.

## Validate

- `npm test` checks input handling, file exclusions, security patterns, lockfiles, private-repository rejection, and local state.
- `npm run lint` runs TypeScript checks.
- `npm run build` creates the production build.

## Scope and privacy

- Only public repositories are supported; Codyn rejects a private repository even if the optional server token can read it.
- Chat sends the question, recent in-session messages, selected public files, and a bounded tree to Google Gemini. Chat is not persisted.
- Saved repositories, preferences, and at most 30 scan reports live only in browser local storage.
- Security output is review triage, not vulnerability verification or certification. Each report records coverage and limitations.
- Source reads are pinned to a commit per workspace load and exclude binary, oversized, symlinked, build-output, and credential-named files.

See `agent.py` for the implementation context and roadmap.
