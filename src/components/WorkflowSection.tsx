import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check, GitBranch, Layers3, ScanSearch, FileOutput } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';

const steps = [
  {
    number: '01',
    label: 'Goal',
    title: 'Describe the outcome',
    description: 'Tell Codyn what you want completed in plain language. There is no need to translate the work into a rigid sequence of commands.',
    detail: 'Objective understood',
    icon: GitBranch,
  },
  {
    number: '02',
    label: 'Plan',
    title: 'Build the execution plan',
    description: 'Codyn breaks the goal into actionable steps, chooses the right tools, and identifies the information it needs to finish.',
    detail: 'Workflow created',
    icon: Layers3,
  },
  {
    number: '03',
    label: 'Execute',
    title: 'Browse, act, and adapt',
    description: 'The agent navigates the web, calls APIs, processes data, and changes course when a page, result, or assumption changes.',
    detail: 'Tools in motion',
    icon: ScanSearch,
  },
  {
    number: '04',
    label: 'Deliver',
    title: 'Verify and return the result',
    description: 'Codyn checks important findings, resolves missing information, and turns the work into a useful, structured deliverable.',
    detail: 'Outcome delivered',
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
            From a goal to a <span className="blue-gradient-text">finished task.</span>
          </h2>
          <p className="mt-5 text-white/60 text-base leading-relaxed max-w-md">
            Real workflows change as they unfold. Codyn observes what happened, reassesses the plan, and chooses the next best action until the result is complete.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-[#8deaff]">
            <span className="h-px w-10 bg-gradient-to-r from-[#1769d2] to-[#8deaff]" />
            Plan → Act → Observe → Reason → Adapt
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
