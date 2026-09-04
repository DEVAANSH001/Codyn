'use client';

import { ArrowLeft, BookOpen, Check, Copy, ExternalLink, FileCode2, Folder, GitBranch, GitCommitHorizontal, GitFork, LoaderCircle, MessageSquare, Network, RefreshCw, Search, Shield, Star } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { RepoSnapshot } from '@/lib/github-public';
import { formatCompactNumber, ScanDepth, ScanRecord } from '@/lib/codyn-dashboard';
import { readStarred, recordScan, toggleStarred } from '@/lib/dashboard-storage';
import { LogoMark } from '@/components/LogoMark';
import { SafeMarkdown } from './SafeMarkdown';
import { RepositoryChat } from './RepositoryChat';
import { SecurityReport } from './SecurityReport';

const tabs = [{ id: 'overview', label: 'Overview', icon: BookOpen }, { id: 'files', label: 'Files', icon: FileCode2 }, { id: 'architecture', label: 'Architecture', icon: Network }, { id: 'chat', label: 'Ask Codyn', icon: MessageSquare }, { id: 'security', label: 'Security', icon: Shield }];

export function RepositoryWorkspace({ owner, repo, initialDepth }: { owner: string; repo: string; initialDepth: ScanDepth }) {
  const fullName = `${owner}/${repo}`;
  const [snapshot, setSnapshot] = useState<RepoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [tab, setTab] = useState('overview');
  const [starred, setStarred] = useState(false);
  const [depth, setDepth] = useState<ScanDepth>(initialDepth);
  const [query, setQuery] = useState('');
  const [path, setPath] = useState('');
  const [file, setFile] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState<ScanRecord | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setStarred(readStarred().includes(fullName));
    fetch(`/api/repository?repo=${encodeURIComponent(fullName)}`, { signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }).then(setSnapshot).catch(reason => { if (!controller.signal.aborted) setError(reason.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [fullName, retry]);
  useEffect(() => {
    if (!path || !snapshot) return;
    const controller = new AbortController(); setFileLoading(true); setFile(''); setFileError('');
    fetch(`/api/repository?repo=${encodeURIComponent(fullName)}&path=${encodeURIComponent(path)}&revision=${snapshot.revision}`, { signal: controller.signal }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }).then(data => setFile(data.content)).catch(reason => { if (!controller.signal.aborted) setFileError(reason.message); }).finally(() => { if (!controller.signal.aborted) setFileLoading(false); });
    return () => controller.abort();
  }, [fullName, path, snapshot]);
  const files = useMemo(() => snapshot?.files.filter(file => file.type === 'blob' && file.path.toLowerCase().includes(query.toLowerCase())) || [], [snapshot, query]);
  const groups = useMemo(() => {
    const groups: Record<string, number> = {};
    snapshot?.files.filter(file => file.type === 'blob').forEach(file => { const key = file.path.includes('/') ? file.path.split('/')[0] : '(root)'; groups[key] = (groups[key] || 0) + 1; });
    return Object.entries(groups).sort((a,b) => b[1] - a[1]).slice(0, 18);
  }, [snapshot]);
  async function scan() {
    setScanning(true); setNotice('');
    try {
      const response = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ repo: fullName, depth }), signal: AbortSignal.timeout(120000) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error); setReport(data);
      try { recordScan(data); setNotice('Report saved on this browser.'); } catch (reason) { setNotice(`Report completed but was not saved: ${(reason as Error).message}`); }
    } catch (reason) { setNotice((reason as Error).message || 'Scan failed. Retry shortly.'); }
    finally { setScanning(false); }
  }
  function star() { try { setStarred(toggleStarred(fullName).includes(fullName)); setNotice(''); } catch (reason) { setNotice((reason as Error).message); } }

  return <div className="dashboard-grid min-h-dvh text-white">
    <header className="border-b border-white/10 bg-black/60 px-4 py-4 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3"><Link href="/dashboard" className="dashboard-focus flex items-center gap-3 rounded-lg"><ArrowLeft size={17} className="text-white/40" /><LogoMark className="h-6 w-6 text-[#00d2ff]" /><span className="font-semibold">Codyn <span className="ml-2 hidden text-sm font-normal text-white/35 sm:inline">Repository intelligence</span></span></Link><div className="flex gap-2"><button type="button" onClick={star} className={`repo-button ${starred ? '!text-amber-200' : ''}`}><Star size={15} fill={starred ? 'currentColor' : 'none'} />{starred ? 'Saved' : 'Save repo'}</button><a href={`https://github.com/${fullName}`} target="_blank" rel="noopener noreferrer" className="repo-button">GitHub <ExternalLink size={13} /></a></div></div></header>
    <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#00d2ff]">Public repository</p><h1 className="break-all text-2xl font-semibold sm:text-3xl"><span className="font-normal text-white/40">{owner} / </span>{repo}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">{snapshot?.repository.description || 'Explore source context, understand architecture, and review security boundaries.'}</p></div>{snapshot && <div className="flex gap-4 text-xs text-white/45"><span className="flex items-center gap-1.5"><Star size={14} />{formatCompactNumber(snapshot.repository.stars)}</span><span className="flex items-center gap-1.5"><GitFork size={14} />{formatCompactNumber(snapshot.repository.forks)}</span><span className="flex items-center gap-1.5"><GitBranch size={14} />{snapshot.defaultBranch}</span></div>}</div>
      {loading ? <div className="dashboard-panel flex min-h-[450px] flex-col items-center justify-center rounded-3xl"><LoaderCircle size={32} className="animate-spin text-[#00d2ff]" /><p className="mt-4 text-sm text-white/50">Reading repository metadata and file tree…</p></div> : error ? <div className="dashboard-panel rounded-3xl p-12 text-center"><h2 className="text-xl font-semibold">Repository could not be loaded</h2><p role="alert" className="mt-3 text-white/50">{error}</p><button type="button" onClick={() => setRetry(retry + 1)} className="repo-button mx-auto mt-5"><RefreshCw size={15} />Retry</button></div> : snapshot && <>
        {snapshot.warnings.map(warning => <p key={warning} className="mb-3 text-sm text-amber-200">{warning}</p>)}
        <div className="dashboard-panel overflow-hidden rounded-[26px]">
          <nav className="flex overflow-x-auto border-b border-white/10 px-3 pt-2 sm:px-5" aria-label="Repository views">{tabs.map(({id,label,icon:Icon}) => <button key={id} type="button" onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`dashboard-focus flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${tab === id ? 'border-[#00d2ff] text-[#8deaff]' : 'border-transparent text-white/40 hover:text-white'}`}><Icon size={16} />{label}</button>)}</nav>
          <div className="p-4 sm:p-6 lg:p-8">
            {notice && <p role="status" className="mb-5 rounded-xl border border-[#00d2ff]/20 bg-[#00d2ff]/5 p-3 text-sm text-[#8deaff]">{notice}</p>}
            {tab === 'overview' && <div className="grid gap-8 lg:grid-cols-[1fr_280px]"><section className="min-w-0"><h2 className="mb-5 flex items-center gap-2 text-sm font-semibold text-white/60"><BookOpen size={16} />README</h2><SafeMarkdown>{snapshot.readme || 'This repository has no readable README.'}</SafeMarkdown></section><aside className="space-y-6"><section className="rounded-2xl border border-white/8 bg-black/20 p-5"><h2 className="font-semibold">At a glance</h2><p className="mt-4 text-xs text-white/45">Pinned revision</p><code className="mt-1 block text-sm text-[#8deaff]">{snapshot.revision.slice(0, 12)}</code><p className="mt-4 text-xs text-white/45">Indexed files</p><p className="mt-1 text-xl font-semibold">{snapshot.files.filter(file => file.type === 'blob').length.toLocaleString()}{snapshot.truncated ? '+' : ''}</p><div className="mt-5 space-y-3">{Object.entries(snapshot.languages).slice(0,6).map(([language, bytes]) => <div key={language}><div className="flex justify-between text-xs text-white/50"><span>{language}</span><span>{Math.round(bytes / Math.max(1, Object.values(snapshot.languages).reduce((a,b)=>a+b,0)) * 100)}%</span></div><div className="mt-2 h-1 overflow-hidden rounded bg-white/5"><div className="h-full rounded bg-[#00d2ff]/60" style={{width: `${bytes / Math.max(1,Object.values(snapshot.languages).reduce((a,b)=>a+b,0))*100}%`}} /></div></div>)}</div></section><section><h2 className="mb-4 font-semibold">Recent commits</h2><div className="space-y-4">{snapshot.commits.map(commit => <a key={commit.sha} href={commit.url} rel="noopener noreferrer" target="_blank" className="block text-sm text-white/60 transition hover:text-[#8deaff]"><p className="flex items-start gap-2"><GitCommitHorizontal size={15} className="mt-1 shrink-0 text-[#00d2ff]" /><span className="line-clamp-2">{commit.message}</span></p><p className="ml-6 mt-1 text-[11px] text-white/30">{commit.author} · {commit.sha.slice(0,7)}</p></a>)}</div></section></aside></div>}
            {tab === 'files' && <div className="grid min-h-[550px] gap-5 lg:grid-cols-[290px_1fr]"><aside><label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-3"><Search size={15} className="text-white/30" /><span className="sr-only">Filter file paths</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Find a file…" className="min-w-0 bg-transparent text-xs outline-none" /></label><div className="mt-3 max-h-[520px] space-y-1 overflow-auto">{files.slice(0, 250).map(item => <button key={item.path} type="button" title={item.path} onClick={() => setPath(item.path)} className={`dashboard-focus flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left font-mono text-[11px] ${path === item.path ? 'bg-[#00d2ff]/10 text-[#8deaff]' : 'text-white/45 hover:bg-white/5'}`}><FileCode2 size={13} className="mt-0.5 shrink-0" /><span className="break-all">{item.path}</span></button>)}{!files.length && <p className="p-5 text-xs text-white/40">No matching files.</p>}{files.length > 250 && <p className="p-3 text-xs text-white/35">Showing 250 matches. Refine the search.</p>}</div></aside><section className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/25"><div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 px-4"><code className="break-all text-xs text-white/45">{path || 'Select a source file'}</code>{file && <button type="button" aria-label="Copy file" className="repo-button" onClick={async () => { try { await navigator.clipboard.writeText(file); setCopied(true); setTimeout(()=>setCopied(false),1500); } catch { setFileError('Clipboard access was denied.'); } }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>}</div>{fileLoading ? <div className="grid h-56 place-items-center"><LoaderCircle className="animate-spin text-[#00d2ff]" /></div> : fileError ? <p role="alert" className="p-5 text-sm text-amber-200">{fileError}</p> : file ? <pre className="max-h-[540px] overflow-auto p-4 text-xs leading-6 text-white/70"><code>{file}</code></pre> : <p className="p-8 text-sm leading-6 text-white/35">Read files from the pinned public revision. Binary, credential-named, symlink, and oversized files are excluded.</p>}</section></div>}
            {tab === 'architecture' && <section><h2 className="text-xl font-semibold">Repository structure</h2><p className="mt-2 text-sm leading-6 text-white/45">A structural map of top-level directories, not an inferred dependency graph. Ask Codyn to explain relationships with source evidence.</p><div className="my-8 flex justify-center"><div className="rounded-2xl border border-[#00d2ff]/30 bg-[#00d2ff]/10 px-8 py-4 text-[#8deaff]"><Network className="mx-auto mb-2" />{fullName}</div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{groups.map(([name,count]) => <button key={name} type="button" onClick={()=>{setQuery(name === '(root)' ? '' : `${name}/`);setTab('files');}} className="dashboard-focus rounded-2xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-[#00d2ff]/30"><Folder className="mb-4 text-[#00d2ff]" size={22} /><p className="font-mono text-sm">{name}</p><p className="mt-1 text-xs text-white/40">{count} indexed files</p></button>)}</div>{snapshot.truncated && <p className="mt-4 text-xs text-amber-200">Tree truncated to 5,000 entries or by GitHub. This map is partial.</p>}</section>}
            <div hidden={tab !== 'chat'}><RepositoryChat fullName={fullName} depth={depth} /></div>
            {tab === 'security' && <section><div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Review the security boundaries</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Run bounded source-pattern checks and OSV advisory lookups for supported npm lockfiles. No code is executed. Quick reads up to 8 files; deep reads up to 24.</p></div><div className="flex gap-2"><select aria-label="Scan depth" value={depth} onChange={event=>setDepth(event.target.value as ScanDepth)} disabled={scanning} className="repo-button bg-[#111] text-white"><option value="quick">Quick scan</option><option value="deep">Deep scan</option></select><button type="button" onClick={()=>void scan()} disabled={scanning} className="dashboard-focus inline-flex items-center gap-2 rounded-xl bg-[#00d2ff] px-4 py-3 text-sm font-semibold text-black disabled:opacity-50">{scanning ? <LoaderCircle size={16} className="animate-spin" /> : <Shield size={16} />}{scanning ? 'Scanning…' : 'Run triage'}</button></div></div>{scanning && <p role="status" className="mb-5 text-sm text-[#8deaff]">Reading source files and checking advisory data. This may take up to two minutes.</p>}{report ? <SecurityReport report={report} /> : <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center"><Shield size={36} className="mx-auto text-[#00d2ff]/50" /><h3 className="mt-4 font-semibold">No scan run yet</h3><p className="mt-2 text-sm text-white/40">Results appear here only after a real scan completes.</p></div>}</section>}
          </div>
        </div>
      </>}
    </main>
  </div>;
}
