import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { db, fetchPayment } = vi.hoisted(() => ({
  db: {
    paymentTransaction: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  fetchPayment: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("razorpay", () => ({ default: class { payments = { fetch: fetchPayment }; } }));

import { fulfillCapturedPayment, validHmac } from "@/lib/razorpay";

const transaction = { id: "tx_1", userId: "user_1", planId: "plan_1", razorpayOrderId: "order_1", amount: 9900, currency: "INR", status: "pending" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RAZORPAY_KEY_ID = "rzp_test_example";
  process.env.RAZORPAY_KEY_SECRET = "test_secret";
  db.paymentTransaction.findUnique.mockResolvedValue(transaction);
  fetchPayment.mockResolvedValue({ order_id: "order_1", amount: 9900, currency: "INR", status: "captured" });
});

describe("Razorpay fulfillment", () => {
  it("validates the exact signed bytes", () => {
    const signature = createHmac("sha256", "test_secret").update("order_1|pay_1").digest("hex");
    expect(validHmac("order_1|pay_1", signature, "test_secret")).toBe(true);
    expect(validHmac("order_1|pay_2", signature, "test_secret")).toBe(false);
    expect(validHmac("order_1|pay_1", "malformed", "test_secret")).toBe(false);
  });

  it.each([
    [{ order_id: "order_wrong", amount: 9900, currency: "INR", status: "captured" }, "mismatch"],
    [{ order_id: "order_1", amount: 100, currency: "INR", status: "captured" }, "mismatch"],
    [{ order_id: "order_1", amount: 9900, currency: "USD", status: "captured" }, "mismatch"],
    [{ order_id: "order_1", amount: 9900, currency: "INR", status: "authorized" }, "pending"],
  ])("does not grant an invalid or uncaptured payment", async (payment, expected) => {
    fetchPayment.mockResolvedValue(payment);
    expect(await fulfillCapturedPayment("order_1", "pay_1")).toBe(expected);
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("grants captured payments once and extends existing access", async () => {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tx = {
      paymentTransaction: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      userPlan: { findUnique: vi.fn().mockResolvedValue({ expiresAt }), upsert: vi.fn() },
    };
    db.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    expect(await fulfillCapturedPayment("order_1", "pay_1")).toBe("verified");
    expect(tx.paymentTransaction.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "tx_1", status: "pending" } }));
    expect(tx.userPlan.upsert.mock.calls[0][0].create.expiresAt.getTime()).toBe(expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  });

  it("does not extend access again when another confirmation already claimed the order", async () => {
    const tx = {
      paymentTransaction: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findUnique: vi.fn().mockResolvedValue({ razorpayPaymentId: "pay_1" }),
      },
      userPlan: { findUnique: vi.fn(), upsert: vi.fn() },
    };
    db.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    expect(await fulfillCapturedPayment("order_1", "pay_1")).toBe("verified");
    expect(tx.userPlan.upsert).not.toHaveBeenCalled();
  });
});
