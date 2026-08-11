import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, GitBranch, Layers3, ScanSearch, FileOutput } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';

const steps = [
  {
    number: '01',
    label: 'Connect',
    title: 'Point Codyn at a repository',
    description: 'Paste a GitHub URL. Public repositories start instantly; private repositories connect with scoped access.',
    detail: 'Repository verified',
    icon: GitBranch,
  },
  {
    number: '02',
    label: 'Map',
    title: 'Build complete code context',
    description: 'Codyn reads whole files and traces imports, control flow, and dependencies without flattening the code into fragments.',
    detail: '34 files mapped',
    icon: Layers3,
  },
  {
    number: '03',
    label: 'Review',
    title: 'Surface the decisions that matter',
    description: 'Architecture gaps, security risks, and review notes are grouped by priority so signal stays ahead of noise.',
    detail: '4 priority findings',
    icon: ScanSearch,
  },
  {
    number: '04',
    label: 'Act',
    title: 'Ask, export, and keep moving',
    description: 'Turn the result into answers, Mermaid diagrams, or reports your team can use immediately.',
    detail: 'Ready to export',
    icon: FileOutput,
  },
];

export const WorkflowSection: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 relative z-10 border-t border-white/10" id="workflow">
      <div className="grid lg:grid-cols-[0.78fr_1.22fr] gap-12 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-28">
          <SectionEyebrow label="Workflow" />
          <h2 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight text-white leading-[1.05]">
            One clear path from URL to <span className="blue-gradient-text">understanding.</span>
          </h2>
          <p className="mt-5 text-white/60 text-base leading-relaxed max-w-md">
            No setup maze and no decorative process theatre. Each stage produces something useful for the next one.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-[#8deaff]">
            <span className="h-px w-10 bg-gradient-to-r from-[#1769d2] to-[#8deaff]" />
            Typical first pass: under a minute
          </div>
        </div>

        <div className="border-y border-white/15">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.number}
                initial={{ opacity: 0, x: 18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: index * 0.07, duration: 0.45 }}
                className="workflow-row group grid grid-cols-[3.25rem_1fr] sm:grid-cols-[4rem_1fr_auto] gap-4 sm:gap-6 py-7 border-b border-white/10 last:border-b-0"
              >
                <div className="pt-0.5 font-mono text-sm text-[#63b3ff]">{step.number}</div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-4 h-4 text-[#8deaff] transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">{step.label}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-[#8deaff] transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55 group-hover:text-white/70 transition-colors">
                    {step.description}
                  </p>
                </div>

                <div className="col-start-2 sm:col-start-auto self-center flex items-center gap-2 text-xs text-white/45 group-hover:text-[#63b3ff] transition-colors whitespace-nowrap">
                  <Check className="w-3.5 h-3.5" />
                  {step.detail}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
