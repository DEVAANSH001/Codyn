# Codyn deployment setup

Set these variables in Vercel Project Settings for each environment you deploy:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.example
AUTH_SECRET=<long-random-secret>
GEMINI_API_KEY=<google-gemini-key>
GITHUB_TOKEN=<github-token>
AUTH_GITHUB_ID=<github-oauth-client-id>
AUTH_GITHUB_SECRET=<github-oauth-client-secret>
DATABASE_URL=<pooled-neon-connection-url>
DIRECT_URL=<direct-neon-connection-url>
UPSTASH_REDIS_REST_URL=<upstash-rest-url>
UPSTASH_REDIS_REST_TOKEN=<upstash-rest-token>
```

Use `DATABASE_URL` for runtime Prisma queries and the pooled Neon URL. Use
`DIRECT_URL` for `prisma migrate deploy` and the non-pooled Neon URL. The
normal Vercel build runs `prisma generate`, so it does not require
`DIRECT_URL`; migrations do.

GitHub OAuth must use `https://your-domain.example/api/auth/callback/github`
as its callback URL. `BLOB_READ_WRITE_TOKEN` is optional for blob artifacts,
and the Resend and admin variables in `.env.example` are optional integrations.

Public repository chat can run with `GEMINI_API_KEY` and `AUTH_SECRET`; the
database and Upstash values enable saved history, shared quotas, caching, and
authenticated features.
