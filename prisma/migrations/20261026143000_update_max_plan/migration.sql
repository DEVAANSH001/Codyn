UPDATE "Plan"
SET
  "name" = 'Max',
  "description" = 'For frequent repository analysis with 100 total questions per day, up to 30 daily Nebius questions, and the full paid model selection.',
  "priceInr" = 499,
  "dailyQueryLimit" = 100,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'pro';
