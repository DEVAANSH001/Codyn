import React from 'react';
import { motion } from 'motion/react';
import { SectionEyebrow } from './SectionEyebrow';

const triageCategories = [
  {
    name: 'Priority',
    count: 4,
    color: '#fb7185',
    items: ['Security: Unsanitized DOM prop in SSR', 'Architecture: Circular dependency in Auth module']
  },
  {
    name: 'Follow-up',
    count: 7,
    color: '#fbbf24',
    items: ['Code Review: FiberNode memory pool allocation', 'PR #28410 Context Impact Analysis']
  },
  {
    name: 'Tech Stack',
    count: 18,
    color: '#38bdf8',
    items: ['TypeScript 5.8 · Rollup · Hermes · Jest · Babel']
  },
  {
    name: 'Archived',
    count: 13,
    color: '#71717a',
    items: ['Clean dependencies · Passed 38 security checks']
  }
];

const chips = [
  'Agentic CAG',
  'Architecture Maps',
  'Context Code Review',
  'Security Audit',
  'Tech Stack Analyzer',
  'Due Diligence'
];

export const FeatureTriage: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative z-10" id="features">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
        {/* Left Column Motion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-start"
        >
          <SectionEyebrow label="Triage" />

          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02] text-white">
            Clear your <span className="blue-gradient-text">codebase</span> <br />
            in a single pass.
          </h2>

          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            Codyn reads <span className="text-[#8deaff]">complete files</span>, retains dependency relationships, and routes noise away from signal. Understand complex architecture without cloning or opening 100 tabs.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {chips.map((chip, index) => (
              <span
                key={chip}
                className={`triage-chip triage-chip-${(index % 3) + 1} text-xs px-3 py-1.5 rounded-full border backdrop-blur-sm cursor-default`}
              >
                {chip}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Right Column Liquid Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="triage-panel rounded-2xl p-5 border border-white/10 space-y-4 shadow-2xl"
        >
          <div className="text-xs font-medium uppercase tracking-wider text-white/50 px-1">
            Today · 42 repository signals triaged
          </div>

          <div className="space-y-3">
            {triageCategories.map((cat) => (
              <div
                key={cat.name}
                className="triage-row rounded-xl p-4 space-y-2 border bg-black/35"
                style={{ '--category-color': cat.color } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-semibold" style={{ color: cat.color }}>
                      {cat.name}
                    </span>
                  </div>
                  <span className="triage-count text-[11px] font-medium px-2 py-0.5 rounded-full border">
                    {cat.count}
                  </span>
                </div>

                <div className="space-y-1 pl-4">
                  {cat.items.map((item, idx) => (
                    <div key={idx} className="text-xs text-white/70 font-normal">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
