import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';

export const Pricing: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10 border-t border-white/10" id="pricing">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <SectionEyebrow label="Pricing" tag="Flexible Plans" />
        <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
          Simple, transparent pricing for every kind of work.
        </h2>
        <p className="mt-4 text-white/60 text-base leading-relaxed">
          Start with your first autonomous workflows for free. Upgrade as your tasks, tools, and team scale.
        </p>

      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="min-h-[620px] rounded-3xl p-8 border border-white/10 bg-black/60 backdrop-blur-xl flex flex-col justify-between hover:border-[#63b3ff]/40 hover:-translate-y-1 transition-all duration-300 group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white/50">
                Free
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-white">₹0</span>
              <span className="text-xs text-white/50">/ forever</span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed mb-6">
              For individuals exploring what autonomous agents can do.
            </p>

            <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-white/80">
              {[
                'Up to 3 active workflows',
                'Web search and browsing',
                '10 agent runs per day',
                'Structured result delivery',
                'Access via web interface and CLI'
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-white/70 flex-shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              const el = document.getElementById('mockup');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-8 w-full py-3 px-4 rounded-xl border border-white/20 bg-white/5 text-white font-medium text-xs hover:bg-white/15 transition-all cursor-pointer"
          >
            Get Started Free
          </button>
        </motion.div>

        {/* Standard Plan (Featured / Popular) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative min-h-[660px] rounded-3xl p-8 border border-[#42a5ff]/50 bg-gradient-to-b from-[#0b5fb8]/20 via-black/80 to-black backdrop-blur-xl flex flex-col justify-between shadow-[0_0_40px_rgba(36,133,255,0.16)] -translate-y-3 group"
        >
          {/* Top Popular Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1769d2] to-[#8deaff] text-black font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-1 rounded-full shadow-md">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between mb-4 mt-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00d2ff]">
                Standard
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-white">
                ₹99
              </span>
              <span className="text-xs text-white/50">/ month</span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed mb-6">
              For professionals who want agents to execute recurring, multi-step work.
            </p>

            <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-white/90">
              {[
                'Up to 50 active workflows',
                'Autonomous planning and execution',
                'Browser, API, and tool access',
                'Source trails and verification',
                'Export structured reports and data'
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[#00d2ff]/20 border border-[#00d2ff]/40 flex items-center justify-center text-[#00d2ff] flex-shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
              if (inputEl) {
                inputEl.focus();
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="mt-8 w-full py-3.5 px-4 rounded-xl bg-[#00d2ff] text-black font-semibold text-xs hover:bg-white transition-all shadow-[0_0_20px_rgba(0,210,255,0.4)] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="min-h-[620px] rounded-3xl p-8 border border-white/10 bg-black/60 backdrop-blur-xl flex flex-col justify-between hover:border-[#63b3ff]/40 hover:-translate-y-1 transition-all duration-300 group"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
                Pro Team
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-bold text-white">
                ₹999
              </span>
              <span className="text-xs text-white/50">/ month</span>
            </div>

            <p className="text-xs text-white/60 leading-relaxed mb-6">
              For teams running high-volume workflows across shared systems and data.
            </p>

            <div className="space-y-3 pt-4 border-t border-white/10 text-xs text-white/80">
              {[
                'Unlimited active workflows',
                'Unlimited autonomous agent runs',
                'Shared knowledge and workflow library',
                'Priority AI execution pipeline',
                '5 team seats and custom integrations'
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              const el = document.getElementById('mockup');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-8 w-full py-3 px-4 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-300 font-medium text-xs hover:bg-purple-500/20 transition-all cursor-pointer"
          >
            Upgrade to Pro
          </button>
        </motion.div>

      </div>
    </section>
  );
};
