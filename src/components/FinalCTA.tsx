import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ArrowRight } from 'lucide-react';

export const FinalCTA: React.FC = () => {
  const handleAnalyzeClick = () => {
    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center border border-[#00d2ff]/30 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-gradient-to-b from-black/80 to-[#00d2ff]/10 backdrop-blur-xl"
      >
        {/* Radial Glow Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(600px circle at 50% 0%, rgba(0, 210, 255, 0.25), transparent 70%)'
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02] text-white">
            Close the tabs. <br />
            Open your codebase.
          </h2>

          <p className="mt-6 text-white/70 max-w-md mx-auto text-sm leading-[1.6]">
            Join thousands of developers, architects, and security teams who talk directly with their repositories using Codyn CAG engine.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleAnalyzeClick}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#00d2ff] text-black font-semibold text-sm px-7 py-3.5 hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(0,210,255,0.4)] active:scale-95 cursor-pointer"
            >
              <span>Analyze Your Repo Free</span>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => {
                const el = document.getElementById('pricing');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 text-white text-sm font-medium px-6 py-3.5 hover:bg-white/10 transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Explore Plans</span>
              <ChevronRight className="w-4 h-4 text-white/70 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
