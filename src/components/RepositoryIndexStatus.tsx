"use client";

import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type IndexStatus = {
    status: "QUEUED" | "INDEXING" | "READY" | "FAILED" | "CANCELLED";
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    errorMessage: string | null;
};

export function RepositoryIndexStatus({ owner, repo }: { owner: string; repo: string }) {
    const [index, setIndex] = useState<IndexStatus | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/repository/index?repo=${encodeURIComponent(`${owner}/${repo}`)}`);
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || "Index status is unavailable.");
            setIndex(body.index as IndexStatus | null);
            setMessage("");
        } catch (error) {
            setIndex(null);
            setMessage(error instanceof Error ? error.message : "Index status is unavailable.");
        } finally {
            setLoading(false);
        }
    }, [owner, repo]);

    useEffect(() => { void refresh(); }, [refresh]);
    useEffect(() => {
        if (index?.status !== "QUEUED" && index?.status !== "INDEXING") return;
        const interval = window.setInterval(() => void refresh(), 5000);
        return () => window.clearInterval(interval);
    }, [index?.status, refresh]);

    if (loading && !index) return <div className="flex items-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" />Checking index status…</div>;
    if (message) return <p className="text-xs leading-5 text-amber-200">{message}</p>;
    if (!index) return <p className="text-xs leading-5 text-white/40">No durable index exists yet. Opening this repository queues one when PostgreSQL is configured.</p>;
    const active = index.status === "QUEUED" || index.status === "INDEXING";
    const complete = index.status === "READY";
    const progress = index.totalFiles > 0 ? Math.min(100, Math.round(((index.processedFiles + index.skippedFiles + index.failedFiles) / index.totalFiles) * 100)) : 0;
    return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-xs font-semibold text-white/75">{active ? <Loader2 size={14} className="animate-spin text-cyan-300" /> : complete ? <CheckCircle2 size={14} className="text-emerald-300" /> : <AlertCircle size={14} className="text-amber-300" />}{index.status === "READY" ? "Repository index ready" : index.status === "INDEXING" ? "Indexing repository" : index.status === "QUEUED" ? "Index queued" : "Index needs attention"}</p><button type="button" onClick={() => void refresh()} className="text-white/40 hover:text-white" aria-label="Refresh index status"><RefreshCw size={13} /></button></div><div className="mt-3 h-1.5 overflow-hidden rounded bg-white/10"><div className={`h-full rounded ${complete ? "bg-emerald-400" : "bg-cyan-300"}`} style={{ width: `${complete ? 100 : progress}%` }} /></div><p className="mt-2 text-[11px] leading-5 text-white/40">{index.processedFiles} parsed · {index.skippedFiles} skipped · {index.failedFiles} failed{index.totalFiles ? ` · ${index.totalFiles} eligible` : ""}</p>{index.errorMessage && <p className="mt-2 text-[11px] leading-5 text-amber-200">{index.errorMessage}</p>}</div>;
}
