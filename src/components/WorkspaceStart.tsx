'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Cloud, FileCode2, GitBranch, LayoutDashboard, Network, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { LogoMark } from './LogoMark';
import RepoSearch from './RepoSearch';
import { workspaceHref } from '@/lib/workspace-navigation';

export function WorkspaceStart({ invalidQuery = false }: { invalidQuery?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');

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
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/50">Explore the source, ask questions, map the architecture, and review security in one workspace. Start with a public GitHub repository or developer profile.</p>
        </div>
        <div className="codyn-panel rounded-3xl border border-white/10 p-6 sm:p-10">
          <h2 className="mb-6 text-sm font-medium text-white/75">Which project are we working on?</h2>
          <RepoSearch onSearchSubmit={openRepository} loading={false} trendingRepos={[]} recentSearches={[]} isSessionActive={false} />
          {(error || invalidQuery) && <p role="alert" className="mt-5 text-center text-sm text-amber-200">{error || 'That address is not a valid GitHub repository or profile. Try another below.'}</p>}
          <p className="mt-6 text-center text-xs leading-6 text-white/35">Public repositories work without signing in. Connect your account to access saved conversations and scan history.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { icon: FileCode2, title: 'Explore & ask', description: 'Browse real source files and ask questions with code context.' },
            { icon: Network, title: 'Map architecture', description: 'Generate and inspect diagrams of the project’s structure.' },
            { icon: ShieldCheck, title: 'Review security', description: 'Run a quick scan, inspect findings, and export your review.' },
          ].map(({ icon: Icon, title, description }) => <div key={title} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5"><Icon size={20} className="mb-4 text-cyan-300" /><h2 className="text-sm font-semibold">{title}</h2><p className="mt-2 text-xs leading-6 text-white/45">{description}</p></div>)}
        </div>
        <section aria-labelledby="whats-new-heading" className="mt-10 rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.07] via-blue-500/[0.035] to-transparent p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-cyan-300"><Sparkles size={14} /> What&apos;s new</p>
              <h2 id="whats-new-heading" className="mt-3 text-2xl font-semibold tracking-tight text-white">More ways to keep your work moving</h2>
            </div>
            <span className="w-fit rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 font-mono text-xs text-cyan-100">v2.0</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Secure sign-in', description: 'Connect GitHub to keep your work tied to your account.' },
              { icon: LayoutDashboard, title: 'Personal dashboard', description: 'Return to recent repositories, searches, and analysis.' },
              { icon: Cloud, title: 'Cloud sync', description: 'Access saved projects and chat history across your devices.' },
              { icon: Zap, title: 'Faster analysis', description: 'Improved indexing and quicker responses when you explore.' },
            ].map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <Icon size={18} className="mb-3 text-cyan-200" />
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-white/50">{description}</p>
              </article>
            ))}
          </div>
        </section>
        <Link href="/explore" className="mt-8 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-cyan-200">Browse repositories <ArrowRight size={15} /></Link>
      </section>
    </main>
  );
}
