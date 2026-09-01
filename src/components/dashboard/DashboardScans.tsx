'use client';

import { Filter, History, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ScanList } from './ScanList';
import { readScans } from '@/lib/dashboard-storage';
import { ScanDepth, ScanRecord } from '@/lib/codyn-dashboard';

type DepthFilter = 'all' | ScanDepth;

export function DashboardScans() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<DepthFilter>('all');

  useEffect(() => {
    const sync = () => setScans(readScans());
    sync();
    window.addEventListener('codyn:scans-updated', sync);
    return () => window.removeEventListener('codyn:scans-updated', sync);
  }, []);

  const filtered = useMemo(() => scans.filter((scan) => {
    const matchesQuery = `${scan.owner}/${scan.repo}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (depth === 'all' || scan.depth === depth);
  }), [depth, query, scans]);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#00d2ff]/25 bg-[#00d2ff]/10 text-[#00d2ff]"><History className="h-6 w-6" /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00d2ff]">Activity</p>
            <h1 className="mt-1 text-3xl font-semibold">Recent scans</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Reopen repository intelligence sessions and compare the risk profile from your latest local analyses.</p>
      </header>

      <div className="dashboard-panel flex flex-col gap-3 rounded-2xl p-3 sm:flex-row">
        <label className="flex min-h-11 flex-1 items-center gap-3 rounded-xl border border-white/8 bg-black/30 px-4 focus-within:border-[#00d2ff]/40">
          <Search className="h-4 w-4 text-white/35" />
          <span className="sr-only">Search scans</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by owner or repository…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25" />
        </label>
        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-black/30 p-1">
          <Filter className="mx-2 h-4 w-4 text-white/30" />
          {(['all', 'quick', 'deep'] as DepthFilter[]).map((option) => (
            <button key={option} type="button" onClick={() => setDepth(option)} className={`dashboard-focus min-h-9 rounded-lg px-3 text-xs font-semibold capitalize transition ${depth === option ? 'bg-[#00d2ff]/15 text-[#8deaff]' : 'text-white/40 hover:text-white'}`}>{option}</button>
          ))}
        </div>
      </div>

      {filtered.length ? <ScanList scans={filtered} title="Scan history" /> : (
        <div className="dashboard-panel rounded-[26px] p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-white/20" />
          <h2 className="mt-4 text-lg font-semibold">No scans match this view</h2>
          <p className="mt-2 text-sm text-white/40">Clear the search or choose another analysis depth.</p>
        </div>
      )}
    </div>
  );
}
