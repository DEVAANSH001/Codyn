"use client";

import { FlaskConical, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type TestMapping = { relatedTests: string[]; confidence: "high" | "medium" | "none" };

export function TestIntelligencePanel({ owner, repo, path }: { owner: string; repo: string; path: string }) {
    const [mapping, setMapping] = useState<TestMapping | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/repository/tests?repo=${encodeURIComponent(`${owner}/${repo}`)}&path=${encodeURIComponent(path)}`, { signal: controller.signal })
            .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Test mapping failed."); return body as TestMapping; })
            .then(setMapping).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Test mapping failed."); });
        return () => controller.abort();
    }, [owner, repo, path]);
    return <section><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/70"><FlaskConical size={14} className="text-cyan-300" />Related tests</p>{!mapping && !error ? <p className="flex items-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" />Finding tests…</p> : error ? <p className="text-xs leading-5 text-amber-200">{error}</p> : mapping && (mapping.relatedTests.length ? <div><p className="text-[11px] text-white/40">{mapping.confidence}-confidence filename match</p><ul className="mt-2 space-y-1 break-all text-[11px] text-white/55">{mapping.relatedTests.map((test) => <li key={test}>{test}</li>)}</ul></div> : <p className="text-xs leading-5 text-amber-200">No related test was found by filename. This is a gap signal, not proof that coverage is absent.</p>)}</section>;
}
