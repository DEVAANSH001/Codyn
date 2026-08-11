import React from 'react';
import { motion } from 'motion/react';

const logos = [
  'Linear',
  'Vercel',
  'Figma',
  'Stripe',
  'Ramp',
  'Notion',
  'Loom',
  'Arc'
];

export const LogoCloud: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 relative z-10 border-t border-white/10">
      <div className="text-center text-xs font-mono uppercase tracking-widest text-white/50 font-medium">
        Trusted by engineers at top technology companies
      </div>


      <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 items-center justify-items-center">
        {logos.map((logo, index) => (
          <motion.span
            key={logo}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            className="text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-pointer text-center"
          >
            {logo}
          </motion.span>
        ))}
      </div>
    </section>
  );
};
