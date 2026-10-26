import Razorpay from "razorpay";
import { auth } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session-guard";
import { prisma } from "@/lib/db";

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function POST(request: Request) {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to purchase a plan" }, { status: 401 });

  try {
    const body = await request.json() as { planId?: unknown };
    const planId = typeof body.planId === "string" ? body.planId.trim() : "";
    if (!planId) return Response.json({ error: "A plan is required" }, { status: 400 });

    const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { id: true, name: true, priceInr: true } });
    if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });

    const amount = Math.round(plan.priceInr * 100);
    if (amount < 100) return Response.json({ error: "Plan amount must be at least ₹1" }, { status: 400 });

    const order = await getRazorpayClient().orders.create({
      amount,
      currency: "INR",
      receipt: `codyn_${userId.slice(0, 12)}_${Date.now()}`.slice(0, 40),
      notes: { planId, userId },
    });

    await prisma.paymentTransaction.create({
      data: { userId, planId: plan.id, razorpayOrderId: order.id, amount, currency: "INR" },
    });

    return Response.json({ order_id: order.id, amount, currency: "INR", plan_name: plan.name });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return Response.json({ error: "Unable to create payment order" }, { status: 500 });
  }
}
