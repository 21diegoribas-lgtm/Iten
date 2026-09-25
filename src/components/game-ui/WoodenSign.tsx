import React from 'react';

interface WoodenSignProps {
  title?: string;
  lines?: string[];
  children?: React.ReactNode;
  variant?: 'board' | 'hanging' | 'signpost' | 'banner';
  className?: string;
}

export const WoodenSign: React.FC<WoodenSignProps> = ({
  title,
  lines,
  children,
  variant = 'board',
  className = ''
}) => {
  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Wooden Sign Board */}
      <div className="relative bg-gradient-to-b from-[#8D6E63] via-[#6D4C41] to-[#4E342E] text-[#FFF8E1] px-5 py-3 rounded-2xl border-4 border-[#3E2723] shadow-[0_6px_0_#271815,0_12px_20px_rgba(0,0,0,0.25)] flex flex-col items-center justify-center min-w-[130px]">
        {/* Wood planks line overlay */}
        <div className="absolute inset-x-2 top-1/2 h-[1.5px] bg-[#3E2723]/40" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#A1887F]/40 rounded-t-xl" />

        {/* Decorative corner nails */}
        <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-[#D7CCC8] border border-[#3E2723] shadow-xs" />
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D7CCC8] border border-[#3E2723] shadow-xs" />
        <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-[#D7CCC8] border border-[#3E2723] shadow-xs" />
        <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D7CCC8] border border-[#3E2723] shadow-xs" />

        {title && (
          <div className="font-black text-sm sm:text-base text-[#FFF9C4] drop-shadow-[0_2px_2px_rgba(0,0,0,0.6)] tracking-wide">
            {title}
          </div>
        )}

        {lines && (
          <div className="flex flex-col items-center gap-0.5 mt-0.5">
            {lines.map((l, i) => (
              <div
                key={i}
                className="text-xs sm:text-sm font-extrabold text-[#FFE082] drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
              >
                {l}
              </div>
            ))}
          </div>
        )}

        {children}
      </div>

      {/* Signpost pole if requested */}
      {variant === 'signpost' && (
        <div className="w-5 h-8 bg-gradient-to-r from-[#4E342E] via-[#6D4C41] to-[#3E2723] border-x-2 border-b-2 border-[#271815] -mt-1 shadow-md z-0" />
      )}
    </div>
  );
};
