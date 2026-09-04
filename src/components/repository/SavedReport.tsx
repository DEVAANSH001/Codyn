'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { readScans } from '@/lib/dashboard-storage';
import type { ScanRecord } from '@/lib/codyn-dashboard';
import { SecurityReport } from './SecurityReport';

export function SavedReport({ id }: { id: string }) {
  const [report, setReport] = useState<ScanRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setReport(readScans().find(scan => scan.id === id) || null); setLoaded(true); }, [id]);
  return <div className="space-y-6"><Link href="/dashboard/scans" className="repo-button w-fit">← Scan history</Link>{!loaded ? <p className="text-white/40">Loading local report…</p> : report ? <><h1 className="break-all text-2xl font-semibold">{report.owner}/{report.repo}</h1><Link href={`/repo/${report.owner}/${report.repo}`} className="text-sm text-[#8deaff]">Open repository workspace →</Link><SecurityReport report={report} /></> : <div className="dashboard-panel rounded-3xl p-10 text-center"><h1 className="text-xl font-semibold">Report not available on this browser</h1><p className="mt-3 text-sm text-white/45">Reports are device-local. Open this link in the browser that ran the scan, or run a new scan. Export JSON or Markdown to share the contents.</p></div>}</div>;
}
