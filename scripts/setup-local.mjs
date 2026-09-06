import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const LOCAL_DEFAULTS = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  AUTH_TRUST_HOST: "true",
};

export function hasConfiguredValue(value) {
  return typeof value === "string"
    && value.trim().length > 0
    && !/^(your_|replace_with_)/i.test(value.trim());
}

export function planLocalSetup(environment, createSecret = () => randomBytes(32).toString("base64url")) {
  const additions = {};
  // Preserve every existing definition, including deliberately empty values.
  // Empty values and sample placeholders are reported for the user to update.
  for (const [name, value] of Object.entries(LOCAL_DEFAULTS)) {
    if (environment[name] === undefined) additions[name] = value;
  }
  if (environment.AUTH_SECRET === undefined && !hasConfiguredValue(environment.NEXTAUTH_SECRET)) {
    additions.AUTH_SECRET = createSecret();
  }
  return additions;
}

export function appendLocalDefaults(envPath, additions) {
  const entries = Object.entries(additions);
  if (entries.length === 0) return;
  const existing = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const newline = existing.includes("\r\n") ? "\r\n" : "\n";
  const separator = existing.length > 0 && !existing.endsWith("\n") ? newline : "";
  const lines = entries.map(([name, value]) => `${name}="${value}"`).join(newline);
  appendFileSync(envPath, `${separator}${newline}# Local defaults added by npm run setup:local${newline}${lines}${newline}`, { mode: 0o600 });
}

export function inspectLocalSetup(environment) {
  const missing = (names) => names.filter((name) => !hasConfiguredValue(environment[name]));
  const local = missing(["NEXT_PUBLIC_APP_URL", "AUTH_TRUST_HOST"]);
  if (!hasConfiguredValue(environment.AUTH_SECRET) && !hasConfiguredValue(environment.NEXTAUTH_SECRET)) {
    local.push("AUTH_SECRET");
  }
  return [
    { name: "Local app defaults", missing: local, required: true },
    { name: "Public repository AI chat and AI analysis", missing: missing(["GEMINI_API_KEY"]), required: true },
    { name: "GitHub sign-in and saved dashboard history", missing: missing(["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET", "DATABASE_URL"]), required: false },
    { name: "Database migrations (direct PostgreSQL connection)", missing: missing(["DIRECT_URL"]), required: false },
    { name: "Higher public GitHub API limits", missing: missing(["GITHUB_TOKEN"]), required: false },
    { name: "Shared cache and rate limits", missing: missing(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]), required: false },
    { name: "Blob storage", missing: missing(["BLOB_READ_WRITE_TOKEN"]), required: false },
  ];
}

export function runLocalSetup({ projectDir = process.cwd(), check = false, log = console.log } = {}) {
  let envLoadFailed = false;
  const { combinedEnv } = nextEnv.loadEnvConfig(projectDir, true, {
    info() {},
    error() { envLoadFailed = true; },
  }, true);
  if (envLoadFailed) throw new Error("An environment file could not be loaded. Check local file access and syntax; no values were printed.");

  const additions = planLocalSetup(combinedEnv);
  const names = Object.keys(additions);
  if (!check) appendLocalDefaults(resolve(projectDir, ".env.local"), additions);
  const environment = check ? combinedEnv : { ...combinedEnv, ...additions };
  log(check ? "Codyn local configuration check (read-only)" : "Codyn local configuration");
  if (names.length > 0) log(`${check ? "Missing local defaults" : "Added to .env.local"}: ${names.join(", ")}`);
  else log("Existing local defaults preserved.");

  const report = inspectLocalSetup(environment);
  for (const feature of report) {
    log(`${feature.name}: ${feature.missing.length === 0 ? "values present" : `missing ${feature.missing.join(", ")}`}`);
  }
  log("This checks configuration presence, not provider connectivity. No secret values are printed.");
  log("For GitHub OAuth use http://localhost:3000/api/auth/callback/github with the default local URL.");
  log("Add missing credentials to .env.local, then restart npm run dev. See docs/LOCAL_SETUP.md.");
  log("Start the application: npm run dev");
  return report.some((feature) => feature.required && feature.missing.length > 0) ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const unsupportedArgs = process.argv.slice(2).filter((argument) => argument !== "--check");
  if (unsupportedArgs.length > 0) {
    console.error("Usage: npm run setup:local [-- --check]");
    process.exitCode = 1;
  } else {
    try {
      process.exitCode = runLocalSetup({ check: process.argv.includes("--check") });
    } catch {
      console.error("Local setup failed. Check environment file access and syntax. Existing credentials were not printed or replaced.");
      process.exitCode = 1;
    }
  }
}
