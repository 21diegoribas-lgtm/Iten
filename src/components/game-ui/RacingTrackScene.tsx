import React from 'react';
import { RacingGameConfig, User } from '../../types';
import { soundFx } from '../../utils/sound';
import { Game3DButton } from './Game3DButton';
import { Trophy, Flag, Star, Sparkles, Check, X, RotateCcw, Volume2, HelpCircle } from 'lucide-react';

interface RacingPlayerState {
  id: string;
  name: string;
  avatar: string;
  position: number; // 0 to maxSteps
  vehicle: 'car_red' | 'bike_blue' | 'bicycle_green' | 'scooter_yellow';
  color: string;
  score: number;
}

interface RacingTrackSceneProps {
  config: RacingGameConfig;
  players: RacingPlayerState[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  onSelectAnswer: (ans: string) => void;
  onConfirmAnswer: () => void;
  isAnswerSubmitted: boolean;
  isAnswerCorrect: boolean | null;
  currentTurnPlayer: RacingPlayerState;
  gameFinished: boolean;
  winner: RacingPlayerState | null;
  onRestartGame: () => void;
  onOpenSettings?: () => void;
  isTeacherOrAdmin?: boolean;
}

export const RacingTrackScene: React.FC<RacingTrackSceneProps> = ({
  config,
  players,
  currentQuestionIndex,
  selectedAnswer,
  onSelectAnswer,
  onConfirmAnswer,
  isAnswerSubmitted,
  isAnswerCorrect,
  currentTurnPlayer,
  gameFinished,
  winner,
  onRestartGame,
  onOpenSettings,
  isTeacherOrAdmin
}) => {
  const currentQ = config.questions[currentQuestionIndex] || config.questions[0];
  const maxSteps = config.totalSteps || 20;

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden border-4 border-[#38BDF8] shadow-[0_16px_36px_rgba(14,165,233,0.25)] bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] to-[#BAE6FD] select-none">
      {/* Top Header inside Racing World (Matching Image 1) */}
      <div className="relative z-30 flex items-center justify-between p-4 sm:p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-4xl font-black text-[#EA580C] drop-shadow-[0_3px_0_#FFF7ED] tracking-wide flex items-center gap-2">
              <span>🏎️</span> ĐƯỜNG ĐUA TRI THỨC
            </h1>
            <span className="text-xs sm:text-sm font-extrabold text-[#0369A1]">
              Trả lời đúng để xe tăng tốc về đích nào!
            </span>
          </div>
        </div>

        {/* Lap Badge (Matching Image 1 Center Top) */}
        <div className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white font-black text-sm border-2 border-[#FEF3C7] shadow-[0_4px_0_#92400E]">
          <Flag className="w-4 h-4 text-white" />
          <span>Vòng {Math.min(currentQuestionIndex + 1, config.questions.length)} / {config.questions.length}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isTeacherOrAdmin && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-3 py-2 rounded-full bg-white/90 text-slate-700 font-bold text-xs shadow-[0_3px_0_#CBD5E1] border border-slate-200 cursor-pointer hover:bg-white"
            >
              ⚙️ Cài đặt
            </button>
          )}
          <Game3DButton variant="yellow" size="sm" onClick={onRestartGame} icon={<RotateCcw className="w-3.5 h-3.5" />}>
            Chơi lại
          </Game3DButton>
        </div>
      </div>

      {/* Main Track Illustration Canvas (Matching Image 1 Middle Section) */}
      <div className="relative w-full h-[320px] sm:h-[380px] overflow-hidden">
        {/* Sky Background & Rolling Mountain Landscapes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="mountGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
            <linearGradient id="greenHillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
            <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>

          {/* Distant Mountains */}
          <polygon points="0,220 180,90 350,220" fill="url(#mountGrad)" opacity="0.6" />
          <polygon points="280,220 480,70 680,220" fill="url(#mountGrad)" opacity="0.7" />
          <polygon points="600,220 800,100 1000,220" fill="url(#mountGrad)" opacity="0.5" />

          {/* Green Hills in mid-ground */}
          <path d="M0 240 Q250 170 500 230 T1000 210 L1000 400 L0 400 Z" fill="url(#greenHillGrad)" />

          {/* Trees on the Hills */}
          <g>
            <circle cx="120" cy="180" r="16" fill="#15803D" />
            <rect x="117" y="196" width="6" height="12" fill="#78350F" />
            <circle cx="280" cy="190" r="18" fill="#16A34A" />
            <rect x="277" y="208" width="6" height="12" fill="#78350F" />
            <circle cx="750" cy="175" r="20" fill="#15803D" />
            <rect x="747" y="195" width="6" height="12" fill="#78350F" />
            <circle cx="910" cy="185" r="15" fill="#16A34A" />
            <rect x="907" y="200" width="6" height="12" fill="#78350F" />
          </g>

          {/* 4 Lanes Road (Spanning horizontally across track) */}
          <g transform="translate(0, 220)">
            {/* Main Road Surface */}
            <rect x="0" y="0" width="1000" height="180" fill="url(#roadGrad)" stroke="#1E293B" strokeWidth="3" />
            {/* Kerb borders top & bottom (Red & White Racing Kerbs) */}
            <pattern id="kerbPattern" width="40" height="10" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="20" height="10" fill="#EF4444" />
              <rect x="20" y="0" width="20" height="10" fill="#FFFFFF" />
            </pattern>
            <rect x="0" y="0" width="1000" height="8" fill="url(#kerbPattern)" />
            <rect x="0" y="172" width="1000" height="8" fill="url(#kerbPattern)" />

            {/* Lane Dividers (Dashed White Lines) */}
            <line x1="0" y1="45" x2="1000" y2="45" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="20,15" opacity="0.6" />
            <line x1="0" y1="90" x2="1000" y2="90" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="20,15" opacity="0.6" />
            <line x1="0" y1="135" x2="1000" y2="135" stroke="#FFFFFF" strokeWidth="2.5" strokeDasharray="20,15" opacity="0.6" />

            {/* START LINE (Left Banner) */}
            <g transform="translate(45, 0)">
              <rect x="0" y="0" width="16" height="180" fill="#FFFFFF" opacity="0.8" />
              <line x1="8" y1="0" x2="8" y2="180" stroke="#000000" strokeWidth="2" strokeDasharray="8,8" />
            </g>

            {/* FINISH LINE (Right Checkered Banner) */}
            <g transform="translate(930, 0)">
              <pattern id="checkeredFinish" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="8" height="8" fill="#000000" />
                <rect x="8" y="0" width="8" height="8" fill="#FFFFFF" />
                <rect x="0" y="8" width="8" height="8" fill="#FFFFFF" />
                <rect x="8" y="8" width="8" height="8" fill="#000000" />
              </pattern>
              <rect x="0" y="0" width="24" height="180" fill="url(#checkeredFinish)" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          </g>
        </svg>

        {/* START BANNER FLAG "XUẤT PHÁT" (Matching Image 1) */}
        <div className="absolute top-44 left-2 sm:left-4 z-20 flex flex-col items-center">
          <div className="px-3 py-1 rounded-lg bg-[#DC2626] text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#991B1B] border border-[#FCA5A5] flex items-center gap-1">
            <span>🚩</span> XUẤT PHÁT
          </div>
          <div className="w-1.5 h-16 bg-[#78350F]" />
        </div>

        {/* FINISH BANNER "VỀ ĐÍCH" (Matching Image 1) */}
        <div className="absolute top-44 right-2 sm:right-4 z-20 flex flex-col items-center">
          <div className="px-3 py-1 rounded-lg bg-[#16A34A] text-white font-black text-[11px] sm:text-xs shadow-[0_3px_0_#14532D] border border-[#86EFAC] flex items-center gap-1">
            <span>🏁</span> VỀ ĐÍCH
          </div>
          <div className="w-1.5 h-16 bg-[#78350F]" />
        </div>

        {/* RACING PLAYERS & VEHICLES ON THE 4 TRACK LANES */}
        <div className="absolute inset-x-0 bottom-3 top-56 z-20 pointer-events-none">
          {players.map((p, laneIndex) => {
            // calculate x position percentage (from 8% to 88%)
            const percent = 8 + (Math.min(p.position, maxSteps) / maxSteps) * 80;
            const laneTop = laneIndex * 38; // 4 lanes

            return (
              <div
                key={p.id}
                style={{
                  left: `${percent}%`,
                  top: `${laneTop}px`,
                  transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                className="absolute -translate-x-1/2 flex items-center gap-2 group"
              >
                {/* Vehicle SVG based on type */}
                <div className="relative">
                  {p.vehicle === 'car_red' && (
                    <div className="w-14 h-9 sm:w-16 sm:h-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                      <svg viewBox="0 0 80 50" className="w-full h-full">
                        {/* Red Sports Car */}
                        <path d="M10 32 L20 20 L50 20 L68 28 L74 38 L8 38 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
                        <rect x="25" y="22" width="22" height="10" rx="2" fill="#E0F2FE" />
                        {/* Yellow racing stripe */}
                        <rect x="12" y="32" width="58" height="4" fill="#FBBF24" />
                        {/* Wheels */}
                        <circle cx="24" cy="38" r="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                        <circle cx="24" cy="38" r="3" fill="#F8FAFC" />
                        <circle cx="58" cy="38" r="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                        <circle cx="58" cy="38" r="3" fill="#F8FAFC" />
                        {/* Exhaust smoke */}
                        <circle cx="2" cy="36" r="3" fill="#E2E8F0" opacity="0.8" className="animate-ping" />
                      </svg>
                    </div>
                  )}

                  {p.vehicle === 'bike_blue' && (
                    <div className="w-13 h-9 sm:w-15 sm:h-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                      <svg viewBox="0 0 80 50" className="w-full h-full">
                        {/* Blue Motorcycle */}
                        <path d="M18 36 L30 22 L52 24 L62 36 Z" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
                        <circle cx="20" cy="36" r="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                        <circle cx="20" cy="36" r="3" fill="#F8FAFC" />
                        <circle cx="58" cy="36" r="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                        <circle cx="58" cy="36" r="3" fill="#F8FAFC" />
                        <circle cx="38" cy="18" r="6" fill="#F472B6" /> {/* Pink helmet rider */}
                      </svg>
                    </div>
                  )}

                  {p.vehicle === 'bicycle_green' && (
                    <div className="w-13 h-9 sm:w-15 sm:h-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                      <svg viewBox="0 0 80 50" className="w-full h-full">
                        {/* Green Bicycle */}
                        <circle cx="20" cy="36" r="8" fill="none" stroke="#15803D" strokeWidth="3" />
                        <circle cx="58" cy="36" r="8" fill="none" stroke="#15803D" strokeWidth="3" />
                        <line x1="20" y1="36" x2="38" y2="28" stroke="#16A34A" strokeWidth="2.5" />
                        <line x1="58" y1="36" x2="48" y2="22" stroke="#16A34A" strokeWidth="2.5" />
                        <line x1="38" y1="28" x2="48" y2="22" stroke="#16A34A" strokeWidth="2.5" />
                        <circle cx="42" cy="16" r="6" fill="#22C55E" /> {/* Green helmet */}
                      </svg>
                    </div>
                  )}

                  {p.vehicle === 'scooter_yellow' && (
                    <div className="w-13 h-9 sm:w-15 sm:h-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]">
                      <svg viewBox="0 0 80 50" className="w-full h-full">
                        {/* Yellow Scooter */}
                        <path d="M16 36 L24 24 L50 26 L64 36 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
                        <circle cx="20" cy="36" r="7" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                        <circle cx="58" cy="36" r="7" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                        <circle cx="38" cy="16" r="6" fill="#FBBF24" />
                      </svg>
                    </div>
                  )}

                  {/* Player Name & Steps Tooltip Pill (Matching Image 1) */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-0.5 rounded-full bg-white/95 text-slate-800 text-[10px] font-black shadow-[0_2px_4px_rgba(0,0,0,0.15)] border border-slate-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span>{p.name.split(' ').slice(-1)[0]}</span>
                    <span className="text-[#EA580C]">({p.position} bước)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUESTION INTERACTION PANEL (Bottom Half matching Image 1) */}
      <div className="relative z-30 p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t-4 border-[#38BDF8]">
        {gameFinished ? (
          /* WINNER PODIUM CELEBRATION */
          <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
            <div className="inline-flex p-4 rounded-full bg-amber-100 text-amber-500 shadow-inner">
              <Trophy className="w-16 h-16 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#EA580C]">
                🏆 CHÚC MỪNG {winner?.name || 'HỌC SINH XUẤT SẮC'} ĐÃ VỀ ĐÍCH!
              </h2>
              <p className="text-sm font-bold text-slate-600 mt-1">
                Hoàn thành xuất sắc đường đua tri thức với số điểm cao nhất!
              </p>
            </div>
            <div className="pt-2">
              <Game3DButton variant="orange" size="xl" onClick={onRestartGame} icon={<RotateCcw className="w-5 h-5" />}>
                CHƠI VÒNG ĐUA MỚI 🏁
              </Game3DButton>
            </div>
          </div>
        ) : (
          /* ACTIVE QUESTION & 4 3D ANSWER OPTIONS */
          <div className="space-y-4 max-w-3xl mx-auto">
            {/* Active Racer Turn Notification */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#0284C7] text-white font-black text-xs uppercase tracking-wider">
                  Lượt chơi của:
                </span>
                <span className="font-black text-slate-800 text-sm sm:text-base">
                  {currentTurnPlayer.name}
                </span>
              </div>
              <div className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                ⭐ Thưởng: +{currentQ?.points || 2} bước tăng tốc
              </div>
            </div>

            {/* Question Text in Wooden Board or Glossy Card */}
            <div className="bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] p-4 sm:p-5 rounded-2xl border-2 border-[#FDE68A] shadow-sm">
              <div className="text-xs font-black text-[#B45309] uppercase tracking-wider mb-1">
                Câu hỏi {currentQuestionIndex + 1}:
              </div>
              <div className="text-base sm:text-lg font-black text-[#78350F]">
                {currentQ?.question || 'Câu hỏi đang được tải...'}
              </div>
            </div>

            {/* 4 3D Answer Choices (A, B, C, D) matching Image 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(currentQ?.options || ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D']).map((opt, i) => {
                const label = ['A', 'B', 'C', 'D'][i];
                const isSelected = selectedAnswer === opt;
                const isCorrect = isAnswerSubmitted && opt === currentQ.correctAnswer;
                const isWrong = isAnswerSubmitted && isSelected && !isCorrect;

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (!isAnswerSubmitted) {
                        onSelectAnswer(opt);
                        soundFx.playClick();
                      }
                    }}
                    disabled={isAnswerSubmitted}
                    className={`relative p-3.5 sm:p-4 rounded-2xl font-extrabold text-left transition-all duration-100 transform active:translate-y-1 cursor-pointer flex items-center justify-between border-2 select-none ${
                      isCorrect
                        ? 'bg-emerald-500 text-white border-emerald-300 shadow-[0_5px_0_#065F46]'
                        : isWrong
                        ? 'bg-rose-500 text-white border-rose-300 shadow-[0_5px_0_#9F1239]'
                        : isSelected
                        ? 'bg-amber-400 text-slate-900 border-amber-200 shadow-[0_5px_0_#B45309]'
                        : 'bg-white text-slate-800 border-slate-200 shadow-[0_5px_0_#CBD5E1] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {label}
                      </span>
                      <span className="text-sm font-black">{opt}</span>
                    </div>

                    {isCorrect && <Check className="w-5 h-5 text-white" />}
                    {isWrong && <X className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback & Confirm / Next Button (Matching Image 1) */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {!isAnswerSubmitted ? (
                <Game3DButton
                  variant="orange"
                  size="lg"
                  disabled={!selectedAnswer}
                  onClick={onConfirmAnswer}
                >
                  XÁC NHẬN CÂU TRẢ LỜI 🎯
                </Game3DButton>
              ) : (
                <div className="flex items-center gap-3 w-full justify-between flex-wrap">
                  <div
                    className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 ${
                      isAnswerCorrect
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {isAnswerCorrect ? (
                      <>
                        <span>🎉</span>
                        <span>CHÍNH XÁC! XE ĐÃ TIẾN LÊN +{currentQ?.points || 2} BƯỚC</span>
                      </>
                    ) : (
                      <>
                        <span>⚠️</span>
                        <span>CHƯA ĐÚNG! ĐÁP ÁN: {currentQ?.correctAnswer}</span>
                      </>
                    )}
                  </div>

                  <Game3DButton
                    variant="green"
                    size="lg"
                    onClick={onConfirmAnswer}
                  >
                    TIẾP TỤC ĐUA 🏁
                  </Game3DButton>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
