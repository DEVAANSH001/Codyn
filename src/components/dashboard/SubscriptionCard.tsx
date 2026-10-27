"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CreditCard, Sparkles } from "lucide-react";

type Entitlement = {
    name?: string;
    expiresAt?: string | null;
    modelIds?: string[];
};

export default function SubscriptionCard({ compact = false }: { compact?: boolean }) {
    const [entitlement, setEntitlement] = useState<Entitlement>({ name: "Free", modelIds: [] });

    useEffect(() => {
        fetch("/api/chat/plan", { cache: "no-store" })
            .then((response) => response.ok ? response.json() as Promise<Entitlement> : null)
            .then((data) => { if (data) setEntitlement(data); })
            .catch(() => {});
    }, []);

    const isPaid = entitlement.name && entitlement.name !== "Free";
    const expiry = entitlement.expiresAt ? new Date(entitlement.expiresAt).toLocaleDateString("en-IN") : null;

    return (
        <section className={`rounded-2xl border border-cyan-500/20 bg-linear-to-br from-cyan-950/40 to-zinc-900 ${compact ? "p-4" : "p-6"}`}>
            <div className="flex items-center justify-between">
                <div className={`grid place-items-center rounded-xl bg-cyan-400/10 text-cyan-300 ${compact ? "h-8 w-8" : "h-10 w-10"}`}>
                    <CreditCard className={compact ? "h-4 w-4" : "h-5 w-5"} />
                </div>
                <Sparkles className="h-4 w-4 text-cyan-300/50" />
            </div>
            <p className={`${compact ? "mt-3" : "mt-5"} text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/70`}>Subscription</p>
            <h2 className={`${compact ? "mt-1 text-base" : "mt-2 text-xl"} font-semibold text-white`}>{entitlement.name || "Free"} plan</h2>
            <p className={`${compact ? "mt-1 text-xs leading-5" : "mt-2 text-sm leading-6"} text-zinc-400`}>
                {isPaid ? `Active until ${expiry}. ${entitlement.modelIds?.length ?? 0} premium models included.` : "Unlock premium models and higher daily limits."}
            </p>
            <Link href="/dashboard/plans" className={`${compact ? "mt-3 px-3 py-2 text-xs" : "mt-5 px-4 py-3 text-sm"} inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 font-semibold text-black transition hover:bg-cyan-300`}>
                {isPaid ? "View plans" : "Explore plans"}
                <ArrowRight className="h-4 w-4" />
            </Link>
        </section>
    );
}
