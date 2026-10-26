UPDATE "Plan"
SET "dailyQueryLimit" = 50,
    "description" = '50 total questions per UTC day, including up to 20 premium-model questions. Keep using Gemini after the premium allowance is used.',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'standard';
