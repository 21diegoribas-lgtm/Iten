import React from 'react';

interface GameSceneContainerProps {
  children: React.ReactNode;
  theme?: 'garden' | 'sky' | 'racing' | 'ocean' | 'classroom';
  title?: string;
  badge?: string;
  rightActions?: React.ReactNode;
  className?: string;
}

export const GameSceneContainer: React.FC<GameSceneContainerProps> = ({
  children,
  theme = 'garden',
  title,
  badge,
  rightActions,
  className = ''
}) => {
  return (
    <div
      className={`relative rounded-[28px] sm:rounded-[32px] overflow-hidden border-4 border-[#BAE6FD]/80 shadow-[0_12px_32px_rgba(14,165,233,0.15)] bg-gradient-to-b from-[#7DD3FC] via-[#BAE6FD] to-[#E0F2FE] p-4 sm:p-6 ${className}`}
    >
      {/* Decorative Sky Clouds & Sun Rays */}
      <div className="absolute top-2 left-8 w-28 h-10 bg-white/70 rounded-full blur-[1px] pointer-events-none" />
      <div className="absolute top-5 left-16 w-20 h-8 bg-white/80 rounded-full pointer-events-none" />
      <div className="absolute top-3 right-24 w-36 h-12 bg-white/70 rounded-full pointer-events-none" />
      <div className="absolute top-6 right-36 w-24 h-10 bg-white/85 rounded-full pointer-events-none" />

      {/* Sun glow top right */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-[#FEF08A]/60 via-[#FDE047]/30 to-transparent blur-xl pointer-events-none" />

      {/* Floating Animated Butterflies/Sparkles */}
      <div className="absolute top-8 right-16 text-xl animate-bounce duration-1000 select-none pointer-events-none opacity-85">
        🦋
      </div>
      <div className="absolute top-16 right-48 text-sm animate-pulse select-none pointer-events-none opacity-75">
        ✨
      </div>
      <div className="absolute top-12 left-1/3 text-lg animate-bounce select-none pointer-events-none opacity-80">
        🌸
      </div>

      {/* Header bar inside Scene if title provided */}
      {(title || badge || rightActions) && (
        <div className="relative z-20 flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            {title && (
              <h2 className="text-xl sm:text-2xl font-black text-[#0284C7] drop-shadow-[0_2px_0_#FFFFFF] tracking-wide flex items-center gap-2">
                {title}
              </h2>
            )}
            {badge && (
              <span className="px-3 py-1 rounded-full bg-[#0284C7] text-white text-xs font-black shadow-[0_2px_0_#0369A1] uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>
          {rightActions && <div className="flex items-center gap-2">{rightActions}</div>}
        </div>
      )}

      {/* Main Game Content Layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
