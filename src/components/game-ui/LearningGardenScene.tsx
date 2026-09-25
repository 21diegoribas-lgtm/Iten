import React, { useState, useEffect, useRef } from 'react';
import { loadFlowerHistory, saveFlowerAnswer, deleteFlowerHistoryEntries } from '../../services/flowerHistoryService';
import { saveFlowerAnswerAndPoint } from '../../services/activityPointService';
import { User, FlowerGameConfig, FlowerGameQuestion, FlowerParticipant, FlowerPlayMode, FlowerParticipantType, FlowerAnswerHistoryRecord, ActivityPointRecord } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Settings,
  HelpCircle,
  Play,
  Plus,
  Trash2,
  Users,
  UserCheck,
  Zap,
  Crown,
  Sparkles,
  ChevronRight,
  Award,
  Flame,
  ArrowRight,
  History,
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface LearningGardenSceneProps {
  currentUser: User;
  flowerConfig: FlowerGameConfig;
  onUpdateFlowerConfig?: (config: FlowerGameConfig) => Promise<void>;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
  isTeacherOrAdmin?: boolean;
}

interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  isLucky?: boolean;
}

interface PickingParticle {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  itemType: 'flower' | 'fruit';
  isLucky?: boolean;
}

const DEFAULT_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow/Amber
  '#8B5CF6', // Purple
  '#F97316'  // Orange
];

export const LearningGardenScene: React.FC<LearningGardenSceneProps> = ({
  currentUser,
  flowerConfig,
  onUpdateFlowerConfig,
  onActivityPointSaved,
  isTeacherOrAdmin = false
}) => {
  // Game mode & participants config
  const playMode: FlowerPlayMode = flowerConfig.playMode || 'turn_based';
  const participantType: FlowerParticipantType = flowerConfig.participantType || 'team';
  const participantsCount: number = flowerConfig.participantsCount || (flowerConfig.participants?.length || 4);

  // Initialize participants
  const initParticipants = (): FlowerParticipant[] => {
    if (flowerConfig.participants && flowerConfig.participants.length > 0) {
      return flowerConfig.participants;
    }
    const count = participantsCount || 4;
    const defaultList: FlowerParticipant[] = [];
    for (let i = 0; i < count; i++) {
      const typeLabel = participantType === 'team' ? 'Tổ' : participantType === 'group' ? 'Nhóm' : 'Học sinh';
      defaultList.push({
        id: `p_${i + 1}`,
        name: `${typeLabel} ${i + 1}`,
        color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        score: 0,
        harvestedCount: 0
      });
    }
    return defaultList;
  };

  // Active game states
  const [participants, setParticipants] = useState<FlowerParticipant[]>(initParticipants());
  const [activeParticipantIdx, setActiveParticipantIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [flowerLang, setFlowerLang] = useState<'vi' | 'en'>(flowerConfig.language || 'vi');
  const [pickedItems, setPickedItems] = useState<number[]>([]);
  const [activeItemIdx, setActiveItemIdx] = useState<number | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [fillAnswer, setFillAnswer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>((flowerConfig.timeMinutes || 5) * 60);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);

  // Q&A History Log state for revision/review
  const [flowerHistory, setFlowerHistory] = useState<FlowerAnswerHistoryRecord[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const answerLock = useRef(false);
  const historyDeleteLock = useRef(false);
  const [deletingHistory, setDeletingHistory] = useState(false);
  const attemptId = useRef<string | null>(null);
  const configLock = useRef(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState('');
  const persistConfig = async (config: FlowerGameConfig): Promise<boolean> => {
    if (configLock.current || answerLock.current) return false;
    if (isPlaying && !isTimeUp && !isGameCompleted) {
      setHistoryError('Hãy kết thúc hoặc đặt lại lượt chơi trước khi sửa cài đặt/câu hỏi.');
      return false;
    }
    if (!isTeacherOrAdmin || !onUpdateFlowerConfig) {
      setHistoryError('Bạn không có quyền chỉnh sửa trò chơi.');
      return false;
    }
    configLock.current = true;
    setSavingConfig(true);
    setConfigSuccess('');
    try {
      await onUpdateFlowerConfig(config);
      setHistoryError('');
      setConfigSuccess('Đã lưu thay đổi thành công.');
      return true;
    } catch (error) {
      const detail = error as { code?: string; message?: string };
      setHistoryError(detail.code === 'permission-denied'
        ? 'Không có quyền lưu. Hãy kiểm tra tài khoản, lớp học và cập nhật Firestore rules.'
        : `Không lưu được: ${detail.message || 'Hãy kiểm tra kết nối và thử lại.'}`);
      return false;
    } finally {
      configLock.current = false;
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setFlowerHistory([]);
    setHistoryError('');
    setHistoryLoading(true);
    loadFlowerHistory(flowerConfig.classId, currentUser.id)
      .then(entries => { if (!cancelled) setFlowerHistory(entries); })
      .catch(() => { if (!cancelled) setHistoryError('Không tải được lịch sử Hái hoa. Hãy tải lại trang sau khi kiểm tra kết nối và quyền truy cập.'); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [flowerConfig.classId, currentUser.id]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilterType, setHistoryFilterType] = useState<'all' | 'correct' | 'wrong'>('all');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [revealAllAnswers, setRevealAllAnswers] = useState(false);

  const toggleRevealAnswer = (id: string) => {
    setRevealedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleRevealAll = () => {
    const nextState = !revealAllAnswers;
    setRevealAllAnswers(nextState);
    const newMap: Record<string, boolean> = {};
    flowerHistory.forEach(h => {
      newMap[h.id] = nextState;
    });
    setRevealedAnswers(newMap);
  };

  // Animation states
  const [characterActionMap, setCharacterActionMap] = useState<Record<number, 'idle' | 'reaching' | 'happy' | 'thinking'>>({});
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [pickingParticles, setPickingParticles] = useState<PickingParticle[]>([]);
  const [speechBubbleText, setSpeechBubbleText] = useState<{ text: string; idx: number } | null>(null);

  // Teacher modal form states
  const [teacherPlayMode, setTeacherPlayMode] = useState<FlowerPlayMode>(playMode);
  const [teacherPartType, setTeacherPartType] = useState<FlowerParticipantType>(participantType);
  const [teacherPartCount, setTeacherPartCount] = useState<number>(participantsCount);
  const [teacherParticipants, setTeacherParticipants] = useState<FlowerParticipant[]>(participants);
  const [teacherTimeMinutes, setTeacherTimeMinutes] = useState<number>(flowerConfig.timeMinutes || 5);
  const [teacherCategory, setTeacherCategory] = useState(flowerConfig.category || 'Thi đua học tập');
  const [teacherIsActive, setTeacherIsActive] = useState<boolean>(flowerConfig.isActive ?? true);

  // Teacher questions state
  const [newQText, setNewQText] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [newQType, setNewQType] = useState<'mcq' | 'fill' | 'bool'>('mcq');
  const [newQOpt1, setNewQOpt1] = useState('');
  const [newQOpt2, setNewQOpt2] = useState('');
  const [newQOpt3, setNewQOpt3] = useState('');
  const [newQOpt4, setNewQOpt4] = useState('');
  const [newQCorrectAns, setNewQCorrectAns] = useState('');
  const [newQIsLucky, setNewQIsLucky] = useState(false);
  const [newQMultiplier, setNewQMultiplier] = useState(2);

  // Sync participants if flowerConfig changes from outside
  useEffect(() => {
    if (flowerConfig.participants && flowerConfig.participants.length > 0) {
      setParticipants(flowerConfig.participants);
      setTeacherParticipants(flowerConfig.participants);
    }
  }, [flowerConfig.participants]);

  // Timer countdown
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && !savingAnswer && timeLeft > 0 && !isTimeUp && !isGameCompleted) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimeUp(true);
            if (!soundMuted) soundFx.playError();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeLeft, isTimeUp, isGameCompleted, soundMuted, savingAnswer]);

  // Speech bubble timeout
  useEffect(() => {
    if (speechBubbleText) {
      const t = setTimeout(() => setSpeechBubbleText(null), 3500);
      return () => clearTimeout(t);
    }
  }, [speechBubbleText]);

  // Check if all items are picked
  useEffect(() => {
    if (isPlaying && currentQuestionIdx === null && pickedItems.length > 0 && pickedItems.length >= treePositions.length) {
      const timer = setTimeout(() => {
        setIsGameCompleted(true);
        if (!soundMuted) soundFx.playSuccess();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [pickedItems, isPlaying, soundMuted, currentQuestionIdx]);

  // 12 Organic Flower and Fruit positions across the majestic tree
  const treePositions = [
    { id: 0, x: 26, y: 34, type: 'flower', isLucky: false, label: '🌸' },
    { id: 1, x: 20, y: 52, type: 'fruit', isLucky: false, label: '🍎' },
    { id: 2, x: 36, y: 26, type: 'fruit', isLucky: false, label: '🍎' },
    { id: 3, x: 42, y: 44, type: 'flower', isLucky: true, multiplier: 2, label: '🌸' },
    { id: 4, x: 50, y: 18, type: 'flower', isLucky: false, label: '🌸' },
    { id: 5, x: 55, y: 36, type: 'fruit', isLucky: false, label: '🍎' },
    { id: 6, x: 62, y: 22, type: 'flower', isLucky: false, label: '🌸' },
    { id: 7, x: 70, y: 40, type: 'flower', isLucky: true, multiplier: 3, label: '🌸' },
    { id: 8, x: 79, y: 30, type: 'fruit', isLucky: false, label: '🍎' },
    { id: 9, x: 74, y: 56, type: 'fruit', isLucky: false, label: '🍎' },
    { id: 10, x: 34, y: 64, type: 'flower', isLucky: false, label: '🌸' },
    { id: 11, x: 60, y: 58, type: 'flower', isLucky: false, label: '🌸' }
  ];

  // Bilingual translation text
  const t = {
    vi: {
      gameTitle: 'HÁI HOA HỌC TẬP',
      gameSubtitle: 'Khu vườn tri thức thi đua học tập - Tranh tài giữa các đội/nhóm/học sinh',
      startBtn: 'BẮT ĐẦU HÁI HOA',
      restartBtn: 'Chơi lại',
      guideBtn: 'Hướng dẫn',
      settingsBtn: 'Cài đặt chế độ & Câu hỏi',
      scoreLabel: 'Tổng điểm',
      timeLeftLabel: 'Thời gian',
      harvestedLabel: 'Đã hái',
      flowerTip: 'Bông hoa học tập',
      fruitTip: 'Quả ngọt tri thức',
      mysteryTip: 'Bông hoa bí mật (Điểm số ẩn)',
      questionTitle: 'CÂU HỎI HÁI HOA',
      submitBtn: 'NỘP ĐÁP ÁN',
      cancelBtn: 'Để sau',
      fillPlaceholder: 'Nhập câu trả lời của bạn...',
      fillLabel: 'Nhập từ hoặc cụm từ còn thiếu:',
      correctToast: (pts: number, name: string, isLucky?: boolean, mult?: number) =>
        isLucky
          ? `🎉 Xuất sắc! ${name} trúng Hoa May Mắn (x${mult}) và trả lời đúng: +${pts} điểm!`
          : `🎉 Tuyệt vời! ${name} trả lời chính xác và nhận: +${pts} điểm!`,
      incorrectToast: (pts: number, name: string, ans: string) =>
        `❌ Rất tiếc chưa đúng! ${name} bị trừ -${pts} điểm. Đáp án chính xác là: ${ans}`,
      fillEmptyAlert: 'Vui lòng nhập câu trả lời trước khi nộp!',
      selectAlert: 'Vui lòng chọn đáp án trước khi nộp!',
      victoryTitle: 'XUẤT SẮC! HOÀN THÀNH HÁI HOA!',
      timeUpTitle: 'HẾT GIỜ HÁI HOA!',
      totalEarned: 'Tổng điểm toàn đội:',
      itemsCollected: 'Số hoa & quả đã hái:',
      categoryLabel: 'Lưu vào mục:',
      studyCategory: '📚 Điểm học tập',
      conductCategory: '🎖️ Điểm rèn luyện',
      playAgainBtn: 'CHƠI LẠI VÒNG MỚI',
      lockedTitle: 'Trò chơi đang tạm khóa',
      lockedDesc: 'Vui lòng chờ Giáo viên / Quản trị viên kích hoạt để bắt đầu tham gia hái hoa.',
      activatedDesc: 'Trò chơi đã được kích hoạt! Nhấn BẮT ĐẦU để bước vào Khu vườn học tập.',
      charCheer: 'Cố lên bạn ơi, hái hoa bí mật và trả lời thật chính xác nhé!',
      charCorrect: 'Đúng rồi! Điểm số bí mật đã được mở khóa! 🎉',
      charIncorrect: (pts: number) => `Chưa đúng rồi, bị trừ -${pts} điểm! Cố gắng ở câu tiếp theo nhé! 💪`,
      turnModeTurnBased: 'Chơi lần lượt từng đội/học sinh',
      turnModeAllTogether: 'Giáo viên chọn đội trả lời',
      turnIndicator: 'Lượt của:',
      winnerCongrats: 'Chúc mừng đội chiến thắng!'
    },
    en: {
      gameTitle: 'EDUCATIONAL FLOWER GARDEN',
      gameSubtitle: '2.5D Knowledge Garden - Team competition & flower harvest challenge',
      startBtn: 'START FLOWER PICKING',
      restartBtn: 'Play Again',
      guideBtn: 'How to Play',
      settingsBtn: 'Mode & Question Settings',
      scoreLabel: 'Total Score',
      timeLeftLabel: 'Time Left',
      harvestedLabel: 'Harvested',
      flowerTip: 'Learning Flower',
      fruitTip: 'Knowledge Fruit',
      mysteryTip: 'Mystery Bloom (Hidden Points)',
      questionTitle: 'FLOWER QUESTION',
      submitBtn: 'SUBMIT ANSWER',
      cancelBtn: 'Skip for now',
      fillPlaceholder: 'Type your answer here...',
      fillLabel: 'Fill in the missing word/phrase:',
      correctToast: (pts: number, name: string, isLucky?: boolean, mult?: number) =>
        isLucky
          ? `🎉 Outstanding! ${name} found a Lucky Flower (x${mult}) and got it right: +${pts} pts!`
          : `🎉 Excellent! ${name} answered correctly and earned: +${pts} pts!`,
      incorrectToast: (pts: number, name: string, ans: string) =>
        `❌ Not quite! ${name} lost -${pts} pts. The correct answer was: ${ans}`,
      fillEmptyAlert: 'Please type your answer before submitting!',
      selectAlert: 'Please select an answer before submitting!',
      victoryTitle: 'EXCELLENT! HARVEST COMPLETED!',
      timeUpTitle: "TIME'S UP!",
      totalEarned: 'Total team score:',
      itemsCollected: 'Flowers & Fruits collected:',
      categoryLabel: 'Saved to:',
      studyCategory: '📚 Academic Points',
      conductCategory: '🎖️ Conduct Points',
      playAgainBtn: 'PLAY NEW ROUND',
      lockedTitle: 'Game is currently paused',
      lockedDesc: 'Please wait for Teacher / Admin to activate the game.',
      activatedDesc: 'Game is now active! Click START to enter the Learning Garden.',
      charCheer: "Let's pick mystery blooms and answer accurately!",
      charCorrect: 'Correct! Secret points revealed and awarded! 🎉',
      charIncorrect: (pts: number) => `Incorrect! Lost -${pts} pts. Keep trying! 💪`,
      turnModeTurnBased: 'Turn-based per team/student',
      turnModeAllTogether: 'Choose the answering team',
      turnIndicator: "Current Turn:",
      winnerCongrats: 'Congratulations to the winning team!'
    }
  }[flowerLang];

  // Start game handler
  const handleStartGame = () => {
    if (answerLock.current || historyLoading) return;
    if (!flowerConfig.questions.length) { setHistoryError('Giáo viên cần thêm ít nhất một câu hỏi trước khi bắt đầu.'); return; }
    if (!flowerConfig.isActive && !isTeacherOrAdmin) {
      alert(t.lockedTitle + ': ' + t.lockedDesc);
      return;
    }
    if (!soundMuted) soundFx.playCoin();
    setIsPlaying(true);
    setPickedItems([]);
    setTimeLeft((flowerConfig.timeMinutes || 5) * 60);
    setIsTimeUp(false);
    setIsGameCompleted(false);
    setCurrentQuestionIdx(null);
    setActiveParticipantIdx(0);

    // Reset participant scores
    setParticipants(prev =>
      prev.map(p => ({
        ...p,
        score: 0,
        harvestedCount: 0
      }))
    );

    setCharacterActionMap({});
    setSpeechBubbleText({ text: t.charCheer, idx: 0 });
  };

  // Reset game handler
  const handleResetGame = () => {
    if (answerLock.current) return;
    if (!soundMuted) soundFx.playClick();
    setIsPlaying(false);
    setPickedItems([]);
    setTimeLeft((flowerConfig.timeMinutes || 5) * 60);
    setIsTimeUp(false);
    setIsGameCompleted(false);
    setCurrentQuestionIdx(null);
    setCharacterActionMap({});
  };

  // Pick a flower/fruit item
  const handlePickItem = (itemIndex: number) => {
    if (answerLock.current || !isPlaying || currentQuestionIdx !== null) return;
    attemptId.current = crypto.randomUUID();
    if (isTimeUp || isGameCompleted || pickedItems.includes(itemIndex)) return;

    if (!soundMuted) soundFx.playWaterBubble();
    const item = treePositions[itemIndex];

    // Determine target participant's X position for harvest flight
    const curP = participants[activeParticipantIdx] || participants[0];
    const totalP = Math.max(1, participants.length);
    // Approximate X coordinate on canvas for this participant (10% to 90%)
    const targetX = totalP === 1 ? 28 : 12 + activeParticipantIdx * (76 / (totalP - 1));

    // Trigger character reaching animation & speech
    setCharacterActionMap(prev => ({ ...prev, [activeParticipantIdx]: 'reaching' }));
    setTimeout(() => {
      setCharacterActionMap(prev => ({ ...prev, [activeParticipantIdx]: 'thinking' }));
    }, 700);

    // Add harvest particle animation from tree branch to specific team's basket
    const particleId = Date.now() + Math.random();
    setPickingParticles(prev => [
      ...prev,
      {
        id: particleId,
        startX: item.x,
        startY: item.y,
        targetX: targetX,
        targetY: 82,
        progress: 0,
        itemType: item.type as 'flower' | 'fruit',
        isLucky: item.isLucky
      }
    ]);

    // Animate particle flying to basket
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.2;
      if (progress >= 1) {
        clearInterval(interval);
        setPickingParticles(prev => prev.filter(p => p.id !== particleId));
      } else {
        setPickingParticles(prev =>
          prev.map(p => (p.id === particleId ? { ...p, progress } : p))
        );
      }
    }, 40);

    // Mark item as picked
    setPickedItems(prev => [...prev, itemIndex]);
    setActiveItemIdx(itemIndex);

    // Open question overlay
    setSelectedAnswer('');
    setFillAnswer('');
    const qIdx = itemIndex % (flowerConfig.questions.length || 1);
    setCurrentQuestionIdx(qIdx);
  };

  // Submit question answer
  const handleSubmitAnswer = async () => {
    if (answerLock.current || historyLoading) return;
    if (currentQuestionIdx === null || isTimeUp || isGameCompleted) return;
    const q = flowerConfig.questions[currentQuestionIdx];
    if (!q) return;

    const isFillType = q.type === 'fill';
    const isBoolType = q.type === 'bool';
    let isCorrect = false;

    if (isFillType) {
      if (!fillAnswer.trim()) {
        alert(t.fillEmptyAlert);
        return;
      }
      isCorrect = fillAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    } else if (isBoolType) {
      if (!selectedAnswer) {
        alert(t.selectAlert);
        return;
      }
      const normSel = selectedAnswer.trim().toLowerCase();
      const normCorr = q.correctAnswer.trim().toLowerCase();
      isCorrect =
        normSel === normCorr ||
        (normSel === 'true' && (normCorr === 'đúng' || normCorr === 'true')) ||
        (normSel === 'false' && (normCorr === 'sai' || normCorr === 'false')) ||
        (normSel === 'đúng' && (normCorr === 'đúng' || normCorr === 'true')) ||
        (normSel === 'sai' && (normCorr === 'sai' || normCorr === 'false'));
    } else {
      if (!selectedAnswer) {
        alert(t.selectAlert);
        return;
      }
      isCorrect = selectedAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    }

    const currentP = participants[activeParticipantIdx] || participants[0];
    const itemConfig = treePositions[pickedItems[pickedItems.length - 1] || 0];
    const basePts = itemConfig?.type === 'fruit' ? 2 : 1;
    const multiplier = q.isLuckyFlower ? (q.multiplier || 2) : 1;
    const pointValue = basePts * multiplier;

    const targetItemIdx = activeItemIdx !== null ? activeItemIdx : (pickedItems[pickedItems.length - 1] ?? 0);
    const historyEntry: FlowerAnswerHistoryRecord = {
      id: attemptId.current || (attemptId.current = crypto.randomUUID()),
      itemNumber: targetItemIdx + 1,
      itemType: treePositions[targetItemIdx]?.type === 'fruit' ? 'fruit' : 'flower',
      questionId: q.id,
      questionNumber: currentQuestionIdx + 1,
      questionText: q.question,
      questionType: q.type,
      options: q.options || (q.type === 'bool' ? ['Đúng', 'Sai'] : undefined),
      participantName: currentP.name,
      participantColor: currentP.color,
      submittedAnswer: isFillType ? fillAnswer.trim() : selectedAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      pointsChange: isCorrect ? pointValue : -pointValue,
      timestamp: new Date().toLocaleString('vi-VN'),
    };
    const isAcademic = ['Điểm HĐ học tập', 'Thi đua học tập', 'Điểm học tập'].includes(flowerConfig.category);
    const pointEntry: ActivityPointRecord | null = currentUser.role === 'student' ? {
      id: historyEntry.id,
      attemptId: historyEntry.id,
      userId: currentUser.id,
      studentName: currentUser.fullName,
      classId: flowerConfig.classId,
      activityId: flowerConfig.id || 'flower_game',
      activityName: flowerConfig.title || 'Hái hoa học tập',
      source: 'flower',
      category: flowerConfig.category,
      pointType: isAcademic ? 'academic_activity' : 'training_activity',
      points: historyEntry.pointsChange,
      isCorrect,
      participantName: currentP.name,
      questionId: q.id,
      date: new Date().toISOString().slice(0, 10),
      timestamp: historyEntry.timestamp,
    } : null;
    answerLock.current = true;
    setSavingAnswer(true);
    try {
      if (pointEntry) await saveFlowerAnswerAndPoint(flowerConfig.classId, currentUser.id, historyEntry, pointEntry);
      else await saveFlowerAnswer(flowerConfig.classId, currentUser.id, historyEntry);
      setFlowerHistory(prev => [historyEntry, ...prev.filter(entry => entry.id !== historyEntry.id)].slice(0, 300));
      if (pointEntry) onActivityPointSaved?.(pointEntry);
      setHistoryError('');
    } catch {
      setHistoryError('Chưa lưu được câu trả lời. Vui lòng kiểm tra kết nối/quyền truy cập rồi bấm Nộp đáp án để thử lại.');
      return;
    } finally {
      answerLock.current = false;
      setSavingAnswer(false);
    }

    if (isCorrect) {
      if (!soundMuted) soundFx.playSuccess();

      // Update current participant's score & basket
      setParticipants(prev =>
        prev.map((p, idx) =>
          idx === activeParticipantIdx
            ? { ...p, score: p.score + pointValue, harvestedCount: p.harvestedCount + 1 }
            : p
        )
      );

      setCharacterActionMap(prev => ({ ...prev, [activeParticipantIdx]: 'happy' }));
      setSpeechBubbleText({ text: t.charCorrect, idx: activeParticipantIdx });

      // Add floating score FX over the active participant
      const totalP = Math.max(1, participants.length);
      const targetX = totalP === 1 ? 28 : 12 + activeParticipantIdx * (76 / (totalP - 1));
      const floatId = Date.now();
      setFloatingScores(prev => [
        ...prev,
        {
          id: floatId,
          text: `+${pointValue} ⭐ (${currentP.name})${q.isLuckyFlower ? ' (x' + multiplier + '!)' : ''}`,
          x: targetX,
          y: 65,
          color: currentP.color,
          isLucky: q.isLuckyFlower
        }
      ]);
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(f => f.id !== floatId));
      }, 2500);

      // Alert showing earned points and lucky multiplier if any
      alert(t.correctToast(pointValue, currentP.name, q.isLuckyFlower, multiplier));

    } else {
      if (!soundMuted) soundFx.playError();

      // Deduct equivalent points for incorrect answer (preventing negative score if desired)
      setParticipants(prev =>
        prev.map((p, idx) =>
          idx === activeParticipantIdx
            ? { ...p, score: p.score - pointValue }
            : p
        )
      );

      setCharacterActionMap(prev => ({ ...prev, [activeParticipantIdx]: 'idle' }));
      setSpeechBubbleText({ text: t.charIncorrect(pointValue), idx: activeParticipantIdx });

      // Add negative floating score FX over active participant
      const totalP = Math.max(1, participants.length);
      const targetX = totalP === 1 ? 28 : 12 + activeParticipantIdx * (76 / (totalP - 1));
      const floatId = Date.now();
      setFloatingScores(prev => [
        ...prev,
        {
          id: floatId,
          text: `-${pointValue} ❌ (${currentP.name})`,
          x: targetX,
          y: 65,
          color: '#EF4444'
        }
      ]);
      setTimeout(() => {
        setFloatingScores(prev => prev.filter(f => f.id !== floatId));
      }, 2500);

      // Alert with penalty deduction and reveal correct answer
      alert(t.incorrectToast(pointValue, currentP.name, q.correctAnswer));


    }


    // If Turn-based mode, advance turn to next participant
    if (playMode === 'turn_based') {
      setActiveParticipantIdx(prev => (prev + 1) % Math.max(1, participants.length));
    }

    // Close question overlay & return to garden
    setCurrentQuestionIdx(null);
    setActiveItemIdx(null);
    setSelectedAnswer('');
    setFillAnswer('');
  };

  // Helper to re-generate teacher participants list when count or type changes
  const handleTeacherCountChange = (newCount: number, pType: FlowerParticipantType) => {
    setTeacherPartCount(newCount);
    setTeacherParticipants(prev => {
      const updated: FlowerParticipant[] = [];
      const label = pType === 'team' ? 'Tổ' : pType === 'group' ? 'Nhóm' : 'Học sinh';
      for (let i = 0; i < newCount; i++) {
        if (prev[i]) {
          updated.push(prev[i]);
        } else {
          updated.push({
            id: `p_${i + 1}`,
            name: `${label} ${i + 1}`,
            color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            score: 0,
            harvestedCount: 0
          });
        }
      }
      return updated;
    });
  };

  // Save all teacher settings
  const handleSaveTeacherSettings = async () => {
    if (!Number.isInteger(teacherTimeMinutes) || teacherTimeMinutes < 1 || teacherTimeMinutes > 120) {
      setHistoryError('Thời gian chơi phải từ 1 đến 120 phút.'); return;
    }
    if (teacherParticipants.length < 1 || teacherParticipants.some(p => !p.name.trim())) {
      setHistoryError('Cần có người chơi và nhập đủ tên người chơi.'); return;
    }
    if (teacherIsActive && !flowerConfig.questions.length) {
      setHistoryError('Hãy thêm câu hỏi trước khi kích hoạt trò chơi.'); return;
    }
    const updatedConfig: FlowerGameConfig = {
      ...flowerConfig,
      playMode: teacherPlayMode,
      participantType: teacherPartType,
      participantsCount: teacherPartCount,
      participants: teacherParticipants.map(p => ({ ...p, name: p.name.trim(), score: 0, harvestedCount: 0 })),
      timeMinutes: teacherTimeMinutes,
      category: teacherCategory,
      isActive: teacherIsActive
    };

    if (!await persistConfig(updatedConfig)) return;

    setParticipants(updatedConfig.participants!);
    setIsPlaying(false);
    setCurrentQuestionIdx(null);
    setActiveItemIdx(null);
    setActiveParticipantIdx(0);
    setShowTeacherModal(false);
    if (!soundMuted) soundFx.playSuccess();
  };

  // Add Question in Teacher Modal
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim()) return;
    if (editingQuestionId && !flowerConfig.questions.some(q => q.id === editingQuestionId)) {
      setHistoryError('Câu hỏi đã bị xóa. Hãy hủy sửa và thêm câu hỏi mới.'); return;
    }

    let finalOptions: string[] | undefined = undefined;
    let finalCorrectAns = newQCorrectAns.trim();

    if (newQType === 'mcq') {
      finalOptions = [newQOpt1, newQOpt2, newQOpt3, newQOpt4].map(o => o.trim()).filter(Boolean);
      if (finalOptions.length < 2) {
        alert('Vui lòng nhập ít nhất 2 phương án lựa chọn!');
        return;
      }
      if (!finalCorrectAns) {
        finalCorrectAns = finalOptions[0];
      }
    } else if (newQType === 'bool') {
      finalOptions = ['Đúng', 'Sai'];
      if (finalCorrectAns.toLowerCase() === 'true') finalCorrectAns = 'Đúng';
      if (finalCorrectAns.toLowerCase() === 'false') finalCorrectAns = 'Sai';
      if (!finalCorrectAns) {
        finalCorrectAns = finalOptions[0];
      }
    }

    const newQuestion: FlowerGameQuestion = {
      id: editingQuestionId || crypto.randomUUID(),
      question: newQText.trim(),
      type: newQType,
      options: finalOptions,
      correctAnswer: finalCorrectAns,
      isLuckyFlower: newQIsLucky,
      multiplier: newQIsLucky ? newQMultiplier : 1
    };

    if (!finalCorrectAns) { setHistoryError('Vui lòng nhập đáp án đúng.'); return; }
    if (finalOptions && !finalOptions.includes(finalCorrectAns)) { setHistoryError('Đáp án đúng phải nằm trong các phương án.'); return; }
    if (finalOptions && new Set(finalOptions.map(o => o.toLowerCase())).size !== finalOptions.length) { setHistoryError('Các phương án không được trùng nhau.'); return; }
    if (!await persistConfig({
        ...flowerConfig,
        questions: editingQuestionId ? flowerConfig.questions.map(q => q.id === editingQuestionId ? newQuestion : q) : [...flowerConfig.questions, newQuestion]
      })) return;

    if (!soundMuted) soundFx.playSuccess();
    // Reset question form
    setEditingQuestionId(null);
    setNewQText('');
    setNewQOpt1('');
    setNewQOpt2('');
    setNewQOpt3('');
    setNewQOpt4('');
    setNewQCorrectAns('');
    setNewQIsLucky(false);
  };

  // Delete Question in Teacher Modal
  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi cây?')) return;
    if (!await persistConfig({
        ...flowerConfig,
        isActive: flowerConfig.questions.length > 1 && flowerConfig.isActive,
        questions: flowerConfig.questions.filter(q => q.id !== qId)
      })) return;
    if (editingQuestionId === qId) {
      setEditingQuestionId(null);
      setNewQText(''); setNewQCorrectAns('');
      setNewQOpt1(''); setNewQOpt2(''); setNewQOpt3(''); setNewQOpt4('');
      setNewQIsLucky(false);
    }
    if (!soundMuted) soundFx.playClick();
  };

  // Sorted participants for leaderboard
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
  const totalCombinedScore = participants.reduce((sum, p) => sum + p.score, 0);

  return (
    <div className="w-full select-none" id="learning-garden-main-container">
      {configSuccess && <div role="status" className="fixed bottom-4 right-4 z-[200] rounded-xl bg-emerald-50 p-4 text-emerald-800 shadow-lg">{configSuccess}<button className="ml-3 underline" onClick={() => setConfigSuccess('')}>Đóng</button></div>}
      {savingConfig && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5">Đang lưu thay đổi...</p></div>}
      {historyLoading && <p role="status" className="mb-3 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">Đang tải lịch sử Hái hoa...</p>}
      {historyError && <div role="alert" className="fixed top-4 right-4 z-[200] max-w-md rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 shadow-lg">{historyError}<button className="ml-3 underline" onClick={() => setHistoryError('')}>Đóng</button></div>}
      {savingAnswer && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5 font-bold text-slate-800">Đang lưu câu trả lời...</p></div>}
      {/* 2D/2.5D CARTOON GAME CANVAS */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(14,165,233,0.28)] border-4 border-[#38BDF8] bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#BAE6FD] min-h-[620px] sm:min-h-[680px] md:min-h-[740px] flex flex-col justify-between">
        
        {/* ========================================================================= */}
        {/* 1. TOP IN-GAME HUD */}
        {/* ========================================================================= */}
        <div className="relative z-30 flex items-center justify-between p-3 sm:p-4 flex-wrap gap-2.5 bg-gradient-to-b from-sky-900/40 via-sky-800/20 to-transparent">
          {/* Left HUD: Title Plaque & Mode Badge */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Wooden Plaque Title */}
            <div className="bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] px-3.5 sm:px-4 py-1.5 rounded-2xl border-2 border-[#F59E0B] shadow-[0_4px_0_#D97706,0_6px_12px_rgba(0,0,0,0.15)] flex items-center gap-2">
              <span className="text-xl sm:text-2xl animate-bounce">🌸</span>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-[#92400E] tracking-wide uppercase drop-shadow-xs flex items-center gap-1.5">
                  {t.gameTitle}
                </h2>
                <div className="text-[10px] font-extrabold text-[#B45309] flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-200/80 text-[#78350F]">
                    {playMode === 'turn_based' ? '🔄 Chơi lần lượt' : '⚡ Chọn đội trả lời'}
                  </span>
                  <span>• {participants.length} {participantType === 'team' ? 'Tổ' : participantType === 'group' ? 'Nhóm' : 'Học sinh'}</span>
                </div>
              </div>
            </div>

            {/* Current Turn Badge / Quick Picker Selector (When Playing) */}
            {isPlaying && (
              <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-amber-300 shadow-[0_4px_0_#F59E0B] animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    {playMode === 'turn_based' ? t.turnIndicator : 'Đội đang hái:'}
                  </span>
                  <div
                    style={{ backgroundColor: participants[activeParticipantIdx]?.color || '#EF4444' }}
                    className="px-2.5 py-0.5 rounded-full text-white text-xs font-black shadow-xs flex items-center gap-1"
                  >
                    <Crown className="w-3 h-3 text-yellow-300" />
                    <span>{participants[activeParticipantIdx]?.name}</span>
                  </div>
                </div>

                {/* Quick switcher if in All Together mode */}
                {playMode === 'all_together' && (
                  <div className="flex items-center gap-1 ml-1 border-l pl-1.5 border-slate-200">
                    {participants.map((p, idx) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (!soundMuted) soundFx.playPop();
                          if (!answerLock.current && currentQuestionIdx === null) setActiveParticipantIdx(idx);
                        }}
                        style={{
                          backgroundColor: activeParticipantIdx === idx ? p.color : '#F1F5F9',
                          color: activeParticipantIdx === idx ? '#FFFFFF' : '#475569',
                          borderColor: p.color
                        }}
                        className={`w-6 h-6 rounded-lg text-[10px] font-black border flex items-center justify-center cursor-pointer transition-transform ${
                          activeParticipantIdx === idx ? 'scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={`Chọn ${p.name} hái hoa`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right HUD: Teams Scoreboard Bar, Timer, Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Countdown Timer Plaque */}
            {isPlaying && (
              <div className={`px-3 py-1.5 rounded-2xl border-2 shadow-[0_4px_0_rgba(0,0,0,0.15)] flex items-center gap-1.5 font-mono text-xs font-black transition-all ${
                timeLeft <= 60
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-[0_4px_0_#9F1239]'
                  : 'bg-white/95 text-[#1E293B] border-[#CBD5E1] shadow-[0_4px_0_#94A3B8]'
              }`}>
                <Clock className={`w-3.5 h-3.5 ${timeLeft <= 60 ? 'text-white animate-spin' : 'text-[#0284C7]'}`} />
                <span>
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Language Switcher */}
            <div className="flex items-center bg-white/90 p-1 rounded-2xl border border-white shadow-xs">
              <button
                type="button"
                onClick={() => {
                  if (!soundMuted) soundFx.playClick();
                  setFlowerLang('vi');
                }}
                className={`px-2 py-0.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  flowerLang === 'vi'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇻🇳 VI
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!soundMuted) soundFx.playClick();
                  setFlowerLang('en');
                }}
                className={`px-2 py-0.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                  flowerLang === 'en'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setSoundMuted(!soundMuted);
                if (soundMuted) soundFx.playClick();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-white/95 text-[#0284C7] shadow-[0_3px_0_#94A3B8] border border-white flex items-center justify-center cursor-pointer hover:scale-105 active:translate-y-0.5 transition-transform"
              title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {soundMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-sky-600" />}
            </button>

            {/* Guide Button */}
            <button
              onClick={() => {
                if (!soundMuted) soundFx.playClick();
                setShowGuideModal(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] text-[#78350F] font-black text-[11px] shadow-[0_3px_0_#D97706] border border-[#FEF3C7] cursor-pointer hover:brightness-105 active:translate-y-0.5 transition-all flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span className="hidden sm:inline">{t.guideBtn}</span>
            </button>

            {/* Q&A History & Review Button */}
            <button
              onClick={() => {
                if (!soundMuted) soundFx.playClick();
                setShowHistoryModal(true);
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-gradient-to-b from-indigo-500 to-purple-600 text-white font-black text-[11px] shadow-[0_3px_0_#4C1D95] border border-indigo-300 cursor-pointer hover:brightness-105 active:translate-y-0.5 transition-all flex items-center gap-1.5"
              title="Xem lại lịch sử trả lời câu hỏi và ôn tập"
            >
              <History className="w-3.5 h-3.5 text-yellow-300" />
              <span>Lịch sử ({flowerHistory.length})</span>
            </button>

            {/* Teacher Settings Button */}
            {isTeacherOrAdmin && (
              <button
                id="flower-teacher-settings-btn"
                onClick={() => {
                  if (isPlaying && !isTimeUp && !isGameCompleted) { setHistoryError('Hãy kết thúc hoặc đặt lại lượt chơi trước khi sửa cài đặt/câu hỏi.'); return; }
                  if (!soundMuted) soundFx.playClick();
                  setTeacherTimeMinutes(flowerConfig.timeMinutes);
                  setTeacherCategory(flowerConfig.category);
                  setTeacherIsActive(flowerConfig.isActive);
                  setTeacherPlayMode(playMode);
                  setTeacherPartType(participantType);
                  setTeacherPartCount(participants.length);
                  setTeacherParticipants(participants.map(p => ({ ...p, score: 0, harvestedCount: 0 })));
                  setShowTeacherModal(true);
                }}
                className="px-3 py-1.5 rounded-2xl bg-white/95 hover:bg-pink-50 text-[#831843] font-black text-[11px] shadow-[0_3px_0_#F472B6] border border-[#FBCFE8] cursor-pointer active:translate-y-0.5 transition-all flex items-center gap-1.5"
                title="Cài đặt chế độ chơi, số người hái hoa & câu hỏi"
              >
                <Settings className="w-3.5 h-3.5 text-pink-600" />
                <span className="hidden md:inline">{t.settingsBtn}</span>
              </button>
            )}

            {/* Restart Button */}
            {isPlaying && (
              <button
                onClick={handleResetGame}
                className="px-2.5 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] shadow-[0_3px_0_#94A3B8] border border-slate-300 cursor-pointer active:translate-y-0.5 transition-all flex items-center gap-1"
                title="Chơi lại từ đầu"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">{t.restartBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mini Teams Scoreboard Ribbon across HUD */}
        {isPlaying && (
          <div className="relative z-25 px-4 py-1 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {participants.map((p, idx) => {
              const isCurrentTurn = idx === activeParticipantIdx;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (playMode === 'all_together') {
                      if (!soundMuted) soundFx.playPop();
                      if (!answerLock.current && currentQuestionIdx === null) setActiveParticipantIdx(idx);
                    }
                  }}
                  style={{
                    borderColor: p.color
                  }}
                  className={`px-3 py-1 rounded-2xl bg-white/90 backdrop-blur-md border-2 shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrentTurn
                      ? 'scale-105 ring-2 ring-amber-400 shadow-[0_4px_10px_rgba(245,158,11,0.3)]'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <div
                    style={{ backgroundColor: p.color }}
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px] font-black"
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-black text-slate-800">{p.name}</span>
                  <span className="text-xs font-black text-amber-600">⭐ {p.score}đ</span>
                  <span className="text-[10px] font-bold text-slate-500">({p.harvestedCount} 🌸)</span>

                  {/* Quick history button for this participant */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!soundMuted) soundFx.playClick();
                      setHistorySearchTerm(p.name);
                      setShowHistoryModal(true);
                    }}
                    className="ml-0.5 p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                    title={`Xem câu hỏi đã trả lời của ${p.name}`}
                  >
                    <History className="w-3 h-3 text-indigo-600" />
                    <span className="hidden sm:inline">📜 Xem câu hỏi</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MULTI-LAYERED 2D/2.5D GAME ENVIRONMENT SCENE */}
        {/* ========================================================================= */}
        <div className="relative w-full flex-1 min-h-[460px] sm:min-h-[520px] overflow-hidden flex flex-col justify-end">
          
          {/* Animated Sky Background & Sunlight Beams */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Sun with warm rays */}
            <div className="absolute top-4 left-10 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 shadow-[0_0_50px_rgba(253,224,71,0.8)] animate-pulse" />
            
            {/* Drifting Clouds */}
            <div className="absolute top-6 left-1/4 w-32 h-10 bg-white/70 rounded-full blur-xs animate-[bounce_8s_ease-in-out_infinite]" />
            <div className="absolute top-12 right-16 w-44 h-12 bg-white/80 rounded-full blur-xs animate-[bounce_10s_ease-in-out_infinite]" />
            <div className="absolute top-20 right-1/3 w-28 h-8 bg-white/60 rounded-full blur-xs" />
          </div>

          {/* SVG Vector World: Layered Distant Mountains, Rolling Hills, Fence, and Grand Tree */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Mountain Gradients */}
              <linearGradient id="gMountainFar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#A7F3D0" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="gMountainMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86EFAC" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
              <linearGradient id="gHillForeground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ADE80" />
                <stop offset="40%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#15803D" />
              </linearGradient>
              
              {/* Grand Tree Gradients */}
              <linearGradient id="gTreeTrunk" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#78350F" />
                <stop offset="40%" stopColor="#92400E" />
                <stop offset="70%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="gTreeCrownMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86EFAC" />
                <stop offset="25%" stopColor="#4ADE80" />
                <stop offset="65%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#16A34A" />
              </linearGradient>
              <linearGradient id="gTreeCrownShadow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#15803D" />
                <stop offset="100%" stopColor="#14532D" />
              </linearGradient>
            </defs>

            {/* Layer 1: Distant Mountains */}
            <path d="M0 380 Q200 240 450 330 T900 280 L1000 320 L1000 600 L0 600 Z" fill="url(#gMountainFar)" />
            
            {/* Layer 2: Midground Rolling Green Hill */}
            <path d="M0 420 Q300 320 600 390 T1000 360 L1000 600 L0 600 Z" fill="url(#gMountainMid)" />

            {/* Layer 3: Foreground Main Meadow Grass */}
            <path d="M0 460 Q250 410 550 440 T1000 420 L1000 600 L0 600 Z" fill="url(#gHillForeground)" />

            {/* Wooden Farm Fence on the Left */}
            <g transform="translate(40, 390)">
              <rect x="0" y="35" width="140" height="7" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
              <rect x="0" y="60" width="140" height="7" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
              {[10, 45, 80, 115].map((xPos, idx) => (
                <polygon
                  key={idx}
                  points={`${xPos},85 ${xPos + 12},85 ${xPos + 12},25 ${xPos + 6},12 ${xPos},25`}
                  fill="#D97706"
                  stroke="#78350F"
                  strokeWidth="1.5"
                />
              ))}
            </g>

            {/* =================================================================== */}
            {/* MAJESTIC GRAND LEARNING TREE (CENTRAL HERO OBJECT) */}
            {/* =================================================================== */}
            <g transform="translate(500, 310)">
              {/* Thick Gnarled Roots */}
              <path d="M-60 190 Q-120 210 -160 220 Q-90 185 -40 180" fill="#78350F" />
              <path d="M60 190 Q120 210 160 220 Q90 185 40 180" fill="#78350F" />
              
              {/* Strong Organic Trunk & Major Branches */}
              <path
                d="M-55 190 C-45 120 -80 50 -40 -40 C-20 -70 -70 -120 -50 -160 C-30 -140 -10 -90 10 -90 C30 -90 50 -140 70 -160 C50 -120 0 -70 20 -40 C60 50 25 120 35 190 Z"
                fill="url(#gTreeTrunk)"
                stroke="#78350F"
                strokeWidth="4"
              />

              {/* Bark Texture Details */}
              <path d="M-20 60 Q-25 100 -20 140" stroke="#78350F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
              <path d="M10 40 Q5 90 10 150" stroke="#78350F" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />

              {/* Deep Shadow Layer for Canopy */}
              <ellipse cx="0" cy="-140" rx="300" ry="200" fill="url(#gTreeCrownShadow)" opacity="0.95" />
              <ellipse cx="-170" cy="-90" rx="170" ry="130" fill="url(#gTreeCrownShadow)" opacity="0.95" />
              <ellipse cx="170" cy="-90" rx="170" ry="130" fill="url(#gTreeCrownShadow)" opacity="0.95" />
              <ellipse cx="0" cy="-210" rx="200" ry="140" fill="url(#gTreeCrownShadow)" opacity="0.95" />

              {/* Lush Vibrant Mid-Green Foliage Clouds */}
              <ellipse cx="0" cy="-140" rx="280" ry="180" fill="url(#gTreeCrownMain)" />
              <ellipse cx="-150" cy="-90" rx="150" ry="110" fill="url(#gTreeCrownMain)" />
              <ellipse cx="150" cy="-90" rx="150" ry="110" fill="url(#gTreeCrownMain)" />
              <ellipse cx="0" cy="-200" rx="180" ry="120" fill="url(#gTreeCrownMain)" />
              
              {/* Highlight Clusters */}
              <ellipse cx="-80" cy="-170" rx="110" ry="75" fill="#86EFAC" opacity="0.5" />
              <ellipse cx="80" cy="-170" rx="110" ry="75" fill="#86EFAC" opacity="0.5" />
              <ellipse cx="0" cy="-110" rx="130" ry="85" fill="#BBF7D0" opacity="0.35" />
            </g>

            {/* Foreground Wildflowers, Daisies */}
            <g>
              <circle cx="80" cy="530" r="5" fill="#FFFFFF" /><circle cx="80" cy="530" r="2.5" fill="#FACC15" />
              <circle cx="120" cy="550" r="6" fill="#FFFFFF" /><circle cx="120" cy="550" r="3" fill="#FACC15" />
              <circle cx="280" cy="540" r="5" fill="#F472B6" /><circle cx="280" cy="540" r="2" fill="#FDE047" />
              <circle cx="480" cy="555" r="6" fill="#FDE047" /><circle cx="480" cy="555" r="2.5" fill="#EA580C" />
              <circle cx="720" cy="540" r="5.5" fill="#FFFFFF" /><circle cx="720" cy="540" r="2.5" fill="#FACC15" />
              <circle cx="880" cy="530" r="7" fill="#FB7185" /><circle cx="880" cy="530" r="3" fill="#FEF08A" />
            </g>
          </svg>

          {/* ========================================================================= */}
          {/* 3. INTERACTIVE 2.5D FLOWERS & FRUITS ON TREE BRANCHES (HIDDEN POINTS) */}
          {/* ========================================================================= */}
          {isPlaying && (
            <div className="absolute inset-0 z-20 pointer-events-auto">
              {treePositions.map((item, idx) => {
                const isPicked = pickedItems.includes(idx);
                const isFruit = item.type === 'fruit';

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isPicked) {
                        setHistorySearchTerm(`#${idx + 1}`);
                        setShowHistoryModal(true);
                      } else {
                        handlePickItem(idx);
                      }
                    }}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300 cursor-pointer ${
                      isPicked
                        ? 'opacity-65 scale-75 hover:scale-95 hover:z-30'
                        : 'hover:scale-135 active:scale-95 animate-bounce-subtle hover:z-30'
                    }`}
                    title={
                      isPicked
                        ? `Đã hái (${isFruit ? 'Quả' : 'Hoa'} #${idx + 1}) - Bấm để xem lại lịch sử trả lời`
                        : `${isFruit ? t.fruitTip : t.flowerTip} #${idx + 1}`
                    }
                  >
                    {/* Explicit Item Number Badge */}
                    <div
                      className={`absolute -top-1.5 -right-1.5 z-20 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border flex items-center gap-0.5 ${
                        isPicked
                          ? 'bg-emerald-600 text-white border-emerald-300'
                          : isFruit
                          ? 'bg-amber-400 text-amber-950 border-amber-600'
                          : 'bg-pink-500 text-white border-pink-200'
                      }`}
                    >
                      <span>#{idx + 1}</span>
                      {isPicked && <span className="text-[9px]">✓</span>}
                    </div>
                    {isFruit ? (
                      /* 3D Knowledge Red Apple (No point label) */
                      <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)] group">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform group-hover:rotate-6 transition-transform">
                          <path d="M50 20 Q54 8 50 4" stroke="#78350F" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                          <path d="M50 14 Q68 8 72 20 Q56 22 50 14 Z" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
                          <circle cx="50" cy="56" r="38" fill="#EF4444" stroke="#B91C1C" strokeWidth="3" />
                          <ellipse cx="38" cy="42" rx="10" ry="14" fill="#FCA5A5" opacity="0.85" transform="rotate(-25 38 42)" />
                          <circle cx="34" cy="38" r="4" fill="#FFFFFF" opacity="0.95" />
                        </svg>
                      </div>
                    ) : (
                      /* 3D Blooming Cherry Flower (No point label or multiplier reveal) */
                      <div className="relative w-12 h-12 sm:w-15 sm:h-15 flex items-center justify-center filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.35)] group">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform group-hover:rotate-12 transition-transform">
                          <circle cx="50" cy="24" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2.5" />
                          <circle cx="75" cy="42" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2.5" />
                          <circle cx="65" cy="72" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2.5" />
                          <circle cx="35" cy="72" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2.5" />
                          <circle cx="25" cy="42" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2.5" />
                          <circle cx="50" cy="50" r="15" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2.5" />
                          <circle cx="48" cy="48" r="4" fill="#FFFFFF" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 4. FLOWER PICKERS CHARACTERS CORRESPONDING TO ALL TEAMS/STUDENTS */}
          {/* ========================================================================= */}
          <div className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 flex items-end justify-around pointer-events-auto gap-2">
            {participants.map((p, idx) => {
              const isCurrentTurn = idx === activeParticipantIdx;
              const charAction = characterActionMap[idx] || 'idle';
              const isSpeaking = speechBubbleText && speechBubbleText.idx === idx;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (playMode === 'all_together') {
                      if (!soundMuted) soundFx.playPop();
                      if (!answerLock.current && currentQuestionIdx === null) setActiveParticipantIdx(idx);
                    }
                  }}
                  className={`relative flex flex-col items-center cursor-pointer transition-all duration-300 ${
                    isCurrentTurn ? 'scale-105 sm:scale-110 z-30' : 'opacity-90 hover:opacity-100 hover:scale-102'
                  }`}
                >
                  {/* Active Turn Halo / Arrow Indicator */}
                  {isCurrentTurn && (
                    <div className="absolute -top-10 sm:-top-12 flex flex-col items-center animate-bounce z-40">
                      <div
                        style={{ backgroundColor: p.color }}
                        className="px-2 py-0.5 rounded-full text-white text-[9px] sm:text-[10px] font-black shadow-md border border-white flex items-center gap-1 whitespace-nowrap"
                      >
                        <Crown className="w-2.5 h-2.5 text-yellow-300" />
                        <span>ĐẾN LƯỢT</span>
                      </div>
                      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]" style={{ borderTopColor: p.color }} />
                    </div>
                  )}

                  {/* Speech Bubble from this character */}
                  {isSpeaking && (
                    <div className="absolute -top-16 z-40 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-pink-300 shadow-md text-[10px] font-black text-pink-900 whitespace-nowrap animate-bounce">
                      <span>🌸 {speechBubbleText.text}</span>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r-2 border-b-2 border-pink-300 transform rotate-45" />
                    </div>
                  )}

                  {/* Character Illustration with Team/Student specific colors */}
                  <div className={`w-16 h-22 sm:w-22 sm:h-28 md:w-24 md:h-32 relative transition-transform duration-300 ${
                    charAction === 'reaching' ? 'scale-110 -translate-y-2' : charAction === 'happy' ? 'scale-115 -translate-y-3' : isCurrentTurn ? 'animate-bounce-subtle' : ''
                  }`}>
                    <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.3)]">
                      {/* Aura ring on floor for active team */}
                      {isCurrentTurn && (
                        <ellipse cx="50" cy="124" rx="42" ry="8" fill={p.color} opacity="0.3" className="animate-pulse" />
                      )}

                      {/* Backpack with team color */}
                      <rect x="20" y="52" width="16" height="36" rx="6" fill={p.color} stroke="#1E293B" strokeWidth="2" />
                      
                      {/* White Uniform Shirt */}
                      <path d="M30 96 L30 54 L70 54 L70 96 Z" fill="#FFFFFF" stroke={p.color} strokeWidth="2.5" />
                      
                      {/* Team-colored Tie / Collar */}
                      <polygon points="50,58 55,66 50,78 45,66" fill={p.color} />
                      
                      {/* Team-colored Shorts/Pants */}
                      <rect x="32" y="90" width="36" height="22" rx="3" fill={p.color} />
                      
                      {/* Legs & Shoes */}
                      <rect x="36" y="110" width="10" height="12" fill="#FFE5D4" />
                      <rect x="54" y="110" width="10" height="12" fill="#FFE5D4" />
                      <ellipse cx="40" cy="122" rx="8" ry="5" fill="#1E293B" />
                      <ellipse cx="60" cy="122" rx="8" ry="5" fill="#1E293B" />
                      
                      {/* Chibi Head */}
                      <ellipse cx="50" cy="32" rx="28" ry="26" fill="#FFE5D4" />
                      
                      {/* Cute Hair with Team Headband/Cap */}
                      <path d="M22 28 C18 10 32 4 50 4 C68 4 82 10 78 28 C72 14 62 12 50 12 C38 12 28 14 22 28 Z" fill="#3D2314" />
                      <path d="M20 30 C24 40 28 44 30 46" stroke="#3D2314" strokeWidth="3" fill="none" />
                      
                      {/* Team Headband */}
                      <rect x="24" y="18" width="52" height="6" rx="3" fill={p.color} opacity="0.9" />
                      
                      {/* Rosy Cheeks */}
                      <circle cx="32" cy="38" r="4.5" fill="#FB7185" opacity="0.7" />
                      <circle cx="68" cy="38" r="4.5" fill="#FB7185" opacity="0.7" />
                      
                      {/* Big Sparkly Anime Eyes */}
                      <ellipse cx="38" cy="30" rx="5" ry="6" fill="#1E293B" />
                      <circle cx="36.5" cy="28" r="2" fill="#FFFFFF" />
                      <ellipse cx="62" cy="30" rx="5" ry="6" fill="#1E293B" />
                      <circle cx="60.5" cy="28" r="2" fill="#FFFFFF" />
                      
                      {/* Smile / Mouth */}
                      <path d="M44 38 Q50 45 56 38" stroke="#E11D48" strokeWidth="3" strokeLinecap="round" fill="#F43F5E" />
                      
                      {/* Arms */}
                      {charAction === 'reaching' ? (
                        <path d="M68 60 Q86 40 88 20" stroke="#FFE5D4" strokeWidth="6" strokeLinecap="round" fill="none" />
                      ) : charAction === 'happy' ? (
                        <g>
                          <path d="M30 60 Q14 40 18 24" stroke="#FFE5D4" strokeWidth="6" strokeLinecap="round" fill="none" />
                          <path d="M70 60 Q86 40 82 24" stroke="#FFE5D4" strokeWidth="6" strokeLinecap="round" fill="none" />
                        </g>
                      ) : isCurrentTurn ? (
                        <path d="M68 60 Q82 50 84 36" stroke="#FFE5D4" strokeWidth="6" strokeLinecap="round" fill="none" />
                      ) : (
                        <path d="M68 60 Q78 72 74 84" stroke="#FFE5D4" strokeWidth="6" strokeLinecap="round" fill="none" />
                      )}
                    </svg>
                  </div>

                  {/* Team/Student Name Plate & Score */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!soundMuted) soundFx.playClick();
                      setHistorySearchTerm(p.name);
                      setShowHistoryModal(true);
                    }}
                    style={{ backgroundColor: p.color }}
                    className="px-2 sm:px-2.5 py-0.5 rounded-full text-white text-[9px] sm:text-[10px] font-black -mt-1 sm:-mt-2 shadow-md border border-white/50 flex items-center gap-1 hover:scale-105 transition-transform cursor-pointer"
                    title={`Bấm để xem lịch sử câu hỏi đã trả lời của ${p.name}`}
                  >
                    <span>{p.name}</span>
                    <span className="bg-black/25 px-1 rounded-md text-amber-200">+{p.score}đ</span>
                    <span className="text-[8px] bg-white/20 px-1 rounded-full text-white">📜</span>
                  </button>

                  {/* Individual Harvest Basket next to this picker */}
                  <div className="w-10 h-9 sm:w-12 sm:h-10 relative mt-1">
                    <svg viewBox="0 0 70 60" className="w-full h-full drop-shadow-md">
                      <path d="M15 30 C15 8 55 8 55 30" stroke="#92400E" strokeWidth="3.5" fill="none" />
                      <path d="M10 24 L18 56 L52 56 L60 24 Z" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
                      <line x1="20" y1="26" x2="24" y2="54" stroke="#D97706" strokeWidth="2" />
                      <line x1="35" y1="24" x2="35" y2="56" stroke="#D97706" strokeWidth="2" />
                      <line x1="50" y1="26" x2="46" y2="54" stroke="#D97706" strokeWidth="2" />
                      
                      {p.harvestedCount > 0 && <circle cx="28" cy="22" r="5.5" fill="#F472B6" />}
                      {p.harvestedCount > 1 && <circle cx="42" cy="20" r="5.5" fill="#EF4444" />}
                      {p.harvestedCount > 2 && <circle cx="35" cy="18" r="4.5" fill="#FDE047" />}
                      {p.harvestedCount > 3 && <circle cx="24" cy="16" r="4" fill="#FB923C" />}
                      {p.harvestedCount > 4 && <circle cx="46" cy="16" r="4.5" fill="#EC4899" />}
                    </svg>
                    <div
                      style={{ backgroundColor: p.color }}
                      className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-white text-[8px] font-black border border-white"
                    >
                      {p.harvestedCount}🌸
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Score Particles */}
          {floatingScores.map(f => (
            <div
              key={f.id}
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
              className="absolute z-40 text-xl sm:text-2xl font-black drop-shadow-[0_4px_0_#78350F] animate-[bounce_1.5s_ease-out] pointer-events-none transform -translate-x-1/2"
            >
              <span style={{ color: f.color }}>{f.text}</span>
            </div>
          ))}

          {/* Harvest Flight Particles */}
          {pickingParticles.map(p => (
            <div
              key={p.id}
              style={{
                left: `${p.startX + (p.targetX - p.startX) * p.progress}%`,
                top: `${p.startY + (p.targetY - p.startY) * p.progress - Math.sin(p.progress * Math.PI) * 20}%`
              }}
              className="absolute z-40 text-2xl sm:text-3xl filter drop-shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            >
              {p.itemType === 'fruit' ? '🍎' : '🌸'}
            </div>
          ))}

          {/* ========================================================================= */}
          {/* 5. START GAME SPLASH OVERLAY (IF NOT PLAYING) */}
          {/* ========================================================================= */}
          {!isPlaying && (
            <div className="absolute inset-0 z-30 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center border-4 border-[#FDE68A] shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-4 animate-in zoom-in-95 duration-200">
                <div className="text-5xl sm:text-6xl animate-bounce">🌳🌺🍎</div>
                
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-[#92400E] uppercase tracking-wide">
                    {t.gameTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
                    {t.gameSubtitle}
                  </p>
                </div>

                {/* Game Mode Summary Box */}
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-left space-y-1.5">
                  <div className="flex items-center justify-between font-black text-amber-900">
                    <span>🎮 Chế độ: {playMode === 'turn_based' ? '🔄 Chơi lần lượt từng đội' : '⚡ Tất cả cùng chơi'}</span>
                    <span className="text-amber-700">⏱️ {flowerConfig.timeMinutes || 5} phút</span>
                  </div>
                  <div className="text-slate-600 text-[11px] flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-700">Người hái hoa ({participants.length}):</span>
                    {participants.map(p => (
                      <span
                        key={p.id}
                        style={{ backgroundColor: p.color }}
                        className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Notice */}
                {!flowerConfig.isActive && !isTeacherOrAdmin ? (
                  <div className="p-3 bg-rose-50 text-rose-900 border border-rose-300 rounded-2xl text-xs font-bold flex items-center gap-2 text-left">
                    <span className="text-xl">🔒</span>
                    <div>{t.lockedDesc}</div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 text-left">
                    <span className="text-xl">🚀</span>
                    <div>{t.activatedDesc}</div>
                  </div>
                )}

                {/* Big 3D Start Button */}
                <button
                  id="flower-start-game-btn"
                  onClick={handleStartGame}
                  disabled={!flowerConfig.isActive && !isTeacherOrAdmin}
                  className={`w-full py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all flex items-center justify-center gap-3 cursor-pointer ${
                    !flowerConfig.isActive && !isTeacherOrAdmin
                      ? 'bg-slate-300 text-slate-500 border border-slate-300 cursor-not-allowed opacity-80'
                      : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white shadow-[0_6px_0_#9F1239,0_12px_24px_rgba(225,29,72,0.4)] hover:scale-102 active:translate-y-1 animate-pulse'
                  }`}
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>🚀 {t.startBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 6. QUESTION OVERLAY */}
        {/* ========================================================================= */}
        {currentQuestionIdx !== null && (
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] rounded-3xl p-5 sm:p-7 max-w-xl w-full border-4 border-[#F59E0B] shadow-[0_15px_35px_rgba(0,0,0,0.3),0_8px_0_#D97706] space-y-4 animate-in zoom-in-95 duration-200 relative">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-[#FCD34D] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-spin-slow">🌸</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#92400E]">
                        {t.questionTitle} #{currentQuestionIdx + 1}
                      </span>
                      <span
                        style={{ backgroundColor: participants[activeParticipantIdx]?.color }}
                        className="px-2 py-0.5 rounded-full text-white text-[10px] font-black"
                      >
                        Đội: {participants[activeParticipantIdx]?.name}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-[#B45309]">
                      {flowerConfig.questions[currentQuestionIdx]?.type === 'fill'
                        ? '✍️ Điền từ vào chỗ trống'
                        : flowerConfig.questions[currentQuestionIdx]?.type === 'bool'
                        ? '⚖️ Đúng hay Sai'
                        : '🎯 Trắc nghiệm 4 lựa chọn'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (answerLock.current) return;
                    setPickedItems(prev => prev.filter(item => item !== activeItemIdx));
                    setActiveItemIdx(null);
                    setCurrentQuestionIdx(null);
                  }}
                  className="w-8 h-8 rounded-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] font-black border border-[#F59E0B] flex items-center justify-center cursor-pointer"
                  title={t.cancelBtn}
                >
                  ✕
                </button>
              </div>

              {/* Mystery Points Hint (Points and multipliers remain secret until submitted) */}
              <div className="px-3 py-1.5 rounded-2xl bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs">
                <span>🎁</span>
                <span>Điểm số và phần thưởng bí mật sẽ mở khóa ngay khi bạn trả lời đúng!</span>
              </div>

              {/* Question Text */}
              <div className="bg-white/90 p-4 rounded-2xl border-2 border-[#FDE68A] shadow-inner">
                <h4 className="text-sm sm:text-base font-black text-slate-800 leading-snug">
                  {flowerConfig.questions[currentQuestionIdx]?.question}
                </h4>
              </div>

              {/* Options */}
              {flowerConfig.questions[currentQuestionIdx]?.type === 'fill' && (
                <div className="space-y-2">
                  <label className="block text-xs font-black text-[#92400E]">
                    ✍️ {t.fillLabel}
                  </label>
                  <input
                    type="text"
                    value={fillAnswer}
                    onChange={e => setFillAnswer(e.target.value)}
                    placeholder={t.fillPlaceholder}
                    className="w-full p-3.5 bg-white border-2 border-[#F59E0B] focus:border-[#D97706] rounded-2xl text-sm font-bold text-slate-800 focus:outline-none shadow-inner"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSubmitAnswer();
                    }}
                    autoFocus
                  />
                </div>
              )}

              {flowerConfig.questions[currentQuestionIdx]?.type === 'bool' && (
                <div className="grid grid-cols-2 gap-3">
                  {(flowerLang === 'en' ? ['True', 'False'] : ['Đúng', 'Sai']).map(opt => {
                    const isSelected = selectedAnswer === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          if (!soundMuted) soundFx.playPop();
                          setSelectedAnswer(opt);
                        }}
                        className={`p-4 rounded-2xl text-sm sm:text-base font-black border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-white border-white shadow-[0_4px_0_#9A3412] scale-102'
                            : 'bg-white/90 hover:bg-white text-[#78350F] border-[#FCD34D] shadow-[0_3px_0_#D97706]'
                        }`}
                      >
                        {opt === 'Đúng' || opt === 'True' ? '✅ ' : '❌ '} {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {flowerConfig.questions[currentQuestionIdx]?.type === 'mcq' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(flowerConfig.questions[currentQuestionIdx]?.options || []).map((opt, oIdx) => {
                    const isSelected = selectedAnswer === opt;
                    const optLetter = String.fromCharCode(65 + oIdx);
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => {
                          if (!soundMuted) soundFx.playPop();
                          setSelectedAnswer(opt);
                        }}
                        className={`p-3 rounded-2xl text-xs sm:text-sm font-black border-2 transition-all text-left flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-white border-white shadow-[0_4px_0_#9A3412] scale-102'
                            : 'bg-white/90 hover:bg-white text-[#78350F] border-[#FCD34D] shadow-[0_3px_0_#D97706]'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-white text-orange-600' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {optLetter}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={savingAnswer || historyLoading}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-black rounded-2xl text-sm shadow-[0_5px_0_#9F1239] hover:scale-102 active:translate-y-1 transition-transform cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{savingAnswer ? 'Đang lưu câu trả lời...' : historyLoading ? 'Đang tải dữ liệu...' : `⭐ ${t.submitBtn}`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. VICTORY / TIME'S UP PODIUM OVERLAY */}
        {/* ========================================================================= */}
        {(isGameCompleted || isTimeUp) && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-gradient-to-b from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center border-4 border-[#F59E0B] shadow-[0_20px_50px_rgba(0,0,0,0.4),0_8px_0_#D97706] space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-5xl sm:text-6xl animate-bounce">
                {isGameCompleted ? '🏆🎉🌺' : '⏰🌸✨'}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#92400E] uppercase">
                  {isGameCompleted ? t.victoryTitle : t.timeUpTitle}
                </h3>
                <p className="text-xs text-slate-600 font-semibold">
                  {t.itemsCollected} <strong>{pickedItems.length} / {treePositions.length}</strong> • {t.totalEarned} <strong>+{totalCombinedScore} ⭐</strong>
                </p>
              </div>

              {/* Leaderboard Podium */}
              <div className="p-4 bg-white/95 rounded-2xl border-2 border-[#FDE68A] shadow-inner space-y-2.5">
                <div className="text-xs text-slate-600 font-black uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>BẢNG XẾP HẠNG THI ĐUA HÁI HOA</span>
                </div>

                <div className="space-y-2">
                  {sortedParticipants.map((p, rank) => (
                    <div
                      key={p.id}
                      style={{ borderColor: p.color }}
                      className={`p-2.5 rounded-xl border-2 flex items-center justify-between text-xs font-bold ${
                        rank === 0 ? 'bg-amber-50/80 shadow-xs ring-1 ring-amber-300' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black ${
                          rank === 0 ? 'bg-amber-400 text-amber-950' : rank === 1 ? 'bg-slate-300 text-slate-800' : rank === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                        </span>
                        <div
                          style={{ backgroundColor: p.color }}
                          className="w-3 h-3 rounded-full"
                        />
                        <span className="font-extrabold text-slate-800">{p.name}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 text-[11px]">{p.harvestedCount} 🌸</span>
                        <span className="text-sm font-black text-amber-600">+{p.score} ⭐</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Play Again Button */}
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black rounded-2xl text-sm shadow-[0_5px_0_#9F1239] hover:scale-102 active:translate-y-1 transition-transform cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.playAgainBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 8. HOW TO PLAY GUIDE MODAL */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-[#7DD3FC] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-[#0284C7] flex items-center gap-2">
                <span>🌸</span> {t.guideBtn} {t.gameTitle}
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                <Users className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-amber-900">Thi đấu theo Đội / Tổ / Học sinh</div>
                  <div className="text-xs text-slate-600">Giáo viên có thể cài đặt chế độ <strong>Chơi lần lượt</strong> hoặc <strong>Cùng chơi đồng thời</strong> cho 2-6 đội. Số người hái hoa trên sân tương ứng với số đội tham gia!</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-2.5">
                <span className="text-xl">🎁</span>
                <div>
                  <div className="font-extrabold text-[#166534]">Điểm số bí mật trên từng hoa/quả</div>
                  <div className="text-xs text-slate-600">Điểm số không hiển thị trên hoa. Chỉ khi trả lời câu hỏi, điểm số thực tế (và các hệ số nhân thưởng may mắn) mới được mở khóa và hiển thị!</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-2.5">
                <span className="text-xl">✅</span>
                <div>
                  <div className="font-extrabold text-[#065F46]">Trả lời đúng: Nhận trọn điểm thưởng</div>
                  <div className="text-xs text-slate-600">Nếu trả lời đúng, đội được cộng số điểm tương ứng (hoa thường, quả tri thức hoặc nhân điểm nếu trúng hoa may mắn).</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5">
                <span className="text-xl">❌</span>
                <div>
                  <div className="font-extrabold text-[#991B1B]">Trả lời sai: Bị trừ số điểm tương đương</div>
                  <div className="text-xs text-slate-600">Nếu trả lời sai, đội sẽ bị trừ đi số điểm tương ứng với giá trị câu hỏi đó và công bố đáp án chính xác.</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-2xl text-xs shadow-md hover:scale-102 cursor-pointer"
            >
              ĐÃ HIỂU, VÀO CHƠI NGAY! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TEACHER SETTINGS MODAL (PLAY MODES, PARTICIPANTS, QUESTIONS) */}
      {/* ========================================================================= */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border-4 border-pink-300 max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-pink-600" />
                <h3 className="text-base font-black text-slate-800">
                  {t.settingsBtn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeacherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* SECTION 1: PLAY MODE & TEAMS / PARTICIPANTS CONFIGURATION */}
            <div className="p-4 bg-gradient-to-br from-amber-50 to-pink-50 rounded-2xl border-2 border-amber-200 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                Thiết lập Chế độ chơi & Số người hái hoa
              </h4>

              {/* Play Mode Selection: Turn-based vs All Together */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  🎮 Chế độ luân phiên / cùng chơi:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTeacherPlayMode('turn_based')}
                    className={`p-3 rounded-xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      teacherPlayMode === 'turn_based'
                        ? 'bg-amber-100/80 border-amber-500 shadow-sm text-amber-950 font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">🔄</span>
                    <div>
                      <div className="text-xs font-bold">Chơi lần lượt (Turn-based)</div>
                      <div className="text-[10px] text-slate-500">Các đội/nhóm/học sinh luân phiên hái hoa từng lượt.</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeacherPlayMode('all_together')}
                    className={`p-3 rounded-xl border-2 text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      teacherPlayMode === 'all_together'
                        ? 'bg-amber-100/80 border-amber-500 shadow-sm text-amber-950 font-black'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">⚡</span>
                    <div>
                      <div className="text-xs font-bold">Chọn đội trả lời trên cùng màn hình</div>
                      <div className="text-[10px] text-slate-500">Tất cả các đội cùng tham gia, hái hoa tự do hoặc chọn đội.</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Participant Type & Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    👥 Hình thức phân chia:
                  </label>
                  <select
                    value={teacherPartType}
                    onChange={e => {
                      const newType = e.target.value as FlowerParticipantType;
                      setTeacherPartType(newType);
                      handleTeacherCountChange(teacherPartCount, newType);
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="team">Theo Tổ (Tổ 1, Tổ 2, Tổ 3...)</option>
                    <option value="group">Theo Nhóm / Đội (Nhóm 1, Nhóm 2...)</option>
                    <option value="student">Học sinh cá nhân (Học sinh 1, 2...)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    🔢 Số lượng người / đội hái hoa:
                  </label>
                  <select
                    value={teacherPartCount}
                    onChange={e => {
                      const newCount = Number(e.target.value);
                      handleTeacherCountChange(newCount, teacherPartType);
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value={2}>2 Người / Đội</option>
                    <option value={3}>3 Người / Đội</option>
                    <option value={4}>4 Người / Đội (Khuyên dùng)</option>
                    <option value={5}>5 Người / Đội</option>
                    <option value={6}>6 Người / Đội</option>
                  </select>
                </div>
              </div>

              {/* Custom Names & Colors for each participant */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  🎨 Tùy chỉnh Tên & Màu sắc của từng người hái hoa:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {teacherParticipants.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2 shadow-xs"
                    >
                      <input
                        type="color"
                        value={p.color}
                        onChange={e => {
                          const newColor = e.target.value;
                          setTeacherParticipants(prev =>
                            prev.map((item, i) => (i === idx ? { ...item, color: newColor } : item))
                          );
                        }}
                        className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0"
                        title="Chọn màu áo"
                      />
                      <input
                        type="text"
                        value={p.name}
                        onChange={e => {
                          const newName = e.target.value;
                          setTeacherParticipants(prev =>
                            prev.map((item, i) => (i === idx ? { ...item, name: newName } : item))
                          );
                        }}
                        className="flex-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        placeholder={`Tên người/đội ${idx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 2: GENERAL TIME & CATEGORY */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  ⏱️ Thời gian (phút):
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={teacherTimeMinutes}
                  onChange={e => setTeacherTimeMinutes(Math.max(1, Number(e.target.value) || 5))}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  🏷️ Phân loại ghi điểm:
                </label>
                <select
                  value={teacherCategory}
                  onChange={e => setTeacherCategory(e.target.value as any)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="Điểm HĐ học tập">🌱 Điểm HĐ học tập (Tổng hợp vào Vườn thành tích)</option>
                  <option value="Điểm HĐ rèn luyện">🌿 Điểm HĐ rèn luyện (Tổng hợp vào Vườn thành tích)</option>
                </select>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  ⚡ Trạng thái:
                </label>
                <button
                  type="button"
                  onClick={() => setTeacherIsActive(!teacherIsActive)}
                  className={`w-full p-2 rounded-xl text-xs font-black cursor-pointer border ${
                    teacherIsActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {teacherIsActive ? '🟢 Đang mở cho HS' : '🔴 Tạm khóa'}
                </button>
              </div>
            </div>

            {/* Save Settings Button */}
            <button
              type="button"
              id="flower-save-settings-btn"
              onClick={handleSaveTeacherSettings}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl text-xs shadow-md hover:scale-101 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>LƯU CẤU HÌNH CHẾ ĐỘ CHƠI & SỐ NGƯỜI HÁI HOA</span>
            </button>

            {/* SECTION 3: ADD NEW QUESTION FORM */}
            <form onSubmit={handleAddQuestion} className="bg-pink-50/50 p-4 rounded-2xl border border-pink-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-pink-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> {editingQuestionId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới vào cây'}
                {editingQuestionId && <button type="button" onClick={() => { setEditingQuestionId(null); setNewQText(''); setNewQCorrectAns(''); }}>Hủy sửa</button>}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại câu hỏi:</label>
                  <select
                    value={newQType}
                    onChange={e => setNewQType(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="mcq">Trắc nghiệm (4 lựa chọn)</option>
                    <option value="fill">Điền vào chỗ trống (Text)</option>
                    <option value="bool">Đúng / Sai (True/False)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ✨ Hoa may mắn:
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newQIsLucky}
                        onChange={e => setNewQIsLucky(e.target.checked)}
                        className="rounded text-pink-600"
                      />
                      Nhân điểm
                    </label>
                    {newQIsLucky && (
                      <select
                        value={newQMultiplier}
                        onChange={e => setNewQMultiplier(Number(e.target.value))}
                        className="p-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-700"
                      >
                        <option value={2}>x2 điểm</option>
                        <option value={3}>x3 điểm</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung câu hỏi:
                </label>
                <input
                  type="text"
                  value={newQText}
                  onChange={e => setNewQText(e.target.value)}
                  placeholder="VD: Thủ đô của Việt Nam là gì?"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  required
                />
              </div>

              {/* Options if MCQ */}
              {newQType === 'mcq' && (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newQOpt1}
                    onChange={e => setNewQOpt1(e.target.value)}
                    placeholder="Phương án A"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newQOpt2}
                    onChange={e => setNewQOpt2(e.target.value)}
                    placeholder="Phương án B"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newQOpt3}
                    onChange={e => setNewQOpt3(e.target.value)}
                    placeholder="Phương án C"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newQOpt4}
                    onChange={e => setNewQOpt4(e.target.value)}
                    placeholder="Phương án D"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              )}

              {/* Correct answer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đáp án chính xác:
                </label>
                {newQType === 'bool' ? (
                  <select
                    value={newQCorrectAns || 'Đúng'}
                    onChange={e => setNewQCorrectAns(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Đúng">Đúng</option>
                    <option value="Sai">Sai</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newQCorrectAns}
                    onChange={e => setNewQCorrectAns(e.target.value)}
                    placeholder="Nhập chính xác đáp án đúng"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    required
                  />
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                {editingQuestionId ? 'Lưu câu hỏi đã sửa' : '+ Thêm câu hỏi vào cây'}
              </button>
            </form>

            {/* SECTION 4: EXISTING QUESTIONS LIST */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Danh sách câu hỏi ({flowerConfig.questions.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {flowerConfig.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">#{idx + 1}.</span>
                        <span className="font-semibold text-slate-900">{q.question}</span>
                        {q.isLuckyFlower && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-black text-amber-700">
                            ✨ x{q.multiplier || 2}
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        <strong className="text-emerald-600">Đáp án:</strong> {q.correctAnswer}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-2 text-sky-700" onClick={() => {
                      setEditingQuestionId(q.id); setNewQText(q.question); setNewQType(q.type);
                      setNewQOpt1(q.options?.[0] || ''); setNewQOpt2(q.options?.[1] || '');
                      setNewQOpt3(q.options?.[2] || ''); setNewQOpt4(q.options?.[3] || '');
                      setNewQCorrectAns(q.type === 'bool' ? (['true', 'đúng'].includes(q.correctAnswer.trim().toLowerCase()) ? 'Đúng' : 'Sai') : q.correctAnswer); setNewQIsLucky(Boolean(q.isLuckyFlower)); setNewQMultiplier(q.multiplier || 2);
                    }}>Sửa</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Q&A HISTORY & REVISION MODAL */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 border-2 border-indigo-200 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    <span>LỊCH SỬ TRẢ LỜI & ÔN TẬP CÂU HỎI</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                      {flowerHistory.length} lượt trả lời
                    </span>
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Tra cứu câu hỏi hái hoa/quả, đáp án đã chọn và đáp án đúng để ôn tập lại kiến thức.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Controls: Search & Filter Tabs */}
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={historySearchTerm}
                    onChange={e => setHistorySearchTerm(e.target.value)}
                    placeholder="Tìm theo nội dung câu hỏi, hoa/quả #, tên đội..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHistoryFilterType('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      historyFilterType === 'all'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Tất cả ({flowerHistory.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilterType('correct')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      historyFilterType === 'correct'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    ✅ Đúng ({flowerHistory.filter(h => h.isCorrect).length})
                  </button>
                  <button
                    onClick={() => setHistoryFilterType('wrong')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      historyFilterType === 'wrong'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    ❌ Chưa đúng ({flowerHistory.filter(h => !h.isCorrect).length})
                  </button>
                </div>
              </div>

              {/* Quick Participant Filter Bar & Reveal All Button */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 border-t border-slate-200/60 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-black text-slate-500 whitespace-nowrap">Lọc theo người hái:</span>
                  <button
                    onClick={() => setHistorySearchTerm('')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      !historySearchTerm
                        ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    Tất cả người chơi
                  </button>
                  {participants.map(p => {
                    const isSelected = historySearchTerm.toLowerCase() === p.name.toLowerCase();
                    const count = flowerHistory.filter(h => h.participantName.toLowerCase() === p.name.toLowerCase()).length;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setHistorySearchTerm(p.name)}
                        style={{
                          backgroundColor: isSelected ? p.color : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          borderColor: p.color
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shadow-2xs flex items-center gap-1 hover:brightness-105"
                      >
                        <span>{p.name}</span>
                        <span className="opacity-80 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleToggleRevealAll}
                  className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {revealAllAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{revealAllAnswers ? 'Ẩn tất cả đáp án' : 'Hiện tất cả đáp án'}</span>
                </button>
              </div>
            </div>

            {/* History Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {flowerHistory.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">Chưa có lịch sử câu hỏi được trả lời.</p>
                  <p className="text-xs text-slate-400">Bắt đầu hái hoa/quả trên cây để tích lũy điểm và lưu lại lịch sử ôn tập.</p>
                </div>
              ) : (
                flowerHistory
                  .filter(h => {
                    if (historyFilterType === 'correct' && !h.isCorrect) return false;
                    if (historyFilterType === 'wrong' && h.isCorrect) return false;
                    if (historySearchTerm.trim()) {
                      const term = historySearchTerm.toLowerCase();
                      const matchQ = h.questionText.toLowerCase().includes(term);
                      const matchItem = `#${h.itemNumber}`.includes(term) || (h.itemType === 'fruit' ? 'quả' : 'hoa').includes(term);
                      const matchP = h.participantName.toLowerCase().includes(term);
                      return matchQ || matchItem || matchP;
                    }
                    return true;
                  })
                  .map((rec, idx) => {
                    const origQ = flowerConfig.questions.find(q => q.id === rec.questionId || q.question === rec.questionText);
                    const qType = rec.questionType || origQ?.type;
                    const qOptions = rec.options || origQ?.options || (qType === 'bool' ? (flowerLang === 'en' ? ['True', 'False'] : ['Đúng', 'Sai']) : undefined);
                    const isRevealed = !!revealedAnswers[rec.id];

                    return (
                      <div
                        key={rec.id || idx}
                        className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                          rec.isCorrect ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                        }`}
                      >
                        {/* Header row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-xl text-xs font-black shadow-2xs border ${
                              rec.itemType === 'fruit' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-pink-100 text-pink-900 border-pink-300'
                            }`}>
                              {rec.itemType === 'fruit' ? '🍎 Quả' : '🌸 Hoa'} SỐ #{rec.itemNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              • Câu hỏi #{rec.questionNumber}
                            </span>
                            <span
                              style={{ backgroundColor: rec.participantColor }}
                              className="px-2 py-0.5 rounded-full text-white text-[10px] font-black"
                            >
                              {rec.participantName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400">{rec.timestamp}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                              rec.isCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                            }`}>
                              {rec.isCorrect ? `+${rec.pointsChange} ⭐` : `${rec.pointsChange} ⭐`}
                            </span>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="p-3 bg-white/90 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <div className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                            ❓ Câu hỏi #{rec.questionNumber}:
                          </div>
                          <div className="text-sm font-black text-slate-800 leading-snug">
                            {rec.questionText}
                          </div>
                        </div>

                        {/* Question Options List */}
                        {qOptions && qOptions.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                              📋 Các lựa chọn của câu hỏi:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {qOptions.map((opt, oIdx) => {
                                const optLetter = String.fromCharCode(65 + oIdx);
                                const normOpt = opt.trim().toLowerCase();
                                const normSub = rec.submittedAnswer?.trim().toLowerCase();
                                const normCorr = rec.correctAnswer?.trim().toLowerCase();
                                
                                const isChosen = normSub === normOpt ||
                                  (normSub && normSub.includes(normOpt) && normOpt.length > 2) ||
                                  (normOpt === 'đúng' && (normSub === 'true' || normSub === 'đúng')) ||
                                  (normOpt === 'sai' && (normSub === 'false' || normSub === 'sai'));

                                const isCorrectOpt = normCorr === normOpt ||
                                  (normOpt === 'đúng' && (normCorr === 'true' || normCorr === 'đúng')) ||
                                  (normOpt === 'sai' && (normCorr === 'false' || normCorr === 'sai'));

                                let bgStyle = "bg-white border-slate-200 text-slate-700";
                                if (isChosen) {
                                  bgStyle = rec.isCorrect
                                    ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold shadow-2xs"
                                    : "bg-rose-100 border-rose-400 text-rose-950 font-bold shadow-2xs";
                                } else if (isRevealed && isCorrectOpt) {
                                  bgStyle = "bg-emerald-200/90 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400/50";
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${bgStyle}`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                        isChosen ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {optLetter}
                                      </span>
                                      <span className="truncate font-semibold">{opt}</span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {isChosen && (
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                          rec.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                        }`}>
                                          {rec.isCorrect ? 'Đã chọn ✓' : 'Đã chọn ✗'}
                                        </span>
                                      )}
                                      {!isChosen && isRevealed && isCorrectOpt && (
                                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-600 text-white animate-in fade-in">
                                          Đáp án đúng ★
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-slate-500 bg-white/60 p-2 rounded-xl border border-slate-200">
                            ✍️ Dạng bài: Điền từ vào chỗ trống
                          </div>
                        )}

                        {/* Submitted Answer & Toggle Correct Answer row */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-600">📌 Đã chọn:</span>
                            <span className={`font-black px-2.5 py-1 rounded-xl border ${
                              rec.isCorrect
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                : 'bg-rose-100 text-rose-950 border-rose-300'
                            }`}>
                              {rec.submittedAnswer || '(Bỏ trống)'}
                            </span>
                            <span className={`font-extrabold text-[11px] ${rec.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {rec.isCorrect ? '✅ Chính xác' : '❌ Chưa chính xác'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            {isRevealed ? (
                              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                <div className="px-3 py-1 rounded-xl bg-emerald-100 border-2 border-emerald-400 text-emerald-950 font-black text-xs shadow-2xs flex items-center gap-1.5">
                                  <span>💡 Đáp án đúng:</span>
                                  <span className="underline decoration-emerald-600 font-extrabold">{rec.correctAnswer}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealAnswer(rec.id)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-all"
                                  title="Ẩn đáp án đúng"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Ẩn</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleRevealAnswer(rec.id)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Hiện đáp án đúng</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer controls */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {isTeacherOrAdmin && flowerHistory.length > 0 && (
                <button
                  disabled={deletingHistory || historyLoading}
                  onClick={async () => {
                    if (historyDeleteLock.current || historyLoading) return;
                    if (confirm(`Xóa toàn bộ ${flowerHistory.length} lượt trả lời đã tải của tài khoản này trong lớp này (bao gồm các lượt bị ẩn bởi bộ lọc)?`)) {
                      historyDeleteLock.current = true;
                      setDeletingHistory(true);
                      try {
                        const entries = flowerHistory;
                        await deleteFlowerHistoryEntries(flowerConfig.classId, currentUser.id, entries);
                        const removedIds = new Set(entries.map(entry => entry.id));
                        setFlowerHistory(prev => prev.filter(entry => !removedIds.has(entry.id)));
                        setRevealedAnswers({});
                        setRevealAllAnswers(false);
                        setHistoryError('');
                      } catch {
                        setHistoryError('Không thể xóa lịch sử. Vui lòng thử lại.');
                      } finally {
                        historyDeleteLock.current = false;
                        setDeletingHistory(false);
                      }
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deletingHistory ? 'Đang xóa...' : 'Xóa lịch sử đã tải'}</span>
                </button>
              )}
              <button
                onClick={() => setShowHistoryModal(false)}
                className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
