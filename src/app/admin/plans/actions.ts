"use server";

import { auth } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  if (!isAdminUser(await auth())) throw new Error("Unauthorized");
}

export async function savePlan(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceInr = Number(formData.get("priceInr"));
  const rawLimit = String(formData.get("dailyQueryLimit") ?? "").trim();
  const dailyQueryLimit = rawLimit === "" ? null : Number(rawLimit);
  const modelIds = String(formData.get("modelIds") ?? "").split("\n").map((value) => value.trim()).filter(Boolean);
  if (!name || !description || !Number.isInteger(priceInr) || priceInr < 0 ||
      (dailyQueryLimit !== null && (!Number.isInteger(dailyQueryLimit) || dailyQueryLimit < 1)) ||
      modelIds.some((model) => model.length > 200) || modelIds.length > 30) {
    throw new Error("Invalid plan details");
  }
  const data = { name, description, priceInr, dailyQueryLimit, modelIds };
  if (id) await prisma.plan.update({ where: { id }, data });
  else await prisma.plan.create({ data });
  revalidatePath("/admin/plans");
  revalidatePath("/");
}

export async function grantPlan(formData: FormData) {
  await requireAdmin();
  const account = String(formData.get("account") ?? "").trim();
  const planId = String(formData.get("planId") ?? "").trim();
  if (!account || !planId) throw new Error("Account and plan are required");
  const [user, plan] = await Promise.all([
    prisma.user.findFirst({ where: { OR: [{ email: { equals: account, mode: "insensitive" } }, { githubLogin: { equals: account.replace(/^@/, ""), mode: "insensitive" } }] }, select: { id: true } }),
    prisma.plan.findUnique({ where: { id: planId }, select: { id: true } }),
  ]);
  if (!user || !plan) redirect("/admin/plans?error=account_not_found");
  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.userPlan.upsert({
    where: { userId: user.id },
    create: { userId: user.id, planId, startsAt, expiresAt },
    update: { planId, startsAt, expiresAt },
  });
  revalidatePath("/admin/plans");
  redirect("/admin/plans?granted=1");
}

export async function revokePlan(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  await prisma.userPlan.deleteMany({ where: { userId } });
  revalidatePath("/admin/plans");
}
