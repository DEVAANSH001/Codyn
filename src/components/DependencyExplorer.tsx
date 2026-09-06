"use client";

import { Loader2, Network, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { RepositoryIndexStatus } from "@/components/RepositoryIndexStatus";
import { TechStackPanel } from "@/components/TechStackPanel";
import { RepositoryHealthPanel } from "@/components/RepositoryHealthPanel";

type ArtifactView = {
    revision: string;
    files: Array<{ path: string; parseStatus: string; symbols: Array<{ name: string; kind: string; exported: boolean; startLine: number }> }>;
    dependencies: Array<{ sourcePath: string; targetPath: string | null; importSource: string; importedNames: unknown; isTypeOnly: boolean; line: number }>;
};

export function DependencyExplorer({ owner, repo, revision, path }: { owner: string; repo: string; revision: string; path: string | null }) {
    const [data, setData] = useState<ArtifactView | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!path) return;
        const controller = new AbortController();
        setLoading(true);
        setMessage("");
        fetch(`/api/repository/index/artifacts?repo=${encodeURIComponent(`${owner}/${repo}`)}&revision=${encodeURIComponent(revision)}&path=${encodeURIComponent(path)}`, { signal: controller.signal })
            .then(async (response) => {
                const body = await response.json();
                if (!response.ok) throw new Error(body.error || "No completed index yet.");
                return body as ArtifactView;
            })
            .then(setData)
            .catch((error) => { if (!controller.signal.aborted) { setData(null); setMessage(error instanceof Error ? error.message : "Unable to load dependencies."); } })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [owner, repo, revision, path]);

    if (!path) return <div className="space-y-4"><RepositoryIndexStatus owner={owner} repo={repo} /><TechStackPanel owner={owner} repo={repo} /><RepositoryHealthPanel owner={owner} repo={repo} /><p className="text-xs leading-5 text-white/40">Select a source file to inspect its indexed symbols and dependencies.</p></div>;
    if (loading) return <div className="flex items-center gap-2 text-xs text-white/50"><Loader2 size={14} className="animate-spin text-cyan-300" />Loading indexed facts…</div>;
    if (message) return <div className="space-y-3"><p className="text-xs leading-5 text-amber-200">{message}</p><p className="text-[11px] leading-5 text-white/35">Run the repository index worker, then refresh this panel.</p></div>;
    const file = data?.files[0];
    const outgoing = data?.dependencies.filter((edge) => edge.sourcePath === path) ?? [];
    const incoming = data?.dependencies.filter((edge) => edge.targetPath === path) ?? [];
    return <div className="space-y-5 text-xs"><RepositoryIndexStatus owner={owner} repo={repo} /><div><p className="mb-2 flex items-center gap-2 font-semibold text-white/70"><Network size={14} className="text-cyan-300" />Indexed symbols</p>{file?.symbols.length ? <div className="space-y-1">{file.symbols.map((symbol) => <p key={`${symbol.name}-${symbol.startLine}`} className="flex justify-between gap-2 text-white/50"><span className="truncate font-mono">{symbol.name}</span><span className="shrink-0 text-white/30">{symbol.kind}{symbol.exported ? " · export" : ""}</span></p>)}</div> : <p className="text-white/35">No symbols extracted.</p>}</div><div><p className="mb-2 font-semibold text-white/70">Imports</p>{outgoing.length ? <div className="space-y-1">{outgoing.map((edge) => <p key={`${edge.sourcePath}-${edge.importSource}-${edge.line}`} className="break-all text-white/50">{edge.targetPath || edge.importSource}</p>)}</div> : <p className="text-white/35">No local imports.</p>}</div><div><p className="mb-2 font-semibold text-white/70">Imported by</p>{incoming.length ? <div className="space-y-1">{incoming.map((edge) => <p key={`${edge.sourcePath}-${edge.line}`} className="break-all text-white/50">{edge.sourcePath}</p>)}</div> : <p className="text-white/35">No indexed callers.</p>}</div></div>;
}
