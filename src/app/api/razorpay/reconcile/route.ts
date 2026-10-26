import { auth } from "@/lib/auth";
import { getSessionUserId } from "@/lib/session-guard";
import { prisma } from "@/lib/db";
import { fulfillCapturedPayment, getRazorpayClient } from "@/lib/razorpay";

export async function POST() {
  const userId = getSessionUserId(await auth());
  if (!userId) return Response.json({ error: "Sign in to check payments" }, { status: 401 });
  try {
    const pending = await prisma.paymentTransaction.findMany({
      where: { userId, status: "pending", createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" }, take: 10, select: { razorpayOrderId: true },
    });
    const client = getRazorpayClient();
    let activated = 0;
    for (const transaction of pending) {
      const payments = await client.orders.fetchPayments(transaction.razorpayOrderId);
      for (const payment of payments.items) {
        if (payment.status === "captured" &&
            await fulfillCapturedPayment(transaction.razorpayOrderId, payment.id) === "verified") {
          activated++;
          break;
        }
      }
    }
    return Response.json({ activated });
  } catch (error) {
    console.error("Razorpay payment reconciliation failed:", error);
    return Response.json({ error: "Unable to check pending payments" }, { status: 503 });
  }
}
