"use client";

import { Loader2, Network } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Graph = { nodes: Array<{ path: string; symbolCount: number }>; edges: Array<{ source: string; target: string }>; truncated: boolean };

export function ArchitectureGraph({ owner, repo, revision }: { owner: string; repo: string; revision: string }) {
    const [graph, setGraph] = useState<Graph | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [error, setError] = useState("");
    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/repository/architecture/graph?repo=${encodeURIComponent(`${owner}/${repo}`)}&revision=${encodeURIComponent(revision)}`, { signal: controller.signal })
            .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Architecture graph failed."); return body as Graph; })
            .then((value) => { setGraph(value); setSelected(value.nodes[0]?.path ?? null); })
            .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Architecture graph failed."); });
        return () => controller.abort();
    }, [owner, repo, revision]);
    const coordinates = useMemo(() => new Map((graph?.nodes ?? []).map((node, index) => [node.path, { x: 35 + (index % 4) * 95, y: 30 + Math.floor(index / 4) * 50 }])), [graph]);
    const incoming = graph?.edges.filter((edge) => edge.target === selected).map((edge) => edge.source) ?? [];
    const outgoing = graph?.edges.filter((edge) => edge.source === selected).map((edge) => edge.target) ?? [];
    return <section><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/70"><Network size={14} className="text-cyan-300" />Module graph</p>{!graph && !error ? <p className="flex items-center gap-2 text-xs text-white/40"><Loader2 size={13} className="animate-spin" />Building graph…</p> : error ? <p className="text-xs leading-5 text-amber-200">{error}</p> : graph && <><div className="overflow-auto rounded-xl border border-white/10 bg-black/30"><svg width="410" height={Math.max(170, Math.ceil(graph.nodes.length / 4) * 50 + 30)} viewBox={`0 0 410 ${Math.max(170, Math.ceil(graph.nodes.length / 4) * 50 + 30)}`} role="img" aria-label="Interactive module dependency graph">{graph.edges.map((edge, index) => { const source = coordinates.get(edge.source); const target = coordinates.get(edge.target); return source && target ? <line key={`${edge.source}-${edge.target}-${index}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="rgba(34,211,238,.22)" strokeWidth="1" /> : null; })}{graph.nodes.map((node) => { const point = coordinates.get(node.path); const active = selected === node.path; return point ? <g key={node.path} onClick={() => setSelected(node.path)} className="cursor-pointer"><circle cx={point.x} cy={point.y} r="11" fill={active ? "#22d3ee" : "#172033"} stroke={active ? "#cffafe" : "#334155"} /><text x={point.x + 15} y={point.y + 4} fill={active ? "#cffafe" : "#94a3b8"} fontSize="8">{node.path.split("/").pop()}</text></g> : null; })}</svg></div>{selected && <div className="mt-2 rounded-lg bg-white/[0.03] p-2 text-[11px] text-white/50"><p className="break-all font-mono text-cyan-100">{selected}</p><p className="mt-1">Imports {outgoing.length} · Imported by {incoming.length}</p></div>}{graph.truncated && <p className="mt-2 text-[10px] leading-4 text-white/30">Showing the first 80 indexed modules and 180 local edges.</p>}</>}</section>;
}
