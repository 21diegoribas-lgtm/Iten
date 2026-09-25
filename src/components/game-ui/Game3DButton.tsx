import React from 'react';
import { soundFx } from '../../utils/sound';

export interface Game3DButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'orange' | 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'wood' | 'cream';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  children: React.ReactNode;
  shadowDepth?: number;
  playSound?: boolean;
}

export const Game3DButton: React.FC<Game3DButtonProps> = ({
  variant = 'orange',
  size = 'md',
  icon,
  children,
  className = '',
  onClick,
  disabled,
  playSound = true,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'orange':
        return 'bg-gradient-to-b from-[#FFA726] to-[#F57C00] text-white border-2 border-[#FFE082] shadow-[0_5px_0_#BF360C] hover:brightness-105 active:shadow-[0_1px_0_#BF360C]';
      case 'green':
        return 'bg-gradient-to-b from-[#66BB6A] to-[#388E3C] text-white border-2 border-[#C8E6C9] shadow-[0_5px_0_#1B5E20] hover:brightness-105 active:shadow-[0_1px_0_#1B5E20]';
      case 'blue':
        return 'bg-gradient-to-b from-[#42A5F5] to-[#1976D2] text-white border-2 border-[#BBDEFB] shadow-[0_5px_0_#0D47A1] hover:brightness-105 active:shadow-[0_1px_0_#0D47A1]';
      case 'yellow':
        return 'bg-gradient-to-b from-[#FFEE58] to-[#FBC02D] text-[#5D4037] font-black border-2 border-[#FFFDE7] shadow-[0_5px_0_#F57F17] hover:brightness-105 active:shadow-[0_1px_0_#F57F17]';
      case 'red':
        return 'bg-gradient-to-b from-[#EF5350] to-[#D32F2F] text-white border-2 border-[#FFCDD2] shadow-[0_5px_0_#B71C1C] hover:brightness-105 active:shadow-[0_1px_0_#B71C1C]';
      case 'purple':
        return 'bg-gradient-to-b from-[#AB47BC] to-[#7B1FA2] text-white border-2 border-[#E1BEE7] shadow-[0_5px_0_#4A148C] hover:brightness-105 active:shadow-[0_1px_0_#4A148C]';
      case 'wood':
        return 'bg-gradient-to-b from-[#8D6E63] to-[#5D4037] text-[#FFF8E1] border-2 border-[#D7CCC8] shadow-[0_5px_0_#3E2723] hover:brightness-105 active:shadow-[0_1px_0_#3E2723]';
      case 'cream':
      default:
        return 'bg-gradient-to-b from-[#FFFFFF] to-[#FFF9C4] text-[#795548] border-2 border-[#FFF59D] shadow-[0_4px_0_#FFE082] hover:brightness-105 active:shadow-[0_1px_0_#FFE082]';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs rounded-xl font-bold gap-1.5';
      case 'lg':
        return 'px-6 py-3 text-base rounded-2xl font-black gap-2.5';
      case 'xl':
        return 'px-8 py-4 text-lg rounded-3xl font-black gap-3';
      case 'md':
      default:
        return 'px-4 py-2.5 text-sm rounded-2xl font-extrabold gap-2';
    }
  };

  return (
    <button
      onClick={(e) => {
        if (!disabled && playSound) {
          soundFx.playClick();
        }
        if (onClick) onClick(e);
      }}
      disabled={disabled}
      className={`inline-flex items-center justify-center select-none transition-all duration-100 transform active:translate-y-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="tracking-wide drop-shadow-xs">{children}</span>
    </button>
  );
};
