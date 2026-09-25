import React from 'react';
import { RacingTeam, RacingGameConfig } from '../../../types';
import { RaceVehicleSvg } from './RaceVehicleSvg';
import { Game3DButton } from '../Game3DButton';
import { Trophy, RotateCcw, Medal, Sparkles, Award } from 'lucide-react';

interface RaceCelebrationPodiumProps {
  winner: RacingTeam | null;
  teams: RacingTeam[];
  config: RacingGameConfig;
  onRestart: () => void;
  language?: 'vi' | 'en';
  isTimeUp?: boolean;
  onViewTeamHistory?: (teamName: string) => void;
}

export const RaceCelebrationPodium: React.FC<RaceCelebrationPodiumProps> = ({
  winner,
  teams,
  config,
  onRestart,
  language = 'vi',
  isTimeUp = false,
  onViewTeamHistory
}) => {
  // Sort teams by distance descending
  const sortedTeams = [...teams].sort((a, b) => b.currentDistance - a.currentDistance);
  const first = sortedTeams[0];
  const second = sortedTeams[1];
  const third = sortedTeams[2];

  const t = {
    vi: {
      victoryTitle: isTimeUp ? 'HẾT GIỜ ĐƯỜNG ĐUA!' : 'CHIẾN THẮNG XUẤT SẮC!',
      subtitle: isTimeUp
        ? `Đã hết thời gian thi đấu (${config.timeMinutes || 5} phút). Dưới đây là bảng xếp hạng chặng đua:`
        : `Chúc mừng ${winner?.name || first?.name} đã cán đích xuất sắc ${config.trackLength} mét!`,
      pointsAwarded: `⭐ Đã cộng điểm ${
        (config.category || 'Thi đua học tập') === 'Thi đua học tập'
          ? 'Thi đua học tập'
          : 'Thi đua rèn luyện'
      } cho toàn đội!`,
      rankings: 'BẢNG XẾP HẠNG CUỘC ĐUA',
      restartBtn: 'BẮT ĐẦU CHẶNG ĐUA MỚI 🏁'
    },
    en: {
      victoryTitle: isTimeUp ? "TIME'S UP!" : 'CHAMPION OF THE TRACK!',
      subtitle: isTimeUp
        ? `Race time limit reached (${config.timeMinutes || 5} mins). Here are the final team standings:`
        : `Congratulations to ${winner?.name || first?.name} for conquering the ${config.trackLength}m race!`,
      pointsAwarded: `⭐ Points awarded to the team's records!`,
      rankings: 'FINAL RACE STANDINGS',
      restartBtn: 'START NEW RACE 🏁'
    }
  }[language];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] rounded-[36px] max-w-2xl w-full p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-4 border-[#F59E0B] text-center space-y-6 animate-in zoom-in-95 duration-300 select-none my-8">
        {/* Floating Trophy & Stars */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center text-5xl shadow-[0_0_35px_#FACC15] animate-bounce">
            🏆
          </div>
          <Sparkles className="absolute -top-2 right-1/3 w-8 h-8 text-amber-300 animate-spin" />
          <Sparkles className="absolute -bottom-1 left-1/3 w-6 h-6 text-yellow-200 animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider">
            {isTimeUp ? '🏁 KẾT QUẢ THI ĐẤU' : '🏆 QUÁN QUÂN ĐƯỜNG ĐUA'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            {t.victoryTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        {/* 3D CARTOON PODIUM (2nd, 1st, 3rd) */}
        <div className="pt-4 pb-2 flex items-end justify-center gap-2 sm:gap-4 max-w-md mx-auto h-56">
          {/* 2nd Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <RaceVehicleSvg
                vehicleId={second.vehicleId}
                teamColor={second.color}
                teamName={second.name}
                size="sm"
                reaction="victory"
              />
              <button
                type="button"
                onClick={() => onViewTeamHistory?.(second.name)}
                className="w-full h-24 bg-gradient-to-t from-slate-400 to-slate-200 rounded-t-2xl border-t-4 border-slate-300 flex flex-col items-center justify-center shadow-lg text-slate-900 font-black cursor-pointer hover:brightness-110 transition-all group"
                title={`Xem câu hỏi đã trả lời của ${second.name}`}
              >
                <span className="text-xl">🥈</span>
                <span className="text-xs">{second.name}</span>
                <span className="text-[10px] font-bold text-slate-700">{second.currentDistance}m</span>
                <span className="text-[9px] text-indigo-700 underline opacity-90 mt-0.5">📜 Xem câu hỏi</span>
              </button>
            </div>
          )}

          {/* 1st Place (Champion) */}
          {first && (
            <div className="flex-1 flex flex-col items-center">
              <div className="text-2xl animate-bounce">👑</div>
              <RaceVehicleSvg
                vehicleId={first.vehicleId}
                teamColor={first.color}
                teamName={first.name}
                size="md"
                reaction="victory"
              />
              <button
                type="button"
                onClick={() => onViewTeamHistory?.(first.name)}
                className="w-full h-32 bg-gradient-to-t from-amber-500 via-yellow-400 to-amber-300 rounded-t-2xl border-t-4 border-yellow-200 flex flex-col items-center justify-center shadow-2xl text-amber-950 font-black cursor-pointer hover:brightness-110 transition-all group"
                title={`Xem câu hỏi đã trả lời của ${first.name}`}
              >
                <span className="text-3xl">🥇</span>
                <span className="text-sm uppercase tracking-wider">{first.name}</span>
                <span className="text-xs font-black text-amber-900">{first.currentDistance}m</span>
                <span className="text-[10px] text-amber-950 underline font-black mt-1">📜 Xem câu hỏi đã trả lời</span>
              </button>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <RaceVehicleSvg
                vehicleId={third.vehicleId}
                teamColor={third.color}
                teamName={third.name}
                size="sm"
                reaction="victory"
              />
              <button
                type="button"
                onClick={() => onViewTeamHistory?.(third.name)}
                className="w-full h-18 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-2xl border-t-4 border-amber-500 flex flex-col items-center justify-center shadow-md text-amber-100 font-black cursor-pointer hover:brightness-110 transition-all group"
                title={`Xem câu hỏi đã trả lời của ${third.name}`}
              >
                <span className="text-xl">🥉</span>
                <span className="text-xs">{third.name}</span>
                <span className="text-[10px] font-bold text-amber-200">{third.currentDistance}m</span>
                <span className="text-[9px] text-amber-200 underline opacity-90 mt-0.5">📜 Xem câu hỏi</span>
              </button>
            </div>
          )}
        </div>

        {/* Awarded points banner */}
        <div className="p-3.5 bg-amber-400/20 rounded-2xl border border-amber-400/40 text-amber-300 text-xs font-extrabold max-w-lg mx-auto">
          {t.pointsAwarded}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Game3DButton
            variant="orange"
            size="lg"
            onClick={onRestart}
            className="w-full max-w-md mx-auto"
            icon={<RotateCcw className="w-4 h-4" />}
          >
            {t.restartBtn}
          </Game3DButton>
        </div>
      </div>
    </div>
  );
};
