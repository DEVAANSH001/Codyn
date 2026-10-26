UPDATE "Plan"
SET "description" = 'For frequent repository analysis with 100 total questions per day, up to 50 daily Nebius questions, and the full paid model selection.',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'pro' AND "name" = 'Max';
