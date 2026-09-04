'use client';

import { ArrowUpRight, BookOpen, GitFork, Globe2, Lock, Star } from 'lucide-react';
import Link from 'next/link';
import { formatCompactNumber, RepositorySummary } from '@/lib/codyn-dashboard';

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5', Go: '#00ADD8', Rust: '#dea584', Java: '#b07219', CSS: '#663399', HTML: '#e34c26',
};

export function RepositoryCard({ repository, starred = false, onToggleStar }: { repository: RepositorySummary; starred?: boolean; onToggleStar?: (fullName: string) => void }) {
  return (
    <article className="dashboard-panel group flex min-h-[230px] flex-col rounded-[22px] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#00d2ff]/25">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-white/30">{repository.owner}</p>
          <h2 className="mt-1 truncate text-lg font-semibold transition group-hover:text-[#8deaff]">{repository.name}</h2>
        </div>
        <div className="flex items-center gap-1">
          {onToggleStar && (
            <button type="button" onClick={() => onToggleStar(repository.fullName)} className={`dashboard-focus rounded-lg p-2 transition hover:bg-white/5 ${starred ? 'text-amber-300' : 'text-white/25 hover:text-amber-300'}`} aria-label={starred ? `Remove ${repository.fullName} from starred` : `Star ${repository.fullName}`}>
              <Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} />
            </button>
          )}
          {repository.private ? <Lock className="h-4 w-4 text-white/30" /> : <Globe2 className="h-4 w-4 text-white/30" />}
        </div>
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-white/45">{repository.description || 'No repository description has been provided yet.'}</p>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/[0.065] pt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/35">
          {repository.language && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: languageColors[repository.language] || '#00d2ff' }} /> {repository.language}</span>}
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {formatCompactNumber(repository.stars)}</span>
          <span className="flex items-center gap-1"><GitFork className="h-3.5 w-3.5" /> {formatCompactNumber(repository.forks)}</span>
        </div>
        <Link href={`/repo/${repository.fullName}`} className="dashboard-focus inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white/[0.065] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#00d2ff] hover:text-black">
          <BookOpen className="h-3.5 w-3.5" /> Analyze <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
