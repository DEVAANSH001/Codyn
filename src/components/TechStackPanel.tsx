"use client";

import { Cpu, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Technology = { name: string; category: string; version?: string; evidence: string };

export function TechStackPanel({ owner, repo }: { owner: string; repo: string }) {
    const [technologies, setTechnologies] = useState<Technology[]>([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/repository/tech-stack?repo=${encodeURIComponent(`${owner}/${repo}`)}`, { signal: controller.signal })
            .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Technology detection failed."); return body.technologies as Technology[]; })
            .then(setTechnologies)
            .catch((error) => { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Technology detection failed."); })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [owner, repo]);

    return <section><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/70"><Cpu size={14} className="text-cyan-300" />Tech stack</p>{loading ? <p className="flex items-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" />Reading manifests…</p> : message ? <p className="text-xs leading-5 text-amber-200">{message}</p> : technologies.length ? <div className="flex flex-wrap gap-1.5">{technologies.map((technology) => <span key={`${technology.category}-${technology.name}`} title={`Evidence: ${technology.evidence}`} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/55">{technology.name}{technology.version ? ` ${technology.version}` : ""}</span>)}</div> : <p className="text-xs text-white/35">No supported manifest evidence found.</p>}</section>;
}
