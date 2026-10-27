import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRazorpayClient } from "@/lib/razorpay";
import { getSessionUserId } from "@/lib/session-guard";

export async function POST(request: Request) {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to manage your subscription" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { subscriptionId?: string };
  const subscription = body.subscriptionId
    ? await prisma.billingSubscription.findFirst({ where: { id: body.subscriptionId, userId } })
    : await prisma.billingSubscription.findFirst({ where: { userId, status: { in: ["created", "authenticated", "active", "pending", "halted"] } }, orderBy: { createdAt: "desc" } });
  if (!subscription) return Response.json({ error: "No active subscription found" }, { status: 404 });
  if (subscription.cancelAtCycleEnd) return Response.json({ success: true });
  try {
    const remote = await getRazorpayClient().subscriptions.cancel(subscription.razorpaySubscriptionId, !["created", "authenticated"].includes(subscription.status));
    await prisma.billingSubscription.update({ where: { id: subscription.id }, data: { cancelAtCycleEnd: true, status: remote.status } });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Subscription cancellation failed:", error);
    return Response.json({ error: "Unable to cancel renewal right now" }, { status: 503 });
  }
}
