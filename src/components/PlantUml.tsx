"use client";

import { Check, Clipboard, Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { layoutPlantUmlGraph, parsePlantUmlPreview, type PlantUmlNodeKind } from "@/lib/plantuml-preview";

interface PlantUmlProps {
    source: string;
    isStreaming?: boolean;
}

export function PlantUml({ source, isStreaming = false }: PlantUmlProps) {
    const [copied, setCopied] = useState(false);
    const graph = useMemo(() => parsePlantUmlPreview(source), [source]);
    const layout = useMemo(() => layoutPlantUmlGraph(graph), [graph]);

    const downloadSource = () => {
        const url = URL.createObjectURL(new Blob([source], { type: "text/plain;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "system-design.puml";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    if (isStreaming || !source.trim().includes("@enduml")) {
        return <div className="my-4 flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" />Generating system design…</div>;
    }

    return (
        <figure className="my-5 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-cyan-400/15 bg-zinc-950/80">
            <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-[0.16em] text-cyan-300">PlantUML system design</span>
                <span className="flex items-center gap-1">
                    <button type="button" onClick={async () => { await navigator.clipboard.writeText(source); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="rounded-lg p-2 hover:bg-white/10 hover:text-white" title="Copy PlantUML source">
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={downloadSource} className="rounded-lg p-2 hover:bg-white/10 hover:text-white" title="Download PlantUML source"><Download className="h-4 w-4" /></button>
                </span>
            </figcaption>
            {graph.nodes.length ? <LocalPlantUmlSvg graph={graph} layout={layout} /> : <div className="p-5 text-sm text-amber-200"><p>This PlantUML uses syntax the local preview does not recognize yet. The source remains available below.</p><pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs text-zinc-400">{source}</pre></div>}
        </figure>
    );
}

const KIND_COLORS: Record<PlantUmlNodeKind, { fill: string; stroke: string }> = {
    actor: { fill: "#172554", stroke: "#60a5fa" },
    component: { fill: "#2e1065", stroke: "#a78bfa" },
    database: { fill: "#052e2b", stroke: "#2dd4bf" },
    queue: { fill: "#422006", stroke: "#fbbf24" },
    cloud: { fill: "#3f0d24", stroke: "#fb7185" },
    service: { fill: "#172033", stroke: "#67e8f9" },
};

function LocalPlantUmlSvg({ graph, layout }: { graph: ReturnType<typeof parsePlantUmlPreview>; layout: ReturnType<typeof layoutPlantUmlGraph> }) {
    return <div className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden bg-[#080c14] p-3 [scrollbar-gutter:stable]"><svg role="img" aria-label={graph.title || "PlantUML system design"} viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width} height={layout.height} className="block h-auto max-w-none shrink-0 rounded-xl bg-[#0b1220]">
        <defs><marker id="plantuml-arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#64748b" /></marker></defs>
        {graph.title && <text x="32" y="34" fill="#e2e8f0" fontSize="18" fontWeight="700">{graph.title}</text>}
        {graph.edges.map((edge, index) => {
            const from = layout.positions.get(edge.from); const to = layout.positions.get(edge.to); if (!from || !to) return null;
            const x1 = from.x + 180; const y1 = from.y + 36; const x2 = to.x; const y2 = to.y + 36; const middleX = (x1 + x2) / 2;
            return <g key={`${edge.from}-${edge.to}-${index}`}><path d={`M ${x1} ${y1} C ${middleX} ${y1}, ${middleX} ${y2}, ${x2} ${y2}`} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray={edge.dashed ? "7 5" : undefined} markerEnd="url(#plantuml-arrow)" />{edge.label && <text x={middleX} y={(y1 + y2) / 2 - 7} textAnchor="middle" fill="#94a3b8" fontSize="11">{edge.label.slice(0, 38)}</text>}</g>;
        })}
        {graph.nodes.map((node) => { const position = layout.positions.get(node.id); if (!position) return null; const colors = KIND_COLORS[node.kind]; return <g key={node.id} transform={`translate(${position.x} ${position.y})`}><rect width="180" height="72" rx={node.kind === "actor" ? 28 : 12} fill={colors.fill} stroke={colors.stroke} strokeWidth="1.5" /><text x="90" y="29" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">{node.label.slice(0, 24)}</text><text x="90" y="51" textAnchor="middle" fill={colors.stroke} fontSize="9" letterSpacing="1.4">{node.kind.toUpperCase()}{node.group ? ` · ${node.group.slice(0, 16)}` : ""}</text></g>; })}
    </svg></div>;
}
