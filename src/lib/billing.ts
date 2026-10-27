import { prisma } from "@/lib/db";
import { getRazorpayClient } from "@/lib/razorpay";
import { sendSubscriptionReceipt } from "@/lib/emails/mailer";

type LocalPlan = { id: string; name: string; priceInr: number; razorpayPlanId: string | null; razorpayPlanAmount: number | null; razorpayKeyId: string | null };

export function fromUnixSeconds(value: number | null | undefined): Date | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? new Date(value * 1000) : null;
}

export async function ensureMonthlyBillingPlan(plan: LocalPlan): Promise<string> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) throw new Error("Payment service is not configured");
  const amount = plan.priceInr * 100;
  if (!Number.isInteger(amount) || amount < 100) throw new Error("Plan price must be at least ₹1");
  if (plan.razorpayPlanId && plan.razorpayPlanAmount === amount && plan.razorpayKeyId === keyId) return plan.razorpayPlanId;

  const remote = await getRazorpayClient().plans.create({
    period: "monthly",
    interval: 1,
    item: { name: `Codyn ${plan.name}`, amount, currency: "INR", description: `${plan.name} monthly subscription` },
    notes: { codyn_plan_id: plan.id },
  });
  await prisma.plan.update({ where: { id: plan.id }, data: { razorpayPlanId: remote.id, razorpayPlanAmount: amount, razorpayKeyId: keyId } });
  return remote.id;
}

export async function fulfillSubscriptionCharge(subscriptionId: string, paymentId: string): Promise<"verified" | "pending" | "unknown" | "mismatch"> {
  const local = await prisma.billingSubscription.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
  if (!local) return "unknown";
  const client = getRazorpayClient();
  const [remote, payment] = await Promise.all([client.subscriptions.fetch(subscriptionId), client.payments.fetch(paymentId)]);
  if (remote.plan_id !== local.razorpayPlanId || Number(payment.amount) !== local.amount || payment.currency !== local.currency) return "mismatch";
  if (payment.status !== "captured") return "pending";
  const currentEnd = fromUnixSeconds(remote.current_end);
  if (!currentEnd || currentEnd <= new Date()) return "pending";
  const currentStart = fromUnixSeconds(remote.current_start);

  await prisma.$transaction(async (tx) => {
    await tx.subscriptionCharge.createMany({
      data: [{ billingSubscriptionId: local.id, razorpayPaymentId: paymentId, amount: local.amount, currency: local.currency }],
      skipDuplicates: true,
    });
    await tx.billingSubscription.update({
      where: { id: local.id },
      data: { status: remote.status, currentStart, currentEnd },
    });
    const existing = await tx.userPlan.findUnique({ where: { userId: local.userId }, select: { expiresAt: true } });
    const expiresAt = existing && existing.expiresAt > currentEnd ? existing.expiresAt : currentEnd;
    await tx.userPlan.upsert({
      where: { userId: local.userId },
      create: { userId: local.userId, planId: local.planId, startsAt: currentStart ?? new Date(), expiresAt },
      update: { planId: local.planId, startsAt: currentStart ?? new Date(), expiresAt },
    });
  });
  await deliverSubscriptionReceipt(paymentId);
  await finalizePlanSwitch(local.id, local.userId, local.createdAt);
  return "verified";
}

async function finalizePlanSwitch(newSubscriptionId: string, userId: string, createdAt: Date): Promise<void> {
  const old = await prisma.billingSubscription.findFirst({
    where: { userId, id: { not: newSubscriptionId }, createdAt: { lt: createdAt }, status: { in: ["active", "pending", "halted"] }, cancelAtCycleEnd: false },
    orderBy: { createdAt: "desc" },
  });
  if (!old) return;
  await getRazorpayClient().subscriptions.cancel(old.razorpaySubscriptionId, true);
  await prisma.billingSubscription.update({ where: { id: old.id }, data: { cancelAtCycleEnd: true } });
}

export async function syncSubscriptionStatus(subscriptionId: string): Promise<boolean> {
  const local = await prisma.billingSubscription.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
  if (!local) return false;
  const remote = await getRazorpayClient().subscriptions.fetch(subscriptionId);
  if (remote.plan_id !== local.razorpayPlanId) throw new Error("Subscription plan mismatch");
  await prisma.billingSubscription.update({
    where: { id: local.id },
    data: { status: remote.status, currentStart: fromUnixSeconds(remote.current_start), currentEnd: fromUnixSeconds(remote.current_end) },
  });
  if (["authenticated", "active"].includes(remote.status)) await finalizePlanSwitch(local.id, local.userId, local.createdAt);
  return true;
}

export async function deliverSubscriptionReceipt(paymentId: string): Promise<boolean> {
  const charge = await prisma.subscriptionCharge.findUnique({
    where: { razorpayPaymentId: paymentId },
    include: { billingSubscription: { include: { user: { select: { email: true, name: true } }, plan: { select: { name: true } } } } },
  });
  if (!charge || charge.receiptSentAt) return true;
  const email = charge.billingSubscription.user.email;
  if (!email) {
    await prisma.subscriptionCharge.update({ where: { id: charge.id }, data: { receiptLastError: "Customer email is unavailable" } });
    return false;
  }
  const result = await sendSubscriptionReceipt({
    to: email,
    name: charge.billingSubscription.user.name || email.split("@")[0],
    planName: charge.billingSubscription.plan.name,
    amount: charge.amount,
    chargedAt: charge.chargedAt,
    idempotencyKey: `subscription-receipt:${paymentId}`,
  });
  await prisma.subscriptionCharge.update({
    where: { id: charge.id },
    data: result.success ? { receiptSentAt: new Date(), receiptAttempts: { increment: 1 }, receiptLastError: null } : { receiptAttempts: { increment: 1 }, receiptLastError: result.error?.slice(0, 1000) ?? "Email delivery failed" },
  });
  return result.success;
}

export async function retrySubscriptionReceipts(limit = 25): Promise<number> {
  const charges = await prisma.subscriptionCharge.findMany({
    where: { receiptSentAt: null, chargedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    orderBy: { chargedAt: "asc" }, take: Math.max(1, Math.min(limit, 100)), select: { razorpayPaymentId: true },
  });
  for (const charge of charges) await deliverSubscriptionReceipt(charge.razorpayPaymentId);
  return charges.length;
}
