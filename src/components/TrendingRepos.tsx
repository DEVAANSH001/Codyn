import React from 'react';
import { motion } from 'motion/react';
import { Star, ArrowUpRight, Sparkles } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';

interface TrendingRepo {
  owner: string;
  name: string;
  stars: string;
  description: string;
  language: string;
  langColor: string;
}

const trendingList: TrendingRepo[] = [
  { owner: 'Growth', name: 'Lead Generation', stars: '20 leads', description: 'Find prospects, buying signals, and verified company information.', language: 'Research', langColor: '#f1e05a' },
  { owner: 'Strategy', name: 'Market Research', stars: '32 sources', description: 'Explore competitors, communities, trends, and emerging opportunities.', language: 'Analysis', langColor: '#3178c6' },
  { owner: 'Knowledge', name: 'Web Research', stars: '8 verified', description: 'Follow relevant information across sources and create a clear report.', language: 'Evidence', langColor: '#cc342d' },
  { owner: 'Operations', name: 'Data Collection', stars: '1,240 rows', description: 'Gather information from websites and transform it into structured data.', language: 'Extraction', langColor: '#00ADD8' },
  { owner: 'Teams', name: 'Repetitive Work', stars: '12h saved', description: 'Complete browser workflows that normally require hours of manual effort.', language: 'Automation', langColor: '#3572A5' },
  { owner: 'Developers', name: 'API Workflows', stars: '6 tools', description: 'Connect AI reasoning with APIs, databases, code, and custom tools.', language: 'Integration', langColor: '#6f78ff' },
  { owner: 'Sales', name: 'Account Research', stars: '45 accounts', description: 'Build concise account briefs with context, signals, and source trails.', language: 'Intelligence', langColor: '#3178c6' },
  { owner: 'Product', name: 'Voice of Customer', stars: '180 insights', description: 'Synthesize customer opinions into themes, needs, and opportunities.', language: 'Synthesis', langColor: '#dea584' },
];

interface TrendingReposProps {
  onSelectRepo?: (fullRepo: string) => void;
}

export const TrendingRepos: React.FC<TrendingReposProps> = ({ onSelectRepo }) => {
  const handleAnalyze = (fullRepo: string) => {
    onSelectRepo?.(fullRepo);
    document.getElementById('mockup')?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderCards = (clone = false) => trendingList.map((repo) => {
    const fullPath = `${repo.owner}/${repo.name}`;

    return (
      <button
        key={`${clone ? 'clone-' : ''}${fullPath}`}
        type="button"
        tabIndex={clone ? -1 : 0}
        aria-hidden={clone || undefined}
        aria-label={clone ? undefined : `Explore ${repo.name}`}
        onClick={() => handleAnalyze(fullPath)}
        className="repo-marquee-card group"
      >
        <span className="flex items-center justify-between text-xs pb-4 border-b border-white/10">
          <span className="flex items-center gap-2 text-white/48 font-mono group-hover:text-[#8deaff] transition-colors">
            <Sparkles className="w-4 h-4" />
            {repo.owner}
          </span>
          <span className="flex items-center gap-1.5 text-white/70 font-mono">
            <Star className="w-3.5 h-3.5 text-[#63b3ff] fill-[#63b3ff]/20" />
            {repo.stars}
          </span>
        </span>

        <span className="mt-5 block text-left">
          <span className="block text-lg font-semibold text-white group-hover:text-[#8deaff] transition-colors">
            {repo.name}
          </span>
          <span className="mt-2 block min-h-10 text-sm leading-relaxed text-white/52">
            {repo.description}
          </span>
        </span>

        <span className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="flex items-center gap-2 text-white/55">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: repo.langColor }} />
            {repo.language}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#63b3ff] translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
            Explore <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </span>
      </button>
    );
  });

  return (
    <section id="discovery" className="max-w-6xl mx-auto py-20 md:py-28 relative z-10 border-x border-t border-white/10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="max-w-6xl mx-auto px-6 mb-10"
      >
        <SectionEyebrow label="Use Cases" />
        <h2 className="mt-3 text-2xl md:text-4xl font-semibold text-white">
          One agent. Infinite workflows.
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Codyn is built to handle the workflows you have not automated yet.
        </p>
      </motion.div>

      <div className="repo-marquee" aria-label="Autonomous agent use cases">
        <div className="repo-marquee-track">
          <div className="repo-marquee-group">{renderCards()}</div>
          <div className="repo-marquee-group" aria-hidden="true">{renderCards(true)}</div>
        </div>
      </div>
    </section>
  );
};
