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
    q: "Can AI truly understand complete GitHub codebases?",
    a: "Yes. Through Agentic CAG (Context-Augmented Generation), Codyn loads full relevant files into large context windows rather than retrieving fragmented text chunks. This allows the model to preserve structural, dependency, and control-flow relationships across the entire project."
  },
  {
    q: "How is Agentic CAG different from traditional chat-with-code tools?",
    a: "Traditional RAG breaks files into small isolated chunks, causing the LLM to miss cross-file controllers, services, and database bindings. Codyn selects complete source files, retaining full dependency trees and architectural control flow for higher accuracy."
  },
  {
    q: "Can I visualize repository architecture without cloning?",
    a: "Absolutely. Codyn automatically maps high-level system components, controller-service patterns, and generates editable Mermaid flowcharts directly from the repository URL without requiring local cloning or environment setup."
  },
  {
    q: "Does Codyn perform security auditing and vulnerability scanning?",
    a: "Yes. Codyn scans application code and dependency trees for security flaws, prioritizing risk signals based on real engineering context and providing severity-framed remediation steps."
  },
  {
    q: "Can Codyn analyze private repositories and developer profiles?",
    a: "Yes. Codyn connects securely to GitHub to analyze private repositories with end-to-end encryption. It also offers Developer Intel to analyze contributor profiles, expertise areas, and open-source impact."
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
          Everything you need to know about Codyn and Agentic CAG architecture.
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
