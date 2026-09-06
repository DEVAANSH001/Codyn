"use client";

import { GitBranch, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Violation = { type: string; severity: "medium" | "high"; message: string };

export function ArchitectureRulesPanel({ owner, repo, revision }: { owner: string; repo: string; revision: string }) {
    const [violations, setViolations] = useState<Violation[] | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/repository/architecture?repo=${encodeURIComponent(`${owner}/${repo}`)}&revision=${encodeURIComponent(revision)}`, { signal: controller.signal })
            .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Architecture analysis failed."); return body.violations as Violation[]; })
            .then(setViolations).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Architecture analysis failed."); });
        return () => controller.abort();
    }, [owner, repo, revision]);
    return <section><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/70"><GitBranch size={14} className="text-cyan-300" />Architecture rules</p>{!violations && !error ? <p className="flex items-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" />Checking dependency boundaries…</p> : error ? <p className="text-xs leading-5 text-amber-200">{error}</p> : violations?.length ? <ul className="space-y-2">{violations.slice(0, 5).map((violation, index) => <li key={`${violation.message}-${index}`} className="rounded-lg border border-amber-300/15 bg-amber-300/5 p-2 text-[11px] leading-5 text-amber-100/80">{violation.message}</li>)}</ul> : <p className="text-xs leading-5 text-emerald-200">No default boundary violations or local dependency cycles found.</p>}</section>;
}
