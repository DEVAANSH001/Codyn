import { ArrowUpRight, History, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { issueTotal, ScanRecord } from '@/lib/codyn-dashboard';

export function ScanList({ scans, title = 'Recent scans', showAll = false }: { scans: ScanRecord[]; title?: string; showAll?: boolean }) {
  return (
    <section className="dashboard-panel overflow-hidden rounded-[26px]">
      <header className="flex items-center justify-between border-b border-white/8 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <History className="h-5 w-5 text-[#00d2ff]" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {showAll && <Link href="/dashboard/scans" className="dashboard-focus rounded text-white/45 transition hover:text-white">View all</Link>}
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/45">{scans.length} scans</span>
        </div>
      </header>
      <div className="divide-y divide-white/[0.065]">
        {scans.map((scan) => {
          const total = issueTotal(scan);
          const safe = scan.issues.high === 0;
          return (
            <Link key={scan.id} href={`/repo/${scan.owner}/${scan.repo}`} className="dashboard-focus group flex items-center justify-between gap-4 px-5 py-5 transition hover:bg-white/[0.035] sm:px-6">
              <div className="flex min-w-0 items-center gap-4">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${safe ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400'}`}>
                  {safe ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#8deaff] sm:text-base">{scan.owner}/{scan.repo}</h3>
                    <span className="rounded-md border border-[#00d2ff]/20 bg-[#00d2ff]/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8deaff]">{scan.depth}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/35">
                    <span>{new Date(scan.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span aria-hidden="true">•</span>
                    {total === 0 ? <span className="text-emerald-400">Secure</span> : (
                      <span className={scan.issues.high ? 'text-rose-400' : 'text-amber-300'}>
                        {scan.issues.high ? `${scan.issues.high} high · ` : ''}{total} issues
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-white/20 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#00d2ff]" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
