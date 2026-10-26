UPDATE "Plan" SET "dailyQueryLimit" = 30, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'standard' AND "dailyQueryLimit" = 100;
UPDATE "Plan" SET "dailyQueryLimit" = 100, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'pro' AND "dailyQueryLimit" = 300;
