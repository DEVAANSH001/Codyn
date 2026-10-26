CREATE TABLE "Plan" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priceInr" INTEGER NOT NULL,
  "dailyQueryLimit" INTEGER,
  "modelIds" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");
CREATE TABLE "UserPlan" (
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX "UserPlan_expiresAt_idx" ON "UserPlan"("expiresAt");
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "DailyQueryUsage" (
  "userId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "DailyQueryUsage_pkey" PRIMARY KEY ("userId","day")
);
ALTER TABLE "DailyQueryUsage" ADD CONSTRAINT "DailyQueryUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
INSERT INTO "Plan" ("id", "name", "description", "priceInr", "dailyQueryLimit", "modelIds", "updatedAt") VALUES
  ('standard', 'Standard', 'For individuals who want more daily questions and a choice of efficient Nebius models.', 99, 100, '["nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B", "Qwen/Qwen3-30B-A3B-Instruct-2507"]'::jsonb, CURRENT_TIMESTAMP),
  ('pro', 'Pro', 'For frequent repository analysis with a larger model selection.', 999, 300, '["nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B", "Qwen/Qwen3-30B-A3B-Instruct-2507", "Qwen/Qwen3-235B-A22B-Instruct-2507", "deepseek-ai/DeepSeek-V4-Flash-0731", "openai/gpt-oss-120b"]'::jsonb, CURRENT_TIMESTAMP);
