import React, { useState, useEffect, useRef } from 'react';
import { User, MemoryCardGameConfig, MemoryCardPair, ActivityPointRecord, MemoryGameResultRecord } from '../../types';
import { saveMemoryResult } from '../../services/memoryGameService';
import { saveMemoryResultAndPoint } from '../../services/activityPointService';
import { soundFx } from '../../utils/sound';
import {
  Play,
  RotateCcw,
  Settings,
  Plus,
  Trash2,
  Trophy,
  Sparkles,
  Layers,
  Award,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface MemoryGameViewProps {
  currentUser: User;
  memoryConfig: MemoryCardGameConfig;
  onUpdateMemoryConfig?: (config: MemoryCardGameConfig) => Promise<void>;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
}

interface FlippedCardItem {
  uid: number;
  pairId: string;
  text: string;
}

export const MemoryGameView: React.FC<MemoryGameViewProps> = ({
  currentUser,
  memoryConfig,
  onUpdateMemoryConfig,
  onActivityPointSaved
}) => {
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';

  // Game play state
  const [memoryStarted, setMemoryStarted] = useState(false);
  const [cards, setCards] = useState<FlippedCardItem[]>([]);
  const [flippedUids, setFlippedUids] = useState<number[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [memoryScore, setMemoryScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [memoryTimeLeft, setMemoryTimeLeft] = useState<number>((memoryConfig.timeMinutes || 5) * 60);
  const [memoryTimeIsUp, setMemoryTimeIsUp] = useState(false);
  const sessionId = useRef<string | null>(null);
  const saveLock = useRef(false);
  const configLock = useRef(false);
  const [savingResult, setSavingResult] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pendingResult, setPendingResult] = useState<{ score: number; matches: number; completed: boolean } | null>(null);

  // Teacher settings modal state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(memoryConfig.title || 'Thách thức thẻ nhớ');
  const [tempCategory, setTempCategory] = useState<'Thi đua học tập' | 'Thi đua rèn luyện'>(
    memoryConfig.category || 'Thi đua học tập'
  );
  const [tempTimeMinutes, setTempTimeMinutes] = useState(memoryConfig.timeMinutes || 5);
  const [newCardA, setNewCardA] = useState('');
  const [newCardB, setNewCardB] = useState('');

  // Synchronize modal state if config changes
  useEffect(() => {
    setTempTitle(memoryConfig.title || 'Thách thức thẻ nhớ');
    setTempCategory(memoryConfig.category || 'Thi đua học tập');
    setTempTimeMinutes(memoryConfig.timeMinutes || 5);
    setMemoryTimeLeft((memoryConfig.timeMinutes || 5) * 60);
  }, [memoryConfig]);

  // Timer countdown effect for student gameplay
  useEffect(() => {
    let interval: any = null;
    if (memoryStarted && memoryTimeLeft > 0 && !gameCompleted && !memoryTimeIsUp) {
      interval = setInterval(() => {
        setMemoryTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setMemoryTimeIsUp(true);
            soundFx.playError();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [memoryStarted, memoryTimeLeft, gameCompleted, memoryTimeIsUp]);

  useEffect(() => {
    if (memoryTimeIsUp && !gameCompleted && memoryStarted) void finalizeResult(memoryScore, matchedPairIds.length, false);
  }, [memoryTimeIsUp]);

  const initGame = () => {
    if (saveLock.current || savingResult) return;
    if (pendingResult) { setSaveError('Hãy lưu lại kết quả hiện tại trước khi bắt đầu lượt mới.'); return; }
    if (memoryConfig.pairs.length < 2) { setSaveError('Giáo viên cần tạo ít nhất 2 cặp thẻ.'); return; }
    soundFx.playCoin();
    const generatedCards: FlippedCardItem[] = memoryConfig.pairs.flatMap((p, idx) => [
      { uid: idx * 2, pairId: p.id, text: p.cardA },
      { uid: idx * 2 + 1, pairId: p.id, text: p.cardB }
    ]);
    // Shuffle cards
    for (let i = generatedCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [generatedCards[i], generatedCards[j]] = [generatedCards[j], generatedCards[i]];
    }

    setCards(generatedCards);
    setFlippedUids([]);
    setMatchedPairIds([]);
    setMemoryScore(0);
    setGameCompleted(false);
    setMemoryTimeIsUp(false);
    setMemoryTimeLeft((memoryConfig.timeMinutes || 5) * 60);
    setMemoryStarted(true);
    sessionId.current = crypto.randomUUID();
    setPendingResult(null);
    setSaveError('');
  };

  const finalizeResult = async (score: number, matches: number, completed: boolean) => {
    if (saveLock.current || !sessionId.current || !currentUser.classId) return;
    const result: MemoryGameResultRecord = {
      id: sessionId.current, score, matchedPairs: matches, totalPairs: memoryConfig.pairs.length, completed,
      timeSpentSeconds: Math.max(0, memoryConfig.timeMinutes * 60 - memoryTimeLeft),
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    const isAcademic = ['Điểm HĐ học tập', 'Thi đua học tập', 'Điểm học tập'].includes(memoryConfig.category || 'Thi đua học tập');
    const point: ActivityPointRecord | null = currentUser.role === 'student' ? {
      id: result.id, attemptId: result.id, userId: currentUser.id, studentName: currentUser.fullName,
      classId: currentUser.classId, activityId: memoryConfig.id || 'memory_game',
      activityName: memoryConfig.title || 'Thách thức thẻ nhớ', source: 'memory',
      category: memoryConfig.category || 'Thi đua học tập',
      pointType: isAcademic ? 'academic_activity' : 'training_activity', points: score,
      isCorrect: completed, participantName: `${matches}/${memoryConfig.pairs.length} cặp thẻ`, questionId: 'memory_result',
      date: new Date().toISOString().slice(0, 10), timestamp: result.timestamp,
    } : null;
    saveLock.current = true;
    setSavingResult(true);
    setPendingResult({ score, matches, completed });
    try {
      if (point) await saveMemoryResultAndPoint(currentUser.classId, currentUser.id, result, point);
      else await saveMemoryResult(currentUser.classId, currentUser.id, result);
      if (point) onActivityPointSaved?.(point);
      setSaveError('');
      setPendingResult(null);
    } catch {
      setSaveError('Chưa lưu được kết quả Thẻ nhớ. Hãy kiểm tra kết nối và thử lưu lại.');
    } finally {
      saveLock.current = false;
      setSavingResult(false);
    }
  };

  const persistConfig = async (config: MemoryCardGameConfig): Promise<boolean> => {
    if (!onUpdateMemoryConfig || configLock.current || memoryStarted) {
      if (memoryStarted) setSaveError('Hãy kết thúc lượt chơi trước khi sửa cấu hình.');
      return false;
    }
    configLock.current = true; setSavingConfig(true);
    try { await onUpdateMemoryConfig(config); setSaveError(''); return true; }
    catch (error) { setSaveError(`Không lưu được cấu hình: ${(error as Error).message}`); return false; }
    finally { configLock.current = false; setSavingConfig(false); }
  };

  const handleCardClick = (card: FlippedCardItem) => {
    if (
      !memoryStarted ||
      memoryTimeIsUp ||
      flippedUids.includes(card.uid) ||
      matchedPairIds.includes(card.pairId) ||
      flippedUids.length >= 2
    ) {
      return;
    }

    soundFx.playFlip();
    const nextFlipped = [...flippedUids, card.uid];
    setFlippedUids(nextFlipped);

    if (nextFlipped.length === 2) {
      const [firstUid, secondUid] = nextFlipped;
      const firstCard = cards.find(c => c.uid === firstUid);
      const secondCard = cards.find(c => c.uid === secondUid);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // Matched!
        setTimeout(async () => {
          soundFx.playSuccess();
          const newMatched = [...matchedPairIds, firstCard.pairId];
          const newScore = memoryScore + 2;
          setMatchedPairIds(newMatched);
          setMemoryScore(newScore);
          setFlippedUids([]);

          // Check if all matched
          if (newMatched.length === memoryConfig.pairs.length) {
            soundFx.playBonus();
            setGameCompleted(true);
            await finalizeResult(newScore, newMatched.length, true);
          }
        }, 500);
      } else {
        // Not matched - flip back after delay
        setTimeout(() => {
          setFlippedUids([]);
        }, 900);
      }
    }
  };

  const handleSaveGeneralConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!await persistConfig({
        ...memoryConfig,
        title: tempTitle,
        category: tempCategory,
        timeMinutes: Number(tempTimeMinutes) || 5
      })) return;
    soundFx.playSuccess();
    alert('Đã cập nhật cấu hình Thẻ nhớ thành công!');
  };

  const handleAddCardPair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardA.trim() || !newCardB.trim()) {
      alert('Vui lòng nhập đầy đủ nội dung cho cả 2 thẻ!');
      return;
    }

    const newPair: MemoryCardPair = {
      id: 'pair_' + Date.now(),
      cardA: newCardA.trim(),
      cardB: newCardB.trim()
    };

    const updatedPairs = [...memoryConfig.pairs, newPair];
    if (!await persistConfig({
        ...memoryConfig,
        pairs: updatedPairs
      })) return;

    setNewCardA('');
    setNewCardB('');
    soundFx.playSuccess();
    alert('Đã thêm cặp thẻ mới thành công!');
  };

  const handleDeleteCardPair = async (pairId: string) => {
    if (memoryConfig.pairs.length <= 2) {
      alert('Trò chơi cần duy trì tối thiểu 2 cặp thẻ!');
      return;
    }
    const updated = memoryConfig.pairs.filter(p => p.id !== pairId);
    if (!await persistConfig({
        ...memoryConfig,
        pairs: updated
      })) return;
    soundFx.playClick();
  };

  const category = memoryConfig.category || 'Thi đua học tập';
  const isLearning = category === 'Thi đua học tập' || category === 'Điểm học tập';

  return (
    <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
      {saveError && <div role="alert" className="fixed top-4 right-4 z-[200] max-w-md rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 shadow-lg">{saveError}{pendingResult && <button className="ml-3 underline font-bold" onClick={() => finalizeResult(pendingResult.score, pendingResult.matches, pendingResult.completed)}>Lưu lại</button>}<button className="ml-3 underline" onClick={() => setSaveError('')}>Đóng</button></div>}
      {(savingResult || savingConfig) && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5 font-bold text-slate-800">{savingResult ? 'Đang lưu kết quả và điểm...' : 'Đang lưu cấu hình...'}</p></div>}
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-2xl">🎴</span>
            <h3 className="text-xl font-black text-slate-800">
              {memoryConfig.title || 'Thách thức thẻ nhớ'}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-2xs ${
                isLearning
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isLearning ? '📚 Điểm học tập' : '🎖️ Điểm rèn luyện'}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> {memoryConfig.timeMinutes || 5} phút
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Lật mở 2 thẻ tương ứng để ghi điểm tích lũy thi đua vào{' '}
            <strong className="text-slate-700">{category}</strong>! (Thời gian quy định: {memoryConfig.timeMinutes || 5} phút)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isTeacherOrAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  const nextActive = !memoryConfig.isActive;
                  if (!await persistConfig({ ...memoryConfig, isActive: nextActive })) return;
                  if (nextActive) {
                    soundFx.playSuccess();
                    alert('🚀 ĐÃ KÍCH HOẠT THÁCH THỨC THẺ NHỚ! Nút Start trên màn hình học sinh đã chuyển sang màu đỏ và sẵn sàng lật thẻ.');
                  } else {
                    soundFx.playClick();
                    alert('⏸️ Đã tạm dừng Thách thức thẻ nhớ. Nút Start trên màn hình học sinh đã chuyển về màu xám.');
                  }
                }}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                  memoryConfig.isActive
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                }`}
                title="Kích hoạt / Tắt trò chơi thẻ nhớ cho học sinh"
              >
                {memoryConfig.isActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>🟢 ĐANG KÍCH HOẠT (Bấm để dừng)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>⚡ KÍCH HOẠT THẺ NHỚ</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (memoryStarted) { setSaveError('Hãy kết thúc lượt chơi trước khi sửa cấu hình.'); return; }
                  soundFx.playClick();
                  setIsTeacherModalOpen(true);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold rounded-2xl text-xs border border-slate-200 hover:border-sky-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4 text-sky-600" />
                <span>Thiết lập trò chơi & Phân loại</span>
              </button>
            </div>
          )}

          {!memoryStarted ? (
            <button
              onClick={() => {
                if (!memoryConfig.isActive && !isTeacherOrAdmin) {
                  alert('Trò chơi thẻ nhớ chưa được giáo viên kích hoạt! Vui lòng chờ giáo viên mở trò chơi.');
                  return;
                }
                initGame();
              }}
              disabled={!memoryConfig.isActive && !isTeacherOrAdmin}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
                !memoryConfig.isActive && !isTeacherOrAdmin
                  ? 'bg-slate-300 text-slate-500 border border-slate-300 shadow-none cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white shadow-xl shadow-red-500/40 hover:scale-105 cursor-pointer ring-2 ring-red-300 animate-pulse'
              }`}
              title={!memoryConfig.isActive && !isTeacherOrAdmin ? 'Chờ giáo viên kích hoạt trò chơi' : 'Bắt đầu lật thẻ'}
            >
              {(!memoryConfig.isActive && !isTeacherOrAdmin) ? (
                <>
                  <span>🔒</span> START (Chờ GV kích hoạt)
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> 🚀 START / BẮT ĐẦU LẬT THẺ
                </>
              )}
            </button>
          ) : (
            <button
              onClick={initGame}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 border border-slate-200"
            >
              <RotateCcw className="w-4 h-4" /> Chơi lại
            </button>
          )}
        </div>
      </div>

      {/* Game Stage */}
      {!memoryStarted ? (
        <div className="p-10 text-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 rounded-3xl border-2 border-dashed border-sky-200 space-y-4">
          <div className="text-6xl animate-bounce">🎴✨</div>

          {!memoryConfig.isActive && !isTeacherOrAdmin && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100/90 text-amber-900 border border-amber-300 rounded-2xl text-xs font-bold shadow-xs">
              <span>⏳</span> Trò chơi thẻ nhớ đang tạm khóa. Vui lòng chờ Giáo viên / Quản trị viên kích hoạt để nút Start chuyển sang màu đỏ!
            </div>
          )}

          {memoryConfig.isActive && !isTeacherOrAdmin && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100/90 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold shadow-xs animate-bounce">
              <span>🚀</span> Trò chơi ĐÃ ĐƯỢC KÍCH HOẠT! Hãy bấm nút Start màu đỏ bên dưới để bắt đầu thử thách lật thẻ.
            </div>
          )}

          <div className="space-y-1">
            <h4 className="text-lg font-black text-slate-800">
              Sẵn sàng thử thách trí nhớ?
            </h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Trò chơi gồm <strong>{memoryConfig.pairs.length} cặp thẻ</strong>. Mỗi cặp ghép đúng được cộng{' '}
              <strong>+2 điểm</strong> trực tiếp vào mục <strong>{category}</strong>.
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                if (!memoryConfig.isActive && !isTeacherOrAdmin) {
                  alert('Trò chơi thẻ nhớ chưa được giáo viên kích hoạt! Vui lòng chờ giáo viên mở trò chơi.');
                  return;
                }
                initGame();
              }}
              disabled={!memoryConfig.isActive && !isTeacherOrAdmin}
              className={`px-8 py-3.5 rounded-2xl text-sm font-black transition-all inline-flex items-center gap-2.5 ${
                !memoryConfig.isActive && !isTeacherOrAdmin
                  ? 'bg-slate-300 text-slate-500 border border-slate-300 shadow-none cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white shadow-2xl shadow-red-500/50 hover:scale-105 cursor-pointer ring-4 ring-red-200 animate-pulse'
              }`}
            >
              {(!memoryConfig.isActive && !isTeacherOrAdmin) ? (
                <>
                  <span>🔒</span> START (Chờ GV kích hoạt)
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" /> 🚀 START / BẮT ĐẦU NGAY 🚀
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between bg-sky-50/80 p-4 rounded-2xl border border-sky-200 flex-wrap gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Điểm tích lũy:{' '}
                <strong className="text-base text-blue-700">{memoryScore}</strong> điểm
              </span>
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-400" />
                Đã ghép đúng:{' '}
                <strong className="text-emerald-700">
                  {matchedPairIds.length} / {memoryConfig.pairs.length} cặp
                </strong>
              </span>
            </div>

            {/* COUNTDOWN TIMER DISPLAY FOR STUDENT */}
            <div className={`px-4 py-2 rounded-2xl border-2 flex items-center gap-2 text-xs font-extrabold transition-all shadow-xs ${
              memoryTimeLeft <= 60
                ? 'bg-rose-50 text-rose-700 border-rose-400 animate-pulse ring-2 ring-rose-200'
                : 'bg-white text-slate-800 border-sky-300'
            }`}>
              <Clock className={`w-4 h-4 ${memoryTimeLeft <= 60 ? 'text-rose-600 animate-spin' : 'text-sky-600'}`} />
              <span>Thời gian còn lại:</span>
              <span className="text-sm font-black font-mono tracking-wider">
                {Math.floor(memoryTimeLeft / 60).toString().padStart(2, '0')}:
                {(memoryTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {cards.map(card => {
              const isFlipped =
                flippedUids.includes(card.uid) || matchedPairIds.includes(card.pairId);
              const isMatched = matchedPairIds.includes(card.pairId);

              return (
                <button
                  key={card.uid}
                  onClick={() => handleCardClick(card)}
                  disabled={isMatched || flippedUids.length >= 2}
                  className={`h-28 sm:h-32 rounded-3xl font-black text-xs sm:text-sm p-3 flex items-center justify-center text-center transition-all duration-300 shadow-sm cursor-pointer select-none ${
                    isMatched
                      ? 'bg-emerald-500 text-white border-2 border-emerald-400 shadow-md ring-2 ring-emerald-200'
                      : isFlipped
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md transform scale-102'
                      : 'bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white hover:scale-102'
                  }`}
                >
                  {isFlipped ? (
                    <span className="leading-snug">{card.text}</span>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-2xl">❓</div>
                      <div className="text-[11px] opacity-80 uppercase tracking-wider font-extrabold">
                        ITEN
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {gameCompleted && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-sky-400 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-7xl animate-bounce">🏆🎉🎴</div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                XUẤT SẮC HOÀN THÀNH!
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                CHIẾN THẮNG THẺ NHỚ!
              </h3>
              <p className="text-xs text-slate-600">
                Chúc mừng bạn đã ghép chính xác tất cả {memoryConfig.pairs.length} cặp thẻ ghi nhớ!
              </p>
            </div>

            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
              <div className="text-xs text-sky-800 font-bold">Tổng điểm ghi nhận:</div>
              <div className="text-3xl font-black text-blue-600">+{memoryScore} Điểm</div>
              <div className="text-xs text-slate-600 font-medium">
                Đã cập nhật tự động vào mục: <strong>{category}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={initGame}
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black rounded-2xl text-xs shadow-lg shadow-blue-500/30 hover:scale-102 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> CHƠI LẠI VÒNG MỚI
            </button>
          </div>
        </div>
      )}

      {/* Time's Up Modal */}
      {memoryTimeIsUp && !gameCompleted && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-4 border-rose-400 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-6xl animate-bounce">⏰⏳⌛</div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase tracking-wider">
                THỜI GIAN LÀM BÀI ĐÃ HẾT!
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                HẾT GIỜ LÀM BÀI!
              </h3>
              <p className="text-xs text-slate-600">
                Thời gian làm bài quy định ({memoryConfig.timeMinutes || 5} phút) đã hết. Bạn đã lật đúng {matchedPairIds.length} / {memoryConfig.pairs.length} cặp thẻ!
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
              <div className="text-xs text-amber-800 font-bold">Tổng điểm ghi nhận được:</div>
              <div className="text-3xl font-black text-amber-600">+{memoryScore} Điểm</div>
              <div className="text-xs text-slate-600 font-medium">
                Cập nhật tự động vào mục: <strong>{category}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={initGame}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl text-xs shadow-lg shadow-orange-500/30 hover:scale-102 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> THỬ THÁCH LẠI VÒNG MỚI
            </button>
          </div>
        </div>
      )}

      {/* Teacher Configuration Modal */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-sky-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Thiết lập trò chơi Thách thức thẻ nhớ
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. General Config Form */}
            <form onSubmit={handleSaveGeneralConfig} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                ⚙️ Cấu hình chung & Phân loại thi đua
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề trò chơi:
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phân loại thi đua (Vườn thành tích):
                  </label>
                  <select
                    value={tempCategory}
                    onChange={e => setTempCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Thi đua học tập">📚 Điểm học tập</option>
                    <option value="Thi đua rèn luyện">🎖️ Điểm rèn luyện</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Kết quả điểm của học sinh sẽ tự động thống kê vào phân loại này.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian làm bài (phút):
                  </label>
                  <input
                    type="number"
                    value={tempTimeMinutes}
                    min={1}
                    max={60}
                    onChange={e => setTempTimeMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                Lưu cấu hình chung
              </button>
            </form>

            {/* 2. Add New Card Pair Form */}
            <form onSubmit={handleAddCardPair} className="bg-sky-50/60 p-5 rounded-2xl border border-sky-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Thêm cặp thẻ nhớ mới
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Thẻ A (Câu hỏi / Thuật ngữ):</label>
                  <input
                    type="text"
                    value={newCardA}
                    onChange={e => setNewCardA(e.target.value)}
                    placeholder="VD: Thủ đô nước Pháp"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Thẻ B (Đáp án / Giải nghĩa):</label>
                  <input
                    type="text"
                    value={newCardB}
                    onChange={e => setNewCardB(e.target.value)}
                    placeholder="VD: Paris"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                + Thêm cặp thẻ vào trò chơi
              </button>
            </form>

            {/* 3. Card Pairs List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Danh sách các cặp thẻ hiện tại ({memoryConfig.pairs.length} cặp)
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {memoryConfig.pairs.map((p, idx) => (
                  <div
                    key={p.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-bold text-slate-400">#{idx + 1}</span>
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 font-semibold text-slate-800 truncate">
                          {p.cardA}
                        </div>
                        <div className="p-2 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-semibold truncate">
                          {p.cardB}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCardPair(p.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Xóa cặp thẻ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
