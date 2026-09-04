'use client';

import { Check, Github, Settings, SlidersHorizontal } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { readGitHubUsername, writeGitHubUsername, readDefaultDepth, writeDefaultDepth, clearScans } from '@/lib/dashboard-storage';
import { validUsername } from '@/lib/codyn-dashboard';

export function DashboardSettings() {
  const [username, setUsername] = useState('vercel');
  const [saved, setSaved] = useState(false);
  const [deepByDefault, setDeepByDefault] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { setUsername(readGitHubUsername()); setDeepByDefault(readDefaultDepth() === 'deep'); }, []);

  function save(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!validUsername(username.trim())) { setError('Enter a valid GitHub username.'); return; }
    try { writeGitHubUsername(username); writeDefaultDepth(deepByDefault ? 'deep' : 'quick'); setSaved(true); window.setTimeout(() => setSaved(false), 1800); }
    catch (reason) { setError((reason as Error).message); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#00d2ff]/25 bg-[#00d2ff]/10 text-[#00d2ff]"><Settings className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#00d2ff]">Preferences</p><h1 className="mt-1 text-3xl font-semibold">Settings</h1></div></div></header>
      <form onSubmit={save} className="dashboard-panel rounded-[26px] p-6 sm:p-8">
        {error && <p role="alert" className="mb-5 text-sm text-rose-300">{error}</p>}
        <div className="flex items-center gap-3"><Github className="h-5 w-5 text-[#00d2ff]" /><div><h2 className="font-semibold">GitHub profile</h2><p className="mt-1 text-sm text-white/40">Used to populate My repositories with public data.</p></div></div>
        <label className="mt-6 block"><span className="text-xs font-medium text-white/55">Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/35 px-4 text-sm outline-none focus:border-[#00d2ff]/45" /></label>
        <div className="my-7 border-t border-white/8" />
        <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><SlidersHorizontal className="h-5 w-5 text-[#8deaff]" /><div><h2 className="font-semibold">Deep analysis by default</h2><p className="mt-1 text-sm text-white/40">Load broader context for architecture and security reasoning.</p></div></div><button type="button" onClick={() => setDeepByDefault(!deepByDefault)} aria-pressed={deepByDefault} className={`dashboard-focus relative h-7 w-12 shrink-0 rounded-full transition ${deepByDefault ? 'bg-[#00d2ff]' : 'bg-white/15'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-black transition ${deepByDefault ? 'left-6' : 'left-1'}`} /></button></div>
        <button type="submit" className="dashboard-focus mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#00d2ff]">{saved ? <><Check className="h-4 w-4" /> Saved</> : 'Save preferences'}</button>
      </form>
      <section className="dashboard-panel rounded-[26px] p-6"><h2 className="font-semibold">Data on this device</h2><p className="mt-2 text-sm leading-6 text-white/45">Preferences, Codyn stars, and up to 30 scan reports are stored in this browser. There is no account sync or private repository access in this version. AI questions and selected public source files are sent to Google Gemini only when you submit a question.</p><button type="button" onClick={() => { if (window.confirm('Delete all Codyn scan reports saved on this browser? This cannot be undone.')) { try { clearScans(); setError(''); } catch (reason) { setError((reason as Error).message); } } }} className="dashboard-focus mt-4 rounded-lg border border-rose-400/20 px-4 py-2 text-sm text-rose-300">Clear local scan history</button></section>
    </div>
  );
}
