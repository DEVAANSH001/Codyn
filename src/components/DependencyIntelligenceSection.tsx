import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, Bot, ChevronRight, ShieldCheck } from 'lucide-react';

const chips = ['Browse', 'Use APIs', 'Read Data', 'Create', 'Deliver'];

const dependencyRows = [
  { name: 'Market evidence', current: '27 found', target: '18 verified', impact: 'DONE', tone: '#8deaff' },
  { name: 'Customer signals', current: '48 found', target: '12 prioritized', impact: 'DONE', tone: '#8deaff' },
  { name: 'Launch brief', current: 'Drafted', target: 'Decision-ready', impact: 'READY', tone: '#63b3ff' },
];

const upgradePlan = [
  'Define the outcome, constraints, and success criteria',
  'Research the market and gather external evidence',
  'Pull customer, CRM, and performance context',
  'Reconcile conflicts and verify important claims',
  'Deliver the launch brief and prioritized action plan',
];

export const DependencyIntelligenceSection: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28 xl:px-0 relative z-10" id="dependency-intelligence">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050b14]/90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(97,216,255,0.16),_transparent_38%)]" />

        <div className="relative grid gap-8 p-6 md:grid-cols-[1.08fr_0.92fr] md:p-10 lg:p-12">
          <div className="flex flex-col justify-start pt-2">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-white/75">
              <span className="h-2 w-2 rounded-full bg-[#3D81E3]" />
              Autonomous Tool Use
            </div>

            <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-[0.98] tracking-[-0.06em] text-white md:text-[3.2rem]">
              Your tools become your <br />
              agent’s <span className="blue-gradient-text">workspace.</span>
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60 md:text-[0.96rem]">
              Codyn moves across the web, APIs, business systems, and documents—collecting context, taking action,
              and producing the deliverable instead of handing the workflow back to you.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {chips.map((chip, index) => (
                <span
                  key={chip}
                  className={`rounded-full border px-2.5 py-1 text-[10px] backdrop-blur-sm ${
                    index === 0
                      ? 'border-[#8deaff]/30 bg-[#8deaff]/8 text-[#8deaff]'
                      : index === 1
                        ? 'border-[#63b3ff]/30 bg-[#63b3ff]/8 text-[#63b3ff]'
                        : 'border-white/10 bg-white/3 text-white/75'
                  }`}
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="relative mt-8 flex-1 min-h-[220px] overflow-hidden rounded-[22px] border border-white/10 bg-[#050d19] p-4 flex items-end justify-center">
              <div className="w-full rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-[11px] text-white/75">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-white/90">Agent activity</span>
                  <span className="text-[#8deaff]">In progress</span>
                </div>
                <div className="space-y-2 text-white/80">
                  <div className="rounded-md border border-white/10 bg-white/3 px-2.5 py-2">
                    Researching competitor launches, pricing changes, positioning, and market response.
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/3 px-2.5 py-2">
                    Pulling customer feedback, CRM notes, campaign metrics, and the team’s existing launch context.
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/3 px-2.5 py-2">
                    Connecting external evidence with internal data to identify the strongest opportunities and risks.
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/3 px-2.5 py-2 text-white/65">
                    <span>Workflow progress</span>
                    <span className="text-[#8deaff]">72% complete</span>
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/3 px-2.5 py-2">
                    Resolving conflicting metrics and checking important claims against their original sources.
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/3 px-2.5 py-2">
                    Preserving source links, tool outputs, and original context so each recommendation is inspectable.
                  </div>
                  <div className="rounded-md border border-white/10 bg-white/3 px-2.5 py-2">
                    Producing a decision-ready launch brief with owners, priorities, and clear next actions.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start pt-1">
            <div className="w-full rounded-[20px] border border-white/10 bg-[#0d1724]/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/50">
                <span>Execution trace</span>
                <span className="text-[#8deaff]">27 sources · 3 tools</span>
              </div>

              <div className="mt-5 rounded-[16px] border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-white">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-[#8deaff]" />
                    <span className="font-medium">Product launch workflow</span>
                  </div>
                  <span className="text-[11px] text-[#f8b84f]">Status: Running</span>
                </div>

                <div className="mt-3 space-y-2 text-[11px] text-white/70">
                  <div className="flex items-center justify-between">
                    <span>Sources explored</span>
                    <span className="text-white/90">27</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Connected tools</span>
                    <span className="text-white/90">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confidence</span>
                    <span className="font-semibold text-[#f8b84f]">HIGH</span>
                  </div>
                </div>

                <div className="mt-4 rounded-[12px] border border-amber-400/30 bg-amber-500/8 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Needs verification
                  </div>

                  <ul className="mt-2 space-y-2 text-[11px] text-white/70">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
                      <span>2 campaign metrics are missing date ranges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-amber-300" />
                      <span>2 competitor claims need a second source</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 rounded-[16px] border border-white/10 bg-black/30 p-3.5">
                <div className="flex items-center justify-between gap-3 text-sm text-white">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#8deaff]" />
                    <span className="font-medium">Plan → Act → Verify</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#8deaff]">On track</span>
                </div>

                <div className="mt-3 space-y-2">
                  {dependencyRows.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-[10px] border border-white/10 bg-white/3 px-2.5 py-2"
                    >
                      <div>
                        <div className="text-[11px] font-medium text-white">{item.name}</div>
                        <div className="text-[10px] text-white/50">
                          {item.current} → {item.target}
                        </div>
                      </div>

                      <span
                        className="rounded-full border px-2 py-1 text-[10px] font-medium"
                        style={{
                          color: item.tone,
                          borderColor: `${item.tone}55`,
                          background: `${item.tone}16`,
                        }}
                      >
                        {item.impact}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[12px] border border-[#8deaff]/20 bg-[#8deaff]/6 p-3">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[#8deaff]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Autonomous execution plan
                  </div>

                  <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-white/75">
                    {upgradePlan.map((step, index) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="text-[#8deaff]">{index + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] border border-white/10 bg-[#0a1623]/80 px-3 py-2 text-[11px] text-white/70">
                <span>Verified launch brief and action plan generated</span>
                <button className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 font-medium text-black transition hover:bg-white/90">
                  Review result <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
