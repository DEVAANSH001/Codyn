import { auth } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session-guard";
import { prisma } from "@/lib/db";
import { fulfillCapturedPayment, validHmac } from "@/lib/razorpay";

export async function POST(request: Request) {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to verify payment" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Invalid request body" }, { status: 400 });

  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";
  if (!paymentId || !orderId || !signature) return Response.json({ error: "Missing payment details" }, { status: 400 });

  try {
    const transaction = await prisma.paymentTransaction.findUnique({ where: { razorpayOrderId: orderId } });
    if (!transaction || transaction.userId !== userId) return Response.json({ error: "Payment order not found" }, { status: 404 });
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return Response.json({ error: "Payment verification is unavailable" }, { status: 503 });
    if (!validHmac(`${transaction.razorpayOrderId}|${paymentId}`, signature, secret)) {
      return Response.json({ error: "Payment signature mismatch" }, { status: 400 });
    }
    const result = await fulfillCapturedPayment(orderId, paymentId, signature);
    if (result === "verified") return Response.json({ success: true });
    if (result === "pending") return Response.json({ pending: true, error: "Payment is awaiting capture. Your plan will activate automatically once confirmed." }, { status: 202 });
    return Response.json({ error: "Payment details do not match the order" }, { status: 400 });
  } catch (error) {
    console.error("Razorpay payment verification failed:", error);
    return Response.json({ error: "Unable to confirm payment right now. If charged, your plan will activate after payment confirmation." }, { status: 503 });
  }
}
