ALTER TABLE "Plan" ADD COLUMN "razorpayPlanId" TEXT,
ADD COLUMN "razorpayPlanAmount" INTEGER,
ADD COLUMN "razorpayKeyId" TEXT;

CREATE TABLE "DailyModelUsage" (
  "userId" TEXT NOT NULL,
  "day" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "DailyModelUsage_pkey" PRIMARY KEY ("userId", "day", "modelId", "scope")
);
CREATE INDEX "DailyModelUsage_day_modelId_idx" ON "DailyModelUsage"("day", "modelId");
ALTER TABLE "DailyModelUsage" ADD CONSTRAINT "DailyModelUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "BillingSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "razorpaySubscriptionId" TEXT NOT NULL,
  "razorpayPlanId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" TEXT NOT NULL DEFAULT 'created',
  "currentStart" TIMESTAMP(3),
  "currentEnd" TIMESTAMP(3),
  "cancelAtCycleEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BillingSubscription_razorpaySubscriptionId_key" ON "BillingSubscription"("razorpaySubscriptionId");
CREATE INDEX "BillingSubscription_userId_status_idx" ON "BillingSubscription"("userId", "status");
CREATE INDEX "BillingSubscription_planId_createdAt_idx" ON "BillingSubscription"("planId", "createdAt");
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SubscriptionCharge" (
  "id" TEXT NOT NULL,
  "billingSubscriptionId" TEXT NOT NULL,
  "razorpayPaymentId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "chargedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "receiptSentAt" TIMESTAMP(3),
  "receiptAttempts" INTEGER NOT NULL DEFAULT 0,
  "receiptLastError" TEXT,
  CONSTRAINT "SubscriptionCharge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubscriptionCharge_razorpayPaymentId_key" ON "SubscriptionCharge"("razorpayPaymentId");
CREATE INDEX "SubscriptionCharge_billingSubscriptionId_chargedAt_idx" ON "SubscriptionCharge"("billingSubscriptionId", "chargedAt");
CREATE INDEX "SubscriptionCharge_receiptSentAt_chargedAt_idx" ON "SubscriptionCharge"("receiptSentAt", "chargedAt");
ALTER TABLE "SubscriptionCharge" ADD CONSTRAINT "SubscriptionCharge_billingSubscriptionId_fkey" FOREIGN KEY ("billingSubscriptionId") REFERENCES "BillingSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
