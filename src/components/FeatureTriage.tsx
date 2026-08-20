import React from 'react';
import { motion } from 'motion/react';
import { SectionEyebrow } from './SectionEyebrow';

const triageCategories = [
  {
    name: 'Planning',
    count: 6,
    color: '#fb7185',
    items: ['Outcome and constraints understood', 'Execution plan and success criteria created']
  },
  {
    name: 'Market Signals',
    count: 27,
    color: '#fbbf24',
    items: ['Competitor launches researched', 'Positioning and pricing changes compared']
  },
  {
    name: 'Customer Context',
    count: 48,
    color: '#38bdf8',
    items: ['Feedback themes analyzed · Campaign metrics connected']
  },
  {
    name: 'Delivered',
    count: 12,
    color: '#71717a',
    items: ['Launch brief ready · Prioritized actions assigned']
  }
];

const chips = [
  'Think',
  'Browse',
  'Act',
  'Reason',
  'Verify',
  'Deliver'
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
          <SectionEyebrow label="Autonomous Execution" />

          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight leading-[1.02] text-white">
            AI that doesn’t stop <br />
            at an <span className="blue-gradient-text">answer.</span>
          </h2>

          <p className="mt-6 text-white/60 text-base leading-[1.6] max-w-md">
            Most AI tools give you information. Codyn <span className="text-[#8deaff]">does something with it</span>—reasoning through the goal, operating tools, checking its work, and delivering the outcome.
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
            Live agent · Product launch workflow in progress
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
