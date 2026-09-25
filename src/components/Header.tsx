import React, { useState } from 'react';
import { User, NotificationItem } from '../types';
import { Bell, Volume2, VolumeX, LogOut, ShieldCheck, UserCheck, GraduationCap, UserPlus, Sparkles, UserCircle } from 'lucide-react';
import { soundFx, getSoundEnabled, setSoundEnabled } from '../utils/sound';
import { getAvatarUrl } from '../utils/avatarHelper';

interface HeaderProps {
  currentUser: User;
  notifications: NotificationItem[];
  onLogout: () => void;
  onReadNotification: (id: string) => void;
  onOpenAvatarSelection?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  notifications,
  onLogout,
  onReadNotification,
  onOpenAvatarSelection
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [soundOn, setSoundOn] = useState(getSoundEnabled());

  const unreadCount = notifications.filter(
    (n) =>
      !n.isRead &&
      (n.targetRole === 'all' ||
        n.targetRole === currentUser.role ||
        n.targetClassId === currentUser.classId)
  ).length;

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    soundFx.playClick();
  };

  const roleBadge = () => {
    switch (currentUser.role) {
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-b from-[#E0F2FE] to-[#BAE6FD] text-[#0369A1] border border-white lg:border-2 shadow-[0_2px_0_#7DD3FC] lg:shadow-[0_3px_0_#7DD3FC] shrink-0">
            <GraduationCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden md:inline">Học sinh {currentUser.position ? `(${currentUser.position})` : ''}</span>
            <span className="md:hidden truncate max-w-12">{currentUser.className || 'HS'}</span>
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-b from-[#D1FAE5] to-[#A7F3D0] text-[#065F46] border border-white lg:border-2 shadow-[0_2px_0_#6EE7B7] lg:shadow-[0_3px_0_#6EE7B7] shrink-0">
            <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden md:inline">Giáo viên ({currentUser.subject || 'Chủ nhiệm'})</span>
            <span className="md:hidden">GV</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black bg-gradient-to-b from-[#FEF3C7] to-[#FDE68A] text-[#92400E] border border-white lg:border-2 shadow-[0_2px_0_#FCD34D] lg:shadow-[0_3px_0_#FCD34D] shrink-0">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden md:inline">Quản trị viên</span>
            <span className="md:hidden">AD</span>
          </span>
        );
    }
  };

  return (
    <header className="h-14 sm:h-16 lg:h-20 bg-gradient-to-r from-white/95 via-[#F0F9FF]/95 to-white/95 backdrop-blur-md border-b-2 lg:border-b-4 border-[#BAE6FD] px-2.5 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_4px_16px_rgba(14,165,233,0.08)] select-none min-w-0">
      <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 min-w-0 shrink">
        <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-gradient-to-br from-[#38BDF8] via-[#0284C7] to-[#0369A1] border lg:border-2 border-[#BAE6FD] flex items-center justify-center text-white shadow-[0_2px_0_#075985] lg:shadow-[0_4px_0_#075985] text-base sm:text-xl lg:text-2xl font-black transform hover:rotate-6 hover:scale-105 transition-all shrink-0">
          🏫
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-xl font-black text-[#0284C7] drop-shadow-[0_1px_0_#FFFFFF] tracking-tight flex items-center gap-1 sm:gap-1.5 flex-nowrap min-w-0">
            <span className="text-base sm:text-lg lg:text-2xl shrink-0">ITEN</span>
            <span className="hidden md:inline text-slate-400 font-bold">-</span>
            <span className="hidden md:inline text-[#EA580C] truncate">A friendly home for teachers and students</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black border border-amber-300 shrink-0">
              v2.5
            </span>
          </h1>
          <p className="hidden md:flex text-xs text-slate-500 font-extrabold items-center gap-1">
            <span>✨</span> Thế giới học tập & thi đua rèn luyện
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
        {/* Current authenticated role */}
        <div className="flex items-center">{roleBadge()}</div>

        {/* Circular Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border lg:border-2 transition-all cursor-pointer shadow-[0_2px_0_rgba(0,0,0,0.15)] lg:shadow-[0_3px_0_rgba(0,0,0,0.15)] active:translate-y-0.5 shrink-0 ${
            soundOn
              ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white border-white'
              : 'bg-slate-100 text-slate-400 border-slate-300'
          }`}
          title={soundOn ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />}
        </button>

        {/* Circular Notification Bell */}
        <div className="static sm:relative">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-b from-[#FDE047] to-[#F59E0B] text-[#78350F] border lg:border-2 border-white shadow-[0_2px_0_#B45309] lg:shadow-[0_3px_0_#B45309] flex items-center justify-center cursor-pointer hover:brightness-105 active:translate-y-0.5 relative shrink-0"
            title="Thông báo"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-rose-500 text-white rounded-full text-[8px] sm:text-[10px] font-black flex items-center justify-center border lg:border-2 border-white animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-full mt-2 sm:mt-3 w-[calc(100vw-24px)] max-w-96 sm:w-96 bg-white rounded-3xl shadow-2xl border-4 border-[#BAE6FD] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-gradient-to-r from-[#0284C7] to-[#0369A1] p-3 sm:p-4 text-white flex items-center justify-between gap-2 border-b-2 border-[#7DD3FC]">
                <h3 className="font-black flex items-center gap-2 text-xs sm:text-sm min-w-0 flex-1">
                  <span className="shrink-0">🔔</span>
                  <span className="truncate">Thông báo hệ thống ({notifications.length})</span>
                </h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-white/90 hover:text-white text-xs font-black px-2 py-1 bg-white/20 rounded-lg cursor-pointer shrink-0"
                >
                  Đóng
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    Chưa có thông báo nào.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isForUser =
                      n.targetRole === 'all' ||
                      n.targetRole === currentUser.role ||
                      n.targetClassId === currentUser.classId;
                    if (!isForUser && currentUser.role !== 'admin') return null;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          soundFx.playClick();
                          onReadNotification(n.id);
                        }}
                        className={`p-3 sm:p-4 hover:bg-sky-50/50 transition-colors cursor-pointer ${
                          !n.isRead ? 'bg-sky-50/40' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-black text-slate-800 text-xs sm:text-sm min-w-0 flex-1 break-words">
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-2 font-medium">
                          {n.content}
                        </p>
                        <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] text-slate-400 font-bold">
                          <span className="min-w-0 flex-1 break-words">
                            {n.senderName} ({n.senderRole})
                          </span>
                          <span className="shrink-0 whitespace-nowrap">{n.createdAt}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Chibi Avatar & Logout */}
        <div className="relative flex items-center gap-1.5 sm:gap-2 lg:gap-3 pl-1 sm:pl-2 lg:pl-3 border-l border-[#BAE6FD] shrink-0">
          <button
            onClick={() => {
              soundFx.playClick();
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="relative focus:outline-none transition-transform transform hover:scale-105 active:scale-95 cursor-pointer block shrink-0"
            title="Hồ sơ tài khoản & Đổi avatar"
          >
            <img
              src={getAvatarUrl(currentUser)}
              alt={currentUser.fullName}
              className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl object-cover border lg:border-2 border-[#38BDF8] shadow-xs sm:shadow-sm bg-sky-50"
            />
            {onOpenAvatarSelection && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white shadow-xs">
                <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3" />
              </div>
            )}
          </button>

          {/* Desktop User Info */}
          <div className="hidden md:block text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black text-slate-800 line-clamp-1">{currentUser.fullName}</p>
              {onOpenAvatarSelection && (
                <button
                  onClick={onOpenAvatarSelection}
                  className="text-[10px] font-extrabold text-amber-700 bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded-md border border-amber-300 transition-colors cursor-pointer"
                >
                  Đổi avatar
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 font-bold">{currentUser.school}</p>
          </div>

          {/* Standalone Desktop Logout Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onLogout();
            }}
            className="hidden lg:flex w-10 h-10 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 shadow-[0_2px_0_#FECDD3] items-center justify-center transition-all cursor-pointer ml-1 active:translate-y-0.5 shrink-0"
            title="Đăng xuất / Đổi tài khoản"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile & Profile Popover Menu (Houses Logout on mobile) */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-64 bg-white rounded-3xl shadow-2xl border-4 border-[#BAE6FD] overflow-hidden z-50 p-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-sky-100">
                <img
                  src={getAvatarUrl(currentUser)}
                  alt={currentUser.fullName}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-[#38BDF8] bg-sky-50 shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-black text-slate-800 truncate">{currentUser.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-bold truncate">{currentUser.school}</p>
                  <span className="inline-block text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5 border border-amber-200">
                    {currentUser.role === 'student' ? `Học sinh ${currentUser.className || ''}` : currentUser.role === 'teacher' ? 'Giáo viên' : 'Quản trị viên'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 mt-2.5">
                {onOpenAvatarSelection && (
                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setShowUserMenu(false);
                      onOpenAvatarSelection();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284C7] font-bold text-xs flex items-center justify-center gap-1.5 border border-sky-200 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Đổi avatar nhân vật Chibi
                  </button>
                )}
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
