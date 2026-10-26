import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { prisma } from "@/lib/db";

export function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function validHmac(message: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export async function fulfillCapturedPayment(orderId: string, paymentId: string, signature?: string) {
  const transaction = await prisma.paymentTransaction.findUnique({ where: { razorpayOrderId: orderId } });
  if (!transaction) return "unknown" as const;
  if (transaction.status === "verified") return transaction.razorpayPaymentId === paymentId ? "verified" as const : "conflict" as const;

  const payment = await getRazorpayClient().payments.fetch(paymentId);
  if (payment.order_id !== orderId || Number(payment.amount) !== transaction.amount ||
      payment.currency !== transaction.currency) return "mismatch" as const;
  if (payment.status !== "captured") return "pending" as const;

  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.paymentTransaction.updateMany({
      where: { id: transaction.id, status: "pending" },
      data: { status: "verified", razorpayPaymentId: paymentId, ...(signature ? { razorpaySignature: signature } : {}), verifiedAt: now },
    });
    if (!claimed.count) {
      const current = await tx.paymentTransaction.findUnique({ where: { id: transaction.id }, select: { razorpayPaymentId: true } });
      return current?.razorpayPaymentId === paymentId ? "verified" as const : "conflict" as const;
    }
    const existing = await tx.userPlan.findUnique({ where: { userId: transaction.userId }, select: { expiresAt: true } });
    const start = existing && existing.expiresAt > now ? existing.expiresAt : now;
    const expiresAt = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    await tx.userPlan.upsert({
      where: { userId: transaction.userId },
      create: { userId: transaction.userId, planId: transaction.planId, startsAt: now, expiresAt },
      update: { planId: transaction.planId, startsAt: now, expiresAt },
    });
    return "verified" as const;
  });
}
