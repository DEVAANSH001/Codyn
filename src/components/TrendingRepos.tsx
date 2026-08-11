import React from 'react';
import { motion } from 'motion/react';
import { Star, ArrowUpRight, Github } from 'lucide-react';
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
  { owner: 'facebook', name: 'react', stars: '228k', description: 'The library for web and native user interfaces.', language: 'JavaScript', langColor: '#f1e05a' },
  { owner: 'vercel', name: 'next.js', stars: '124k', description: 'The React Framework for the Web.', language: 'TypeScript', langColor: '#3178c6' },
  { owner: 'gitlabhq', name: 'gitlabhq', stars: '24.5k', description: 'GitLab CE Mirror and open-source DevOps platform.', language: 'Ruby', langColor: '#cc342d' },
  { owner: 'goodrain', name: 'rainbond', stars: '4.2k', description: 'Multi-cloud application management platform.', language: 'Go', langColor: '#00ADD8' },
  { owner: 'ProxyScrape', name: 'free-proxy-list', stars: '2.1k', description: 'A free proxy list updated every five minutes.', language: 'Python', langColor: '#3572A5' },
  { owner: 'kamegoro', name: 'tobira.nvim', stars: '1.8k', description: 'Seamless workspace and session navigation for Neovim.', language: 'Lua', langColor: '#6f78ff' },
  { owner: 'Tauber01', name: 'ZENCHE', stars: '1.2k', description: 'Lightweight web performance intelligence toolkit.', language: 'TypeScript', langColor: '#3178c6' },
  { owner: 'umamoorg', name: 'umamo', stars: '950', description: 'Distributed microservice context tracing framework.', language: 'Rust', langColor: '#dea584' },
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
        aria-label={clone ? undefined : `Analyze ${fullPath}`}
        onClick={() => handleAnalyze(fullPath)}
        className="repo-marquee-card group"
      >
        <span className="flex items-center justify-between text-xs pb-4 border-b border-white/10">
          <span className="flex items-center gap-2 text-white/48 font-mono group-hover:text-[#8deaff] transition-colors">
            <Github className="w-4 h-4" />
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
            Analyze <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </span>
      </button>
    );
  });

  return (
    <section className="max-w-6xl mx-auto py-20 md:py-28 relative z-10 border-x border-t border-white/10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="max-w-6xl mx-auto px-6 mb-10"
      >
        <SectionEyebrow label="Discovery" />
        <h2 className="mt-3 text-2xl md:text-4xl font-semibold text-white">
          Trending Repositories
        </h2>
        <p className="mt-2 text-sm text-white/60">
          Explore and analyze open-source codebases moving through the developer community.
        </p>
      </motion.div>

      <div className="repo-marquee" aria-label="Trending repositories">
        <div className="repo-marquee-track">
          <div className="repo-marquee-group">{renderCards()}</div>
          <div className="repo-marquee-group" aria-hidden="true">{renderCards(true)}</div>
        </div>
      </div>
    </section>
  );
};
