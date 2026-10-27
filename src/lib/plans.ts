import { prisma } from "@/lib/db";

export const FREE_DAILY_QUERIES = 10;
export const NEBIUS_DAILY_QUERIES = 50;
export const STANDARD_NEBIUS_DAILY_QUERIES = 20;

export function getPremiumDailyQueryLimit(planId: string): number {
  return planId === "standard" ? STANDARD_NEBIUS_DAILY_QUERIES : NEBIUS_DAILY_QUERIES;
}

export async function getUserEntitlement(userId: string | null) {
  if (!userId) return { name: "Free", dailyQueryLimit: FREE_DAILY_QUERIES, premiumDailyQueryLimit: 0, modelIds: [] as string[], expiresAt: null };
  const assignment = await prisma.userPlan.findUnique({
    where: { userId },
    include: { plan: true },
  });
  if (!assignment || assignment.expiresAt <= new Date()) {
    return { name: "Free", dailyQueryLimit: FREE_DAILY_QUERIES, premiumDailyQueryLimit: 0, modelIds: [] as string[], expiresAt: null };
  }
  return {
    name: assignment.plan.name,
    dailyQueryLimit: assignment.plan.dailyQueryLimit,
    premiumDailyQueryLimit: getPremiumDailyQueryLimit(assignment.plan.id),
    modelIds: Array.isArray(assignment.plan.modelIds)
      ? assignment.plan.modelIds.filter((id): id is string => typeof id === "string")
      : [],
    expiresAt: assignment.expiresAt.toISOString(),
  };
}

export async function consumeDailyQuery(userId: string, limit: number | null, isNebius = false, premiumLimit = NEBIUS_DAILY_QUERIES, modelId?: string, scope?: "repo" | "profile"): Promise<"ok" | "plan" | "nebius"> {
  const day = new Date().toISOString().slice(0, 10);
  return prisma.$transaction(async (tx) => {
    await tx.dailyQueryUsage.createMany({ data: [{ userId, day }], skipDuplicates: true });
    const result = await tx.dailyQueryUsage.updateMany({
      where: { userId, day, ...(limit === null ? {} : { count: { lt: limit } }), ...(isNebius ? { nebiusCount: { lt: premiumLimit } } : {}) },
      data: { count: { increment: 1 }, ...(isNebius ? { nebiusCount: { increment: 1 } } : {}) },
    });
    if (result.count > 0) {
      if (modelId && scope) {
        await tx.dailyModelUsage.upsert({
          where: { userId_day_modelId_scope: { userId, day, modelId, scope } },
          create: { userId, day, modelId, scope, count: 1 },
          update: { count: { increment: 1 } },
        });
      }
      return "ok";
    }
    if (isNebius) {
      const row = await tx.dailyQueryUsage.findUnique({ where: { userId_day: { userId, day } }, select: { count: true } });
      if (limit === null || (row && row.count < limit)) return "nebius";
    }
    return "plan";
  });
}

export async function getDailyQueryCount(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  return (await prisma.dailyQueryUsage.findUnique({ where: { userId_day: { userId, day } }, select: { count: true } }))?.count ?? 0;
}

export async function getDailyNebiusCount(userId: string) {
  const day = new Date().toISOString().slice(0, 10);
  return (await prisma.dailyQueryUsage.findUnique({ where: { userId_day: { userId, day } }, select: { nebiusCount: true } }))?.nebiusCount ?? 0;
}
