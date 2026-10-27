import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureMonthlyBillingPlan } from "@/lib/billing";
import { getRazorpayClient } from "@/lib/razorpay";
import { getSessionUserId } from "@/lib/session-guard";

export async function POST(request: Request) {
  const session = await auth();
  const userId = getSessionUserId(session);
  if (!userId) return Response.json({ error: "Sign in to subscribe" }, { status: 401 });
  if (!session?.user?.email) return Response.json({ error: "Add an email address to your account before subscribing." }, { status: 400 });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return Response.json({ error: "Payment service is not configured" }, { status: 503 });

  let body: { planId?: unknown };
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const planId = typeof body?.planId === "string" ? body.planId.trim() : "";
  if (!planId) return Response.json({ error: "Choose a plan" }, { status: 400 });

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { id: true, name: true, priceInr: true, razorpayPlanId: true, razorpayPlanAmount: true, razorpayKeyId: true } });
    if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
    const existing = await prisma.billingSubscription.findMany({
      where: { userId, status: { in: ["created", "authenticated", "active", "pending", "halted"] } },
      orderBy: { createdAt: "desc" },
    });
    const waiting = existing.find((item) => item.status === "created" || item.status === "authenticated");
    if (waiting) {
      if (waiting.planId !== planId) return Response.json({ error: "You already have a plan change waiting to begin. Cancel that subscription before selecting another plan." }, { status: 409 });
      return Response.json({ subscription_id: waiting.razorpaySubscriptionId, key: process.env.RAZORPAY_KEY_ID, amount: waiting.amount, currency: waiting.currency });
    }
    const active = existing.find((item) => ["active", "pending", "halted"].includes(item.status) && !item.cancelAtCycleEnd);
    if (active?.planId === planId) return Response.json({ error: "This plan is already active." }, { status: 409 });
    if (active && !active.currentEnd) return Response.json({ error: "Your current billing period is still being confirmed. Try again shortly." }, { status: 409 });

    const remotePlanId = await ensureMonthlyBillingPlan(plan);
    const currentAccess = await prisma.userPlan.findUnique({ where: { userId }, select: { expiresAt: true } });
    const accessEnd = currentAccess?.expiresAt.getTime() ?? 0;
    const currentCycleEnd = active?.currentEnd?.getTime() ?? 0;
    const nextStart = Math.max(accessEnd, currentCycleEnd);
    const startAt = nextStart > Date.now() + 60_000 ? Math.floor(nextStart / 1000) : undefined;
    const client = getRazorpayClient();
    const remote = await client.subscriptions.create({
      plan_id: remotePlanId,
      total_count: 120,
      quantity: 1,
      customer_notify: true,
      ...(startAt ? { start_at: startAt } : {}),
      notes: { codyn_user_id: userId, codyn_plan_id: plan.id },
    });
    try {
      await prisma.billingSubscription.create({
        data: { userId, planId: plan.id, razorpaySubscriptionId: remote.id, razorpayPlanId: remotePlanId, amount: plan.priceInr * 100, currency: "INR", status: remote.status },
      });
    } catch (error) {
      await client.subscriptions.cancel(remote.id, false).catch((cancelError: unknown) => console.error("Failed to cancel orphaned subscription:", cancelError));
      throw error;
    }
    return Response.json({ subscription_id: remote.id, key: process.env.RAZORPAY_KEY_ID, amount: plan.priceInr * 100, currency: "INR", starts_at: startAt ?? null });
  } catch (error: unknown) {
    const provider = error as { statusCode?: number; error?: { description?: string } };
    console.error("Subscription creation failed:", error);
    if (provider.statusCode === 401) return Response.json({ error: "Payment service credentials were rejected" }, { status: 502 });
    if (provider.statusCode && provider.statusCode >= 400 && provider.statusCode < 500) return Response.json({ error: provider.error?.description || "Subscription could not be created" }, { status: 400 });
    return Response.json({ error: "Unable to start subscription" }, { status: 503 });
  }
}
