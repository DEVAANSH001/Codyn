"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Impact = { risk: "low" | "medium" | "high"; reasons: string[]; transitiveDependents: string[] };

export function ChangeImpactPanel({ owner, repo, revision, path }: { owner: string; repo: string; revision: string; path: string }) {
    const [impact, setImpact] = useState<Impact | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/repository/impact?repo=${encodeURIComponent(`${owner}/${repo}`)}&revision=${encodeURIComponent(revision)}&path=${encodeURIComponent(path)}`, { signal: controller.signal })
            .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Impact analysis failed."); return body as Impact; })
            .then(setImpact).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Impact analysis failed."); });
        return () => controller.abort();
    }, [owner, repo, revision, path]);
    return <section><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/70"><AlertTriangle size={14} className="text-cyan-300" />Change impact</p>{!impact && !error ? <p className="flex items-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" />Tracing dependents…</p> : error ? <p className="text-xs leading-5 text-amber-200">{error}</p> : impact && <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className={`text-xs font-semibold uppercase ${impact.risk === "high" ? "text-red-300" : impact.risk === "medium" ? "text-amber-200" : "text-emerald-300"}`}>{impact.risk} risk</p><p className="mt-2 text-[11px] leading-5 text-white/45">{impact.reasons.join(" ")}</p>{impact.transitiveDependents.length > 0 && <details className="mt-2"><summary className="cursor-pointer text-[11px] text-cyan-200">{impact.transitiveDependents.length} affected file{impact.transitiveDependents.length === 1 ? "" : "s"}</summary><ul className="mt-2 space-y-1 break-all text-[11px] text-white/45">{impact.transitiveDependents.map((file) => <li key={file}>{file}</li>)}</ul></details>}</div>}</section>;
}
