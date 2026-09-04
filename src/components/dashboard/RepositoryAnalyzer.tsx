'use client';

import { ArrowRight, Github, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { readDefaultDepth } from '@/lib/dashboard-storage';
import { parseRepositoryInput, ScanDepth } from '@/lib/codyn-dashboard';

export function RepositoryAnalyzer({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState('github.com/facebook/react');
  const [depth, setDepth] = useState<ScanDepth>('deep');
  const [error, setError] = useState('');
  useEffect(() => setDepth(readDefaultDepth()), []);

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseRepositoryInput(value);
    if (!parsed) {
      setError('Enter a GitHub repository such as facebook/react.');
      return;
    }
    setError('');
    router.push(`/repo/${parsed.owner}/${parsed.repo}?scan=${depth}`);
  }

  return (
    <form onSubmit={submit} className={compact ? '' : 'dashboard-panel rounded-[26px] p-5 sm:p-6'}>
      {!compact && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-white"><Zap className="h-4 w-4 text-[#00d2ff]" /> Start an analysis</div>
            <p className="mt-1.5 text-sm text-white/45">Paste a public GitHub repository to map its architecture and risks.</p>
          </div>
          <div className="hidden rounded-full border border-[#00d2ff]/20 bg-[#00d2ff]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8deaff] sm:block">No clone needed</div>
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-black/45 p-2 transition focus-within:border-[#00d2ff]/50 focus-within:shadow-[0_0_30px_rgba(0,210,255,0.08)]">
        <div className="flex flex-col gap-2 lg:flex-row">
          <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
            <Github className="h-5 w-5 shrink-0 text-[#00d2ff]" />
            <span className="sr-only">GitHub repository</span>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/25"
              placeholder="github.com/owner/repository"
              spellCheck={false}
            />
          </label>
          <div className="flex gap-2">
            <div className="flex rounded-xl border border-white/8 bg-white/[0.035] p-1" aria-label="Analysis depth">
              {(['quick', 'deep'] as ScanDepth[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDepth(option)}
                  className={`dashboard-focus rounded-lg px-3 text-xs font-semibold capitalize transition ${depth === option ? 'bg-[#00d2ff]/15 text-[#8deaff]' : 'text-white/40 hover:text-white'}`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button type="submit" className="dashboard-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#00d2ff]">
              Analyze <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-400" role="alert">{error}</p>}
    </form>
  );
}
