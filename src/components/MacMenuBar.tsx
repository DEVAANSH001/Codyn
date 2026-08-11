import React from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';
import { LogoMark } from './LogoMark';


const menuItems = ['File', 'Edit', 'View', 'Go', 'Window', 'Help'];

export const MacMenuBar: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
      className="isolate max-w-6xl mx-auto h-10 bg-[#050505]/95 border-y border-white/10 relative z-20 overflow-hidden"
    >
      <div className="px-6 h-full flex items-center justify-between text-xs text-white/80">
        {/* Left menu section */}
        <div className="flex items-center gap-4">
          <LogoMark className="w-3.5 h-3.5 text-[#00d2ff] flex-shrink-0" />
          <span className="font-bold text-white tracking-wide">Codyn</span>

          <div className="flex items-center gap-4 text-white/70">

            {menuItems.map((item, index) => {
              let visibility = "inline";
              if (index > 2) visibility = "hidden sm:inline";
              if (index > 3) visibility = "hidden md:inline";
              return (
                <span
                  key={item}
                  className={`${visibility} hover:text-white transition-colors cursor-pointer`}
                >
                  {item}
                </span>
              );
            })}
          </div>
        </div>

        {/* Right status section */}
        <div className="flex items-center gap-4">
          <Search className="w-3.5 h-3.5 text-white/60 hover:text-white cursor-pointer transition-colors" />
          <span className="font-medium text-white/70">Wed May 6 1:09 PM</span>
        </div>
      </div>
    </motion.div>
  );
};
