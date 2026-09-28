import React from 'react';
import { LayoutDashboard, Award, BookOpen, Sparkles, Wrench, ClipboardCheck, Inbox } from 'lucide-react';
import { soundFx } from '../utils/sound';
import { MainTabType, User } from '../types';
import { getAvatarUrl } from '../utils/avatarHelper';

interface SidebarProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  currentUser?: User;
  onOpenAvatarSelection?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, currentUser, onOpenAvatarSelection }) => {
  const tabs = [
    {
      id: 'dashboard' as MainTabType,
      label: 'Trang chủ',
      icon: LayoutDashboard,
    },
    {
      id: 'training_competition' as MainTabType,
      label: 'Điểm rèn luyện',
      icon: Award,
    },
    {
      id: 'learning_competition' as MainTabType,
      label: 'Điểm học tập',
      icon: BookOpen,
    },
    {
      id: 'activities' as MainTabType,
      label: 'Hoạt động',
      icon: Sparkles,
    },
    {
      id: 'online_tests' as MainTabType,
      label: 'Kiểm tra online',
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
    }
  ];

  return (
    <aside className="w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800 p-4 flex flex-col shrink-0 min-h-[calc(100vh-4.5rem)] shadow-[12px_0_35px_rgba(15,23,42,0.12)] select-none">
      {/* Top User Chibi Profile Badge */}
      {currentUser && (
        <div className="mb-5 p-3.5 rounded-2xl bg-white/8 border border-white/10 shadow-lg flex items-center gap-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => {
              if (onOpenAvatarSelection) {
                soundFx.playClick();
                onOpenAvatarSelection();
              }
            }}
            className="relative w-13 h-13 rounded-2xl overflow-hidden bg-blue-50 border border-blue-200 shadow-sm shrink-0 hover:scale-[1.03] transition-transform cursor-pointer group"
            title="Đổi Avatar Chibi"
          >
            <img
              src={getAvatarUrl(currentUser)}
              alt={currentUser.fullName}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black">
              ✏️ Đổi
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black text-blue-300 uppercase tracking-wider flex items-center gap-1">
              <span>Xin chào,</span>
              <span className="text-amber-500">✨</span>
            </div>
            <div className="text-sm font-black text-white truncate">
              {currentUser.fullName}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                {currentUser.role === 'teacher'
                  ? 'Giáo viên 🎓'
                  : currentUser.role === 'admin'
                  ? 'Admin 👑'
                  : `${currentUser.className || '8A1'} ⭐`}
              </span>
              {onOpenAvatarSelection && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onOpenAvatarSelection();
                  }}
                  className="px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 hover:bg-sky-200 text-[10px] font-extrabold border border-sky-300 transition-colors"
                >
                  🎭 Đổi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="space-y-1.5 flex-1" aria-label="Điều hướng chính">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                soundFx.playClick();
                onTabChange(t.id);
              }}
              className={`relative w-full min-h-12 text-left px-3 py-2.5 rounded-xl flex items-center gap-3 border transition-all duration-200 active:scale-[0.99] cursor-pointer select-none ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-400/60 shadow-lg shadow-blue-950/30'
                  : 'bg-transparent text-slate-300 border-transparent hover:bg-white/8 hover:text-white'
              }`}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-600" />}
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'bg-white/8 text-slate-300'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm tracking-normal leading-5 whitespace-nowrap">
                  {t.label}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mascot Card at bottom */}
      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-amber-400/15 to-blue-400/15 border border-white/10 text-center relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl">🦊</span>
          <span className="text-xs font-black text-amber-200">ITEN Mascot</span>
        </div>
        <p className="text-[11px] font-bold text-slate-300 leading-snug">
          "Cùng rèn luyện & khám phá kiến thức mỗi ngày nhé!"
        </p>
      </div>
    </aside>
  );
};
