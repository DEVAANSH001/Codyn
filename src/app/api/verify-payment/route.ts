import { createHmac, timingSafeEqual } from "node:crypto";
import { auth } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session-guard";
import { prisma } from "@/lib/db";

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(request: Request) {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to verify payment" }, { status: 401 });

  let body: { razorpay_payment_id?: unknown; razorpay_order_id?: unknown; razorpay_signature?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";
  if (!paymentId || !orderId || !signature) return Response.json({ error: "Missing payment details" }, { status: 400 });

  const transaction = await prisma.paymentTransaction.findUnique({ where: { razorpayOrderId: orderId } });
  if (!transaction || transaction.userId !== userId) return Response.json({ error: "Payment order not found" }, { status: 400 });
  if (transaction.status === "verified") {
    return transaction.razorpayPaymentId === paymentId
      ? Response.json({ success: true, alreadyVerified: true })
      : Response.json({ error: "Payment order was already verified" }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    console.error("Razorpay secret is not configured");
    return Response.json({ error: "Payment verification is unavailable" }, { status: 500 });
  }

  const expectedSignature = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  if (!signaturesMatch(expectedSignature, signature)) return Response.json({ error: "Payment signature mismatch" }, { status: 400 });

  const now = new Date();
  const existingPlan = await prisma.userPlan.findUnique({ where: { userId }, select: { expiresAt: true } });
  const subscriptionStart = existingPlan && existingPlan.expiresAt > now ? existingPlan.expiresAt : now;
  const expiresAt = new Date(subscriptionStart.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.paymentTransaction.update({
      where: { id: transaction.id },
      data: { status: "verified", razorpayPaymentId: paymentId, razorpaySignature: signature, verifiedAt: now },
    });
    await tx.userPlan.upsert({
      where: { userId },
      create: { userId, planId: transaction.planId, startsAt: now, expiresAt },
      update: { planId: transaction.planId, startsAt: now, expiresAt },
    });
  });

  return Response.json({ success: true, expiresAt: expiresAt.toISOString() });
}
