import React from 'react';
import { RacingQuestion, RacingTeam } from '../../../types';
import { Game3DButton } from '../Game3DButton';
import { Sparkles, CheckCircle2, XCircle, Send, Users, UserCheck, CheckSquare, Square } from 'lucide-react';

interface RaceQuestionOverlayProps {
  question: RacingQuestion;
  questionIndex: number;
  totalQuestions: number;
  activeTeam: RacingTeam;
  teams: RacingTeam[];
  playMode?: 'turn_based' | 'all_teams';
  selectedOption: string | null;
  fillText: string;
  onSelectOption: (opt: string) => void;
  onChangeFillText: (text: string) => void;
  onSubmitAnswer: () => void;
  // Multi-team state for all_teams mode
  teamAnswers?: Record<string, string>;
  teamCorrectStates?: Record<string, boolean>;
  onToggleTeamCorrect?: (teamId: string) => void;
  onSetTeamAnswer?: (teamId: string, answer: string) => void;
  onSetAllTeamsCorrect?: (correct: boolean) => void;
  onSubmitAllTeamsRound?: () => void;
  feedbackState?: 'idle' | 'correct' | 'wrong';
  language?: 'vi' | 'en';
}

export const RaceQuestionOverlay: React.FC<RaceQuestionOverlayProps> = ({
  question,
  questionIndex,
  totalQuestions,
  activeTeam,
  teams,
  playMode = 'all_teams',
  selectedOption,
  fillText,
  onSelectOption,
  onChangeFillText,
  onSubmitAnswer,
  teamAnswers = {},
  teamCorrectStates = {},
  onToggleTeamCorrect,
  onSetTeamAnswer,
  onSetAllTeamsCorrect,
  onSubmitAllTeamsRound,
  feedbackState = 'idle',
  language = 'vi'
}) => {
  const isFill = question.type === 'fill';
  const isBool = question.type === 'bool';
  const isAllTeams = playMode === 'all_teams';

  const t = {
    vi: {
      checkpointChallenge: 'TRẠM THỬ THÁCH ĐƯỜNG ĐUA',
      question: 'CÂU HỎI',
      of: '/',
      teamTurn: 'Lượt thi đấu của:',
      allTeamsMode: '⚡ TẤT CẢ CÁC ĐỘI CÙNG THAM GIA',
      allTeamsDesc: 'Chọn đáp án hoặc tích chọn các đội trả lời đúng trong câu hỏi này:',
      selectAllCorrect: '✅ Tất cả các đội đều đúng',
      clearAll: '🔄 Bỏ chọn tất cả',
      fillPrompt: '✍️ Nhập câu trả lời chính xác:',
      fillPlaceholder: 'Nhập đáp án tại đây...',
      submitBtn: 'NỘP CÂU TRẢ LỜI & QUAY XE 🚀',
      submitAllBtn: 'XÁC NHẬN KẾT QUẢ & TĂNG TỐC 🚀',
      correctToast: 'CHÍNH XÁC! Tăng tốc mở vòng quay xe...',
      wrongToast: 'Chưa chính xác! Chuyển lượt sang đội kế tiếp...',
      mascotTip: 'Trả lời đúng để kích hoạt Vòng quay ngẫu nhiên phương tiện tăng tốc!',
      correctLabel: 'ĐÚNG',
      wrongLabel: 'CHƯA ĐÚNG',
      correctCountMsg: (count: number) => `Có ${count} đội trả lời đúng sẵn sàng quay xe tăng tốc!`
    },
    en: {
      checkpointChallenge: 'RACE CHECKPOINT CHALLENGE',
      question: 'QUESTION',
      of: '/',
      teamTurn: 'Active Team:',
      allTeamsMode: '⚡ ALL TEAMS COMPETING SIMULTANEOUSLY',
      allTeamsDesc: 'Select answers or mark all teams that answered correctly:',
      selectAllCorrect: '✅ Mark All Teams Correct',
      clearAll: '🔄 Clear All',
      fillPrompt: '✍️ Enter your exact answer:',
      fillPlaceholder: 'Type your answer here...',
      submitBtn: 'SUBMIT ANSWER & SPIN VEHICLE 🚀',
      submitAllBtn: 'CONFIRM RESULTS & BOOST 🚀',
      correctToast: 'CORRECT! Speeding up & opening vehicle spin...',
      wrongToast: 'Not quite! Passing turn to the next team...',
      mascotTip: 'Answer correctly to trigger the Mystery Vehicle Boost Wheel!',
      correctLabel: 'CORRECT',
      wrongLabel: 'INCORRECT',
      correctCountMsg: (count: number) => `${count} team(s) answered correctly and ready to boost!`
    }
  }[language];

  // Count correct teams in all_teams mode
  const correctTeamsCount = teams.filter(t => teamCorrectStates[t.id]).length;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-4 border-[#F59E0B] shadow-[0_16px_40px_rgba(217,119,6,0.3)] bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] p-4 sm:p-6 transition-all duration-300">
      {/* Top Banner Plaque (Wooden Racing Signboard Style) */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b-2 border-amber-300/80">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md border border-amber-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            <span>{t.checkpointChallenge}</span>
          </div>

          <span className="px-3 py-1 rounded-full bg-white text-amber-900 text-xs font-black border border-amber-200 shadow-2xs">
            🚧 CHƯỚNG NGOẠI VẬT #{questionIndex + 1} • {t.question} #{questionIndex + 1} {t.of} {totalQuestions}
          </span>
        </div>

        {/* Mode Indicator & Active Team Plaque */}
        {isAllTeams ? (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-indigo-50 border-2 border-indigo-300 text-indigo-900 shadow-xs">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-black tracking-wide">{t.allTeamsMode}</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/95 border-2 shadow-xs"
            style={{ borderColor: activeTeam?.color || '#f59e0b' }}
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-white"
              style={{ backgroundColor: activeTeam?.color || '#f59e0b' }}
            />
            <span className="text-xs font-bold text-slate-600">{t.teamTurn}</span>
            <strong className="text-xs sm:text-sm font-black" style={{ color: activeTeam?.color || '#f59e0b' }}>
              {activeTeam?.name}
            </strong>
          </div>
        )}
      </div>

      {/* Main Question Display */}
      <div className="py-4 sm:py-5">
        <div className="bg-white/90 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider">
              {question.type === 'mcq'
                ? 'Trắc nghiệm 4 lựa chọn'
                : question.type === 'bool'
                ? 'Đúng hay Sai'
                : 'Điền từ / Số'}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug">
            {question.question}
          </h3>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CASE 1: CHẾ ĐỘ TẤT CẢ CÁC ĐỘI CÙNG CHƠI (ALL TEAMS MODE)     */}
      {/* ============================================================ */}
      {isAllTeams ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs font-extrabold text-slate-700">
              {t.allTeamsDesc}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetAllTeamsCorrect && onSetAllTeamsCorrect(true)}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-black text-[11px] rounded-xl border border-emerald-300 cursor-pointer shadow-2xs transition-all flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{t.selectAllCorrect}</span>
              </button>
              <button
                type="button"
                onClick={() => onSetAllTeamsCorrect && onSetAllTeamsCorrect(false)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] rounded-xl border border-slate-300 cursor-pointer shadow-2xs transition-all flex items-center gap-1"
              >
                <Square className="w-3.5 h-3.5" />
                <span>{t.clearAll}</span>
              </button>
            </div>
          </div>

          {/* Teams Response Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {teams.map((team, idx) => {
              const isCorrect = !!teamCorrectStates[team.id];
              const selectedTeamAns = teamAnswers[team.id] || '';

              return (
                <div
                  key={team.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 shadow-xs ${
                    isCorrect
                      ? 'bg-emerald-50/95 border-emerald-400 ring-2 ring-emerald-300/60'
                      : 'bg-white/95 border-slate-200 hover:border-amber-300'
                  }`}
                >
                  {/* Team Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white shadow-2xs"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="text-xs font-black truncate text-slate-800" title={team.name}>
                        {team.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {team.currentDistance}m
                    </span>
                  </div>

                  {/* MCQ Quick Choice Pills for each team if options exist */}
                  {question.options && question.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5">
                      {question.options.map((opt, oIdx) => {
                        const isChosen = selectedTeamAns === opt;
                        const letter = question.type === 'bool'
                          ? (opt.toLowerCase().includes('đúng') || opt.toLowerCase().includes('true') ? 'Đ' : 'S')
                          : String.fromCharCode(65 + oIdx);

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => {
                              if (onSetTeamAnswer) onSetTeamAnswer(team.id, opt);
                            }}
                            className={`px-2 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
                              isChosen
                                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                            }`}
                            title={opt}
                          >
                            <span className="opacity-75 font-mono">{letter}:</span>
                            <span className="truncate">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Toggle Correct / Incorrect Status Button */}
                  <button
                    type="button"
                    onClick={() => onToggleTeamCorrect && onToggleTeamCorrect(team.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 border shadow-xs ${
                      isCorrect
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                        <span>{t.correctLabel} (+Quay xe)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-400" />
                        <span>{t.wrongLabel}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Bar: Correct Teams Summary & Confirm All-Teams Round Button */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-200/60 px-3 py-2 rounded-xl border border-amber-300">
              <span className="text-base">🚀</span>
              <span>{t.correctCountMsg(correctTeamsCount)}</span>
            </div>

            <Game3DButton
              variant={correctTeamsCount > 0 ? 'green' : 'orange'}
              size="lg"
              onClick={onSubmitAllTeamsRound || onSubmitAnswer}
              icon={<Send className="w-4 h-4" />}
              className="cursor-pointer"
            >
              {t.submitAllBtn} ({correctTeamsCount} Đội)
            </Game3DButton>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* CASE 2: CHẾ ĐỘ CHƠI LẦN LƯỢT (TURN-BASED MODE)               */
        /* ============================================================ */
        <div className="space-y-4">
          {/* 1. Fill in the blank */}
          {isFill && (
            <div className="space-y-2 bg-white/95 p-4 rounded-2xl border-2 border-amber-300 shadow-sm">
              <label className="block text-xs font-extrabold text-slate-700">
                {t.fillPrompt}
              </label>
              <input
                type="text"
                value={fillText}
                onChange={e => onChangeFillText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') onSubmitAnswer();
                }}
                placeholder={t.fillPlaceholder}
                className="w-full p-3.5 bg-slate-50 border-2 border-amber-300 focus:border-orange-500 rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all shadow-inner"
                autoFocus
              />
            </div>
          )}

          {/* 2. True / False buttons */}
          {isBool && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {(question.options && question.options.length === 2 ? question.options : ['Đúng', 'Sai']).map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isTrueChoice = opt.toLowerCase().includes('đúng') || opt.toLowerCase().includes('true');

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectOption(opt)}
                    className={`p-4 sm:p-5 rounded-2xl border-3 text-sm sm:text-base font-black transition-all cursor-pointer flex items-center justify-center gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-600 shadow-xl scale-[1.02] ring-4 ring-amber-300/60'
                        : isTrueChoice
                        ? 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-800 border-rose-300'
                    }`}
                  >
                    <span className="text-xl">{isTrueChoice ? '✅' : '❌'}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Multiple Choice Options (A, B, C, D) */}
          {!isFill && !isBool && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {question.options?.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const letter = String.fromCharCode(65 + i);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectOption(opt)}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-3 text-left ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-600 shadow-xl scale-[1.02] ring-4 ring-amber-300/60'
                        : 'bg-white/95 hover:bg-amber-100/90 border-amber-200 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm ${
                        isSelected ? 'bg-white text-orange-600' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="truncate">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom Mascot Tip & Submit Action Button */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 bg-amber-200/60 px-3 py-1.5 rounded-xl border border-amber-300">
              <span className="text-base">🤖</span>
              <span>{t.mascotTip}</span>
            </div>

            <Game3DButton
              variant="orange"
              size="lg"
              onClick={onSubmitAnswer}
              icon={<Send className="w-4 h-4" />}
            >
              {t.submitBtn}
            </Game3DButton>
          </div>

          {/* Feedback visual alerts */}
          {feedbackState === 'correct' && (
            <div className="p-3 bg-emerald-100 border-2 border-emerald-400 rounded-2xl text-emerald-900 text-xs font-black flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{t.correctToast}</span>
            </div>
          )}

          {feedbackState === 'wrong' && (
            <div className="p-3 bg-rose-100 border-2 border-rose-400 rounded-2xl text-rose-900 text-xs font-black flex items-center gap-2 animate-shake">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>{t.wrongToast}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
