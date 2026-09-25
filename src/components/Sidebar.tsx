import React from 'react';
import { LayoutDashboard, Award, BookOpen, Sparkles, Wrench, Trophy, Star, Shield } from 'lucide-react';
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
      emoji: '🏰',
      icon: LayoutDashboard,
      activeBg: 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white border-2 border-[#BAE6FD] shadow-[0_5px_0_#0369A1]',
      hoverBg: 'hover:bg-sky-50 text-slate-700 bg-white/80 border border-sky-100 shadow-[0_2px_0_#BAE6FD]'
    },
    {
      id: 'training_competition' as MainTabType,
      label: 'Điểm rèn luyện',
      emoji: '🛡️',
      icon: Award,
      activeBg: 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white border-2 border-[#BBF7D0] shadow-[0_5px_0_#14532D]',
      hoverBg: 'hover:bg-emerald-50 text-slate-700 bg-white/80 border border-emerald-100 shadow-[0_2px_0_#A7F3D0]'
    },
    {
      id: 'learning_competition' as MainTabType,
      label: 'Điểm học tập',
      emoji: '📚',
      icon: BookOpen,
      activeBg: 'bg-gradient-to-b from-[#FBBF24] to-[#D97706] text-white border-2 border-[#FEF3C7] shadow-[0_5px_0_#92400E]',
      hoverBg: 'hover:bg-amber-50 text-slate-700 bg-white/80 border border-amber-100 shadow-[0_2px_0_#FDE68A]'
    },
    {
      id: 'activities' as MainTabType,
      label: 'Hoạt động',
      emoji: '🎮',
      icon: Sparkles,
      activeBg: 'bg-gradient-to-b from-[#FB923C] to-[#EA580C] text-white border-2 border-[#FFEDD5] shadow-[0_5px_0_#9A3412]',
      hoverBg: 'hover:bg-orange-50 text-slate-700 bg-white/80 border border-orange-100 shadow-[0_2px_0_#FED7AA]'
    },
    {
      id: 'utilities' as MainTabType,
      label: 'Tiện ích',
      emoji: '🧰',
      icon: Wrench,
      activeBg: 'bg-gradient-to-b from-[#C084FC] to-[#9333EA] text-white border-2 border-[#F3E8FF] shadow-[0_5px_0_#6B21A8]',
      hoverBg: 'hover:bg-purple-50 text-slate-700 bg-white/80 border border-purple-100 shadow-[0_2px_0_#E9D5FF]'
    }
  ];

  return (
    <aside className="w-72 bg-gradient-to-b from-[#E0F2FE]/90 via-[#F0F9FF] to-[#FEF3C7]/60 border-r-4 border-[#BAE6FD] p-4 flex flex-col shrink-0 min-h-[calc(100vh-4.5rem)] shadow-lg select-none">
      {/* Top User Chibi Profile Badge */}
      {currentUser && (
        <div className="mb-5 p-3.5 rounded-3xl bg-white/95 border-2 border-[#BAE6FD] shadow-[0_4px_0_#7DD3FC] flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onOpenAvatarSelection) {
                soundFx.playClick();
                onOpenAvatarSelection();
              }
            }}
            className="relative w-13 h-13 rounded-2xl overflow-hidden bg-sky-100 border-2 border-sky-300 shadow-sm shrink-0 hover:scale-105 transition-transform cursor-pointer group"
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
            <div className="text-[10px] font-black text-[#0284C7] uppercase tracking-wider flex items-center gap-1">
              <span>Xin chào,</span>
              <span className="text-amber-500">✨</span>
            </div>
            <div className="text-sm font-black text-slate-800 truncate">
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

      {/* 5 Main Navigation Tabs with 3D Cartoon Chunky Buttons */}
      <nav className="space-y-2.5 flex-1">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                soundFx.playClick();
                onTabChange(t.id);
              }}
              className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all duration-100 transform active:translate-y-1 cursor-pointer select-none ${
                isActive ? t.activeBg : t.hoverBg
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform ${
                  isActive
                    ? 'bg-white/20 shadow-inner rotate-3'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span>{t.emoji}</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className={`font-black text-sm tracking-wide ${isActive ? 'text-white drop-shadow-xs' : 'text-slate-800'}`}>
                  {t.label}
                </div>
              </div>

              {isActive && (
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0 mr-1" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mascot Card at bottom */}
      <div className="mt-4 p-3.5 rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FFFBEB] to-[#E0F2FE] border-2 border-[#FDE68A] text-center relative overflow-hidden shadow-[0_4px_0_#FCD34D]">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-xl">🦊</span>
          <span className="text-xs font-black text-amber-900">ITEN Mascot</span>
        </div>
        <p className="text-[11px] font-bold text-amber-800 leading-snug">
          "Cùng rèn luyện & khám phá kiến thức mỗi ngày nhé!"
        </p>
      </div>
    </aside>
  );
};

