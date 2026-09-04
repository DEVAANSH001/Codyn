'use client';

import { LoaderCircle, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RepositoryCard } from './RepositoryCard';
import { RepositorySummary } from '@/lib/codyn-dashboard';
import { readStarred, toggleStarred } from '@/lib/dashboard-storage';

export function StarredRepositories() {
  const [names, setNames] = useState<string[]>([]);
  const [repositories, setRepositories] = useState<RepositorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => setNames(readStarred()), []);
  useEffect(() => {
    if (!names.length) { setRepositories([]); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/github/repositories?names=${encodeURIComponent(names.join(','))}`, { signal: controller.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Could not load saved repositories.'); return data; })
      .then(data => { setRepositories(data.repositories || []); if (data.unavailable?.length) setError(`Could not load: ${data.unavailable.join(', ')}. These bookmarks are still saved.`); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [names]);

  function handleToggle(fullName: string) { try { setNames(toggleStarred(fullName)); } catch (reason) { setError((reason as Error).message); } }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-300"><Star className="h-6 w-6 fill-current" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00d2ff]">Saved collection</p><h1 className="mt-1 text-3xl font-semibold">Starred repositories</h1></div></div>
        <p className="mt-3 text-sm text-white/45">Saved in Codyn on this browser. These bookmarks do not change your GitHub stars.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-200">{error}</p>}
      {loading ? <div className="dashboard-panel grid min-h-56 place-items-center rounded-[26px]"><LoaderCircle className="h-7 w-7 animate-spin text-[#00d2ff]" /></div> : repositories.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{repositories.map((repository) => <RepositoryCard key={repository.id} repository={repository} starred onToggleStar={handleToggle} />)}</div>
      ) : (
        <div className="dashboard-panel rounded-[26px] p-12 text-center"><Star className="mx-auto h-8 w-8 text-white/20" /><h2 className="mt-4 text-lg font-semibold">No starred repositories</h2><p className="mt-2 text-sm text-white/40">Star repositories from My repositories or an intelligence workspace.</p></div>
      )}
    </div>
  );
}
