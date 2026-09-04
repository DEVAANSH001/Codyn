'use client';

import { Activity, CalendarDays, Github, ScanSearch, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { RepositoryAnalyzer } from './RepositoryAnalyzer';
import { ScanList } from './ScanList';
import { issueTotal, ScanRecord } from '@/lib/codyn-dashboard';
import { readScans } from '@/lib/dashboard-storage';
import { useEffect, useState } from 'react';

export function DashboardOverview() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [today, setToday] = useState('Your repository workspace');
  useEffect(() => {
    const sync = () => setScans(readScans());
    sync();
    setToday(new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()));
    window.addEventListener('codyn:scans-updated', sync);
    return () => window.removeEventListener('codyn:scans-updated', sync);
  }, []);
  const stats = [
    { label: 'Repositories scanned', value: new Set(scans.map(scan => `${scan.owner}/${scan.repo}`)).size, icon: ScanSearch, color: 'text-[#00d2ff]', tint: 'bg-[#00d2ff]/10' },
    { label: 'Review candidates', value: scans.reduce((total, scan) => total + issueTotal(scan), 0), icon: ShieldAlert, color: 'text-rose-400', tint: 'bg-rose-400/10' },
    { label: 'Deep analyses', value: scans.filter(scan => scan.depth === 'deep').length, icon: Zap, color: 'text-[#8deaff]', tint: 'bg-[#8deaff]/10' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-panel relative overflow-hidden rounded-[30px] p-6 sm:p-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#00d2ff]/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#00d2ff]/25 bg-[#00d2ff]/10 text-[#00d2ff]"><Sparkles className="h-5 w-5" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#00d2ff]">Intelligence workspace</p>
                <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Welcome back to Codyn</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/45">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#8deaff]" /> {today}</span>
              <span className="flex items-center gap-2"><Github className="h-4 w-4 text-[#8deaff]" /> Public GitHub mode</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/30 px-4 py-3 text-xs text-white/45">
            <Activity className="h-4 w-4 text-emerald-400" /> Systems ready for analysis
          </div>
        </div>
      </section>

      <RepositoryAnalyzer />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ScanList scans={scans.slice(0, 5)} showAll />
        <aside className="space-y-4">
          {stats.map(({ label, value, icon: Icon, color, tint }) => (
            <div key={label} className="dashboard-panel rounded-[22px] p-5">
              <div className="flex items-center justify-between">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${tint} ${color}`}><Icon className="h-5 w-5" /></span>
                <Activity className="h-4 w-4 text-white/10" />
              </div>
              <p className="mt-5 text-sm text-white/40">{label}</p>
              <p className="mt-1 text-3xl font-semibold">{value}</p>
            </div>
          ))}
          <div className="rounded-[22px] border border-[#00d2ff]/20 bg-gradient-to-br from-[#00d2ff]/10 to-[#1769d2]/10 p-5">
            <p className="font-semibold text-[#8deaff]">Pro tip</p>
            <p className="mt-2 text-sm leading-6 text-white/55">Use a deep analysis when you need architecture mapping, dependency context, and security triage together.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
