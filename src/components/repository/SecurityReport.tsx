'use client';

import { Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { ScanRecord } from '@/lib/codyn-dashboard';

export function downloadText(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SecurityReport({ report }: { report: ScanRecord }) {
  const [filter, setFilter] = useState('all');
  const findings = report.findings || [];
  const filtered = findings.filter(finding => filter === 'all' || finding.severity === filter);
  function exportMarkdown() {
    downloadText(`codyn-${report.repo}-report.md`, `# Codyn security triage: ${report.owner}/${report.repo}\n\nRevision: ${report.revision}\nDate: ${report.createdAt}\n\n## Coverage and limits\n${(report.limitations || []).map(text => `- ${text}`).join('\n')}\n\n## Review candidates\n${findings.map(finding => `### ${finding.title}\nPriority: ${finding.severity}\nLocation: ${finding.path}${finding.line ? ':' + finding.line : ''}\n\n${finding.description}\n\n${finding.recommendation}\n`).join('\n')}`);
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Security triage report</h2><p className="mt-1 text-xs text-white/45">{report.depth} · {report.filesChecked || 0} files read · {report.revision?.slice(0, 7)} · {new Date(report.createdAt).toLocaleString()}</p></div><div className="flex gap-2"><button type="button" className="repo-button" onClick={() => downloadText(`codyn-${report.repo}-report.json`, JSON.stringify(report, null, 2), 'application/json')}><Download size={14} /> JSON</button><button type="button" className="repo-button" onClick={exportMarkdown}><Download size={14} /> Markdown</button></div></div>
    <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/75"><strong>Review candidates, not a security certification.</strong> Pattern matches may be false positives. Dependency advisories require reachability assessment. This bounded scan cannot establish that a repository is safe.</div>
    <div className="grid grid-cols-3 gap-3">{(['high','medium','low'] as const).map(severity => <div key={severity} className="dashboard-panel rounded-2xl p-4"><p className="text-xs capitalize text-white/45">{severity} priority</p><p className={`mt-2 text-2xl font-semibold ${severity === 'high' ? 'text-rose-300' : severity === 'medium' ? 'text-amber-200' : 'text-[#8deaff]'}`}>{report.issues[severity]}</p></div>)}</div>
    <div className="flex gap-2" aria-label="Filter findings">{['all','high','medium','low'].map(value => <button type="button" key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`repo-button capitalize ${filter === value ? '!border-[#00d2ff]/30 !text-[#8deaff]' : ''}`}>{value}</button>)}</div>
    {filtered.length ? filtered.map(finding => <article key={finding.id} className="dashboard-panel rounded-2xl p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{finding.title}</h3><span className="text-xs uppercase tracking-wider text-[#8deaff]">{finding.severity} · {finding.source}</span></div><code className="mt-2 block break-all text-xs text-white/40">{finding.path}{finding.line ? `:${finding.line}` : ''}</code><p className="mt-4 text-sm leading-6 text-white/55">{finding.description}</p><p className="mt-3 text-sm leading-6 text-white/80">{finding.recommendation}</p>{finding.url && /^https:\/\/osv\.dev\//.test(finding.url) && <a href={finding.url} rel="noopener noreferrer" target="_blank" className="mt-3 inline-flex items-center gap-1 text-xs text-[#00d2ff]">Read advisory <ExternalLink size={12} /></a>}</article>) : <div className="dashboard-panel rounded-2xl p-10 text-center"><ShieldCheck className="mx-auto text-emerald-300" size={30} /><h3 className="mt-3 font-semibold">{findings.length ? 'No candidates at this priority' : 'No candidates found in the scanned scope'}</h3><p className="mt-2 text-sm text-white/45">Review coverage below before drawing conclusions.</p></div>}
    <details className="dashboard-panel rounded-2xl p-5" open><summary className="cursor-pointer font-semibold">Coverage and limitations</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-white/45">{report.limitations?.map(text => <li key={text}>{text}</li>)}</ul></details>
  </div>;
}
