import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { appendLocalDefaults, inspectLocalSetup, planLocalSetup } from "./setup-local.mjs";

test("local defaults preserve existing credentials and custom application URLs", () => {
  const environment = {
    AUTH_SECRET: "an-existing-private-secret",
    NEXT_PUBLIC_APP_URL: "http://localhost:3200",
    AUTH_TRUST_HOST: "false",
    GEMINI_API_KEY: "existing-private-api-key",
  };
  assert.deepEqual(planLocalSetup(environment, () => { throw new Error("Secret must not be regenerated"); }), {});
});

test("missing authentication secret is cryptographically generated and existing legacy secret is honored", () => {
  const first = planLocalSetup({});
  const second = planLocalSetup({});
  assert.match(first.AUTH_SECRET, /^[\w-]{43}$/);
  assert.notEqual(first.AUTH_SECRET, second.AUTH_SECRET);
  assert.equal(planLocalSetup({ NEXTAUTH_SECRET: "existing-legacy-secret" }).AUTH_SECRET, undefined);
});

test("empty existing definitions and copied template placeholders are reported without replacement", () => {
  const environment = { AUTH_SECRET: "", GEMINI_API_KEY: "your_gemini_api_key", AUTH_GITHUB_ID: "your_github_client_id" };
  assert.equal(planLocalSetup(environment).AUTH_SECRET, undefined);
  const report = inspectLocalSetup(environment);
  assert.ok(report[0].missing.includes("AUTH_SECRET"));
  assert.ok(report[1].missing.includes("GEMINI_API_KEY"));
  assert.ok(report[2].missing.includes("AUTH_GITHUB_ID"));
});

test("writing defaults preserves existing file bytes and does not duplicate a completed setup", () => {
  const directory = mkdtempSync(join(tmpdir(), "codyn-local-setup-"));
  const envPath = join(directory, ".env.local");
  try {
    const original = '# Private existing configuration\r\nGEMINI_API_KEY="existing-key"';
    writeFileSync(envPath, original);
    const additions = planLocalSetup({ GEMINI_API_KEY: "existing-key" });
    appendLocalDefaults(envPath, additions);
    const updated = readFileSync(envPath, "utf8");
    assert.ok(updated.startsWith(original));
    assert.ok(updated.includes('\r\nAUTH_SECRET="'));
    appendLocalDefaults(envPath, planLocalSetup({ GEMINI_API_KEY: "existing-key", ...additions }));
    assert.equal(readFileSync(envPath, "utf8"), updated);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("read-only CLI checks never write files or print credential values", () => {
  const directory = mkdtempSync(join(tmpdir(), "codyn-local-check-"));
  const envPath = join(directory, ".env.local");
  try {
    const original = 'GEMINI_API_KEY="private-test-value-never-print"\n';
    writeFileSync(envPath, original);
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./setup-local.mjs", import.meta.url)), "--check"], {
      cwd: directory,
      encoding: "utf8",
      env: { SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, NODE_ENV: "development" },
    });
    assert.equal(result.status, 1);
    assert.equal(readFileSync(envPath, "utf8"), original);
    assert.ok(result.stdout.includes("read-only"));
    assert.ok(result.stdout.includes("missing AUTH_GITHUB_ID"));
    assert.ok(!`${result.stdout}${result.stderr}`.includes("private-test-value-never-print"));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI honors Next.js env file precedence and stays idempotent", () => {
  const directory = mkdtempSync(join(tmpdir(), "codyn-local-precedence-"));
  const envPath = join(directory, ".env.local");
  try {
    writeFileSync(join(directory, ".env"), 'AUTH_SECRET="existing-base-file-secret"\n');
    writeFileSync(envPath, 'GEMINI_API_KEY="private-test-key"\n');
    const run = () => spawnSync(process.execPath, [fileURLToPath(new URL("./setup-local.mjs", import.meta.url))], {
      cwd: directory,
      encoding: "utf8",
      env: { SystemRoot: process.env.SystemRoot, PATH: process.env.PATH, NODE_ENV: "development" },
    });
    const first = run();
    assert.equal(first.status, 0);
    const contents = readFileSync(envPath, "utf8");
    assert.ok(!contents.includes("AUTH_SECRET="));
    assert.ok(!first.stdout.includes("existing-base-file-secret"));
    assert.equal(run().status, 0);
    assert.equal(readFileSync(envPath, "utf8"), contents);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
