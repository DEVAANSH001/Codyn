import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/session-guard";

export async function GET() {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to view your subscription" }, { status: 401 });
  const subscriptions = await prisma.billingSubscription.findMany({
    where: { userId }, orderBy: { createdAt: "desc" }, take: 5,
    select: { id: true, planId: true, status: true, currentEnd: true, cancelAtCycleEnd: true, plan: { select: { name: true } }, charges: { orderBy: { chargedAt: "desc" }, take: 1, select: { razorpayPaymentId: true, chargedAt: true } } },
  });
  const subscription = subscriptions.find((item) => item.currentEnd && item.currentEnd > new Date()) ?? subscriptions[0];
  const scheduled = subscriptions.find((item) => item.id !== subscription?.id && ["created", "authenticated"].includes(item.status));
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
  return Response.json({ subscription: serialize(subscription), scheduled: serialize(scheduled) });
}
