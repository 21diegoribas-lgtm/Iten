import React from 'react';
import { RacingTeam, VehicleConfig } from '../../../types';
import { RaceVehicleSvg } from './RaceVehicleSvg';

interface RacingTrackArenaProps {
  teams: RacingTeam[];
  vehicles: VehicleConfig[];
  trackLength: number;
  activeTeamIdx?: number;
  isMoving?: boolean;
  movingTeamIdx?: number | null;
  winnerTeam?: RacingTeam | null;
  reactionState?: 'idle' | 'racing' | 'correct' | 'wrong' | 'boost' | 'victory';
  onSelectTeamHistory?: (teamName: string) => void;
}

export const RacingTrackArena: React.FC<RacingTrackArenaProps> = ({
  teams,
  vehicles,
  trackLength = 1000,
  activeTeamIdx,
  isMoving = false,
  movingTeamIdx = null,
  winnerTeam = null,
  reactionState = 'idle',
  onSelectTeamHistory
}) => {
  return (
    <div className="relative w-full rounded-[28px] sm:rounded-[36px] overflow-hidden border-4 border-[#F59E0B] shadow-[0_20px_50px_rgba(217,119,6,0.35)] bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] to-[#BAE6FD] select-none">
      {/* 1. SKY & DISTANT MOUNTAIN HORIZON */}
      <div className="relative w-full h-[100px] sm:h-[130px] overflow-hidden">
        {/* Sun & Golden Rays */}
        <div className="absolute top-2 left-10 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-200 blur-[1px] shadow-[0_0_40px_#FDE047]">
          <div className="absolute inset-0 rounded-full bg-white/40 animate-pulse" />
        </div>

        {/* Drifting Cartoon Clouds */}
        <div className="absolute top-3 left-1/4 flex items-center opacity-85 animate-pulse">
          <div className="w-14 h-8 bg-white rounded-full shadow-sm" />
          <div className="w-10 h-10 bg-white rounded-full -ml-4 -mt-2 shadow-sm" />
          <div className="w-16 h-8 bg-white rounded-full -ml-4 shadow-sm" />
        </div>
        <div className="absolute top-6 right-1/4 flex items-center opacity-75 hidden sm:flex">
          <div className="w-20 h-9 bg-white rounded-full shadow-sm" />
          <div className="w-12 h-12 bg-white rounded-full -ml-6 -mt-3 shadow-sm" />
          <div className="w-16 h-9 bg-white rounded-full -ml-4 shadow-sm" />
        </div>

        {/* Hot Air Balloon floating */}
        <div className="absolute top-2 right-12 flex flex-col items-center opacity-85 animate-bounce-subtle">
          <div className="w-8 h-10 rounded-full bg-gradient-to-b from-rose-500 via-amber-400 to-sky-400 border border-white shadow-md flex items-center justify-center">
            <span className="text-[7px] font-black text-white">ITEN</span>
          </div>
          <div className="w-3 h-2.5 bg-amber-800 rounded-sm -mt-0.5 border border-amber-950" />
        </div>

        {/* SVG Mountains & Rolling Hills */}
        <svg
          viewBox="0 0 1000 130"
          className="absolute bottom-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skyMount1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="skyMount2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <linearGradient id="greenHills" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
          </defs>

          {/* Distant Mountain Silhouettes */}
          <polygon points="0,130 140,45 280,130" fill="url(#skyMount1)" opacity="0.6" />
          <polygon points="220,130 380,30 540,130" fill="url(#skyMount2)" opacity="0.7" />
          <polygon points="480,130 650,40 820,130" fill="url(#skyMount1)" opacity="0.5" />
          <polygon points="760,130 900,25 1000,130" fill="url(#skyMount2)" opacity="0.6" />

          {/* Midground Rolling Hills */}
          <path d="M0 80 Q250 40 500 75 T1000 65 L1000 130 L0 130 Z" fill="url(#greenHills)" />

          {/* Cute Pine & Apple Trees on Hills */}
          <g>
            <circle cx="80" cy="65" r="14" fill="#15803D" />
            <circle cx="95" cy="70" r="12" fill="#16A34A" />
            <circle cx="240" cy="60" r="16" fill="#15803D" />
            <circle cx="235" cy="56" r="3" fill="#EF4444" />
            <circle cx="245" cy="62" r="3" fill="#EF4444" />
            <circle cx="580" cy="70" r="15" fill="#16A34A" />
            <circle cx="780" cy="55" r="18" fill="#15803D" />
            <circle cx="920" cy="65" r="14" fill="#16A34A" />
          </g>

          {/* Cartoon Windmill */}
          <g transform="translate(420, 40)">
            <polygon points="12,40 18,15 26,15 32,40" fill="#FEF3C7" stroke="#78350F" strokeWidth="1.5" />
            <circle cx="22" cy="16" r="3" fill="#78350F" />
            <line x1="8" y1="16" x2="36" y2="16" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
            <line x1="22" y1="2" x2="22" y2="30" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>

        {/* White Farm Picket Fence */}
        <div className="absolute bottom-0 left-0 right-0 h-4 flex justify-around opacity-90 pointer-events-none">
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="w-2.5 h-4 bg-white rounded-t-sm border border-slate-300 shadow-2xs" />
          ))}
        </div>
      </div>

      {/* 2. RACING TRACK ARENA (MAIN MULTI-LANE ASPHALT STAGE) */}
      <div className="relative bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] p-3 sm:p-5 border-y-4 border-[#F59E0B] shadow-inner space-y-3.5 sm:space-y-4">
        {/* Top Kerb (Red & White Racing Curb) */}
        <div className="w-full h-3 rounded-full overflow-hidden border border-slate-700 shadow-md flex">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-red-500' : 'bg-white'}`} />
          ))}
        </div>

        {/* Track Milestones Header (Start, 25%, 50% Checkpoint, 75%, Finish) */}
        <div className="relative h-6 w-full flex items-center text-[10px] sm:text-xs font-black text-amber-300 px-2 sm:px-4">
          <div className="absolute left-2 flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-amber-500/50">
            <span>🟢</span> 0m (XUẤT PHÁT)
          </div>

          <div className="absolute left-1/4 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 hidden sm:flex">
            <span>🚩</span> {Math.round(trackLength * 0.25)}m
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full shadow-md border border-amber-300 animate-pulse">
            <span>⛩️</span> CHECKPOINT ({Math.round(trackLength * 0.5)}m)
          </div>

          <div className="absolute left-3/4 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 hidden sm:flex">
            <span>🚩</span> {Math.round(trackLength * 0.75)}m
          </div>

          <div className="absolute right-2 flex items-center gap-1 bg-gradient-to-r from-red-600 to-rose-600 text-white px-2.5 py-0.5 rounded-full shadow-lg border border-red-300 font-black">
            <span>🏁</span> ĐÍCH ({trackLength}m)
          </div>
        </div>

        {/* Interactive Track Obstacles positioned on the course */}
        <div className="relative w-full h-0 pointer-events-none z-15">
          {/* Obstacle 1: Fallen Tree Log with cute mushrooms at 28% */}
          <div className="absolute left-[28%] -top-3 flex flex-col items-center opacity-85">
            <div className="w-12 h-3.5 bg-amber-900 rounded-full border border-amber-950 shadow-md flex items-center justify-around px-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 -mt-2 shadow-xs" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 -mt-1.5 shadow-xs" />
            </div>
            <span className="text-[8px] font-black text-amber-200/80 uppercase">🪵 Khúc gỗ</span>
          </div>

          {/* Obstacle 2: Golden Magic Crystal Rock at 52% */}
          <div className="absolute left-[52%] -top-4 flex flex-col items-center">
            <div className="w-6 h-6 rotate-45 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border-2 border-yellow-100 rounded-md shadow-[0_0_12px_#FACC15] animate-pulse" />
            <span className="text-[8px] font-black text-yellow-300 mt-1 uppercase">✨ Đá Vàng</span>
          </div>

          {/* Obstacle 3: Traffic Safety Barrier at 72% */}
          <div className="absolute left-[72%] -top-3 flex flex-col items-center opacity-90">
            <div className="w-7 h-4 bg-orange-600 rounded-t-sm border border-white flex flex-col justify-between py-0.5">
              <div className="w-full h-1 bg-white" />
            </div>
            <span className="text-[8px] font-black text-orange-300 uppercase">🚧 Rào chắn</span>
          </div>
        </div>

        {/* 50% CHECKPOINT GATE (Grand Wooden Arch) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-10 bottom-8 w-8 z-10 pointer-events-none flex flex-col items-center justify-between opacity-70">
          <div className="w-12 h-3 bg-amber-800 rounded-sm border border-amber-950 shadow-md text-[7px] text-amber-200 font-black text-center">
            GATE
          </div>
          <div className="w-1.5 h-full bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 rounded-full border border-amber-900" />
        </div>

        {/* FINISH LINE CHECKERED ARCH */}
        <div className="absolute right-6 top-8 bottom-6 w-8 z-20 pointer-events-none flex flex-col items-center justify-between">
          <div className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-black text-white text-[9px] font-black rounded-md border border-white shadow-lg animate-bounce">
            FINISH
          </div>
          <div className="w-5 h-full flex flex-col justify-between overflow-hidden rounded-sm border-2 border-white shadow-xl opacity-90">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className={`w-full h-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-black'}`} />
            ))}
          </div>
        </div>

        {/* MULTI-LANE TRACKS (ONE LANE PER RACING TEAM) */}
        <div className="space-y-3 relative z-10">
          {teams.map((team, idx) => {
            const isCurrentTurn = activeTeamIdx !== undefined && idx === activeTeamIdx;
            const isTeamMoving = isMoving && (movingTeamIdx === null || movingTeamIdx === idx);
            const currentVehicleConfig =
              vehicles.find(v => v.id === team.vehicleId) ||
              vehicles[0] ||
              { id: 'v3', name: 'Xe đạp', icon: '🚲', distance: 100, color: team.color };

            const progressPct = Math.min(100, (team.currentDistance / (trackLength || 1000)) * 100);
            // Calculate track offset: Start at 0% (left) to max 84% (right before finish line)
            const trackOffset = Math.min(84, Math.max(1, progressPct * 0.83));
            const isWinner = winnerTeam?.id === team.id;

            return (
              <div
                key={team.id}
                className={`relative rounded-2xl p-2.5 sm:p-3 border-2 transition-all duration-300 ${
                  isCurrentTurn
                    ? 'bg-slate-900/90 border-[#F59E0B] shadow-[0_0_24px_rgba(245,158,11,0.35)] ring-2 ring-amber-400/40'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                {/* Lane Info Header */}
                <div className="flex items-center justify-between text-xs text-white font-extrabold mb-1.5 px-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                      style={{ backgroundColor: team.color }}
                    />
                    <button
                      type="button"
                      onClick={() => onSelectTeamHistory?.(team.name)}
                      className="font-black text-slate-100 text-xs sm:text-sm tracking-wide hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 group"
                      title={`Bấm để xem lịch sử câu hỏi của ${team.name}`}
                    >
                      <span>{team.name}</span>
                      <span className="text-[10px] text-amber-400 opacity-80 group-hover:opacity-100 group-hover:underline">
                        (📜 Xem câu hỏi)
                      </span>
                    </button>
                    {isCurrentTurn && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-black animate-pulse shadow-sm">
                        ⚡ ĐANG THI ĐẤU
                      </span>
                    )}
                    {isWinner && (
                      <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-yellow-950 text-[10px] font-black animate-bounce shadow-md">
                        🏆 VỀ ĐÍCH ĐẦU TIÊN!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectTeamHistory && (
                      <button
                        type="button"
                        onClick={() => onSelectTeamHistory(team.name)}
                        className="px-2 py-0.5 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-400/50 text-[10px] font-bold transition-all cursor-pointer hidden sm:flex items-center gap-1"
                      >
                        <span>📜 Câu hỏi đã trả lời</span>
                      </button>
                    )}
                    <span className="text-[11px] font-bold text-slate-400 hidden md:inline">
                      Phương tiện: <strong className="text-amber-300">{currentVehicleConfig.name}</strong>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 text-xs font-black">
                      {team.currentDistance}m / {trackLength}m ({Math.round(progressPct)}%)
                    </span>
                  </div>
                </div>

                {/* Asphalt Lane Track Surface */}
                <div className="relative h-20 sm:h-24 bg-[#0A0F1D] rounded-xl border border-slate-750 overflow-hidden flex items-center px-2 shadow-inner">
                  {/* Dashed White Center Lane Lines */}
                  <div className="absolute inset-0 flex items-center justify-between px-6 opacity-30 pointer-events-none">
                    {Array.from({ length: 14 }).map((_, lineIdx) => (
                      <div key={lineIdx} className="w-8 h-1.5 bg-white rounded-full" />
                    ))}
                  </div>

                  {/* Gradient Progress Fill (Team Color Trail) */}
                  <div
                    className="absolute left-0 top-0 bottom-0 opacity-20 transition-all duration-700 rounded-l-xl"
                    style={{
                      width: `${progressPct}%`,
                      backgroundColor: team.color
                    }}
                  />

                  {/* 2D/2.5D Animated Illustrated Racing Vehicle */}
                  <div
                    className="absolute transition-all duration-700 ease-out z-20 flex items-center"
                    style={{ left: `${trackOffset}%` }}
                  >
                    <RaceVehicleSvg
                      vehicleId={team.vehicleId}
                      vehicleName={currentVehicleConfig.name}
                      teamColor={team.color}
                      teamName={team.name}
                      isMoving={isTeamMoving || isCurrentTurn}
                      isCurrentTurn={isCurrentTurn}
                      isWinner={isWinner}
                      reaction={
                        isWinner
                          ? 'victory'
                          : isCurrentTurn
                          ? reactionState
                          : 'idle'
                      }
                      size="md"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Kerb (Red & White Racing Curb) */}
        <div className="w-full h-3 rounded-full overflow-hidden border border-slate-700 shadow-md flex">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-white' : 'bg-red-500'}`} />
          ))}
        </div>
      </div>

      {/* 3. FOREGROUND LAWN & WILDFLOWERS */}
      <div className="relative h-8 sm:h-10 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 flex items-center justify-around px-6 overflow-hidden">
        {Array.from({ length: 16 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-1.5 opacity-85">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-xs" />
            <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-xs" />
          </div>
        ))}
      </div>
    </div>
  );
};
