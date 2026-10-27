import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fulfillSubscriptionCharge, syncSubscriptionStatus } from "@/lib/billing";
import { getRazorpayClient, validHmac } from "@/lib/razorpay";
import { getSessionUserId } from "@/lib/session-guard";

export async function POST(request: Request) {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to confirm your subscription" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request body" }, { status: 400 }); }
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
  const subscriptionId = typeof body?.razorpay_subscription_id === "string" ? body.razorpay_subscription_id.trim() : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";
  if (!paymentId || !subscriptionId || !signature) return Response.json({ error: "Missing checkout details" }, { status: 400 });

  const local = await prisma.billingSubscription.findUnique({ where: { razorpaySubscriptionId: subscriptionId } });
  if (!local || local.userId !== userId) return Response.json({ error: "Subscription not found" }, { status: 404 });
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return Response.json({ error: "Payment verification is unavailable" }, { status: 503 });
  if (!validHmac(`${paymentId}|${local.razorpaySubscriptionId}`, signature, secret)) return Response.json({ error: "Subscription signature mismatch" }, { status: 400 });

  try {
    const payment = await getRazorpayClient().payments.fetch(paymentId);
    if (payment.status !== "captured" || Number(payment.amount) !== local.amount) {
      await syncSubscriptionStatus(subscriptionId);
      return Response.json({ pending: true, message: "Thanks for subscribing! Your plan will activate after the first monthly charge is confirmed." }, { status: 202 });
    }
    const result = await fulfillSubscriptionCharge(subscriptionId, paymentId);
    if (result === "verified") return Response.json({ success: true, message: "Thanks for purchasing! Your monthly subscription is active." });
    if (result === "pending") return Response.json({ pending: true, message: "Thanks for subscribing! Your plan will activate after payment confirmation." }, { status: 202 });
    return Response.json({ error: "Payment does not match the subscription" }, { status: 400 });
  } catch (error) {
    console.error("Subscription verification failed:", error);
    return Response.json({ error: "We could not confirm your subscription yet. Please refresh shortly." }, { status: 503 });
  }
}
