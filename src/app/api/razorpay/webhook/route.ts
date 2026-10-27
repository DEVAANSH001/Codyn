import { fulfillCapturedPayment, validHmac } from "@/lib/razorpay";
import { fulfillSubscriptionCharge, syncSubscriptionStatus } from "@/lib/billing";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!validHmac(rawBody, signature, secret)) return Response.json({ error: "Invalid signature" }, { status: 401 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; subscription_id?: string } }; subscription?: { entity?: { id?: string } } } };
  try { event = JSON.parse(rawBody); }
  catch { return Response.json({ error: "Invalid webhook body" }, { status: 400 }); }

  if (event.event?.startsWith("subscription.")) {
    const subscriptionId = event.payload?.subscription?.entity?.id;
    if (!subscriptionId) return Response.json({ error: "Missing subscription identifier" }, { status: 400 });
    try {
      if (event.event === "subscription.charged") {
        const paymentId = event.payload?.payment?.entity?.id;
        if (!paymentId) return Response.json({ error: "Missing charge identifier" }, { status: 400 });
        const result = await fulfillSubscriptionCharge(subscriptionId, paymentId);
        if (result !== "verified") return Response.json({ error: `Subscription charge ${result}` }, { status: result === "unknown" || result === "pending" ? 503 : 400 });
      } else {
        const found = await syncSubscriptionStatus(subscriptionId);
        if (!found) return Response.json({ error: "Subscription not recorded yet" }, { status: 503 });
      }
      return Response.json({ received: true });
    } catch (error) {
      console.error("Subscription webhook failed:", error);
      return Response.json({ error: "Subscription update failed" }, { status: 503 });
    }
  }
  if (event.event !== "payment.captured") return Response.json({ received: true });

  const paymentId = event.payload?.payment?.entity?.id;
  const orderId = event.payload?.payment?.entity?.order_id;
  const subscriptionId = event.payload?.payment?.entity?.subscription_id;
  if (!paymentId) return Response.json({ error: "Missing payment identifier" }, { status: 400 });
  try {
    if (subscriptionId) {
      const subscriptionResult = await fulfillSubscriptionCharge(subscriptionId, paymentId);
      if (subscriptionResult === "unknown") return Response.json({ error: "Subscription not recorded yet" }, { status: 503 });
      // The initial mandate authorization can be captured for a nominal amount.
      // The subscription.charged event is responsible for the full plan charge.
      return Response.json({ received: true });
    }
    if (!orderId) return Response.json({ error: "Missing order identifier" }, { status: 400 });
    const result = await fulfillCapturedPayment(orderId, paymentId);
    if (result === "unknown") {
      console.error("Razorpay webhook has no matching order:", orderId);
      return Response.json({ received: true });
    }
    if (result !== "verified") {
      console.error("Razorpay webhook payment mismatch:", orderId, paymentId, result);
      return Response.json({ error: "Payment could not be fulfilled" }, { status: 400 });
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook fulfillment failed:", error);
    return Response.json({ error: "Payment fulfillment failed" }, { status: 503 });
  }
}
