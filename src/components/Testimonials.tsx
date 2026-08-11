import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Github, Twitter } from 'lucide-react';
import { SectionEyebrow } from './SectionEyebrow';

interface Testimonial {
  quote: string;
  author: string;
  handle: string;
  role: string;
  company: string;
  avatarUrl: string;
  badge: string;
}

const testimonialsData: Testimonial[] = [
  {
    quote: "Codyn gave our engineering team four hours of their week back. Understanding complex legacy codebases without manual AST parsing or local clones feels effortless.",
    author: "Parker Wilf",
    handle: "@pwilf_dev",
    role: "Lead Systems Engineer",
    company: "MERCURY",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    badge: "Verified Developer"
  },
  {
    quote: "Agentic CAG completely transformed how we perform code reviews. It understands cross-file dependencies, controller bindings, and edge-case logic flaws in seconds.",
    author: "Andrew von Rosenbach",
    handle: "@andrew_vr",
    role: "Senior Infrastructure Lead",
    company: "COHERE",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    badge: "Tech Lead"
  },
  {
    quote: "The security triage feature surfaced an unsanitized DOM prop vector in our SSR hydration flow that standard static security scanners missed entirely.",
    author: "Elena Rostova",
    handle: "@erostova_sec",
    role: "Principal Security Auditor",
    company: "DATADOG",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
    badge: "Security Researcher"
  },
  {
    quote: "Architecture mapping that actually reflects real control flow! What used to take new engineering hires days of manual code browsing now takes under 5 minutes.",
    author: "Mathies Christensen",
    handle: "@mchristensen",
    role: "Engineering Manager",
    company: "LUNAR",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    badge: "Engineering Manager"
  },
  {
    quote: "Being able to paste a GitHub URL and generate an accurate Mermaid dependency flowchart on the fly has streamlined our architectural review sessions.",
    author: "David K. Liang",
    handle: "@dliang_infra",
    role: "Staff Platform Engineer",
    company: "CLOUDFLARE",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
    badge: "Platform Lead"
  },
  {
    quote: "Querying full file contexts without token truncation means zero hallucinated import paths. Codyn is now an essential part of our core developer workflow.",
    author: "Sophia Martinez",
    handle: "@smartinez_ui",
    role: "Principal Frontend Architect",
    company: "VERCEL ECOSYSTEM",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    badge: "Core Contributor"
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24 md:py-32 relative z-10 border-t border-white/10" id="testimonials">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <SectionEyebrow label="Testimonials" tag="Developer Feedback" />
        <h2 className="mt-4 text-3xl md:text-5xl font-semibold tracking-tight text-white leading-tight">
          Engineers rely on Codyn every day.
        </h2>
        <p className="mt-4 text-white/60 text-base leading-relaxed">
          Real feedback from software architects, infrastructure engineers, and security leads using Codyn to master codebases.
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonialsData.map((item, index) => (
          <motion.figure
            key={item.author}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.6 }}
            className="relative rounded-3xl p-6 border border-white/10 bg-black/60 backdrop-blur-xl flex flex-col justify-between hover:border-[#00d2ff]/40 transition-all duration-300 group hover:-translate-y-1 shadow-xl"
          >
            <div>
              {/* Profile Card Header */}
              <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-white/10">
                <img
                  src={item.avatarUrl}
                  alt={item.author}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white/20 group-hover:border-[#00d2ff] transition-colors shadow-md flex-shrink-0"
                />
                <div className="flex flex-col overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white group-hover:text-[#00d2ff] transition-colors truncate">
                      {item.author}
                    </span>
                  </div>
                  <span className="text-xs text-white/50 font-mono truncate">
                    {item.handle}
                  </span>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="text-xs md:text-sm text-white/80 leading-[1.6] mb-6">
                “{item.quote}”
              </blockquote>
            </div>

            {/* Author Role & Company Footer */}
            <figcaption className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white/90">
                  {item.role}
                </span>
                <span className="text-[10px] text-[#00d2ff] font-mono font-bold tracking-wider uppercase mt-0.5">
                  {item.company}
                </span>
              </div>

              <span className="text-[10px] font-mono text-white/50 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1 flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {item.badge}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
};
