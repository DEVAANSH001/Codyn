import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';

interface FaqItem {
  q: string;
  a: string;
}

const faqData: FaqItem[] = [
  {
    q: "What makes Codyn an autonomous AI agent?",
    a: "Codyn does more than return an answer. It understands your objective, creates an execution plan, uses browsers and tools, evaluates what it finds, adapts when conditions change, and keeps working until it can deliver the requested outcome."
  },
  {
    q: "How is Codyn different from a chatbot?",
    a: "A chatbot usually waits for the next instruction. Codyn can pursue a goal across multiple steps: searching, navigating websites, calling APIs, processing data, checking gaps, and deciding what to do next without requiring you to orchestrate every action."
  },
  {
    q: "What kinds of workflows can Codyn handle?",
    a: "Codyn can support lead generation, market and web research, data collection, repetitive browser work, account intelligence, developer workflows, and specialized processes built around your own tools and data."
  },
  {
    q: "Can I see what the agent is doing?",
    a: "Yes. Codyn provides a visible execution trail so you can follow the plan, sources, actions, progress, and verification steps behind the result instead of wondering what happened behind the scenes."
  },
  {
    q: "Can developers connect their own tools and data?",
    a: "Yes. You can connect Codyn to AI models, browsers, APIs, databases, custom tools, and code to build specialized agents around the systems and workflows your team already uses."
  },
  {
    q: "How does Codyn handle changing or incomplete workflows?",
    a: "Codyn observes the result of each action, checks what is still missing, and can revise its plan when pages change, data conflicts, or a tool returns an unexpected result. It is designed to pursue the outcome rather than blindly replay a brittle script."
  }
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-20 md:py-28 relative z-10 border-t border-white/10" id="faq">
      <div className="text-center mb-12">
        <SectionEyebrow label="FAQ" tag="Questions & Answers" />
        <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tight text-white">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-white/60 text-base">
          Everything you need to know about Codyn and autonomous execution.
        </p>
      </div>


      <div className="space-y-4">
        {faqData.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              className={`rounded-3xl border overflow-hidden bg-black/70 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                isOpen
                  ? 'border-[#00d2ff]/40 bg-black/80 shadow-[0_18px_45px_rgba(0,0,0,0.42)]'
                  : 'border-white/10 hover:border-[#00d2ff]/30'
              }`}
            >
              <button
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                className="group w-full text-left px-6 md:px-7 py-5 md:py-6 flex items-center justify-between gap-4 cursor-pointer text-white hover:text-[#00d2ff] transition-colors"
              >
                <span className="font-semibold text-sm md:text-base leading-snug">
                  {item.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-white/50 group-hover:text-[#00d2ff] transition-all duration-300 flex-shrink-0 ${
                    isOpen ? 'rotate-180 text-[#00d2ff]' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    id={`faq-answer-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="mx-6 md:mx-7 pb-6 md:pb-7 text-sm text-white/75 leading-[1.7] border-t border-white/10 pt-5">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
