import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session-guard";

export async function GET() {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to view your subscription" }, { status: 401 });
  const [subscriptions, assignment] = await Promise.all([
    prisma.billingSubscription.findMany({
      where: { userId }, orderBy: { createdAt: "desc" }, take: 10,
      select: { id: true, planId: true, status: true, currentEnd: true, cancelAtCycleEnd: true, plan: { select: { name: true } }, charges: { orderBy: { chargedAt: "desc" }, take: 1, select: { razorpayPaymentId: true, chargedAt: true } } },
    }),
    prisma.userPlan.findUnique({ where: { userId }, select: { planId: true, expiresAt: true, plan: { select: { name: true } } } }),
  ]);
  const now = new Date();
  const access = assignment && assignment.expiresAt > now ? {
    planId: assignment.planId,
    planName: assignment.plan.name,
    expiresAt: assignment.expiresAt.toISOString(),
  } : null;
  const current = subscriptions.find((item) => item.currentEnd && item.currentEnd > now && ["active", "pending", "halted", "cancelled"].includes(item.status));
  const pending = subscriptions.find((item) => ["created", "authenticated"].includes(item.status));
  const subscription = current ?? (access ? undefined : pending ?? subscriptions.find((item) => ["active", "pending", "halted"].includes(item.status)));
  const scheduled = access ? pending && pending.id !== current?.id ? pending : undefined : undefined;
  const serialize = (item: (typeof subscriptions)[number] | undefined) => item ? ({
    id: item.id,
    planId: item.planId,
    planName: item.plan.name,
    status: item.status,
    currentEnd: item.currentEnd?.toISOString() ?? null,
    cancelAtCycleEnd: item.cancelAtCycleEnd,
    lastPaymentId: item.charges[0]?.razorpayPaymentId ?? null,
    lastChargedAt: item.charges[0]?.chargedAt.toISOString() ?? null,
  }) : null;
  return Response.json({ access, subscription: serialize(subscription), scheduled: serialize(scheduled) });
}
