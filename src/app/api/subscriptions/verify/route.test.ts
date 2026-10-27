import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, findUnique, validHmacMock, fetchPayment, fulfill, sync } = vi.hoisted(() => ({
  authMock: vi.fn(), findUnique: vi.fn(), validHmacMock: vi.fn(), fetchPayment: vi.fn(), fulfill: vi.fn(), sync: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ prisma: { billingSubscription: { findUnique } } }));
vi.mock("@/lib/razorpay", () => ({ validHmac: validHmacMock, getRazorpayClient: () => ({ payments: { fetch: fetchPayment } }) }));
vi.mock("@/lib/billing", () => ({ fulfillSubscriptionCharge: fulfill, syncSubscriptionStatus: sync }));

import { POST } from "./route";

const request = () => new Request("http://localhost/api/subscriptions/verify", { method: "POST", body: JSON.stringify({ razorpay_payment_id: "pay_1", razorpay_subscription_id: "sub_1", razorpay_signature: "signature" }) });

describe("subscription checkout verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_KEY_SECRET = "test-secret";
    authMock.mockResolvedValue({ user: { id: "user_1" } });
    findUnique.mockResolvedValue({ userId: "user_1", razorpaySubscriptionId: "sub_1", amount: 9900 });
  });

  it("rejects an invalid signature without granting access", async () => {
    validHmacMock.mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(400);
    expect(validHmacMock).toHaveBeenCalledWith("pay_1|sub_1", "signature", "test-secret");
    expect(fulfill).not.toHaveBeenCalled();
  });

  it("waits for the real plan charge after an authorization payment", async () => {
    validHmacMock.mockReturnValue(true);
    fetchPayment.mockResolvedValue({ status: "captured", amount: 100 });
    const response = await POST(request());
    expect(response.status).toBe(202);
    expect(sync).toHaveBeenCalledWith("sub_1");
    expect(fulfill).not.toHaveBeenCalled();
  });

  it("fulfills a captured full-price subscription payment", async () => {
    validHmacMock.mockReturnValue(true);
    fetchPayment.mockResolvedValue({ status: "captured", amount: 9900 });
    fulfill.mockResolvedValue("verified");
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(fulfill).toHaveBeenCalledWith("sub_1", "pay_1");
  });
});
