"use client";

import { useState, useEffect } from "react";
import { RepoSidebar } from "./RepoSidebar";
import { ChatInterface } from "./ChatInterface";
import { FilePreview } from "./FilePreview";
import { DependencyExplorer } from "./DependencyExplorer";
import type { FileNode, GitHubRepo } from "@/lib/github";

interface RepoLayoutProps {
    fileTree: FileNode[];
    repoName: string;
    owner: string;
    repo: string;
    hiddenFiles?: { path: string; reason: string }[];
    repoData: GitHubRepo;
    initialPrompt?: string;
    revision: string;
}

export function RepoLayout({ fileTree, repoName, owner, repo, hiddenFiles = [], repoData, initialPrompt, revision }: RepoLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<string | null>(null);
    const [dependencyOpen, setDependencyOpen] = useState(false);

    const handleFileDoubleClick = (filePath: string) => {
        setPreviewFile(filePath);
        // Close sidebar on mobile after selecting a file
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    // Listen for custom event to open file preview from chat
    useEffect(() => {
        const handleOpenPreview = (event: Event) => {
            const customEvent = event as CustomEvent<string>;
            setPreviewFile(customEvent.detail);
        };

        const handleRevealFolder = () => {
            setSidebarOpen(true);
        };

        window.addEventListener("open-file-preview", handleOpenPreview as EventListener);
        window.addEventListener("reveal-folder", handleRevealFolder);
        return () => {
            window.removeEventListener("open-file-preview", handleOpenPreview as EventListener);
            window.removeEventListener("reveal-folder", handleRevealFolder);
        };
    }, []);

    return (
        <>
            <div className="codyn-workspace-grid relative flex h-[100dvh] w-full overflow-hidden">
                <RepoSidebar
                    fileTree={fileTree}
                    repoName={repoName}
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    onFileDoubleClick={handleFileDoubleClick}
                    hiddenFiles={hiddenFiles}
                    repoData={repoData}
                />
                <div className="flex-1 h-full flex flex-col min-w-0">
                    <button type="button" onClick={() => setDependencyOpen((open) => !open)} className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-950/90 px-3 py-2 text-xs text-white/70 shadow-lg backdrop-blur hover:border-cyan-300/40 hover:text-cyan-200">
                        {dependencyOpen ? "Hide dependencies" : "Dependencies"}
                    </button>
                    {/* Hamburger button for mobile */}
                    <ChatInterface
                        repoContext={{
                            owner,
                            repo,
                            revision,
                            fileTree
                        }}
                        onToggleSidebar={() => setSidebarOpen(true)}
                        initialPrompt={initialPrompt}
                    />
                </div>
                {dependencyOpen && <aside className="absolute right-3 top-16 z-20 max-h-[calc(100dvh-5rem)] w-[min(22rem,calc(100vw-1.5rem))] overflow-auto rounded-2xl border border-white/10 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Dependency explorer</p><p className="mt-1 truncate text-[11px] text-white/35">{previewFile || "No file selected"}</p></div><button type="button" onClick={() => setDependencyOpen(false)} className="text-xs text-white/40 hover:text-white">Close</button></div><DependencyExplorer owner={owner} repo={repo} revision={revision} path={previewFile} /></aside>}
            </div>

            <FilePreview
                isOpen={previewFile !== null}
                filePath={previewFile}
                repoOwner={owner}
                repoName={repo}
                onClose={() => setPreviewFile(null)}
            />
        </>
    );
}
