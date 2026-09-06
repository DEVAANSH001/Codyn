import React from 'react';
import { LogoMark } from './LogoMark';

export const Footer: React.FC = () => {
  return (
    <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-white/10 relative z-10 text-xs text-white/40 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <LogoMark className="w-5 h-5 text-[#00d2ff]" />
        <span className="font-medium text-white/70">Codyn Intelligence Inc. © {new Date().getFullYear()}</span>
      </div>

      <div className="flex items-center gap-6">
        <a href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</a>
        <a href="/terms" className="hover:text-white/80 transition-colors">Terms of Service</a>
        <a href="/security-scanner" className="hover:text-white/80 transition-colors">Security Audit</a>
        <a href="/faq" className="hover:text-white/80 transition-colors">Documentation</a>
      </div>
    </footer>
  );
};
