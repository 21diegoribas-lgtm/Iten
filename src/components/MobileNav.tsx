import React from 'react';
import { LayoutDashboard, Award, BookOpen, Sparkles, Wrench, ClipboardCheck, Inbox } from 'lucide-react';
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
      id: 'online_tests' as MainTabType,
      label: 'Kiểm tra',
      icon: ClipboardCheck,
    },
    {
      id: 'requests' as MainTabType,
      label: 'Yêu cầu',
      icon: Inbox,
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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 overflow-x-auto bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] pb-[calc(env(safe-area-inset-bottom,0px)+0.4rem)] pt-1.5 px-2"
    >
      <div className="flex min-w-max sm:min-w-0 sm:grid sm:grid-cols-7 w-full max-w-2xl mx-auto items-center gap-1">
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
              className={`relative flex min-w-[4.75rem] sm:min-w-0 flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'text-blue-700 font-black bg-blue-50'
                  : 'text-slate-500 hover:text-slate-800 font-bold'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-transform ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 scale-105'
                    : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="text-[10px] leading-4 tracking-tight mt-0.5 whitespace-nowrap text-center">
                {tab.label}
              </span>
              {isActive && <span className="absolute -bottom-1 h-1 w-6 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
