'use client';

import { Github, LoaderCircle, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { RepositoryCard } from './RepositoryCard';
import { GitHubUser } from '@/lib/github-public';
import { RepositorySummary, validUsername } from '@/lib/codyn-dashboard';
import { readGitHubUsername, readStarred, toggleStarred, writeGitHubUsername } from '@/lib/dashboard-storage';

export function MyRepositories() {
  const [username, setUsername] = useState('vercel');
  const [input, setInput] = useState('vercel');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repositories, setRepositories] = useState<RepositorySummary[]>([]);
  const [starred, setStarred] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = readGitHubUsername();
    setUsername(saved); setInput(saved); setStarred(readStarred());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRepositories([]); setUser(null);
    fetch(`/api/github/repositories?username=${encodeURIComponent(username)}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load repositories.');
        setUser(data.user); setRepositories(data.repositories);
      })
      .catch((reason) => { if (reason.name !== 'AbortError') setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [username]);

  const filtered = useMemo(() => repositories.filter((repository) => `${repository.name} ${repository.description || ''}`.toLowerCase().includes(query.toLowerCase())), [query, repositories]);

  function switchUser(event: FormEvent) {
    event.preventDefault();
    const next = input.trim().replace(/^@/, '');
    if (!validUsername(next)) { setError('Enter a valid GitHub username.'); return; }
    try { writeGitHubUsername(next); setUsername(next); } catch (reason) { setError((reason as Error).message); }
  }

  function handleToggle(fullName: string) { try { setStarred(toggleStarred(fullName)); } catch (reason) { setError((reason as Error).message); } }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00d2ff]">GitHub workspace</p>
          <h1 className="mt-2 text-3xl font-semibold">My repositories</h1>
          <p className="mt-2 text-sm text-white/45">Browse any public GitHub profile and open a repository directly in Codyn.</p>
        </div>
        <form onSubmit={switchUser} className="flex gap-2">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 focus-within:border-[#00d2ff]/40">
            <Github className="h-4 w-4 text-[#00d2ff]" /><span className="sr-only">GitHub username</span>
            <input value={input} onChange={(event) => setInput(event.target.value)} className="w-36 bg-transparent text-sm outline-none" placeholder="username" />
          </label>
          <button type="submit" className="dashboard-focus rounded-xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#00d2ff]">Load profile</button>
        </form>
      </header>

      {user && (
        <section className="dashboard-panel flex flex-col gap-4 rounded-[24px] p-5 sm:flex-row sm:items-center">
          <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-2xl border border-[#00d2ff]/25 object-cover" />
          <div className="min-w-0 flex-1"><h2 className="font-semibold">{user.name || user.login} <span className="font-normal text-white/35">@{user.login}</span></h2><p className="mt-1 line-clamp-1 text-sm text-white/45">{user.bio || `${user.publicRepos} public repositories on GitHub.`}</p></div>
          <div className="flex items-center gap-2 text-xs text-[#8deaff]"><ShieldCheck className="h-4 w-4" /> Public data only</div>
        </section>
      )}

      <label className="dashboard-panel flex min-h-14 items-center gap-3 rounded-2xl px-5 focus-within:border-[#00d2ff]/35">
        <Search className="h-5 w-5 text-white/30" /><span className="sr-only">Search repositories</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories by name or description…" className="w-full bg-transparent text-sm outline-none placeholder:text-white/25" />
      </label>

      {loading ? (
        <div className="dashboard-panel flex min-h-64 flex-col items-center justify-center rounded-[26px] text-white/40"><LoaderCircle className="h-7 w-7 animate-spin text-[#00d2ff]" /><p className="mt-3 text-sm">Loading GitHub repositories…</p></div>
      ) : error ? (
        <div className="dashboard-panel rounded-[26px] p-10 text-center"><RefreshCw className="mx-auto h-7 w-7 text-rose-400" /><h2 className="mt-4 font-semibold">GitHub could not be reached</h2><p className="mt-2 text-sm text-white/40">{error}</p></div>
      ) : (
        filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((repository) => <RepositoryCard key={repository.id} repository={repository} starred={starred.includes(repository.fullName)} onToggleStar={handleToggle} />)}</div> : <p className="dashboard-panel rounded-2xl p-10 text-center text-white/50">No repositories match this search.</p>
      )}
      <p className="text-xs text-white/35">Showing up to 100 recently updated public repositories. This is a public profile browser, not an authenticated GitHub session.</p>
    </div>
  );
}
