# Codyn

Codyn is a full-context GitHub repository-intelligence platform. The existing Codyn landing page now opens a complete product workspace with repository and developer-profile chat, file exploration, architecture diagrams, code review, security scanning, durable scan history, report sharing, discovery pages, and administration tools.

The application foundation incorporates MIT-licensed RepoMind source. See [LICENSE](./LICENSE) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for attribution.

## Local setup

1. Install dependencies with `npm install`.
2. Run `npm run setup:local`. This preserves existing credentials and generates a local authentication secret. Add your Gemini key to `.env.local` if needed.
3. Run `npm run dev` and open `http://localhost:3000`.

The site, landing page, public content, and bundled blog posts work without service credentials. Add integrations incrementally:

- `GITHUB_TOKEN` raises GitHub API limits.
- `GEMINI_API_KEY` enables AI chat, analysis, diagrams, and security reasoning.
- `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET`, and `AUTH_TRUST_HOST=true` enable GitHub sign-in.
- `DATABASE_URL` and `DIRECT_URL` enable users, sessions, chat history, scans, reports, sharing, analytics, and admin content.
- Upstash Redis and Blob variables enable shared cache and artifact persistence.
- Resend variables enable welcome and operational email.
- `NEXT_PUBLIC_APP_URL` sets canonical links and the permitted production API origin.

## Database

Generate the client with `npm run prisma:generate`. Apply local migrations with `npm run prisma:migrate`; use `npm run prisma:deploy` in deployment workflows. The Prisma CLI uses a local placeholder only when no database is configured so code generation and CI builds remain possible. Runtime database features still require a real PostgreSQL URL.

## Product surface

- `/` — Codyn marketing landing page
- `/chat` — application start screen; `/chat?q=owner/repo` opens the real RepoMind-derived file explorer and chat, and `/chat?q=username` opens profile intelligence
- `/repo/[owner]/[repo]` — repository information page with links into the analysis application
- `/signin` — GitHub sign-in, or an explanation when account services have not been configured
- `/dashboard/*` — overview, scans, repositories, starred items, and settings
- `/report/[scan_id]` and `/report/shared/[token]` — security reports and signed sharing
- `/security-scanner` — repository scanning workflow
- `/blog`, `/explore`, `/trending`, and `/topics/[topic]` — public content and discovery
- `/admin/*` — protected analytics, indexing, and blog management

## Validation

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` runs the imported unit and integration suite. `npm run build` generates Prisma Client and then performs the Next.js 16 production build.

The landing page and its repository examples open `/chat?q=...` directly. This mounts the original RepoMind `RepoLoader → RepoLayout → ChatInterface` workflow, adapted to Codyn's colors and shell. The former standalone `RepositoryWorkspace` prototype is not the active product UI.

Public source browsing, Lite AI chat, architecture requests, and quick scans work without a database. When no database is configured, chat-run creation explicitly disables server persistence; answers and inline scan results still appear in the real application. Export the conversation to retain a copy. Authenticated history and shared reports require PostgreSQL; deep scans also use Upstash Redis for quotas. Private repository support must be validated with appropriate GitHub access: the inherited analysis backend uses the server `GITHUB_TOKEN`, so OAuth alone does not establish private analysis access.

See [docs/LOCAL_SETUP.md](./docs/LOCAL_SETUP.md) for setup and `npm run setup:local -- --check` for a credentials-presence check that does not print secrets.

See [agent.py](./agent.py) for the complete architecture, environment map, delivery rules, commit ladder, and verified state.
