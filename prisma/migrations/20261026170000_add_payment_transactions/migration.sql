CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "razorpayOrderId" TEXT NOT NULL,
  "razorpayPaymentId" TEXT,
  "razorpaySignature" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentTransaction_razorpayOrderId_key" ON "PaymentTransaction"("razorpayOrderId");
CREATE UNIQUE INDEX "PaymentTransaction_razorpayPaymentId_key" ON "PaymentTransaction"("razorpayPaymentId");
CREATE INDEX "PaymentTransaction_userId_createdAt_idx" ON "PaymentTransaction"("userId", "createdAt");
CREATE INDEX "PaymentTransaction_status_createdAt_idx" ON "PaymentTransaction"("status", "createdAt");
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
