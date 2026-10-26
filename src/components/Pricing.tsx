"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Script from "next/script";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { SectionEyebrow } from "./SectionEyebrow";
import { getNebiusModelDetails } from "@/lib/nebius-models";

type PublicPlan = { id: string; name: string; description: string; priceInr: number; dailyQueryLimit: number | null; modelIds: string[] };
type RazorpayResult = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void; close: () => void };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { email?: string | null }; theme: { color: string }; handler: (response: RazorpayResult) => void };
type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export const Pricing = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/plans").then((response) => response.ok ? response.json() : []).then((data) => setPlans(Array.isArray(data) ? data : [])).catch(() => setMessage({ type: "error", text: "Unable to load plans." }));
  }, []);

  const buyPlan = async (plan: PublicPlan) => {
    if (sessionStatus !== "authenticated" || !session) {
      await signIn("github", { callbackUrl: "/#pricing" });
      return;
    }
    setBuyingPlanId(plan.id);
    setMessage(null);
    try {
      const orderResponse = await fetch("/api/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id }) });
      const order = await orderResponse.json() as { order_id?: string; amount?: number; currency?: string; error?: string };
      if (!orderResponse.ok || !order.order_id || !order.amount || !order.currency) throw new Error(order.error || "Unable to start checkout");
      await loadRazorpay();
      const Razorpay = window.Razorpay;
      const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!Razorpay || !key) throw new Error("Razorpay checkout is not configured");

      const checkout = new Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        name: "Codyn",
        description: `${plan.name} plan · 30 days`,
        order_id: order.order_id,
        prefill: { email: session.user?.email },
        theme: { color: "#22d3ee" },
        handler: async (result) => {
          try {
            const verifyResponse = await fetch("/api/verify-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
            const verification = await verifyResponse.json() as { success?: boolean; error?: string };
            if (!verifyResponse.ok || !verification.success) throw new Error(verification.error || "Payment verification failed");
            setMessage({ type: "success", text: `${plan.name} is active for 30 days.` });
          } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Payment verification failed." });
          } finally {
            setBuyingPlanId(null);
          }
        },
      });
      checkout.on("payment.failed", (response) => {
        setMessage({ type: "error", text: response.error?.description || "Payment failed. Please try again." });
        setBuyingPlanId(null);
      });
      checkout.open();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to start checkout." });
      setBuyingPlanId(null);
    }
  };

  return <section className="relative z-10 mx-auto max-w-6xl border-t border-white/10 px-6 py-20 md:py-28" id="pricing">
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
    <div className="mx-auto mb-10 max-w-2xl text-center"><SectionEyebrow label="Pricing" tag="Flexible plans" /><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Choose your model and daily limit.</h2><p className="mt-4 text-sm leading-7 text-white/60">Pay securely with Razorpay. Your selected plan activates automatically for 30 days after payment verification.</p></div>
    {message && <p role={message.type === "error" ? "alert" : "status"} className={`mx-auto mb-6 max-w-2xl rounded-xl border p-3 text-center text-sm ${message.type === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{message.text}</p>}
    <div className="grid gap-5 md:grid-cols-3">
      <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-zinc-950/80 p-7"><p className="text-xs font-mono uppercase tracking-widest text-cyan-300">Free</p><p className="mt-5 text-4xl font-semibold">₹0 <span className="text-sm font-normal text-white/40">forever</span></p><p className="mt-4 min-h-20 text-sm leading-6 text-white/55">Explore public repositories and save chat history when signed in.</p><ul className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />10 queries per day for signed-in users</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Gemini Lite and Thinking</li></ul><Link href="/chat" className="mt-auto pt-7"><span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">Start free <ArrowRight size={15} /></span></Link></article>
      {plans.map((plan) => <article key={plan.id} className="flex h-full flex-col rounded-3xl border border-cyan-400/25 bg-linear-to-b from-cyan-950/35 to-zinc-950 p-7"><p className="text-xs font-mono uppercase tracking-widest text-cyan-300">{plan.name}</p><p className="mt-5 text-4xl font-semibold">₹{plan.priceInr}<span className="text-sm font-normal text-white/40"> / 30 days</span></p><p className="mt-4 min-h-20 text-sm leading-6 text-white/55">{plan.description}</p><ul className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />{plan.dailyQueryLimit === null ? "Unlimited total questions" : `${plan.dailyQueryLimit} total questions per UTC day`}</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Up to 50 premium-model questions daily</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Gemini plus {plan.modelIds.length} premium model{plan.modelIds.length === 1 ? "" : "s"}</li></ul><div className="mt-5"><p className="text-[10px] font-semibold uppercase tracking-widest text-white/35">Included premium models</p><div className="mt-2 flex flex-wrap gap-2">{plan.modelIds.map((id) => { const model = getNebiusModelDetails(id); return <span key={id} className="rounded-lg border border-white/10 bg-white/4 px-2.5 py-1.5 text-[11px] font-medium text-white/65">{model.name}</span>; })}</div></div><p className="mt-5 text-xs leading-5 text-white/40">Per-account limits reset at 00:00 UTC. Premium requests pause at the daily limit; Gemini remains available until the total plan limit is reached.</p><button type="button" onClick={() => buyPlan(plan)} disabled={buyingPlanId !== null || sessionStatus === "loading"} className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">{buyingPlanId === plan.id ? "Opening checkout..." : sessionStatus === "authenticated" ? "Buy with Razorpay" : "Sign in to subscribe"}<ArrowRight size={15} /></button></article>)}
    </div>
  </section>;
};
