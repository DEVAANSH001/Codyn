import React from 'react';

interface SectionEyebrowProps {
  label: string;
  tag?: string;
  className?: string;
}

export const SectionEyebrow: React.FC<SectionEyebrowProps> = ({
  label,
  tag,
  className = ""
}) => {
  return (
    <div className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/70 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
      <span>{label}</span>
      {tag && (
        <span className="ml-1 px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-[10px] normal-case tracking-normal">
          {tag}
        </span>
      )}
    </div>
  );
};
