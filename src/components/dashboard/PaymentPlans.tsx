"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowRight, Check } from "lucide-react";
import { getNebiusModelDetails } from "@/lib/nebius-models";
import { PaidModelCatalog } from "@/components/PaidModelCatalog";

type Plan = { id: string; name: string; description: string; priceInr: number; dailyQueryLimit: number | null; premiumDailyQueryLimit: number; modelIds: string[] };
type Access = { planId: string; planName: string; expiresAt: string };
type Subscription = { id: string; planId: string; planName: string; status: string; currentEnd: string | null; cancelAtCycleEnd: boolean };
type PaymentResult = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };
type Checkout = { open: () => void; on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void };
type CheckoutOptions = { key: string; subscription_id: string; name: string; description: string; prefill: { email?: string | null }; theme: { color: string }; modal: { ondismiss: () => void }; handler: (response: PaymentResult) => void };
declare global { interface Window { Razorpay?: new (options: CheckoutOptions) => Checkout } }

const confetti = Array.from({ length: 32 }, (_, i) => ({ left: `${(i * 37) % 100}%`, delay: `${(i % 8) * 90}ms`, color: ["#22d3ee", "#facc15", "#f472b6", "#86efac"][i % 4] }));
const date = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function PaymentPlans() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [access, setAccess] = useState<Access | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [scheduled, setScheduled] = useState<Subscription | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    fetch("/api/plans").then((response) => response.ok ? response.json() : []).then((data) => setPlans(Array.isArray(data) ? data : [])).catch(() => setMessage({ type: "error", text: "Unable to load plans." }));
  }, []);

  async function refreshSubscription() {
    const response = await fetch("/api/subscriptions/status", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { access?: Access | null; subscription?: Subscription | null; scheduled?: Subscription | null };
    setAccess(data.access ?? null);
    setSubscription(data.subscription ?? null);
    setScheduled(data.scheduled ?? null);
  }

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/subscriptions/status", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ access?: Access | null; subscription?: Subscription | null; scheduled?: Subscription | null }> : null).then((data) => {
      if (data) { setAccess(data.access ?? null); setSubscription(data.subscription ?? null); setScheduled(data.scheduled ?? null); }
    }).catch(() => {});
    fetch("/api/razorpay/reconcile", { method: "POST" }).then((response) => response.ok ? response.json() as Promise<{ activated: number }> : null).then((result) => {
      if (result?.activated) { void refreshSubscription(); router.refresh(); }
    }).catch(() => {});
  }, [sessionStatus, router]);

  const currentPlanId = access?.planId ?? (subscription?.currentEnd ? subscription.planId : null);
  const currentPrice = plans.find((plan) => plan.id === currentPlanId)?.priceInr;
  const hasUpcoming = !!scheduled || (!!subscription && ["created", "authenticated"].includes(subscription.status) && !subscription.currentEnd);
  const canCancelCurrent = !!subscription && !subscription.cancelAtCycleEnd && !scheduled && ["active", "pending", "halted"].includes(subscription.status);

  function actionLabel(plan: Plan) {
    if (sessionStatus !== "authenticated") return "Sign in to continue";
    if (scheduled) return scheduled.planId === plan.id ? "Change scheduled" : "Plan change scheduled";
    if (subscription?.status === "created" && subscription.planId === plan.id) return "Continue setup";
    if (subscription?.status === "authenticated" && subscription.planId === plan.id) return "Awaiting first charge";
    if (currentPlanId === plan.id) return subscription && !subscription.cancelAtCycleEnd ? "Current plan" : "Set up monthly renewal";
    if (currentPrice !== undefined) return plan.priceInr > currentPrice ? "Upgrade at period end" : "Downgrade at period end";
    return "Buy plan";
  }

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
      const response = await fetch("/api/subscriptions/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id }) });
      const order = await response.json() as { subscription_id?: string; key?: string; starts_at?: number | null; error?: string };
      if (!response.ok) throw new Error(order.error || `Unable to start subscription (${response.status})`);
      if (!order.subscription_id || !order.key) throw new Error("The subscription response was incomplete.");
      const checkout = new window.Razorpay({
        key: order.key, subscription_id: order.subscription_id, name: "Codyn",
        description: `${plan.name} monthly subscription · renews automatically`,
        prefill: { email: session.user?.email }, theme: { color: "#22d3ee" },
        modal: { ondismiss: () => setBusy(null) },
        handler: async (result) => {
          try {
            const verifyResponse = await fetch("/api/subscriptions/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
            const verification = await verifyResponse.json() as { success?: boolean; pending?: boolean; message?: string; error?: string };
            if (verification.pending) {
              const nextCharge = order.starts_at ? ` Your first ₹${plan.priceInr} plan charge is scheduled for ${date(new Date(order.starts_at * 1000).toISOString())}, when your current paid access ends.` : ` Your first ₹${plan.priceInr} plan charge follows authorization.`;
              setMessage({ type: "success", text: `Monthly billing authorized.${nextCharge} Access is confirmed after the full plan payment is captured.` });
            } else {
              if (!verifyResponse.ok || !verification.success) throw new Error(verification.error || "Payment verification failed.");
              setMessage({ type: "success", text: "Thanks for purchasing! Your subscription is active." });
              setCelebrate(true);
              window.setTimeout(() => setCelebrate(false), 4200);
              router.refresh();
            }
            await refreshSubscription();
          } catch (error) {
            setMessage({ type: "error", text: error instanceof Error ? error.message : "Payment confirmation is delayed. Please refresh shortly." });
          } finally { setBusy(null); }
        },
      });
      checkout.on("payment.failed", (result) => { setMessage({ type: "error", text: result.error?.description || "Payment failed. Please try again." }); setBusy(null); });
      checkout.open();
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to start subscription." });
      setBusy(null);
    }
  }

  async function cancelRenewal(subscriptionId: string) {
    setBusy("cancel");
    try {
      const response = await fetch("/api/subscriptions/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscriptionId }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to cancel renewal.");
      setMessage({ type: "success", text: scheduled?.id === subscriptionId ? "Upcoming plan cancelled. Your current access remains until the paid period ends." : "Automatic renewal cancelled. Your paid access remains until the period ends." });
      await refreshSubscription();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to cancel renewal." }); }
    finally { setBusy(null); }
  }

  return <main className="space-y-8">
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setCheckoutReady(true)} onError={() => setMessage({ type: "error", text: "Unable to load payment checkout. Please refresh and try again." })} />
    {celebrate && <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-64 overflow-hidden">{confetti.map((piece, i) => <span key={i} className="absolute top-0 h-3 w-2 animate-[confetti-fall_3s_ease-in_forwards]" style={{ left: piece.left, animationDelay: piece.delay, backgroundColor: piece.color, transform: `rotate(${i * 23}deg)` }} />)}</div>}
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Subscription</p><h1 className="mt-2 text-3xl font-semibold text-white">Choose a plan</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Manage your plan and future renewals.</p></header>
    {message && <p role={message.type === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${message.type === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{message.text}</p>}
    {access && <section className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-5 text-sm"><p className="font-semibold text-white">Current plan: {access.planName}</p><p className="mt-1 text-zinc-300">Paid access until {date(access.expiresAt)}. {scheduled ? "Your next plan starts when this period ends." : canCancelCurrent ? "Renews automatically each month." : "Renewal off — no future plan charge is scheduled."}</p></section>}
    {!access && subscription && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 text-sm"><div><p className="font-semibold text-white">{subscription.planName} subscription · {subscription.status}</p><p className="mt-1 text-zinc-400">{subscription.status === "created" ? "Complete checkout to authorize monthly billing." : subscription.status === "authenticated" ? "Authorization complete. Waiting for the first full monthly payment." : subscription.cancelAtCycleEnd ? "Renewal cancelled." : "Your payment is being confirmed."}</p></div>{!subscription.cancelAtCycleEnd && <button type="button" onClick={() => void cancelRenewal(subscription.id)} disabled={busy !== null} className="rounded-lg border border-white/20 px-3 py-2 text-zinc-200 hover:bg-white/10 disabled:opacity-50">{subscription.status === "created" ? "Cancel setup" : "Cancel renewal"}</button>}</section>}
    {scheduled && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-5 text-sm"><p>Upcoming plan: {scheduled.planName}. Its first full monthly charge is due when your current paid period ends.</p><button type="button" onClick={() => void cancelRenewal(scheduled.id)} disabled={busy !== null} className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10 disabled:opacity-50">Cancel upcoming plan</button></section>}
    <div className="grid gap-5 lg:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="flex h-full flex-col rounded-3xl border border-cyan-400/25 bg-linear-to-b from-cyan-950/35 to-zinc-950 p-7">
      <div className="flex items-center justify-between gap-3"><p className="text-xs font-mono uppercase tracking-widest text-cyan-300">{plan.name}</p>{currentPlanId === plan.id && <span className="rounded-full border border-cyan-400/30 px-2 py-1 text-xs text-cyan-200">Current plan</span>}</div>
      <p className="mt-5 text-4xl font-semibold text-white">₹{plan.priceInr}<span className="text-sm font-normal text-white/40"> / month</span></p><p className="mt-4 text-sm leading-6 text-white/60">{plan.description}</p>
      <ul className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />{plan.dailyQueryLimit === null ? "Unlimited total questions" : `${plan.dailyQueryLimit} total questions per UTC day`}</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Up to {plan.premiumDailyQueryLimit} premium-model questions per UTC day</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Gemini plus {plan.modelIds.length} premium model{plan.modelIds.length === 1 ? "" : "s"} to choose from</li></ul>
      {plan.modelIds.length > 0 && <div className="mt-5"><h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Included paid models</h2><ul className="mt-3 flex flex-wrap gap-2">{plan.modelIds.map((id) => <li key={id} title={id} className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1.5 text-xs text-white/75">{getNebiusModelDetails(id).name}</li>)}</ul></div>}
      <div className="mt-auto pt-8"><p className="mb-3 text-xs text-zinc-400">₹{plan.priceInr} monthly after the first plan payment.</p><button type="button" onClick={() => void buy(plan)} disabled={busy !== null || sessionStatus === "loading" || !!scheduled || (!!subscription && subscription.status === "authenticated" && subscription.planId === plan.id) || (!!subscription && currentPlanId === plan.id && !subscription.cancelAtCycleEnd && ["active", "pending", "halted"].includes(subscription.status)) || (!!hasUpcoming && subscription?.planId !== plan.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{busy === plan.id ? "Opening checkout..." : actionLabel(plan)}<ArrowRight size={15} /></button>{currentPlanId === plan.id && canCancelCurrent && <button type="button" onClick={() => void cancelRenewal(subscription.id)} disabled={busy !== null} className="mt-3 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-medium text-zinc-200 hover:bg-white/10 disabled:opacity-50">{busy === "cancel" ? "Cancelling..." : "Cancel renewal"}</button>}{currentPlanId === plan.id && !canCancelCurrent && !scheduled && <p className="mt-3 text-center text-xs text-zinc-400">Renewal off · access ends {access ? date(access.expiresAt) : subscription?.currentEnd ? date(subscription.currentEnd) : "at period end"}</p>}</div>
    </article>)}</div>
    <PaidModelCatalog />
  </main>;
}
