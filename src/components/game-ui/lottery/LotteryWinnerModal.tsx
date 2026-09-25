import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { LotteryBallSvg } from './LotteryBallSvg';
import { Game3DButton } from '../Game3DButton';
import { soundFx } from '../../../utils/sound';
import {
  Trophy,
  Sparkles,
  Award,
  Star,
  RotateCcw,
  CheckCircle2,
  UserCheck,
  Send,
  Plus
} from 'lucide-react';

interface LotteryWinnerModalProps {
  winner: User | null;
  ballNumber: number;
  colorIndex: number;
  onClose: () => void;
  onSpinNext: () => void;
  onAwardPoints?: (student: User, points: number, reason: string) => void;
  onSelectStudent?: (student: User) => void;
  language?: 'vi' | 'en';
}

export const LotteryWinnerModal: React.FC<LotteryWinnerModalProps> = ({
  winner,
  ballNumber,
  colorIndex,
  onClose,
  onSpinNext,
  onAwardPoints,
  onSelectStudent,
  language = 'vi'
}) => {
  // Reveal animation steps: 'fly_in' -> 'burst' -> 'full_reveal'
  const [animStage, setAnimStage] = useState<'fly_in' | 'burst' | 'full_reveal'>('fly_in');
  const [awardedPoints, setAwardedPoints] = useState<number | null>(null);
  const [customReason, setCustomReason] = useState<string>('Trúng thưởng Lồng quay xổ số may mắn');

  useEffect(() => {
    // Step 1: Fly in ball (0 -> 600ms)
    const t1 = setTimeout(() => {
      setAnimStage('burst');
      soundFx.playBonus();
    }, 600);

    // Step 2: Full celebration reveal (600ms -> 1100ms)
    const t2 = setTimeout(() => {
      setAnimStage('full_reveal');
      soundFx.playSuccess();
    }, 1100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleGivePoints = (pts: number) => {
    if (!onAwardPoints || !winner) return;
    soundFx.playCoin();
    onAwardPoints(winner, pts, customReason);
    setAwardedPoints(pts);
  };

  const t = {
    vi: {
      congratsBadge: '🎟️ KẾT QUẢ XỔ SỐ MAY MẮN',
      title: winner ? 'CHÚC MỪNG HỌC SINH MAY MẮN!' : 'CHÚC MỪNG QUẢ BÓNG MAY MẮN!',
      subtitle: `Quả bóng may mắn số #${ballNumber} đã được chọn từ lồng quay!`,
      studentInfo: 'THÔNG TIN HỌC SINH ĐƯỢC CHỌN',
      class: 'Lớp:',
      team: 'Tổ/Nhóm:',
      awardTitle: '⭐ Thưởng điểm trực tiếp cho học sinh:',
      awardedToast: 'Đã cộng thành công điểm thi đua!',
      spinNextBtn: '🎟️ QUAY LƯỢT TIẾP THEO (NEXT SPIN)',
      viewProfileBtn: '👤 Xem hồ sơ chi tiết',
      points: 'điểm'
    },
    en: {
      congratsBadge: '🎟️ LUCKY LOTTERY RESULT',
      title: winner ? 'CONGRATULATIONS WINNER!' : 'LUCKY NUMBER DRAWN!',
      subtitle: `Lucky ball #${ballNumber} was picked from the lottery cage!`,
      studentInfo: 'SELECTED STUDENT DETAILS',
      class: 'Class:',
      team: 'Team:',
      awardTitle: '⭐ Award merit points directly:',
      awardedToast: 'Merit points successfully recorded!',
      spinNextBtn: '🎟️ SPIN NEXT ROUND',
      viewProfileBtn: '👤 View Profile',
      points: 'pts'
    }
  }[language];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none">
      {/* Floating Sparkles & Confetti Background Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => {
          const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FBBF24'];
          const randomColor = colors[i % colors.length];
          const left = (i * 4.2) % 100;
          const delay = (i * 0.15) % 2;
          const duration = 2.5 + (i % 3);

          return (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-xs animate-bounce"
              style={{
                backgroundColor: randomColor,
                left: `${left}%`,
                top: `${(i * 7) % 90}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                transform: `rotate(${i * 35}deg)`
              }}
            />
          );
        })}
      </div>

      {/* Main Reveal Container */}
      <div className="relative bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] rounded-[36px] max-w-lg w-full p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-4 border-[#F59E0B] text-center space-y-5 my-6 animate-in zoom-in-95 duration-300">
        {/* Stage 1 & 2: Ball Zooming and Star Burst */}
        {animStage !== 'full_reveal' ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              {/* Radial Starburst Glow */}
              <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-tr from-amber-400/50 via-yellow-300/40 to-transparent blur-xl animate-pulse" />

              {/* Big Flying Ball */}
              <div
                className={`transition-all duration-500 transform ${
                  animStage === 'fly_in'
                    ? 'scale-75 translate-y-12 rotate-45'
                    : 'scale-125 translate-y-0 rotate-0 ring-8 ring-yellow-400/80 shadow-[0_0_50px_#FACC15]'
                }`}
              >
                <LotteryBallSvg
                  number={ballNumber}
                  colorIndex={colorIndex}
                  size="xl"
                  isHighlighted
                />
              </div>
            </div>

            <div className="text-amber-300 font-black text-lg tracking-wider animate-pulse">
              ✨ ĐANG KHÁM PHÁ QUẢ BÓNG MAY MẮN... ✨
            </div>
          </div>
        ) : (
          /* Stage 3: Full Winner Presentation */
          <div className="space-y-5 animate-in fade-in zoom-in-90 duration-300">
            {/* Top Celebration Badge & Trophy */}
            <div className="relative flex flex-col items-center">
              {/* Giant Crown & Trophy */}
              <div className="relative flex items-center justify-center -mt-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-4xl shadow-[0_0_30px_#FACC15] border-3 border-white animate-bounce">
                  🏆
                </div>
                <Sparkles className="absolute -top-2 -right-3 w-7 h-7 text-yellow-300 animate-spin" />
                <Sparkles className="absolute -bottom-1 -left-3 w-6 h-6 text-amber-300 animate-pulse" />
              </div>

              <span className="mt-3 px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>{t.congratsBadge}</span>
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-wide drop-shadow-md">
                {t.title}
              </h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto mt-0.5">
                {t.subtitle}
              </p>
            </div>

            {/* Winner Student Profile Card */}
            {winner ? (
              <div className="relative bg-gradient-to-b from-white/10 via-amber-500/10 to-white/5 rounded-3xl p-4 sm:p-5 border-2 border-amber-300/60 shadow-inner backdrop-blur-md flex flex-col sm:flex-row items-center gap-4 text-left">
                {/* Lucky Ball Badge on Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={winner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={winner.fullName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-4 ring-white/30"
                  />
                  {/* Floating mini lottery ball */}
                  <div className="absolute -bottom-2 -right-2">
                    <LotteryBallSvg
                      number={ballNumber}
                      colorIndex={colorIndex}
                      size="sm"
                      isHighlighted
                    />
                  </div>
                </div>

                {/* Student details */}
                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase">
                    <span>★</span> BÓNG SỐ {ballNumber}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                    {winner.fullName}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-bold text-slate-300">
                    <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
                      {t.class} <strong className="text-amber-300">{winner.className || 'Chung'}</strong>
                    </span>
                    <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
                      {t.team} <strong className="text-orange-300">{winner.team || 'Tổ 1'}</strong>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-gradient-to-b from-white/10 via-amber-500/10 to-white/5 rounded-3xl p-6 border-2 border-amber-300/60 shadow-inner backdrop-blur-md flex flex-col items-center gap-3">
                <LotteryBallSvg
                  number={ballNumber}
                  colorIndex={colorIndex}
                  size="lg"
                  isHighlighted
                />
                <div className="text-center space-y-1">
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black">
                    QUẢ BÓNG MAY MẮN SỐ #{ballNumber}
                  </span>
                  <p className="text-xs text-slate-300 font-bold">
                    Số bốc thăm may mắn trúng thưởng trong lượt quay này!
                  </p>
                </div>
              </div>
            )}

            {/* Quick Merit Point Awarding (If teacher/admin callback provided and winner exists) */}
            {onAwardPoints && winner && (
              <div className="bg-amber-950/40 rounded-2xl p-3 border border-amber-400/40 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-black text-amber-300">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    {t.awardTitle}
                  </span>
                  {awardedPoints && (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> +{awardedPoints} {t.points}!
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 5, 10].map(pts => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => handleGivePoints(pts)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                        awardedPoints === pts
                          ? 'bg-emerald-500 text-white border-emerald-300 shadow-md ring-2 ring-emerald-200'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-amber-300 shadow-xs'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{pts} {t.points}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Game3DButton
                variant="orange"
                size="lg"
                onClick={onSpinNext}
                className="w-full"
                icon={<RotateCcw className="w-4 h-4" />}
              >
                {t.spinNextBtn}
              </Game3DButton>

              <div className="flex items-center justify-center gap-3">
                {onSelectStudent && winner && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectStudent(winner);
                      onClose();
                    }}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer py-1"
                  >
                    {t.viewProfileBtn}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer py-1"
                >
                  Đóng lại
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
