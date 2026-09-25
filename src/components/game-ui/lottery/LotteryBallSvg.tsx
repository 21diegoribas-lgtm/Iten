import React from 'react';

export interface LotteryBallData {
  id: string;
  studentId?: string;
  name?: string;
  number: number;
  colorIndex: number;
  avatar?: string;
  team?: string;
  className?: string;
}

interface LotteryBallSvgProps {
  number: number;
  name?: string;
  colorIndex?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isHighlighted?: boolean;
  className?: string;
  rotation?: number;
}

// 8 Rich 3D Palette Gradients with Specular Highlight and Shadow
export const LOTTERY_BALL_PALETTES = [
  {
    id: 'ruby',
    name: 'Ruby Red',
    gradStart: '#FF4D6D',
    gradMid: '#E11D48',
    gradEnd: '#9F1239',
    ring: '#FFE4E6',
    border: '#BE123C',
    text: '#881337',
    badge: '#FFF1F2'
  },
  {
    id: 'sapphire',
    name: 'Sapphire Blue',
    gradStart: '#38BDF8',
    gradMid: '#0284C7',
    gradEnd: '#0369A1',
    ring: '#E0F2FE',
    border: '#0284C7',
    text: '#0C4A6E',
    badge: '#F0F9FF'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    gradStart: '#34D399',
    gradMid: '#059669',
    gradEnd: '#065F46',
    ring: '#D1FAE5',
    border: '#047857',
    text: '#064E3B',
    badge: '#ECFDF5'
  },
  {
    id: 'gold',
    name: 'Royal Gold',
    gradStart: '#FDE047',
    gradMid: '#F59E0B',
    gradEnd: '#B45309',
    ring: '#FEF3C7',
    border: '#D97706',
    text: '#78350F',
    badge: '#FFFBEB'
  },
  {
    id: 'amethyst',
    name: 'Amethyst Violet',
    gradStart: '#C084FC',
    gradMid: '#9333EA',
    gradEnd: '#6B21A8',
    ring: '#F3E8FF',
    border: '#7E22CE',
    text: '#581C87',
    badge: '#FAF5FF'
  },
  {
    id: 'amber',
    name: 'Blaze Orange',
    gradStart: '#FB923C',
    gradMid: '#EA580C',
    gradEnd: '#9A3412',
    ring: '#FFEDD5',
    border: '#C2410C',
    text: '#7C2D12',
    badge: '#FFF7ED'
  },
  {
    id: 'coral',
    name: 'Coral Pink',
    gradStart: '#F472B6',
    gradMid: '#DB2777',
    gradEnd: '#9D174D',
    ring: '#FCE7F3',
    border: '#BE185D',
    text: '#831843',
    badge: '#FDF2F8'
  },
  {
    id: 'cyan',
    name: 'Neon Cyan',
    gradStart: '#22D3EE',
    gradMid: '#0891B2',
    gradEnd: '#155E75',
    ring: '#CFFAFE',
    border: '#0E7490',
    text: '#164E63',
    badge: '#ECFEFF'
  }
];

export const LotteryBallSvg: React.FC<LotteryBallSvgProps> = ({
  number,
  colorIndex = 0,
  size = 'md',
  isHighlighted = false,
  className = '',
  rotation = 0
}) => {
  const palette = LOTTERY_BALL_PALETTES[Math.abs(colorIndex) % LOTTERY_BALL_PALETTES.length];

  // Size pixel map
  const sizeMap = {
    xs: { px: 28, textSz: 'text-[10px]', innerD: 15, fontSize: 9 },
    sm: { px: 38, textSz: 'text-[12px]', innerD: 22, fontSize: 13 },
    md: { px: 52, textSz: 'text-sm', innerD: 30, fontSize: 17 },
    lg: { px: 76, textSz: 'text-lg', innerD: 44, fontSize: 24 },
    xl: { px: 110, textSz: 'text-3xl', innerD: 64, fontSize: 36 }
  }[size];

  const diameter = sizeMap.px;
  const radius = diameter / 2;

  const gradId = `ball-grad-${number}-${colorIndex}-${size}`;
  const specId = `ball-spec-${number}-${colorIndex}-${size}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{
        width: diameter,
        height: diameter,
        transform: rotation ? `rotate(${rotation}deg)` : undefined
      }}
    >
      <svg
        width={diameter}
        height={diameter}
        viewBox={`0 0 ${diameter} ${diameter}`}
        className={`w-full h-full drop-shadow-md transition-all ${
          isHighlighted ? 'scale-110 drop-shadow-[0_0_15px_#FACC15]' : ''
        }`}
      >
        <defs>
          {/* Main 3D Spherical Radial Gradient */}
          <radialGradient id={gradId} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={palette.gradStart} />
            <stop offset="45%" stopColor={palette.gradMid} />
            <stop offset="90%" stopColor={palette.gradEnd} />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.8" />
          </radialGradient>

          {/* Specular Highlight Gloss */}
          <linearGradient id={specId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Ball Base Sphere */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 1.5}
          fill={`url(#${gradId})`}
          stroke={palette.border}
          strokeWidth="1.5"
        />

        {/* 2. Top Specular Gloss Reflection Curve */}
        <ellipse
          cx={radius * 0.75}
          cy={radius * 0.45}
          rx={radius * 0.45}
          ry={radius * 0.25}
          fill={`url(#${specId})`}
          transform={`rotate(-25 ${radius * 0.75} ${radius * 0.45})`}
        />

        {/* 3. Center White Number Emblem Disc */}
        <circle
          cx={radius}
          cy={radius}
          r={sizeMap.innerD / 2}
          fill={palette.badge}
          stroke={palette.ring}
          strokeWidth="1.5"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.25))"
        />

        {/* 4. Number inside center circle - Perfectly Centered, High Contrast */}
        <text
          x={radius}
          y={radius}
          textAnchor="middle"
          dominantBaseline="central"
          fill={palette.text}
          fontWeight="900"
          fontSize={sizeMap.fontSize}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {number}
        </text>
      </svg>
    </div>
  );
};
