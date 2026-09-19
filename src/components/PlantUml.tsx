"use client";

import { Check, Clipboard, Download, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface PlantUmlProps {
    source: string;
    isStreaming?: boolean;
}

export function PlantUml({ source, isStreaming = false }: PlantUmlProps) {
    const [svgUrl, setSvgUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [attempt, setAttempt] = useState(0);

    const downloadSource = () => {
        const url = URL.createObjectURL(new Blob([source], { type: "text/plain;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "system-design.puml";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const controller = new AbortController();
        async function renderDiagram() {
            if (isStreaming || !source.trim().includes("@enduml")) return;
            try {
                const response = await fetch("/api/plantuml", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ source }),
                    signal: controller.signal,
                });
                if (!response.ok) {
                    const body = await response.json().catch(() => ({ error: "PlantUML rendering failed." })) as { error?: string };
                    throw new Error(body.error || "PlantUML rendering failed.");
                }
                const blob = await response.blob();
                const nextUrl = URL.createObjectURL(blob);
                setError(null);
                setSvgUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return nextUrl;
                });
            } catch (reason) {
                if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "PlantUML rendering failed.");
            }
        }
        void renderDiagram();
        return () => controller.abort();
    }, [attempt, isStreaming, source]);

    useEffect(() => () => {
        if (svgUrl) URL.revokeObjectURL(svgUrl);
    }, [svgUrl]);

    if (isStreaming || !source.trim().includes("@enduml")) {
        return <div className="my-4 flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/70 p-4 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" />Generating system design…</div>;
    }

    return (
        <figure className="my-5 overflow-hidden rounded-2xl border border-cyan-400/15 bg-zinc-950/80">
            <figcaption className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-zinc-400">
                <span className="font-semibold uppercase tracking-[0.16em] text-cyan-300">PlantUML system design</span>
                <span className="flex items-center gap-1">
                    <button type="button" onClick={async () => { await navigator.clipboard.writeText(source); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="rounded-lg p-2 hover:bg-white/10 hover:text-white" title="Copy PlantUML source">
                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Clipboard className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={downloadSource} className="rounded-lg p-2 hover:bg-white/10 hover:text-white" title="Download PlantUML source"><Download className="h-4 w-4" /></button>
                    {svgUrl && <a href={svgUrl} download="system-design.svg" className="rounded-lg p-2 hover:bg-white/10 hover:text-white" title="Download SVG"><Download className="h-4 w-4" /></a>}
                </span>
            </figcaption>
            {error ? (
                <div className="p-5 text-sm text-amber-200">
                    <p>{error}</p>
                    <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300/20 px-3 py-2 text-xs hover:bg-amber-300/10"><RefreshCw className="h-3.5 w-3.5" />Retry</button>
                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-xs text-zinc-400">{source}</pre>
                </div>
            ) : svgUrl ? (
                <div className="overflow-auto bg-white p-3">
                    {/* Blob URLs are generated client-side and cannot use the Next image optimizer. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={svgUrl} alt="Generated PlantUML system design" className="mx-auto h-auto max-w-full" />
                </div>
            ) : (
                <div className="flex items-center gap-2 p-5 text-sm text-zinc-400"><Loader2 className="h-4 w-4 animate-spin" />Rendering PlantUML…</div>
            )}
        </figure>
    );
}
