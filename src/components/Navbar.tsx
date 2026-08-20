import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { LogoMark } from './LogoMark';

const navLinks = [
  { name: 'Product', target: 'features' },
  { name: 'How It Works', target: 'workflow' },
  { name: 'Use Cases', target: 'discovery' },
  { name: 'Pricing', target: 'pricing' },
  { name: 'Tools', target: 'dependency-intelligence' }
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = (targetId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyzeClick = () => {
    setMobileMenuOpen(false);
    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputEl) {
      inputEl.focus();
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const el = document.getElementById('mockup');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="max-w-6xl mx-auto px-6 py-5 relative z-30"
    >
      <div className="flex items-center justify-between">
        {/* Left: Brand Logo */}
        <a 
          href="#" 
          className="inline-flex items-center gap-3 transition-transform hover:scale-105 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00d2ff]/20 to-white/5 border border-[#00d2ff]/30 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            <LogoMark className="w-full h-full text-white group-hover:text-[#00d2ff] transition-colors" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-sans">Codyn</span>
        </a>

        {/* Center: Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              href={`#${link.target}`}
              onClick={(e) => {
                e.preventDefault();
                handleScroll(link.target);
              }}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              className="text-white/70 text-sm font-medium hover:text-white transition-colors cursor-pointer"
            >
              {link.name}
            </motion.a>
          ))}
        </div>

        {/* Right Desktop: Header CTA focused on use case */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleAnalyzeClick}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-[#00d2ff] transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,210,255,0.5)] active:scale-95 cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Mobile menu icon button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 overflow-hidden rounded-2xl border border-white/10 p-6 flex flex-col gap-4 bg-black/90 backdrop-blur-xl shadow-2xl"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={`#${link.target}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleScroll(link.target);
                }}
                className="text-white/80 hover:text-white font-medium text-base py-1"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-3 border-t border-white/10">
              <button
                onClick={handleAnalyzeClick}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#00d2ff] text-black font-semibold text-sm active:scale-95 transition-all"
              >
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
