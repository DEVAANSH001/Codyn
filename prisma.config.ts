
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

if (!process.env.VERCEL) {
  config({ path: ".env.local" });
  config();
  // Keep code generation and local builds available before infrastructure is
  // connected. Runtime database calls still fail clearly until a real URL is set.
  process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/codyn";
  process.env.DIRECT_URL ??= process.env.DATABASE_URL;
}

const prismaCliDatabaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const isMigrationCommand = process.argv.includes("migrate");

if (process.env.VERCEL && isMigrationCommand && !process.env.DIRECT_URL) {
  throw new Error(
    "DIRECT_URL is required on Vercel for Prisma migrations. Use the non-pooled Neon connection URL.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx scripts/seed-blog.ts",
  },
  engine: "classic",
  datasource: {
    // Avoid running migrations through pooled URLs; advisory locks require a direct connection.
    // `prisma generate` only needs a datasource shape; migrations must use
    // DIRECT_URL so pooled connections never hold advisory locks.
    url: prismaCliDatabaseUrl ?? "postgresql://postgres:postgres@localhost:5432/codyn",
  },
});
