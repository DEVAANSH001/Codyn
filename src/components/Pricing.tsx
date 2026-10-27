"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { SectionEyebrow } from "./SectionEyebrow";

type PublicPlan = { id: string; name: string; description: string; priceInr: number; dailyQueryLimit: number | null; premiumDailyQueryLimit: number; modelIds: string[] };
export const Pricing = () => {
  const [plans, setPlans] = useState<PublicPlan[]>([]);

  useEffect(() => {
    fetch("/api/plans").then((response) => response.ok ? response.json() : []).then((data) => setPlans(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  return <section className="relative z-10 mx-auto max-w-6xl border-t border-white/10 px-6 py-20 md:py-28" id="pricing">
    <div className="mx-auto mb-10 max-w-2xl text-center"><SectionEyebrow label="Pricing" tag="Flexible plans" /><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Choose your model and daily limit.</h2><p className="mt-4 text-sm leading-7 text-white/60">Paid plans renew monthly. Review details and cancel anytime.</p></div>
    <div className="grid gap-5 md:grid-cols-3">
      <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-zinc-950/80 p-7"><p className="text-xs font-mono uppercase tracking-widest text-cyan-300">Free</p><p className="mt-5 text-4xl font-semibold">₹0 <span className="text-sm font-normal text-white/40">forever</span></p><p className="mt-4 min-h-20 text-sm leading-6 text-white/55">Explore public repositories and save chat history when signed in.</p><ul className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />10 queries per day for signed-in users</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Gemini Lite and Thinking</li></ul><Link href="/chat" className="mt-auto pt-7"><span className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">Start free <ArrowRight size={15} /></span></Link></article>
      {plans.map((plan) => <article key={plan.id} className="flex h-full flex-col rounded-3xl border border-cyan-400/25 bg-linear-to-b from-cyan-950/35 to-zinc-950 p-7"><p className="text-xs font-mono uppercase tracking-widest text-cyan-300">{plan.name}</p><p className="mt-5 text-4xl font-semibold">₹{plan.priceInr}<span className="text-sm font-normal text-white/40"> / month</span></p><p className="mt-4 min-h-20 text-sm leading-6 text-white/55">{plan.description}</p><ul className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-white/75"><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />{plan.dailyQueryLimit === null ? "Unlimited total questions" : `${plan.dailyQueryLimit} total questions per UTC day`}</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Up to {plan.premiumDailyQueryLimit} premium-model questions per UTC day</li><li className="flex gap-2"><Check size={16} className="shrink-0 text-cyan-300" />Gemini plus {plan.modelIds.length} premium model{plan.modelIds.length === 1 ? "" : "s"}</li></ul><Link href="/dashboard/plans" className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-black hover:bg-cyan-300">More info <ArrowRight size={15} /></Link></article>)}
    </div>
  </section>;
};
