import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Github, Code, Zap, ShieldCheck } from 'lucide-react';

const gradientStyle: React.CSSProperties = {
  backgroundImage: 'linear-gradient(to right, #07152f 0%, #1769d2 22%, #42a5ff 42%, #8deaff 50%, #42a5ff 58%, #1769d2 78%, #07152f 100%)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  WebkitTextFillColor: 'transparent',
  filter: 'url(#c3-noise)',
};

interface HeroProps {
  onAnalyze?: (repoUrl: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onAnalyze }) => {
  const [repoInput, setRepoInput] = useState('github.com/facebook/react');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAnalyze) {
      onAnalyze(repoInput);
    } else {
      const el = document.getElementById('mockup');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExampleClick = (url: string) => {
    setRepoInput(url);
    if (onAnalyze) {
      onAnalyze(url);
    } else {
      const el = document.getElementById('mockup');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative z-10 min-h-[650px] md:min-h-[720px] py-16 md:py-20 text-center flex flex-col justify-center items-center max-w-6xl mx-auto px-6">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden"
      >
        <span>Agentic CAG Architecture • Zero Token Truncation</span>
      </motion.div>

      {/* Motion Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[0.95] text-white mt-5"
      >
        <span className="block">Talk with your</span>
        <span className="animate-shiny inline-block mt-2 md:mt-4" style={gradientStyle}>
          codebase.
        </span>

      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-7 text-white/70 max-w-2xl text-base md:text-lg leading-[1.65]"
      >
        Understand repositories faster with context-aware AI. Go from URL to architecture mapping, deep code review, and security triage in seconds without cloning.
      </motion.p>

      {/* Interactive URL Input Box */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-10 w-full max-w-3xl"
      >
        <div className="relative rounded-2xl p-2 border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center gap-2 bg-black/70 backdrop-blur-xl">
          <div className="flex items-center gap-3 pl-3 pr-2 py-2 w-full">
            <Github className="w-5 h-5 text-[#00d2ff] flex-shrink-0" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="GitHub URL, username, or repo (e.g. facebook/react)"
              className="bg-transparent border-none outline-none text-sm text-white placeholder-white/40 w-full font-mono focus:ring-0"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold text-sm px-6 py-3.5 hover:bg-[#00d2ff] transition-all duration-300 active:scale-[0.98] cursor-pointer flex-shrink-0 shadow-lg"
          >
            <span>Analyze Repo</span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-white/60">
          <span className="text-white/40 font-medium">Try analyzing:</span>
          {['facebook/react', 'vercel/next.js', 'tailwindlabs/tailwindcss'].map((repo) => (
            <button
              key={repo}
              type="button"
              onClick={() => handleExampleClick(repo)}
              className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00d2ff]/40 hover:text-[#00d2ff] transition-all cursor-pointer font-mono text-[11px]"
            >
              {repo}
            </button>
          ))}
        </div>
      </motion.form>

      {/* Use Case Platform Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="mt-12 pt-7 w-full max-w-3xl border-t border-white/10 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-xs text-white/60"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00d2ff]" />
          <span>Instant CAG AST Context</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Security & Vulnerability Triage</span>
        </div>
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-400" />
          <span>Mermaid Diagram Generator</span>
        </div>
      </motion.div>
    </section>
  );
};
