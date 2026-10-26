import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, dailyFindUnique, createMany, updateMany, transaction } = vi.hoisted(() => ({
  findUnique: vi.fn(), dailyFindUnique: vi.fn(), createMany: vi.fn(), updateMany: vi.fn(), transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: {
  userPlan: { findUnique },
  dailyQueryUsage: { findUnique: dailyFindUnique, createMany, updateMany },
  $transaction: transaction,
} }));

import { consumeDailyQuery, getUserEntitlement } from "@/lib/plans";

describe("manual plan entitlements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation((callback) => callback({ dailyQueryUsage: { createMany, updateMany, findUnique: dailyFindUnique } }));
    createMany.mockResolvedValue({ count: 1 });
  });

  it("falls back to Free when the grant has expired", async () => {
    findUnique.mockResolvedValue({ expiresAt: new Date("2020-01-01"), plan: { name: "Pro", dailyQueryLimit: null, modelIds: ["vendor/model"] } });
    expect(await getUserEntitlement("user-1")).toMatchObject({ name: "Free", dailyQueryLimit: 10, modelIds: [] });
  });

  it("allows only models on an active grant", async () => {
    findUnique.mockResolvedValue({ expiresAt: new Date("2099-01-01"), plan: { name: "Standard", dailyQueryLimit: 30, modelIds: ["vendor/model", 42] } });
    expect(await getUserEntitlement("user-1")).toMatchObject({ name: "Standard", dailyQueryLimit: 30, modelIds: ["vendor/model"] });
  });

  it("increments only while the daily count remains below the limit", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    expect(await consumeDailyQuery("user-1", 30)).toBe("plan");
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ count: { lt: 30 } }) }));
  });

  it("caps Nebius separately from the overall plan", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    dailyFindUnique.mockResolvedValue({ count: 5 });
    const result = await consumeDailyQuery("user-1", 100, true);
    expect(result).toBe("nebius");
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ nebiusCount: { lt: 30 } }), data: expect.objectContaining({ nebiusCount: { increment: 1 } }) }));
  });
});
