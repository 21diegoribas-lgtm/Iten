import React, { useState } from 'react';
import {
  User,
  PersonalStorageItem
} from '../../types';
import { soundFx } from '../../utils/sound';
import { DiceTableScene } from '../game-ui/DiceTableScene';
import { FishingPondScene } from '../game-ui/FishingPondScene';
import { LotteryScene } from '../game-ui/lottery/LotteryScene';
import { TeacherStopwatchTimer } from '../game-ui/TeacherStopwatchTimer';
import { ResourceRepository } from '../resources/ResourceRepository';
import { Dice5, Ticket, FolderArchive, Plus, Edit3, Trash2, Sparkles, RotateCw, Trophy, Fish, Timer, FolderHeart } from 'lucide-react';

interface UtilitiesTabProps {
  currentUser: User;
  students: User[];
  storageItems: PersonalStorageItem[];
  onAddStorageItem: (item: PersonalStorageItem) => void;
  onDeleteStorageItem: (id: string) => void;
  onAwardPoints?: (student: User, points: number, reason: string) => void;
  onSelectStudent?: (student: User) => void;
}

export const UtilitiesTab: React.FC<UtilitiesTabProps> = ({
  currentUser,
  students,
  storageItems,
  onAddStorageItem,
  onDeleteStorageItem,
  onAwardPoints,
  onSelectStudent
}) => {
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const [subUtility, setSubUtility] = useState<'resources' | 'timer' | 'fishing' | 'lottery' | 'dice' | 'storage'>(
    isTeacherOrAdmin ? 'resources' : 'timer'
  );

  // Storage form state
  const [storageTitle, setStorageTitle] = useState('');
  const [storageType, setStorageType] = useState<'table' | 'blank'>('blank');
  const [blankText, setBlankText] = useState('');

  const handleSaveStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageTitle) return;
    soundFx.playSuccess();
    onAddStorageItem({
      id: 'st_' + Date.now(),
      userId: currentUser.id,
      title: storageTitle,
      type: storageType,
      blankContent: blankText,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    setStorageTitle('');
    setBlankText('');
    alert('Đã lưu trữ thông tin thành công!');
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border-4 border-amber-300">
        <div className="absolute right-4 -bottom-6 text-9xl opacity-20 select-none">🛠️</div>
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full bg-white/25 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            ✨ Công cụ hỗ trợ giảng dạy & học tập
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 mb-1">
            Tiện ích & Bàn Game ITEN
          </h2>
          <p className="text-sm font-medium text-white/95 max-w-2xl">
            Sử dụng Đồng hồ bấm giờ & Đếm ngược, Ao Cá May Mắn, Bàn Xúc Xắc 2.5D, Lồng Quay Xổ Số và Kho lưu trữ cá nhân tiện lợi.
          </p>
        </div>
      </div>

      {/* Utilities Navigation */}
      <div className="flex flex-wrap gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl border-2 border-amber-200 shadow-sm">
        {isTeacherOrAdmin && (
          <button
            onClick={() => { soundFx.playClick(); setSubUtility('resources'); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              subUtility === 'resources'
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-[0_3px_0_#C2410C]'
                : 'bg-slate-50 text-slate-700 hover:bg-amber-50'
            }`}
          >
            <FolderHeart className="w-4 h-4 text-amber-300" /> 📚 Kho tài nguyên & Bài giảng
          </button>
        )}
        <button
          onClick={() => { soundFx.playClick(); setSubUtility('timer'); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            subUtility === 'timer'
              ? 'bg-[#F59E0B] text-amber-950 shadow-[0_3px_0_#D97706]'
              : 'bg-slate-50 text-slate-700 hover:bg-amber-50'
          }`}
        >
          <Timer className="w-4 h-4" /> ⏱️ Đồng hồ bấm giờ & Đếm ngược
        </button>
        <button
          onClick={() => { soundFx.playClick(); setSubUtility('fishing'); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            subUtility === 'fishing'
              ? 'bg-[#0284C7] text-white shadow-[0_3px_0_#0369A1]'
              : 'bg-slate-50 text-slate-700 hover:bg-sky-50'
          }`}
        >
          <Fish className="w-4 h-4" /> 🎣 Ao cá may mắn
        </button>
        <button
          onClick={() => { soundFx.playClick(); setSubUtility('dice'); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            subUtility === 'dice'
              ? 'bg-[#EA580C] text-white shadow-[0_3px_0_#9A3412]'
              : 'bg-slate-50 text-slate-700 hover:bg-orange-50'
          }`}
        >
          <Dice5 className="w-4 h-4" /> 🎲 Bàn Xúc xắc (Dice)
        </button>
        <button
          onClick={() => { soundFx.playClick(); setSubUtility('lottery'); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            subUtility === 'lottery'
              ? 'bg-[#E11D48] text-white shadow-[0_3px_0_#9F1239]'
              : 'bg-slate-50 text-slate-700 hover:bg-rose-50'
          }`}
        >
          <Ticket className="w-4 h-4" /> 🎰 Lồng quay xổ số
        </button>
        <button
          onClick={() => { soundFx.playClick(); setSubUtility('storage'); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
            subUtility === 'storage'
              ? 'bg-[#16A34A] text-white shadow-[0_3px_0_#15803D]'
              : 'bg-slate-50 text-slate-700 hover:bg-emerald-50'
          }`}
        >
          <FolderArchive className="w-4 h-4" /> 🗄️ Kho lưu trữ cá nhân
        </button>
      </div>

      {/* 0. KHO TÀI NGUYÊN & BÀI GIẢNG ITEN (TEACHER & ADMIN ONLY) */}
      {subUtility === 'resources' && isTeacherOrAdmin && (
        <ResourceRepository currentUser={currentUser} />
      )}

      {/* 0. ĐỒNG HỒ BẤM GIỜ & ĐẾM NGƯỢC (TEACHER STOPWATCH & TIMER) */}
      {subUtility === 'timer' && (
        <TeacherStopwatchTimer
          currentUser={currentUser}
          students={students}
        />
      )}

      {/* 1. AO CÁ MAY MẮN (GAME SCENE) */}
      {subUtility === 'fishing' && (
        <FishingPondScene
          currentUser={currentUser}
          students={students}
          onAwardPoints={onAwardPoints}
          onSelectStudent={onSelectStudent}
        />
      )}

      {/* 2. BÀN XÚC XẮC 2.5D (GAME SCENE) */}
      {subUtility === 'dice' && (
        <DiceTableScene />
      )}

      {/* 3. LỒNG QUAY XỔ SỐ HỌC SINH (2D/2.5D GAME SCENE) */}
      {subUtility === 'lottery' && (
        <LotteryScene
          currentUser={currentUser}
          students={students}
          onAwardPoints={onAwardPoints}
          onSelectStudent={onSelectStudent}
        />
      )}

      {/* 5.3 - KHO LƯU TRỮ CỦA TÔI */}
      {subUtility === 'storage' && (
        <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>📁</span> Kho lưu trữ của tôi ({storageItems.length})
          </h3>

          <form onSubmit={handleSaveStorage} className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Thêm mới nội dung lưu trữ</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên tiêu đề</label>
                <input
                  type="text"
                  value={storageTitle}
                  onChange={e => setStorageTitle(e.target.value)}
                  placeholder="Tiêu đề lưu trữ..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hình thức</label>
                <select
                  value={storageType}
                  onChange={e => setStorageType(e.target.value as any)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="blank">Dạng trang trống (Ghi chú)</option>
                  <option value="table">Dạng bảng (Table)</option>
                </select>
              </div>
            </div>

            {storageType === 'blank' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung ghi chú</label>
                <textarea
                  rows={4}
                  value={blankText}
                  onChange={e => setBlankText(e.target.value)}
                  placeholder="Nhập nội dung cần lưu trữ..."
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  required
                ></textarea>
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Lưu trữ ngay
            </button>
          </form>

          {/* Saved storage items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storageItems.map(item => (
              <div key={item.id} className="p-5 rounded-3xl bg-amber-50/40 border border-amber-100 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                  <button
                    onClick={() => { soundFx.playClick(); onDeleteStorageItem(item.id); }}
                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-line">{item.blankContent || '(Dạng bảng dữ liệu)'}</p>
                <div className="text-[10px] text-slate-400">Cập nhật: {item.updatedAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
