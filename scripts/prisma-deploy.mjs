import { spawnSync } from "node:child_process";

const MAX_ATTEMPTS = Number.parseInt(process.env.PRISMA_DEPLOY_MAX_ATTEMPTS ?? "3", 10);
const RETRY_DELAY_MS = Number.parseInt(process.env.PRISMA_DEPLOY_RETRY_DELAY_MS ?? "15000", 10);

const advisoryLockTimeoutPattern =
  /P1002|Timed out trying to acquire a postgres advisory lock/i;
const transientConnectionPattern =
  /P1001|Can't reach database server|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  const result = spawnSync("prisma", ["migrate", "deploy"], {
    stdio: "pipe",
    encoding: "utf8",
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status === 0) {
    process.exit(0);
  }

  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const isAdvisoryLockTimeout = advisoryLockTimeoutPattern.test(combinedOutput);
  const isTransientConnectionError = transientConnectionPattern.test(combinedOutput);
  const shouldRetry =
    (isAdvisoryLockTimeout || isTransientConnectionError) && attempt < MAX_ATTEMPTS;

  if (!shouldRetry) {
    process.exit(result.status ?? 1);
  }

  const waitSeconds = Math.ceil(RETRY_DELAY_MS / 1000);
  const reason = isAdvisoryLockTimeout
    ? "advisory lock timeout"
    : "temporary database connectivity issue";
  console.warn(
    `[prisma:deploy] ${reason} detected (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in ${waitSeconds}s...`,
  );
  await sleep(RETRY_DELAY_MS);
}
