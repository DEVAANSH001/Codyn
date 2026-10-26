import { fulfillCapturedPayment, validHmac } from "@/lib/razorpay";

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Webhook is not configured" }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!validHmac(rawBody, signature, secret)) return Response.json({ error: "Invalid signature" }, { status: 401 });

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try { event = JSON.parse(rawBody); }
  catch { return Response.json({ error: "Invalid webhook body" }, { status: 400 }); }
  if (event.event !== "payment.captured") return Response.json({ received: true });

  const paymentId = event.payload?.payment?.entity?.id;
  const orderId = event.payload?.payment?.entity?.order_id;
  if (!paymentId || !orderId) return Response.json({ error: "Missing payment identifiers" }, { status: 400 });
  try {
    const result = await fulfillCapturedPayment(orderId, paymentId);
    if (result === "unknown") {
      console.error("Razorpay webhook has no matching order:", orderId);
      return Response.json({ error: "Order not recorded yet" }, { status: 503 });
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
