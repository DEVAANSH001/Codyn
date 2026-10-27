import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, findMany, findUnique } = vi.hoisted(() => ({ authMock: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ prisma: { billingSubscription: { findMany }, userPlan: { findUnique } } }));

import { GET } from "./route";

describe("subscription status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(null);
  });

  it("shows an existing paid plan even without a recurring subscription", async () => {
    findUnique.mockResolvedValue({ planId: "max", expiresAt: new Date(Date.now() + 86400000), plan: { name: "Max" } });
    const response = await GET();
    const data = await response.json();
    expect(data.access).toMatchObject({ planId: "max", planName: "Max" });
    expect(data.subscription).toBeNull();
  });

  it("shows a scheduled change alongside the current paid plan", async () => {
    findUnique.mockResolvedValue({ planId: "max", expiresAt: new Date(Date.now() + 86400000), plan: { name: "Max" } });
    findMany.mockResolvedValue([{ id: "next", planId: "standard", status: "authenticated", currentEnd: null, cancelAtCycleEnd: false, plan: { name: "Standard" }, charges: [] }]);
    const data = await (await GET()).json();
    expect(data.access.planId).toBe("max");
    expect(data.scheduled).toMatchObject({ planId: "standard", status: "authenticated" });
  });
});
