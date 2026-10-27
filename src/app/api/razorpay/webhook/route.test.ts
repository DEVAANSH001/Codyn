import { beforeEach, describe, expect, it, vi } from "vitest";

const { validHmacMock, fulfillCaptured, fulfillSubscription, syncSubscription } = vi.hoisted(() => ({
  validHmacMock: vi.fn(), fulfillCaptured: vi.fn(), fulfillSubscription: vi.fn(), syncSubscription: vi.fn(),
}));
vi.mock("@/lib/razorpay", () => ({ validHmac: validHmacMock, fulfillCapturedPayment: fulfillCaptured }));
vi.mock("@/lib/billing", () => ({ fulfillSubscriptionCharge: fulfillSubscription, syncSubscriptionStatus: syncSubscription }));

import { POST } from "./route";

const request = (event: object) => new Request("http://localhost/api/razorpay/webhook", {
  method: "POST", headers: { "x-razorpay-signature": "signed" }, body: JSON.stringify(event),
});

describe("subscription webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-test-secret";
  });

  it("rejects a payload with an invalid signature", async () => {
    validHmacMock.mockReturnValue(false);
    const response = await POST(request({ event: "subscription.charged" }));
    expect(response.status).toBe(401);
    expect(fulfillSubscription).not.toHaveBeenCalled();
  });

  it("fulfills a signed monthly charge", async () => {
    validHmacMock.mockReturnValue(true);
    fulfillSubscription.mockResolvedValue("verified");
    const response = await POST(request({ event: "subscription.charged", payload: { subscription: { entity: { id: "sub_1" } }, payment: { entity: { id: "pay_1" } } } }));
    expect(response.status).toBe(200);
    expect(fulfillSubscription).toHaveBeenCalledWith("sub_1", "pay_1");
  });

  it("acknowledges a nominal authorization without activating a plan", async () => {
    validHmacMock.mockReturnValue(true);
    fulfillSubscription.mockResolvedValue("mismatch");
    const response = await POST(request({ event: "payment.captured", payload: { payment: { entity: { id: "pay_auth", subscription_id: "sub_1" } } } }));
    expect(response.status).toBe(200);
    expect(fulfillCaptured).not.toHaveBeenCalled();
  });
});
