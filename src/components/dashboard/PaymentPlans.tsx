"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ArrowRight, Check } from "lucide-react";
import { getNebiusModelDetails } from "@/lib/nebius-models";

type Plan = { id: string; name: string; description: string; priceInr: number; dailyQueryLimit: number | null; premiumDailyQueryLimit: number; modelIds: string[] };
type PaymentResult = { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string };
type Checkout = { open: () => void; on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void };
type CheckoutOptions = { key: string; subscription_id: string; name: string; description: string; prefill: { email?: string | null }; theme: { color: string }; modal: { ondismiss: () => void }; handler: (response: PaymentResult) => void };
declare global { interface Window { Razorpay?: new (options: CheckoutOptions) => Checkout } }

type Subscription = { id: string; planId: string; planName: string; status: string; currentEnd: string | null; cancelAtCycleEnd: boolean };
const confetti = Array.from({ length: 32 }, (_, i) => ({ left: `${(i * 37) % 100}%`, delay: `${(i % 8) * 90}ms`, color: ["#22d3ee", "#facc15", "#f472b6", "#86efac"][i % 4] }));

export default function PaymentPlans() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
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
    const response = await fetch("/api/subscriptions/status");
    if (response.ok) {
      const data = await response.json() as { subscription?: Subscription | null; scheduled?: Subscription | null };
      setSubscription(data.subscription ?? null);
      setScheduled(data.scheduled ?? null);
    }
  }

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/subscriptions/status").then((response) => response.ok ? response.json() as Promise<{ subscription?: Subscription | null; scheduled?: Subscription | null }> : null).then((data) => {
      if (data) { setSubscription(data.subscription ?? null); setScheduled(data.scheduled ?? null); }
    }).catch(() => {});
    fetch("/api/razorpay/reconcile", { method: "POST" }).then((response) => response.ok ? response.json() as Promise<{ activated: number }> : null).then((result) => {
      if (result?.activated) router.refresh();
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
      const response = await fetch("/api/subscriptions/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id }) });
      const order = await response.json() as { subscription_id?: string; key?: string; error?: string };
      if (!response.ok) throw new Error(order.error || `Unable to start subscription (${response.status})`);
      if (!order.subscription_id || !order.key) throw new Error("The subscription response was incomplete.");
      const checkout = new window.Razorpay({ key: order.key, subscription_id: order.subscription_id, name: "Codyn", description: `${plan.name} monthly subscription · renews automatically`, prefill: { email: session.user?.email }, theme: { color: "#22d3ee" }, modal: { ondismiss: () => setBusy(null) }, handler: async (result) => {
        try {
          const verifyResponse = await fetch("/api/subscriptions/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) });
          const verification = await verifyResponse.json() as { success?: boolean; pending?: boolean; message?: string; error?: string };
          if (verification.pending) {
            setMessage({ type: "success", text: verification.message || "Subscription authorized. Access starts after the first monthly charge." });
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
      } });
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
      setMessage({ type: "success", text: scheduled?.id === subscriptionId ? "Upcoming subscription cancelled. Your current access remains until the paid period ends; choose a plan again if you want renewal." : "Automatic renewal is cancelled. Your current access remains until the paid period ends." });
      await refreshSubscription();
    } catch (error) { setMessage({ type: "error", text: error instanceof Error ? error.message : "Unable to cancel renewal." }); }
    finally { setBusy(null); }
  }

  return <main className="space-y-8">
    <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onReady={() => setCheckoutReady(true)} onError={() => setMessage({ type: "error", text: "Unable to load payment checkout. Please refresh and try again." })} />
    {celebrate && <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50 h-64 overflow-hidden">{confetti.map((piece, i) => <span key={i} className="absolute top-0 h-3 w-2 animate-[confetti-fall_3s_ease-in_forwards]" style={{ left: piece.left, animationDelay: piece.delay, backgroundColor: piece.color, transform: `rotate(${i * 23}deg)` }} />)}</div>}
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Subscription</p><h1 className="mt-2 text-3xl font-semibold text-white">Choose a plan</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Your plan renews automatically every month after the first payment. You can cancel future renewals here.</p></header>
    {message && <p role={message.type === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${message.type === "error" ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"}`}>{message.text}</p>}
    {subscription && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-5 text-sm"><div><p className="font-semibold">{subscription.planName} subscription · {subscription.status}</p><p className="mt-1 text-zinc-400">{subscription.cancelAtCycleEnd ? "Renewal cancelled" : subscription.status === "created" ? "Complete checkout to authorize monthly billing" : "Renews automatically each month"}{subscription.currentEnd ? ` · current period ends ${new Date(subscription.currentEnd).toLocaleDateString("en-IN")}` : ""}</p></div>{!subscription.cancelAtCycleEnd && ["created", "authenticated", "active", "pending", "halted"].includes(subscription.status) && <button type="button" onClick={() => void cancelRenewal(subscription.id)} disabled={busy !== null} className="rounded-lg border border-white/20 px-3 py-2 text-zinc-200 hover:bg-white/10 disabled:opacity-50">{subscription.status === "created" ? "Cancel setup" : "Cancel renewal"}</button>}</section>}
    {scheduled && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-5 text-sm"><p>Upcoming plan: {scheduled.planName}. It starts when your current paid period ends. Cancelling it will leave renewal off until you choose a plan again.</p><button type="button" onClick={() => void cancelRenewal(scheduled.id)} disabled={busy !== null} className="rounded-lg border border-white/20 px-3 py-2 hover:bg-white/10 disabled:opacity-50">Cancel upcoming plan</button></section>}
    <div className="grid gap-5 lg:grid-cols-2">{plans.map((plan) => <article key={plan.id} className="flex h-full flex-col rounded-3xl border border-cyan-400/25 bg-linear-to-b from-cyan-950/35 to-zinc-950 p-7"><p className="text-xs font-mono uppercase tracking-widest text-cyan-300">{plan.name}</p><p className="mt-5 text-4xl font-semibold text-white">₹{plan.priceInr}<span className="text-sm font-normal text-white/40"> / month</span></p><p className="mt-4 text-sm leading-6 text-white/60">{plan.description}</p><ul className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />{plan.dailyQueryLimit === null ? "Unlimited total questions" : `${plan.dailyQueryLimit} total questions per UTC day`}</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Up to {plan.premiumDailyQueryLimit} premium-model questions per UTC day</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Gemini plus {plan.modelIds.length} premium model{plan.modelIds.length === 1 ? "" : "s"} to choose from</li></ul><div className="mt-5"><h2 className="text-xs font-semibold uppercase tracking-widest text-cyan-300">Included premium models</h2>{plan.modelIds.length ? <ul className="mt-3 flex flex-wrap gap-2">{plan.modelIds.map((id) => <li key={id} title={id} className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1.5 text-xs text-white/75">{getNebiusModelDetails(id).name}</li>)}</ul> : <p className="mt-2 text-xs text-zinc-400">Gemini only</p>}</div><div className="mt-auto pt-8"><p className="mb-3 text-xs text-zinc-400">₹{plan.priceInr} charged monthly until you cancel.</p><button type="button" onClick={() => void buy(plan)} disabled={busy !== null || sessionStatus === "loading" || (!!subscription && subscription.planId === plan.id && !subscription.cancelAtCycleEnd && subscription.status !== "created") || !!scheduled} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">{busy === plan.id ? "Opening checkout..." : scheduled?.planId === plan.id ? "Change scheduled" : subscription?.planId === plan.id && subscription.status === "created" ? "Continue setup" : subscription?.planId === plan.id && !subscription.cancelAtCycleEnd ? "Current plan" : subscription && sessionStatus === "authenticated" ? subscription.planId === plan.id ? "Renew current plan" : plan.priceInr > (plans.find((item) => item.id === subscription.planId)?.priceInr ?? 0) ? "Upgrade at next renewal" : "Downgrade at next renewal" : sessionStatus === "authenticated" ? "Buy plan" : "Sign in to continue"}<ArrowRight size={15} /></button></div></article>)}</div>
  </main>;
}
