import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getInvalidSessionApiError, getSessionAuthState, getSessionUserId } from "@/lib/session-guard";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const authState = getSessionAuthState(session);

  if (authState === "unauthenticated") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (authState === "invalid") return NextResponse.json(getInvalidSessionApiError(), { status: 401 });

  const userId = getSessionUserId(session);
  if (!userId) return NextResponse.json(getInvalidSessionApiError(), { status: 401 });

  try {
    const payments = await prisma.paymentTransaction.findMany({
      where: { userId },
      select: { id: true, amount: true, currency: true, status: true, createdAt: true, verifiedAt: true, plan: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return NextResponse.json({ payments });
  } catch {
    return NextResponse.json({ error: "Failed to fetch payment history" }, { status: 500 });
  }
}
