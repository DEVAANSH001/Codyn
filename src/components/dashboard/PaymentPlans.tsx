"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowRight, Check } from "lucide-react";
import { getNebiusModelDetails } from "@/lib/nebius-models";

type Plan = { id: string; name: string; description: string; priceInr: number; dailyQueryLimit: number | null; premiumDailyQueryLimit: number; modelIds: string[] };
type PaymentResult = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type Razorpay = { open: () => void; on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { email?: string | null }; theme: { color: string }; modal: { ondismiss: () => void }; handler: (response: PaymentResult) => void };
type RazorpayConstructor = new (options: RazorpayOptions) => Razorpay;

declare global { interface Window { Razorpay?: RazorpayConstructor } }

export default function PaymentPlans() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(false);

  useEffect(() => {
    fetch("/api/plans").then((response) => response.ok ? response.json() : []).then((data) => setPlans(Array.isArray(data) ? data : [])).catch(() => setMessage({ type: "error", text: "Unable to load plans." }));
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/razorpay/reconcile", { method: "POST" })
      .then((response) => response.ok ? response.json() as Promise<{ activated: number }> : null)
      .then((result) => {
        if (result?.activated) {
          setMessage({ type: "success", text: "A previous payment was confirmed and your plan is active." });
          router.refresh();
        }
      }).catch(() => {});
  }, [sessionStatus, router]);

  async function buy(plan: Plan) {
    if (sessionStatus !== "authenticated" || !session) {
      await signIn("github", { callbackUrl: "/dashboard/plans" });
      return;
    }
    if (!checkoutReady || !window.Razorpay) {
      setMessage({ type: "error", text: "Payment checkout is still loading. Please try again shortly." });
      return;
    }
    setBusy(plan.id);
    setMessage(null);
    try {
      const response = await fetch("/api/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id }) });
      const order = await response.json() as { order_id?: string; amount?: number; currency?: string; key?: string; error?: string };
      if (!response.ok) throw new Error(order.error || `Unable to create order (${response.status})`);
      if (!order.order_id || !order.amount || !order.currency) throw new Error("The payment order response was incomplete.");
      const Razorpay = window.Razorpay;
      const key = order.key;
      if (!Razorpay || !key) throw new Error("Payment checkout is not configured. Please contact support.");
      const checkout = new Razorpay({ key, amount: order.amount, currency: order.currency, name: "Codyn", description: `${plan.name} plan · 30 days`, order_id: order.order_id, prefill: { email: session.user?.email }, theme: { color: "#22d3ee" }, modal: { ondismiss: () => setBusy(null) }, handler: async (result) => {
        try {
          const verifyResponse = await fetch("/api/verify-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
          const verification = await verifyResponse.json() as { success?: boolean; pending?: boolean; error?: string };
          if (verification.pending) {
            setMessage({ type: "success", text: verification.error || "Payment received. Your plan will activate after confirmation." });
            return;
          }
          if (!verifyResponse.ok || !verification.success) throw new Error(verification.error || "Payment verification failed.");
          setMessage({ type: "success", text: `${plan.name} is active for 30 days.` });
          router.refresh();
        } catch (error) {
          setMessage({ type: "error", text: error instanceof Error ? error.message : "Payment confirmation is delayed. If charged, please refresh shortly." });
        } finally { setBusy(null); }
      } });
      checkout.on("payment.failed", (result) => { setMessage({ type: "error", text: result.error?.description || "Payment failed. Please try again." }); setBusy(null); });
      checkout.open();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to create order." });
      setBusy(null);
    }
  }

  return <main className="space-y-8"><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setCheckoutReady(true)} onError={() => setMessage({ type: "error", text: "Unable to load payment checkout. Please refresh and try again." })} /><header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Subscription</p><h1 className="mt-2 text-3xl font-semibold text-white">Choose a plan</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Review your monthly access and activate it securely. Your plan starts automatically after payment verification.</p></header>{message && <p role={message.type === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${message.type === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{message.text}</p>}<div className="grid gap-5 lg:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="flex flex-col rounded-3xl border border-cyan-400/25 bg-linear-to-b from-cyan-950/35 to-zinc-950 p-7"><p className="text-xs font-mono uppercase tracking-widest text-cyan-300">{plan.name}</p><p className="mt-5 text-4xl font-semibold text-white">₹{plan.priceInr}<span className="text-sm font-normal text-white/40"> / 30 days</span></p><p className="mt-4 text-sm leading-6 text-white/60">{plan.description}</p><ul className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />{plan.dailyQueryLimit === null ? "Unlimited total questions" : `${plan.dailyQueryLimit} total questions per UTC day`}</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Up to {plan.premiumDailyQueryLimit} premium-model questions per UTC day</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Gemini plus {plan.modelIds.length} premium model{plan.modelIds.length === 1 ? "" : "s"} to choose from</li></ul><div className="mt-5"><h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Included premium models</h2>{plan.modelIds.length ? <ul className="mt-3 flex flex-wrap gap-2">{plan.modelIds.map((id) => <li key={id} title={id} className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1.5 text-xs text-white/75">{getNebiusModelDetails(id).name}</li>)}</ul> : <p className="mt-2 text-xs text-zinc-400">Gemini only</p>}</div><button type="button" onClick={() => void buy(plan)} disabled={busy !== null || sessionStatus === "loading"} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">{busy === plan.id ? "Opening checkout..." : sessionStatus === "authenticated" ? "Buy plan" : "Sign in to continue"}<ArrowRight size={15} /></button></article>)}</div></main>;
}
