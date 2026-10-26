"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { SectionEyebrow } from "./SectionEyebrow";

const capabilities = [
  "Grounded in actual repository files",
  "Maps services, stores, queues, and external systems",
  "Labels protocols, trust boundaries, and key data flows",
  "Exports portable PlantUML source without sharing code externally",
];

export function SystemDesignShowcase() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28" id="system-design">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#080b12]/80 p-6 md:p-10 lg:p-12"
      >
        <div className="relative max-w-5xl">
          <SectionEyebrow label="System Design Generator" />
          <h2 className="mt-5 max-w-4xl text-3xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
            Turn a repository into a <span className="blue-gradient-text">system map.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60">
            Codyn traces the codebase before drawing. Generate a high-level Mermaid architecture view or a detailed PlantUML system design with evidence from real files.
          </p>
          <ul className="mt-8 space-y-3">
            {capabilities.map((capability) => <li key={capability} className="flex items-start gap-3 text-sm leading-6 text-white/65"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#63d8ff]" />{capability}</li>)}
          </ul>
          <div className="mt-9 flex">
            <Link href="/chat" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#dff8ff]">Start generation <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
