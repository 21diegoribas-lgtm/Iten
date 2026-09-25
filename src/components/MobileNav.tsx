import React from 'react';
import { LayoutDashboard, Award, BookOpen, Sparkles, Wrench } from 'lucide-react';
import { MainTabType } from '../types';
import { soundFx } from '../utils/sound';

interface MobileNavProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'dashboard' as MainTabType,
      label: 'Trang chủ',
      icon: LayoutDashboard,
    },
    {
      id: 'training_competition' as MainTabType,
      label: 'Rèn luyện',
      icon: Award,
    },
    {
      id: 'learning_competition' as MainTabType,
      label: 'Học tập',
      icon: BookOpen,
    },
    {
      id: 'activities' as MainTabType,
      label: 'Hoạt động',
      icon: Sparkles,
    },
    {
      id: 'utilities' as MainTabType,
      label: 'Tiện ích',
      icon: Wrench,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Điều hướng chính di động"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t-2 border-[#BAE6FD] shadow-[0_-4px_16px_rgba(14,165,233,0.1)] pb-[calc(env(safe-area-inset-bottom,0px)+0.35rem)] pt-1.5 px-1"
    >
      <div className="grid grid-cols-5 w-full max-w-lg mx-auto items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`mobile-nav-${tab.id}`}
              type="button"
              onClick={() => {
                soundFx.playClick();
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all cursor-pointer select-none min-w-0 ${
                isActive
                  ? 'text-[#EA580C] font-black'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-transform ${
                  isActive
                    ? 'bg-amber-100 text-[#EA580C] scale-110 shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] leading-tight tracking-tight mt-0.5 truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
