"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Boxes, Braces, CheckCircle2, Network } from "lucide-react";
import { motion } from "motion/react";
import { PlantUml } from "./PlantUml";
import { SectionEyebrow } from "./SectionEyebrow";

const examples = [
  {
    name: "SaaS platform",
    detail: "Web, API, jobs, cache, and database",
    source: `@startuml
title Multi-tenant SaaS platform
actor "Customer" as user
cloud "Identity Provider" as idp
package "Application" {
  component "Next.js Web" as web
  component "API Service" as api
  queue "Job Queue" as queue
  component "Worker" as worker
  database "PostgreSQL" as db
  storage "Redis Cache" as cache
}
user --> web : HTTPS
web --> idp : OAuth
web --> api : JSON API
api --> cache : sessions
api --> db : queries
api --> queue : jobs
queue --> worker : consume
worker --> db : updates
@enduml`,
  },
  {
    name: "Event pipeline",
    detail: "Ingress, stream processing, and analytics",
    source: `@startuml
title Event-driven analytics pipeline
actor "SDK Client" as client
package "Ingestion" {
  component "Edge API" as edge
  queue "Event Stream" as stream
}
package "Processing" {
  component "Normalizer" as worker
  component "Aggregator" as aggregate
  database "Warehouse" as warehouse
}
component "Analytics API" as analytics
client --> edge : events
edge --> stream : publish
stream --> worker : consume
worker --> aggregate : normalized events
aggregate --> warehouse : batches
warehouse --> analytics : queries
@enduml`,
  },
  {
    name: "AI assistant",
    detail: "Repository context, model calls, and history",
    source: `@startuml
title Repository-aware AI assistant
actor "Developer" as developer
package "Codyn" {
  component "Workspace UI" as ui
  component "Context Builder" as context
  component "Security Scanner" as scanner
  component "AI Orchestrator" as ai
  database "Saved History" as history
}
cloud "GitHub" as github
cloud "Model Provider" as model
developer --> ui : question
ui --> context : repository request
context --> github : source files
context --> scanner : selected files
context --> ai : grounded context
ai --> model : inference
ai --> history : save result
ai --> ui : answer + diagrams
@enduml`,
  },
] as const;

const capabilities = [
  "Grounded in actual repository files",
  "Maps services, stores, queues, and external systems",
  "Labels protocols, trust boundaries, and key data flows",
  "Exports portable PlantUML source without sharing code externally",
];

export function SystemDesignShowcase() {
  const [activeExample, setActiveExample] = useState(0);
  const example = examples[activeExample];

  return (
    <section className="relative z-10 border-y border-white/10 bg-[#080b12]/70 py-20 md:py-28" id="system-design">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:sticky lg:top-28">
            <SectionEyebrow label="System Design Generator" />
            <h2 className="mt-5 text-3xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl">
              Turn a repository into a <span className="blue-gradient-text">system map.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/60">
              Codyn traces the codebase before drawing. Generate a high-level Mermaid architecture view or a detailed PlantUML system design with evidence from real files.
            </p>
            <ul className="mt-8 space-y-3">
              {capabilities.map((capability) => <li key={capability} className="flex items-start gap-3 text-sm leading-6 text-white/65"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#63d8ff]" />{capability}</li>)}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/chat" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#dff8ff]">Generate a system design <ArrowRight className="h-4 w-4" /></Link>
              <a href="#workflow" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-cyan-300/30 hover:text-white">See how it works</a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.12 }} className="min-w-0">
            <div className="mb-4 grid gap-2 sm:grid-cols-3">
              {examples.map((item, index) => <button key={item.name} type="button" onClick={() => setActiveExample(index)} className={`rounded-xl border p-3 text-left transition ${activeExample === index ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/10 bg-black/25 hover:border-white/20"}`} aria-pressed={activeExample === index}>
                <span className="flex items-center gap-2 text-xs font-semibold text-white"><Network className={`h-3.5 w-3.5 ${activeExample === index ? "text-cyan-300" : "text-white/35"}`} />{item.name}</span>
                <span className="mt-1 block text-[11px] leading-4 text-white/40">{item.detail}</span>
              </button>)}
            </div>
            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-[26px] border border-white/10 bg-black/30 p-3 shadow-2xl shadow-cyan-950/20">
              <div className="flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/35"><span className="flex items-center gap-2"><Boxes className="h-3.5 w-3.5 text-cyan-300" />Live example</span><span className="flex items-center gap-1.5"><Braces className="h-3.5 w-3.5" />PlantUML</span></div>
              <PlantUml source={example.source} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
