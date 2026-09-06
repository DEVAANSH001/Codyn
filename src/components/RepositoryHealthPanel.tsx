"use client";

import { Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Health = { score: number; grade: string; metrics: { sourceFiles: number; testFiles: number; documentationFiles: number; circularDependencies: string[][] }; limitations: string[] };

export function RepositoryHealthPanel({ owner, repo }: { owner: string; repo: string }) {
    const [health, setHealth] = useState<Health | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/repository/health?repo=${encodeURIComponent(`${owner}/${repo}`)}`, { signal: controller.signal })
            .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Health report failed."); return body as Health; })
            .then(setHealth).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Health report failed."); });
        return () => controller.abort();
    }, [owner, repo]);
    return <section><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/70"><Activity size={14} className="text-cyan-300" />Repository health</p>{!health && !error ? <p className="flex items-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" />Calculating structural signals…</p> : error ? <p className="text-xs leading-5 text-amber-200">{error}</p> : health && <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-end justify-between"><p className="text-2xl font-semibold text-white">{health.score}<span className="text-sm text-white/40">/100</span></p><p className="text-sm font-semibold text-cyan-200">Grade {health.grade}</p></div><p className="mt-2 text-[11px] leading-5 text-white/40">{health.metrics.sourceFiles} source · {health.metrics.testFiles} tests · {health.metrics.documentationFiles} docs · {health.metrics.circularDependencies.length} cycles</p><p className="mt-2 text-[10px] leading-4 text-white/30">{health.limitations[0]}</p></div>}</section>;
}
