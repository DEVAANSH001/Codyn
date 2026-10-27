import { prisma } from "@/lib/db";
import { getPremiumDailyQueryLimit } from "@/lib/plans";

export async function GET() {
  const plans = await prisma.plan.findMany({ orderBy: { priceInr: "asc" }, select: { id: true, name: true, description: true, priceInr: true, dailyQueryLimit: true, modelIds: true } });
  return Response.json(plans.map((plan) => ({
    ...plan,
    modelIds: Array.isArray(plan.modelIds) ? plan.modelIds.filter((id): id is string => typeof id === "string") : [],
    premiumDailyQueryLimit: getPremiumDailyQueryLimit(plan.id),
  })));
}
