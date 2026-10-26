'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileCode2, GitBranch, LayoutDashboard, Network, ShieldCheck } from 'lucide-react';
import { LogoMark } from './LogoMark';
import RepoSearch from './RepoSearch';
import { workspaceHref } from '@/lib/workspace-navigation';
import type { SearchHistoryItem } from '@/lib/services/history-service';
import { getLocalConversationHistory } from '@/lib/storage';

export function WorkspaceStart({
  invalidQuery = false,
  recentSearches = [],
  conversations = [],
  isSessionActive = false,
}: {
  invalidQuery?: boolean;
  recentSearches?: SearchHistoryItem[];
  conversations?: { id: string; label: string; query: string; updatedAt: string }[];
  isSessionActive?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [localConversations, setLocalConversations] = useState<typeof conversations>([]);
  useEffect(() => {
    if (isSessionActive) return;
    const timer = window.setTimeout(() => setLocalConversations(getLocalConversationHistory()), 0);
    return () => window.clearTimeout(timer);
  }, [isSessionActive]);
  const allConversations = [...conversations, ...localConversations.filter((local) => !conversations.some((cloud) => cloud.query.toLowerCase() === local.query.toLowerCase()))];

  function openRepository(input: string) {
    const destination = workspaceHref(input);
    if (!destination) {
      setError('Enter a GitHub repository (owner/repository) or a developer username.');
      return;
    }
    setError('');
    router.push(destination);
  }

  return (
    <main className="codyn-product codyn-workspace-grid min-h-dvh text-white">
      <header className="codyn-toolbar border-b border-white/10">
        <nav aria-label="Application" className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="codyn-brand-mark grid h-10 w-10 place-items-center rounded-xl"><LogoMark className="h-6 w-6 text-cyan-200" /></span>
            <span className="text-lg font-semibold tracking-tight">Codyn <span className="ml-3 hidden text-xs font-normal text-white/35 sm:inline">Workspace</span></span>
          </Link>
          <Link href="/dashboard" className="repo-button"><LayoutDashboard size={15} /> My dashboard</Link>
        </nav>
      </header>
      <section className="mx-auto max-w-5xl px-6 py-12 sm:py-20">
        <div className="mb-8">
          <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-cyan-300"><GitBranch size={14} /> Repository intelligence</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Open a codebase.<br /><span className="text-[#8deaff]">Understand how it works.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">Explore the source, ask questions, map the architecture, and review security in one workspace. Open a public repository, or connect GitHub to chat with a private repository you can access.</p>
        </div>
        {allConversations.length > 0 && <section id="history" className="mt-8"><h2 className="mb-4 text-sm font-semibold text-white/80">Your chat history</h2><div className="grid gap-2 sm:grid-cols-2">{allConversations.map((conversation) => <Link key={conversation.id} href={workspaceHref(conversation.query) ?? "/chat"} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-cyan-400/40 hover:bg-cyan-400/5"><span className="block truncate text-sm text-white">{conversation.label}</span><span className="text-xs text-white/40">{new Date(conversation.updatedAt).toLocaleDateString()}</span></Link>)}</div></section>}
        <div className="codyn-panel rounded-3xl border border-white/10 p-6 sm:p-10">
          <h2 className="mb-6 text-sm font-medium text-white/75">Which project are we working on?</h2>
          <RepoSearch onSearchSubmit={openRepository} loading={false} trendingRepos={[]} recentSearches={recentSearches} isSessionActive={isSessionActive} />
          {(error || invalidQuery) && <p role="alert" className="mt-5 text-center text-sm text-amber-200">{error || 'That address is not a valid GitHub repository or profile. Try another below.'}</p>}
          <p className="mt-6 text-center text-xs leading-6 text-white/35">{isSessionActive ? 'Browse your GitHub repositories in My dashboard, including private repos when access is granted.' : 'Public repositories work without signing in. Connect GitHub to access private repos, saved conversations, and scan history.'}</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: FileCode2, title: 'Explore & ask', description: 'Browse real source files and ask questions with code context.' },
            { icon: Network, title: 'Map architecture', description: 'Generate and inspect diagrams of the project’s structure.' },
            { icon: ShieldCheck, title: 'Review security', description: 'Run a quick scan, inspect findings, and export your review.' },
          ].map(({ icon: Icon, title, description }) => <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5"><Icon size={20} className="mb-4 text-cyan-300" /><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-xs leading-6 text-white/45">{description}</p></div>)}
        </div>
        <Link href="/explore" className="mt-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-cyan-200">Browse repositories <ArrowRight size={15} /></Link>
      </section>
    </main>
  );
}
