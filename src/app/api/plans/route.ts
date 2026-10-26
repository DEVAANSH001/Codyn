import { prisma } from "@/lib/db";

export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { priceInr: "asc" }, select: { id: true, name: true, description: true, priceInr: true, dailyQueryLimit: true, modelIds: true } });
  return Response.json(plans);
}
