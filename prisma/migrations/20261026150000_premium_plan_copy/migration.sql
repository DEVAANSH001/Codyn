UPDATE "Plan"
SET
  "description" = CASE
    WHEN "id" = 'standard' THEN 'For individuals who want more daily questions and a choice of efficient premium AI models.'
    WHEN "id" = 'pro' THEN 'For frequent repository analysis with 100 total questions per day, up to 30 daily premium-model questions, and the full premium model selection.'
    ELSE "description"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('standard', 'pro');
