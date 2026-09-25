import React, { useState, useEffect } from 'react';
import {
  User,
  AttendanceRecord,
  SpyGameMission,
  FlowerGameConfig,
  FlowerGameQuestion,
  RacingGameConfig,
  RacingQuestion,
  VehicleConfig,
  RacingTeam,
  KeyboardHeroTask,
  MemoryCardGameConfig,
  DisciplineRecord,
  LearningRecord,
  ActivityPointRecord
} from '../../types';
import { soundFx } from '../../utils/sound';
import { SpyGameView } from '../activities/SpyGameView';
import { KeyboardHeroView } from '../activities/KeyboardHeroView';
import { MemoryGameView } from '../activities/MemoryGameView';
import { AchievementGardenView } from '../activities/AchievementGardenView';
import { AttendanceView } from '../activities/AttendanceView';
import { LearningGardenScene } from '../game-ui/LearningGardenScene';
import { LearningRaceScene } from '../game-ui/racing/LearningRaceScene';
import {
  Sparkles,
  CheckSquare,
  Eye,
  Flower2,
  Flag,
  PenTool,
  Copy,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  Heart,
  Globe,
  Settings,
  Plus,
  Trash2,
  Zap,
  Dice5,
  Award,
  Users,
  Gauge,
  Lock,
  Unlock,
  EyeOff,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  Check,
  AlertTriangle,
  Filter,
  UserX,
  AlertCircle,
  Clock,
  X
} from 'lucide-react';

interface ActivitiesTabProps {
  currentUser: User;
  students: User[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (recs: AttendanceRecord[]) => void;
  onSaveAttendance?: (recs: AttendanceRecord[]) => Promise<void>;
  onAwardAttendance?: (points: ActivityPointRecord[]) => Promise<void>;
  spyMission: SpyGameMission;
  onUpdateSpyMission: (m: SpyGameMission) => void;
  onSaveSpyMission?: (m: SpyGameMission) => Promise<void>;
  onCastSpyVote?: (suspectId: string) => Promise<void>;
  onResetSpyVotes?: () => Promise<void>;
  onClearAllSpyVotes?: () => Promise<void>;
  onFinishSpyMission?: (mission: SpyGameMission, points: ActivityPointRecord[]) => Promise<void>;
  flowerConfig: FlowerGameConfig;
  flowerLoadState?: string;
  onUpdateFlowerConfig?: (config: FlowerGameConfig) => Promise<void>;
  racingConfig: RacingGameConfig;
  onUpdateRacingConfig?: (config: RacingGameConfig) => Promise<void>;
  keyboardTask: KeyboardHeroTask;
  onUpdateKeyboardTask: (task: KeyboardHeroTask) => void;
  onSaveKeyboardTaskConfig?: (task: KeyboardHeroTask) => Promise<void>;
  onSaveKeyboardSubmission?: (submission: import('../../types').KeyboardHeroSubmission) => Promise<void>;
  onSetKeyboardLike?: (submissionId: string, liked: boolean) => Promise<void>;
  onAddKeyboardComment?: (submissionId: string, comment: import('../../types').KeyboardHeroSubmission['comments'][number]) => Promise<void>;
  onGradeKeyboardSubmission?: (submission: import('../../types').KeyboardHeroSubmission, point: ActivityPointRecord) => Promise<void>;
  memoryConfig: MemoryCardGameConfig;
  onUpdateMemoryConfig?: (config: MemoryCardGameConfig) => Promise<void>;
  disciplineRecords: DisciplineRecord[];
  learningRecords: LearningRecord[];
  onAddLearningRecord: (rec: LearningRecord) => void;
  onAddDisciplineRecord: (rec: DisciplineRecord) => void;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({
  currentUser,
  students,
  attendanceRecords,
  onUpdateAttendance,
  onSaveAttendance,
  onAwardAttendance,
  spyMission,
  onUpdateSpyMission,
  onSaveSpyMission,
  onCastSpyVote,
  onResetSpyVotes,
  onClearAllSpyVotes,
  onFinishSpyMission,
  flowerConfig,
  flowerLoadState,
  onUpdateFlowerConfig,
  racingConfig,
  onUpdateRacingConfig,
  keyboardTask,
  onUpdateKeyboardTask,
  onSaveKeyboardTaskConfig,
  onSaveKeyboardSubmission,
  onSetKeyboardLike,
  onAddKeyboardComment,
  onGradeKeyboardSubmission,
  memoryConfig,
  onUpdateMemoryConfig,
  disciplineRecords,
  learningRecords,
  onAddLearningRecord,
  onAddDisciplineRecord,
  onActivityPointSaved
}) => {
  const [activeActivity, setActiveActivity] = useState<
    'attendance' | 'spy' | 'flower' | 'racing' | 'keyboard' | 'memory' | 'garden'
  >('flower');

  // Flower game interactive state
  const [flowerGameStarted, setFlowerGameStarted] = useState(false);
  const [pickedItems, setPickedItems] = useState<number[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [fillAnswer, setFillAnswer] = useState<string>('');
  const [flowerScore, setFlowerScore] = useState(0);
  const [flowerLang, setFlowerLang] = useState<'vi' | 'en'>(flowerConfig.language || 'vi');
  const [isTeacherFlowerModalOpen, setIsTeacherFlowerModalOpen] = useState(false);

  // Live timer countdown state for Flower Game
  const [flowerTimeLeft, setFlowerTimeLeft] = useState<number>((flowerConfig.timeMinutes || 5) * 60);
  const [flowerTimeIsUp, setFlowerTimeIsUp] = useState(false);

  // Timer effect for Flower Game
  useEffect(() => {
    let interval: any = null;
    if (flowerGameStarted && flowerTimeLeft > 0 && !flowerTimeIsUp) {
      interval = setInterval(() => {
        setFlowerTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setFlowerTimeIsUp(true);
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
  }, [flowerGameStarted, flowerTimeLeft, flowerTimeIsUp]);

  // New question form in teacher settings
  const [newQText, setNewQText] = useState('');
  const [newQType, setNewQType] = useState<'mcq' | 'fill' | 'bool'>('mcq');
  const [newQOpt1, setNewQOpt1] = useState('');
  const [newQOpt2, setNewQOpt2] = useState('');
  const [newQOpt3, setNewQOpt3] = useState('');
  const [newQOpt4, setNewQOpt4] = useState('');
  const [newQCorrectAns, setNewQCorrectAns] = useState('');
  const [newQIsLucky, setNewQIsLucky] = useState(false);
  const [newQMultiplier, setNewQMultiplier] = useState<number>(2);

  // Racing game interactive state
  const [racingStarted, setRacingStarted] = useState(false);
  const [racingTeams, setRacingTeams] = useState<RacingTeam[]>(
    racingConfig.teams && racingConfig.teams.length > 0
      ? racingConfig.teams
      : [
          { id: 't1', name: 'Tổ 1 (Rồng Lửa)', color: '#ef4444', vehicleId: 'v3', currentDistance: 0 },
          { id: 't2', name: 'Tổ 2 (Bão Xanh)', color: '#3b82f6', vehicleId: 'v3', currentDistance: 0 },
          { id: 't3', name: 'Tổ 3 (Chiến Binh)', color: '#10b981', vehicleId: 'v3', currentDistance: 0 },
          { id: 't4', name: 'Tổ 4 (Tia Chớp)', color: '#f59e0b', vehicleId: 'v3', currentDistance: 0 }
        ]
  );
  const [activeRacingTeamIdx, setActiveRacingTeamIdx] = useState(0);
  const [currentRacingQuestionIdx, setCurrentRacingQuestionIdx] = useState(0);
  const [racingSelectedOpt, setRacingSelectedOpt] = useState('');
  const [racingFillText, setRacingFillText] = useState('');
  const [showRandomVehicleModal, setShowRandomVehicleModal] = useState(false);
  const [isSpinningVehicle, setIsSpinningVehicle] = useState(false);
  const [spinDisplayVehicle, setSpinDisplayVehicle] = useState<VehicleConfig | null>(null);
  const [awardedVehicle, setAwardedVehicle] = useState<VehicleConfig | null>(null);
  const [racingWinner, setRacingWinner] = useState<RacingTeam | null>(null);

  // Teacher settings for racing
  const [isTeacherRacingModalOpen, setIsTeacherRacingModalOpen] = useState(false);
  const [racingSettingsTab, setRacingSettingsTab] = useState<'general' | 'vehicles' | 'questions'>('general');

  // General racing settings state
  const [tempTrackTitle, setTempTrackTitle] = useState(racingConfig.title || 'Đường đua học tập tốc độ cao');
  const [tempTrackLength, setTempTrackLength] = useState<number>(racingConfig.trackLength || 1000);
  const [tempTrackCount, setTempTrackCount] = useState<number>(racingConfig.trackCount || 4);
  const [tempRacingTimeMinutes, setTempRacingTimeMinutes] = useState<number>(racingConfig.timeMinutes || 5);
  const [tempRacingCategory, setTempRacingCategory] = useState<'Thi đua học tập' | 'Thi đua rèn luyện'>(
    racingConfig.category || 'Thi đua học tập'
  );

  // Live timer countdown state for Racing
  const [racingTimeLeft, setRacingTimeLeft] = useState<number>((racingConfig.timeMinutes || 5) * 60);
  const [racingTimeIsUp, setRacingTimeIsUp] = useState(false);

  // Timer effect for racing game
  useEffect(() => {
    let interval: any = null;
    if (racingStarted && racingTimeLeft > 0 && !racingWinner && !racingTimeIsUp) {
      interval = setInterval(() => {
        setRacingTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setRacingTimeIsUp(true);
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
  }, [racingStarted, racingTimeLeft, racingWinner, racingTimeIsUp]);

  // New vehicle form in teacher settings
  const [newVehName, setNewVehName] = useState('');
  const [newVehIcon, setNewVehIcon] = useState('🏎️');
  const [newVehDistance, setNewVehDistance] = useState<number>(250);
  const [newVehColor, setNewVehColor] = useState('#3b82f6');

  // New racing question form in teacher settings
  const [newRQText, setNewRQText] = useState('');
  const [newRQType, setNewRQType] = useState<'mcq' | 'fill' | 'bool'>('mcq');
  const [newRQOpt1, setNewRQOpt1] = useState('');
  const [newRQOpt2, setNewRQOpt2] = useState('');
  const [newRQOpt3, setNewRQOpt3] = useState('');
  const [newRQOpt4, setNewRQOpt4] = useState('');
  const [newRQCorrectAns, setNewRQCorrectAns] = useState('');

  // Keyboard hero submission content
  const [mySubmission, setMySubmission] = useState('');
  const [myComment, setMyComment] = useState('');

  // Fish Pond / Random wheel state
  const [wheelPoints, setWheelPoints] = useState<number | null>(null);

  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isOfficer = currentUser.role === 'student' && currentUser.position && currentUser.position !== 'thành viên';

  // Flower Game Multi-language texts
  const tFlower = {
    vi: {
      title: flowerConfig.title || 'Hái hoa học tập',
      subtitle: 'Hái hoa và quả trên cây, trả lời câu hỏi đúng để tích lũy điểm thi đua!',
      startBtn: 'BẮT ĐẦU HÁI HOA',
      startNowBtn: 'BẮT ĐẦU NGAY 🚀',
      restartBtn: 'Chơi lại',
      readyTitle: 'Sẵn sàng bước vào Khu vườn học tập 3D/2.5D?',
      readyDesc: 'Mỗi bông hoa mang lại +1 điểm, mỗi quả ngọt mang lại +2 điểm. Chú ý các bông hoa may mắn có thể nhân đôi hoặc nhân ba số điểm!',
      scoreLabel: '🎯 Điểm tích lũy hiện tại:',
      scoreUnit: 'điểm',
      harvestedLabel: 'Đã hái',
      gardenBadge: '🌿 Khu vườn học tập ITEN 3D/2.5D 🌿',
      flowerTip: 'Hái hoa (+1đ)',
      fruitTip: 'Hái quả (+2đ)',
      questionModalTitle: '❓ Câu hỏi hái hoa',
      luckyBadge: (mult: number) => `✨ HOA MAY MẮN (Nhân ${mult} điểm)! ✨`,
      fillLabel: 'Nhập câu trả lời điền vào chỗ trống:',
      fillPlaceholder: 'Nhập từ hoặc cụm từ cần điền...',
      submitAnswerBtn: 'Nộp câu trả lời',
      correctToast: (pts: number) => `Chính xác! Bạn nhận được +${pts} điểm.`,
      incorrectToast: (ans: string) => `Chưa chính xác. Đáp án đúng là: ${ans}`,
      fillEmptyAlert: 'Vui lòng nhập câu trả lời trước khi nộp!',
      selectAnswerAlert: 'Vui lòng chọn một đáp án trước khi nộp!',
      langSetting: 'Ngôn ngữ trò chơi',
      teacherSettingsBtn: 'Cài đặt câu hỏi & Ngôn ngữ',
      manageQuestionsTitle: 'Quản lý câu hỏi & Thiết lập ngôn ngữ',
      addQuestionHeader: 'Thêm câu hỏi mới vào cây',
      addQuestionBtn: 'Lưu câu hỏi',
      questionTypeLabel: 'Loại câu hỏi:',
      mcqType: 'Trắc nghiệm (4 lựa chọn)',
      fillType: 'Điền vào chỗ trống (Fill-in-the-blank)',
      boolType: 'Đúng / Sai (True/False)',
      correctAnswerLabel: 'Đáp án chính xác:',
      questionListHeader: 'Danh sách câu hỏi hiện tại',
      trueText: 'Đúng',
      falseText: 'Sai'
    },
    en: {
      title: flowerConfig.title.includes('Ngữ Văn') ? 'Educational Flower Garden (English/General)' : flowerConfig.title,
      subtitle: 'Pick flowers and fruits from trees, answer questions correctly to earn competition points!',
      startBtn: 'START FLOWER PICKING',
      startNowBtn: 'START NOW 🚀',
      restartBtn: 'Play Again',
      readyTitle: 'Ready to enter the 3D/2.5D Learning Garden?',
      readyDesc: 'Each flower awards +1 point, each sweet fruit awards +2 points. Watch out for lucky flowers that double or triple points!',
      scoreLabel: '🎯 Current Accumulated Score:',
      scoreUnit: 'pts',
      harvestedLabel: 'Harvested',
      gardenBadge: '🌿 ITEN Learning Garden 3D/2.5D 🌿',
      flowerTip: 'Pick flower (+1 pt)',
      fruitTip: 'Pick fruit (+2 pts)',
      questionModalTitle: '❓ Flower Picking Question',
      luckyBadge: (mult: number) => `✨ LUCKY FLOWER (x${mult} Multiplier)! ✨`,
      fillLabel: 'Fill in the blank with your answer:',
      fillPlaceholder: 'Type your answer here...',
      submitAnswerBtn: 'Submit Answer',
      correctToast: (pts: number) => `Correct! You received +${pts} points.`,
      incorrectToast: (ans: string) => `Incorrect. The correct answer is: ${ans}`,
      fillEmptyAlert: 'Please type your answer before submitting!',
      selectAnswerAlert: 'Please select an answer before submitting!',
      langSetting: 'Game Language',
      teacherSettingsBtn: 'Game & Language Settings',
      manageQuestionsTitle: 'Manage Questions & Language Settings',
      addQuestionHeader: 'Add New Question to Tree',
      addQuestionBtn: 'Save Question',
      questionTypeLabel: 'Question Type:',
      mcqType: 'Multiple Choice (4 Options)',
      fillType: 'Fill-in-the-blank (Text Input)',
      boolType: 'True / False',
      correctAnswerLabel: 'Correct Answer:',
      questionListHeader: 'Current Questions in Game',
      trueText: 'True',
      falseText: 'False'
    }
  }[flowerLang];

  const handleLanguageChange = (newLang: 'vi' | 'en') => {
    soundFx.playClick();
    setFlowerLang(newLang);
    if (onUpdateFlowerConfig) {
      onUpdateFlowerConfig({
        ...flowerConfig,
        language: newLang
      });
    }
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQText.trim() || !newQCorrectAns.trim()) {
      alert(flowerLang === 'en' ? 'Please enter question text and correct answer' : 'Vui lòng nhập nội dung câu hỏi và đáp án đúng');
      return;
    }

    let options: string[] | undefined = undefined;
    if (newQType === 'mcq') {
      options = [newQOpt1, newQOpt2, newQOpt3, newQOpt4].filter(o => o.trim().length > 0);
      if (options.length < 2) {
        alert(flowerLang === 'en' ? 'Please provide at least 2 options for multiple choice' : 'Vui lòng cung cấp ít nhất 2 phương án trắc nghiệm');
        return;
      }
    } else if (newQType === 'bool') {
      options = flowerLang === 'en' ? ['True', 'False'] : ['Đúng', 'Sai'];
    }

    const newQuestion: FlowerGameQuestion = {
      id: 'q_' + Date.now(),
      question: newQText,
      type: newQType,
      options,
      correctAnswer: newQCorrectAns.trim(),
      isLuckyFlower: newQIsLucky,
      multiplier: newQIsLucky ? newQMultiplier : 1
    };

    const updatedQuestions = [...flowerConfig.questions, newQuestion];
    if (onUpdateFlowerConfig) {
      onUpdateFlowerConfig({
        ...flowerConfig,
        questions: updatedQuestions
      });
    }

    soundFx.playSuccess();
    setNewQText('');
    setNewQOpt1('');
    setNewQOpt2('');
    setNewQOpt3('');
    setNewQOpt4('');
    setNewQCorrectAns('');
    setNewQIsLucky(false);
    alert(flowerLang === 'en' ? 'New question added successfully!' : 'Đã thêm câu hỏi mới thành công!');
  };

  const handleDeleteQuestion = (qId: string) => {
    if (flowerConfig.questions.length <= 1) {
      alert(flowerLang === 'en' ? 'The game must have at least one question.' : 'Trò chơi cần có ít nhất một câu hỏi.');
      return;
    }
    const updated = flowerConfig.questions.filter(q => q.id !== qId);
    if (onUpdateFlowerConfig) {
      onUpdateFlowerConfig({
        ...flowerConfig,
        questions: updated
      });
    }
    soundFx.playClick();
  };

  // RACING GAME HANDLERS
  const handleStartRacing = () => {
    soundFx.playCoin();
    setRacingStarted(true);
    // Initialize or reset teams based on config trackCount
    const count = racingConfig.trackCount || 4;
    const initialTeams: RacingTeam[] = (racingConfig.teams && racingConfig.teams.length > 0)
      ? racingConfig.teams.slice(0, count).map(t => ({ ...t, currentDistance: 0 }))
      : Array.from({ length: count }).map((_, i) => ({
          id: `team_${i + 1}`,
          name: `Tổ ${i + 1}`,
          color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i % 6],
          vehicleId: racingConfig.vehicles[0]?.id || 'v1',
          currentDistance: 0
        }));
    setRacingTeams(initialTeams);
    setActiveRacingTeamIdx(0);
    setCurrentRacingQuestionIdx(0);
    setRacingSelectedOpt('');
    setRacingFillText('');
    setShowRandomVehicleModal(false);
    setAwardedVehicle(null);
    setRacingWinner(null);
    setRacingTimeIsUp(false);
    setRacingTimeLeft((racingConfig.timeMinutes || 5) * 60);
  };

  const handleAnswerRacingQuestion = (q: RacingQuestion) => {
    let isCorrect = false;
    if (q.type === 'fill') {
      if (!racingFillText.trim()) {
        alert('Vui lòng nhập câu trả lời trước khi nộp!');
        return;
      }
      isCorrect = racingFillText.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    } else if (q.type === 'bool') {
      if (!racingSelectedOpt) {
        alert('Vui lòng chọn Đúng hoặc Sai!');
        return;
      }
      const sel = racingSelectedOpt.trim().toLowerCase();
      const cor = q.correctAnswer.trim().toLowerCase();
      isCorrect =
        sel === cor ||
        (sel === 'đúng' && (cor === 'đúng' || cor === 'true')) ||
        (sel === 'sai' && (cor === 'sai' || cor === 'false')) ||
        (sel === 'true' && (cor === 'đúng' || cor === 'true')) ||
        (sel === 'false' && (cor === 'sai' || cor === 'false'));
    } else {
      if (!racingSelectedOpt) {
        alert('Vui lòng chọn một đáp án!');
        return;
      }
      isCorrect = racingSelectedOpt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    }

    if (isCorrect) {
      soundFx.playSuccess();
      setShowRandomVehicleModal(true);
      setAwardedVehicle(null);
      setIsSpinningVehicle(false);
    } else {
      soundFx.playError();
      alert(`Chưa chính xác! Đáp án đúng là: "${q.correctAnswer}". Lượt thi đấu chuyển sang đội tiếp theo!`);
      setRacingSelectedOpt('');
      setRacingFillText('');
      setActiveRacingTeamIdx((prev) => (prev + 1) % (racingTeams.length || 1));
      setCurrentRacingQuestionIdx((prev) => (prev + 1) % (racingConfig.questions.length || 1));
    }
  };

  const handleSpinRandomVehicle = () => {
    if (isSpinningVehicle || !racingConfig.vehicles || racingConfig.vehicles.length === 0) return;
    setIsSpinningVehicle(true);
    soundFx.playCoin();

    // Slot animation cycle
    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * racingConfig.vehicles.length);
      setSpinDisplayVehicle(racingConfig.vehicles[randomIdx]);
      counter++;
      if (counter > 14) {
        clearInterval(interval);
        const finalChosen = racingConfig.vehicles[Math.floor(Math.random() * racingConfig.vehicles.length)];
        setSpinDisplayVehicle(finalChosen);
        setAwardedVehicle(finalChosen);
        setIsSpinningVehicle(false);
        soundFx.playBonus();

        // Update active team's distance and vehicle
        const activeTeam = racingTeams[activeRacingTeamIdx];
        const newDist = (activeTeam ? activeTeam.currentDistance : 0) + finalChosen.distance;
        const updatedTeams = racingTeams.map((t, idx) => {
          if (idx === activeRacingTeamIdx) {
            return {
              ...t,
              vehicleId: finalChosen.id,
              currentDistance: newDist
            };
          }
          return t;
        });
        setRacingTeams(updatedTeams);

        // Record points based on Category
        const racingCat = racingConfig.category || 'Điểm HĐ học tập';
        const isAcademic = racingCat === 'Điểm HĐ học tập' || racingCat === 'Thi đua học tập' || racingCat === 'Điểm học tập';
        const actId = racingConfig.id || 'racing_game';
        const actName = racingConfig.title || 'Đường đua học tập';
        const earnedPoints = Math.round(finalChosen.distance / 50) + 1;

        if (isAcademic) {
          onAddLearningRecord({
            id: 'lr_' + Date.now(),
            studentId: currentUser.id,
            studentName: currentUser.fullName,
            classId: currentUser.classId || 'c1',
            activityName: actName,
            activityId: actId,
            pointType: 'academic_activity',
            category: 'Điểm HĐ học tập',
            points: earnedPoints,
            date: new Date().toISOString().substring(0, 10),
            week: 4,
            month: 8,
            semester: 'Học kỳ 1'
          });
        } else {
          onAddDisciplineRecord({
            id: 'dr_' + Date.now(),
            studentId: currentUser.id,
            studentName: currentUser.fullName,
            classId: currentUser.classId || 'c1',
            type: 'reward',
            categoryName: actName,
            activityId: actId,
            activityName: actName,
            pointType: 'training_activity',
            category: 'Điểm HĐ rèn luyện',
            points: earnedPoints,
            reason: `Tăng tốc với xe ${finalChosen.name} (+${finalChosen.distance}m)`,
            date: new Date().toISOString().substring(0, 10),
            week: 4,
            month: 8,
            semester: 'Học kỳ 1',
            recordedBy: 'Hệ thống ITEN'
          });
        }

        // Check if track completed
        if (newDist >= (racingConfig.trackLength || 1000)) {
          soundFx.playSuccess();
          setRacingWinner({ ...activeTeam, currentDistance: newDist });
        }
      }
    }, 85);
  };

  const handleContinueAfterSpin = () => {
    setShowRandomVehicleModal(false);
    setAwardedVehicle(null);
    setSpinDisplayVehicle(null);
    setRacingSelectedOpt('');
    setRacingFillText('');
    // Advance to next team & next question
    if (!racingWinner) {
      setActiveRacingTeamIdx((prev) => (prev + 1) % (racingTeams.length || 1));
      setCurrentRacingQuestionIdx((prev) => (prev + 1) % (racingConfig.questions.length || 1));
    }
  };

  // Teacher config methods for racing
  const handleSaveRacingGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.min(6, Math.max(2, Number(tempTrackCount) || 4));
    let newTeams = [...(racingConfig.teams || [])];
    if (newTeams.length < count) {
      for (let i = newTeams.length; i < count; i++) {
        newTeams.push({
          id: `team_${i + 1}`,
          name: `Tổ ${i + 1}`,
          color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][i % 6],
          vehicleId: racingConfig.vehicles[0]?.id || 'v1',
          currentDistance: 0
        });
      }
    } else if (newTeams.length > count) {
      newTeams = newTeams.slice(0, count);
    }

    const updated: RacingGameConfig = {
      ...racingConfig,
      title: tempTrackTitle,
      category: tempRacingCategory,
      trackLength: Number(tempTrackLength) || 1000,
      timeMinutes: Math.max(1, Number(tempRacingTimeMinutes) || 5),
      trackCount: count,
      teams: newTeams
    };

    if (onUpdateRacingConfig) {
      onUpdateRacingConfig(updated);
    }
    setRacingTeams(newTeams);
    soundFx.playSuccess();
    alert('Đã cập nhật cấu hình Đường đua học tập thành công!');
  };

  const handleUpdateVehicleDistance = (vehId: string, newDist: number) => {
    const updatedVehicles = racingConfig.vehicles.map(v =>
      v.id === vehId ? { ...v, distance: Math.max(10, newDist) } : v
    );
    const updated: RacingGameConfig = {
      ...racingConfig,
      vehicles: updatedVehicles
    };
    if (onUpdateRacingConfig) {
      onUpdateRacingConfig(updated);
    }
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehName.trim()) {
      alert('Vui lòng nhập tên loại xe!');
      return;
    }
    const newVeh: VehicleConfig = {
      id: 'veh_' + Date.now(),
      name: newVehName.trim(),
      icon: newVehIcon || '🏎️',
      distance: Number(newVehDistance) || 100,
      color: newVehColor || '#3b82f6'
    };
    const updatedVehicles = [...racingConfig.vehicles, newVeh];
    const updated: RacingGameConfig = {
      ...racingConfig,
      vehicles: updatedVehicles
    };
    if (onUpdateRacingConfig) {
      onUpdateRacingConfig(updated);
    }
    setNewVehName('');
    setNewVehDistance(200);
    soundFx.playSuccess();
    alert('Đã thêm loại xe mới thành công!');
  };

  const handleDeleteVehicle = (vehId: string) => {
    if (racingConfig.vehicles.length <= 2) {
      alert('Cần giữ lại ít nhất 2 loại xe trong trò chơi!');
      return;
    }
    const updatedVehicles = racingConfig.vehicles.filter(v => v.id !== vehId);
    const updated: RacingGameConfig = {
      ...racingConfig,
      vehicles: updatedVehicles
    };
    if (onUpdateRacingConfig) {
      onUpdateRacingConfig(updated);
    }
    soundFx.playClick();
  };

  const handleAddRacingQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRQText.trim() || !newRQCorrectAns.trim()) {
      alert('Vui lòng nhập câu hỏi và đáp án chính xác!');
      return;
    }
    let options: string[] | undefined = undefined;
    if (newRQType === 'mcq') {
      options = [newRQOpt1, newRQOpt2, newRQOpt3, newRQOpt4].filter(o => o.trim().length > 0);
      if (options.length < 2) {
        alert('Vui lòng cung cấp ít nhất 2 phương án trắc nghiệm!');
        return;
      }
    } else if (newRQType === 'bool') {
      options = ['Đúng', 'Sai'];
    }

    const newQ: RacingQuestion = {
      id: 'rq_' + Date.now(),
      question: newRQText.trim(),
      type: newRQType,
      options,
      correctAnswer: newRQCorrectAns.trim()
    };

    const updatedQuestions = [...racingConfig.questions, newQ];
    const updated: RacingGameConfig = {
      ...racingConfig,
      questions: updatedQuestions
    };
    if (onUpdateRacingConfig) {
      onUpdateRacingConfig(updated);
    }
    setNewRQText('');
    setNewRQOpt1('');
    setNewRQOpt2('');
    setNewRQOpt3('');
    setNewRQOpt4('');
    setNewRQCorrectAns('');
    soundFx.playSuccess();
    alert('Đã thêm câu hỏi đường đua mới thành công!');
  };

  const handleDeleteRacingQuestion = (qId: string) => {
    if (racingConfig.questions.length <= 1) {
      alert('Cần có ít nhất 1 câu hỏi trên đường đua!');
      return;
    }
    const updatedQuestions = racingConfig.questions.filter(q => q.id !== qId);
    const updated: RacingGameConfig = {
      ...racingConfig,
      questions: updatedQuestions
    };
    if (onUpdateRacingConfig) {
      onUpdateRacingConfig(updated);
    }
    soundFx.playClick();
  };

  const activitiesList = [
    { id: 'flower', label: 'Hái hoa học tập', icon: Flower2, color: 'from-pink-400 to-rose-500' },
    { id: 'racing', label: 'Đường đua học tập', icon: Flag, color: 'from-amber-400 to-orange-500' },
    { id: 'memory', label: 'Thách thức thẻ nhớ', icon: Copy, color: 'from-sky-400 to-blue-500' },
    { id: 'spy', label: 'Truy tìm gián điệp', icon: Eye, color: 'from-purple-400 to-indigo-500' },
    { id: 'keyboard', label: 'Anh hùng bàn phím', icon: PenTool, color: 'from-emerald-400 to-teal-500' },
    { id: 'attendance', label: 'Điểm danh', icon: CheckSquare, color: 'from-cyan-400 to-blue-500' },
    { id: 'garden', label: 'Vườn thành tích', icon: Trophy, color: 'from-yellow-400 to-amber-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-9xl opacity-20 select-none">🎮</div>
        <div className="relative z-10">
          <span className="px-3 py-1 rounded-full bg-white/25 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            ✨ Thể giới hoạt động & Trò chơi giáo dục
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 mb-1">
            Khu vực hoạt động ITEN
          </h2>
          <p className="text-sm font-medium text-white/95 max-w-2xl">
            Tham gia 7 hoạt động chính thức để rèn luyện kỹ năng, tích lũy điểm thi đua rèn luyện và học tập.
          </p>
        </div>
      </div>

      {/* Activities Navigation Pills */}
      <div className="flex flex-wrap gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-amber-100 shadow-xs overflow-x-auto">
        {activitiesList.map(act => {
          const Icon = act.icon;
          const isActive = activeActivity === act.id;
          return (
            <button
              key={act.id}
              onClick={() => {
                soundFx.playClick();
                setActiveActivity(act.id as any);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? `bg-gradient-to-r ${act.color} text-white shadow-md scale-105`
                  : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {act.label}
            </button>
          );
        })}
      </div>

      {/* 4.3 – HÁI HOA HỌC TẬP (2D/2.5D ANIMATED CARTOON GAME WORLD) */}
      {activeActivity === 'flower' && (
        flowerLoadState ? <p role="status" className="rounded-xl bg-sky-50 p-4 text-sky-900">{flowerLoadState}</p> :
        <LearningGardenScene
          key={`${currentUser.id}:${flowerConfig.classId}`}
          currentUser={currentUser}
          flowerConfig={flowerConfig}
          onUpdateFlowerConfig={onUpdateFlowerConfig}
          onActivityPointSaved={onActivityPointSaved}
          isTeacherOrAdmin={isTeacherOrAdmin}
        />
      )}

      {/* 4.4 – ĐƯỜNG ĐUA HỌC TẬP (2D/2.5D ANIMATED CARTOON GAME WORLD) */}
      {activeActivity === 'racing' && (
        <LearningRaceScene
          currentUser={currentUser}
          racingConfig={racingConfig}
          onUpdateRacingConfig={onUpdateRacingConfig}
          onActivityPointSaved={onActivityPointSaved}
          isTeacherOrAdmin={isTeacherOrAdmin}
        />
      )}

      {/* 4.6 – THÁCH THỨC THẺ NHỚ */}
      {activeActivity === 'memory' && (
        <MemoryGameView
          currentUser={currentUser}
          memoryConfig={memoryConfig}
          onUpdateMemoryConfig={onUpdateMemoryConfig}
          onActivityPointSaved={onActivityPointSaved}
        />
      )}

      {/* 4.2 – TRUY TÌM GIÁN ĐIỆP */}
      {activeActivity === 'spy' && (
        <SpyGameView
          currentUser={currentUser}
          students={students}
          spyMission={spyMission}
          onUpdateSpyMission={onUpdateSpyMission}
          onSaveSpyMission={onSaveSpyMission}
          onCastVote={onCastSpyVote}
          onResetMyVotes={onResetSpyVotes}
          onClearAllVotes={onClearAllSpyVotes}
          onFinishMission={onFinishSpyMission}
          onActivityPointSaved={onActivityPointSaved}
        />
      )}

      {/* 4.5 – ANH HÙNG BÀN PHÍM */}
      {activeActivity === 'keyboard' && (
        <KeyboardHeroView
          currentUser={currentUser}
          students={students}
          keyboardTask={keyboardTask}
          onUpdateKeyboardTask={onUpdateKeyboardTask}
          onSaveTaskConfig={onSaveKeyboardTaskConfig}
          onSaveSubmission={onSaveKeyboardSubmission}
          onSetLike={onSetKeyboardLike}
          onAddComment={onAddKeyboardComment}
          onGradeSubmission={onGradeKeyboardSubmission}
          onActivityPointSaved={onActivityPointSaved}
        />
      )}

      {/* 4.1 – ĐIỂM DANH */}
      {activeActivity === 'attendance' && (
        <AttendanceView
          currentUser={currentUser}
          students={students}
          attendanceRecords={attendanceRecords}
          onUpdateAttendance={onUpdateAttendance}
          onSaveAttendance={onSaveAttendance}
          onAwardAttendance={onAwardAttendance}
          onActivityPointSaved={onActivityPointSaved}
        />
      )}

      {/* 4.7 – VƯỜN THÀNH TÍCH */}
      {activeActivity === 'garden' && (
        <AchievementGardenView
          currentUser={currentUser}
          students={students}
          disciplineRecords={disciplineRecords}
          learningRecords={learningRecords}
          onAddLearningRecord={onAddLearningRecord}
          onAddDisciplineRecord={onAddDisciplineRecord}
          onActivityPointSaved={onActivityPointSaved}
          flowerConfig={flowerConfig}
          racingConfig={racingConfig}
          keyboardTask={keyboardTask}
          memoryConfig={memoryConfig}
          spyMission={spyMission}
        />
      )}
    </div>
  );
};
