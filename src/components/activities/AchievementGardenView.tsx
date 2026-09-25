import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  User,
  DisciplineRecord,
  LearningRecord,
  FlowerGameConfig,
  RacingGameConfig,
  KeyboardHeroTask,
  MemoryCardGameConfig,
  SpyGameMission,
  ActivityPointRecord
} from '../../types';
import { loadGardenConfig, loadGardenSpinHistory, saveGardenConfig, saveGardenSpin } from '../../services/achievementGardenService';
import { soundFx } from '../../utils/sound';
import {
  Trophy,
  Award,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Star,
  Flame,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Gift,
  RotateCcw,
  Flower2,
  TreeDeciduous,
  Zap,
  Heart,
  Medal,
  ChevronRight,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  BarChart2,
  HelpCircle,
  Calendar,
  LogOut,
  X
} from 'lucide-react';

export interface PointRangeRule {
  id: string;
  minPoints: number;
  maxPoints: number;
  spinsAllowed: number;
  label: string;
}

export interface RewardConfig {
  minReward: number;
  maxReward: number;
  stepReward: number;
}

export interface SpinHistoryRecord {
  id: string;
  studentId: string;
  studentName: string;
  points: number;
  category: 'learning' | 'discipline';
  pointTypeLabel?: string;
  destinationLabel?: string;
  source?: string;
  date: string;
  week?: number;
  timeframeLabel: string;
}

export type TimeframePeriod = 'all' | 'week' | 'month' | 'semester1' | 'semester2';

const DEFAULT_POINT_RANGES: PointRangeRule[] = [
  { id: 'r1', minPoints: 10, maxPoints: 20, spinsAllowed: 1, label: 'Mức 1 (10 - 20 điểm)' },
  { id: 'r2', minPoints: 21, maxPoints: 40, spinsAllowed: 2, label: 'Mức 2 (21 - 40 điểm)' },
  { id: 'r3', minPoints: 41, maxPoints: 60, spinsAllowed: 3, label: 'Mức 3 (41 - 60 điểm)' },
  { id: 'r4', minPoints: 61, maxPoints: 9999, spinsAllowed: 5, label: 'Mức Xuất Sắc (> 60 điểm)' },
];

const DEFAULT_REWARD_CONFIG: RewardConfig = {
  minReward: 0.25,
  maxReward: 1.0,
  stepReward: 0.25
};

interface AchievementGardenViewProps {
  currentUser: User;
  students: User[];
  disciplineRecords: DisciplineRecord[];
  learningRecords: LearningRecord[];
  onAddLearningRecord: (rec: LearningRecord) => void;
  onAddDisciplineRecord: (rec: DisciplineRecord) => void;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
  flowerConfig?: FlowerGameConfig;
  racingConfig?: RacingGameConfig;
  keyboardTask?: KeyboardHeroTask;
  memoryConfig?: MemoryCardGameConfig;
  spyMission?: SpyGameMission;
}

export const AchievementGardenView: React.FC<AchievementGardenViewProps> = ({
  currentUser,
  students,
  disciplineRecords,
  learningRecords,
  onAddLearningRecord,
  onAddDisciplineRecord,
  onActivityPointSaved,
  flowerConfig,
  racingConfig,
  keyboardTask,
  memoryConfig,
  spyMission
}) => {
  // Privileges
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';

  // Category tabs: all / learning / discipline
  const [gardenSection, setGardenSection] = useState<'all' | 'learning' | 'discipline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Lucky wheel modal state
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [spinTargetCategory, setSpinTargetCategory] = useState<'learning' | 'discipline'>('learning');
  const [selectedStudentForBonus, setSelectedStudentForBonus] = useState<string>(
    currentUser.role === 'student' ? currentUser.id : students[0]?.id || ''
  );

  // State for Spin Activation & Bonus Classification Target
  const [isSpinActive, setIsSpinActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_spin_active');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return true; // Default to active so feature is ready
  });

  const [spinAwardTarget, setSpinAwardTarget] = useState<'learning' | 'discipline' | 'auto'>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_spin_award_target');
      if (saved === 'learning' || saved === 'discipline' || saved === 'auto') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'learning';
  });

  const [usedSpinsMap, setUsedSpinsMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_used_spins');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {};
  });

  // Selected Applied Week for Reward Spins (Teacher / Admin configures)
  const [selectedSpinWeek, setSelectedSpinWeek] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_selected_spin_week');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 52) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return 4; // Default to Week 4
  });

  const saveSelectedSpinWeek = (weekNum: number) => {
    setSelectedSpinWeek(weekNum);
    try {
      localStorage.setItem('iten_garden_selected_spin_week', weekNum.toString());
    } catch (e) {
      console.error(e);
    }
  };

  // Timeframe filter state (Tuần / Tháng / Học kỳ / Tất cả)
  const [timeframe, setTimeframe] = useState<TimeframePeriod>('all');

  // Configurable Reward Points State (Min, Max, Step)
  const [rewardConfig, setRewardConfig] = useState<RewardConfig>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_reward_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.minReward === 'number' && typeof parsed.maxReward === 'number' && typeof parsed.stepReward === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_REWARD_CONFIG;
  });

  // Spin History Log State
  const [spinHistory, setSpinHistory] = useState<SpinHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_spin_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Visual Wheel Rotation State
  const [wheelRotation, setWheelRotation] = useState<number>(0);

  const saveRewardConfig = (config: RewardConfig) => {
    setRewardConfig(config);
    try {
      localStorage.setItem('iten_garden_reward_config', JSON.stringify(config));
    } catch (e) {
      console.error(e);
    }
  };

  const possibleRewardPoints = useMemo(() => {
    const list: number[] = [];
    const min = Math.max(0.01, rewardConfig.minReward);
    const max = Math.max(min, rewardConfig.maxReward);
    const step = Math.max(0.01, rewardConfig.stepReward);

    for (let v = min; v <= max + 0.0001; v += step) {
      list.push(Math.round(v * 100) / 100);
    }
    return list.length > 0 ? list : [0.25, 0.5, 0.75, 1.0];
  }, [rewardConfig]);

  // Helper to toggle spin activation
  const toggleSpinActive = (active: boolean) => {
    setIsSpinActive(active);
    try {
      localStorage.setItem('iten_garden_spin_active', JSON.stringify(active));
    } catch (e) {
      console.error(e);
    }
  };

  const saveSpinAwardTarget = (target: 'learning' | 'discipline' | 'auto') => {
    setSpinAwardTarget(target);
    try {
      localStorage.setItem('iten_garden_spin_award_target', target);
    } catch (e) {
      console.error(e);
    }
  };

  const recordSpinUsed = (studentId: string) => {
    setUsedSpinsMap((prev) => {
      const updated = { ...prev, [studentId]: (prev[studentId] || 0) + 1 };
      try {
        localStorage.setItem('iten_garden_used_spins', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleResetStudentSpins = (studentId?: string) => {
    if (studentId) {
      setUsedSpinsMap((prev) => {
        const updated = { ...prev };
        delete updated[studentId];
        try {
          localStorage.setItem('iten_garden_used_spins', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
      soundFx.playSuccess();
    } else {
      if (window.confirm('Khôi phục lượt quay cho tất cả học sinh?')) {
        setUsedSpinsMap({});
        try {
          localStorage.setItem('iten_garden_used_spins', JSON.stringify({}));
        } catch (e) {
          console.error(e);
        }
        soundFx.playSuccess();
      }
    }
  };

  // State for Point Range Rules & Teacher Settings
  const [pointRanges, setPointRanges] = useState<PointRangeRule[]>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_point_ranges');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading point ranges:', e);
    }
    return DEFAULT_POINT_RANGES;
  });

  const [scoreTypeBasis, setScoreTypeBasis] = useState<'overall' | 'learning' | 'discipline'>(() => {
    try {
      const saved = localStorage.getItem('iten_garden_score_basis');
      if (saved === 'learning' || saved === 'discipline' || saved === 'overall') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'overall';
  });
  const gardenLoaded = useRef(false);

  useEffect(() => {
    const classId = currentUser.classId;
    if (!classId) return;
    let cancelled = false;
    Promise.all([loadGardenConfig(classId), loadGardenSpinHistory(classId)]).then(([config, history]) => {
      if (cancelled) return;
      if (config) {
        setIsSpinActive(config.isSpinActive);
        setSpinAwardTarget(config.spinAwardTarget);
        setSelectedSpinWeek(config.selectedSpinWeek);
        setPointRanges(config.pointRanges);
        setScoreTypeBasis(config.scoreTypeBasis);
        setRewardConfig(config.rewardConfig);
      }
      setSpinHistory(history);
      const activeWeek = config?.selectedSpinWeek ?? selectedSpinWeek;
      const counts: Record<string, number> = {};
      history.filter(item => item.week === activeWeek).forEach(item => { counts[item.studentId] = (counts[item.studentId] || 0) + 1; });
      setUsedSpinsMap(counts);
      gardenLoaded.current = true;
    }).catch(error => console.error('[Garden load]', error));
    return () => { cancelled = true; };
  }, [currentUser.classId]);

  useEffect(() => {
    if (!gardenLoaded.current || !isTeacherOrAdmin || !currentUser.classId) return;
    saveGardenConfig({ classId: currentUser.classId, isSpinActive, spinAwardTarget, selectedSpinWeek, pointRanges, scoreTypeBasis, rewardConfig })
      .catch(error => console.error('[Garden config save]', error));
  }, [currentUser.classId, isTeacherOrAdmin, isSpinActive, spinAwardTarget, selectedSpinWeek, pointRanges, scoreTypeBasis, rewardConfig]);

  const [isStatsSettingsOpen, setIsStatsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'rules' | 'rewardConfig' | 'studentStats' | 'history'>('rules');

  // Form for adding/editing range
  const [newMin, setNewMin] = useState<number>(10);
  const [newMax, setNewMax] = useState<number>(20);
  const [newSpins, setNewSpins] = useState<number>(1);
  const [newLabel, setNewLabel] = useState<string>('');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Helper to save ranges
  const savePointRanges = (updated: PointRangeRule[]) => {
    setPointRanges(updated);
    try {
      localStorage.setItem('iten_garden_point_ranges', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveScoreBasis = (basis: 'overall' | 'learning' | 'discipline') => {
    setScoreTypeBasis(basis);
    try {
      localStorage.setItem('iten_garden_score_basis', basis);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMin < 0 || newMax < newMin || newSpins < 1) {
      alert('Vui lòng nhập khoảng điểm hợp lệ (Min <= Max) và số lượt quay lớn hơn 0!');
      return;
    }

    const defaultName = newLabel.trim() || `Mức ${newMin} - ${newMax} điểm`;

    if (editingRuleId) {
      const updated = pointRanges.map((r) =>
        r.id === editingRuleId
          ? { ...r, minPoints: newMin, maxPoints: newMax, spinsAllowed: newSpins, label: defaultName }
          : r
      );
      savePointRanges(updated);
      setEditingRuleId(null);
    } else {
      const newRule: PointRangeRule = {
        id: 'rule_' + Date.now(),
        minPoints: newMin,
        maxPoints: newMax,
        spinsAllowed: newSpins,
        label: defaultName
      };
      savePointRanges([...pointRanges, newRule]);
    }

    setNewLabel('');
    soundFx.playSuccess();
  };

  const startEditRule = (rule: PointRangeRule) => {
    setEditingRuleId(rule.id);
    setNewMin(rule.minPoints);
    setNewMax(rule.maxPoints);
    setNewSpins(rule.spinsAllowed);
    setNewLabel(rule.label);
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoảng điểm này?')) {
      const updated = pointRanges.filter((r) => r.id !== id);
      savePointRanges(updated);
      if (editingRuleId === id) {
        setEditingRuleId(null);
        setNewLabel('');
      }
      soundFx.playClick();
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục về các khoảng điểm mặc định?')) {
      savePointRanges(DEFAULT_POINT_RANGES);
      setEditingRuleId(null);
      setNewLabel('');
      soundFx.playSuccess();
    }
  };

  // Helper for timeframe label
  const getTimeframeLabel = (tf: TimeframePeriod) => {
    switch (tf) {
      case 'week': return `Tuần ${selectedSpinWeek}`;
      case 'month': return 'Tháng này';
      case 'semester1': return 'Học kỳ I (T9 - T1)';
      case 'semester2': return 'Học kỳ II (T2 - T6)';
      default: return 'Tất cả thời gian';
    }
  };

  // Helper to check if a record falls within the selected timeframe
  const isRecordInTimeframe = (recordDateStr?: string, recSemester?: string, recWeek?: number) => {
    if (timeframe === 'all' || !recordDateStr) return true;

    if (timeframe === 'semester1') {
      if (recSemester === 'Học kỳ 1' || recSemester === 'Học kỳ I' || recSemester === 'HK1') return true;
      const d = new Date(recordDateStr);
      if (!isNaN(d.getTime())) {
        const m = d.getMonth();
        return m >= 8 || m === 0;
      }
      return true;
    }

    if (timeframe === 'semester2') {
      if (recSemester === 'Học kỳ 2' || recSemester === 'Học kỳ II' || recSemester === 'HK2') return true;
      const d = new Date(recordDateStr);
      if (!isNaN(d.getTime())) {
        const m = d.getMonth();
        return m >= 1 && m <= 5;
      }
      return true;
    }

    const recDate = new Date(recordDateStr);
    if (isNaN(recDate.getTime())) return true;
    const now = new Date('2026-08-25');

    if (timeframe === 'week') {
      if (typeof recWeek === 'number' && recWeek > 0) {
        return recWeek === selectedSpinWeek;
      }
      const diffDays = (now.getTime() - recDate.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }

    if (timeframe === 'month') {
      return recDate.getMonth() === now.getMonth() && recDate.getFullYear() === now.getFullYear();
    }

    return true;
  };

  const filteredLearningRecords = useMemo(() => {
    return learningRecords.filter(r => isRecordInTimeframe(r.date, r.semester, r.week));
  }, [learningRecords, timeframe, selectedSpinWeek]);

  const filteredDisciplineRecords = useMemo(() => {
    return disciplineRecords.filter(r => isRecordInTimeframe(r.date, r.semester, r.week));
  }, [disciplineRecords, timeframe, selectedSpinWeek]);

  // 1. Calculate Learning Scores per student (Filtered by Timeframe)
  const studentLearningMap = useMemo(() => {
    const map: { [studentId: string]: { totalPoints: number; count: number; recentRecords: LearningRecord[] } } = {};
    students.forEach(st => {
      map[st.id] = { totalPoints: 0, count: 0, recentRecords: [] };
    });

    filteredLearningRecords.forEach(rec => {
      if (map[rec.studentId]) {
        map[rec.studentId].totalPoints += rec.points;
        map[rec.studentId].count += 1;
        map[rec.studentId].recentRecords.push(rec);
      }
    });

    return map;
  }, [students, filteredLearningRecords]);

  // 2. Calculate Discipline Scores per student (Filtered by Timeframe)
  const studentDisciplineMap = useMemo(() => {
    const map: {
      [studentId: string]: {
        rewardPoints: number;
        violationPoints: number;
        netPoints: number;
        count: number;
        recentRecords: DisciplineRecord[];
      };
    } = {};

    students.forEach(st => {
      map[st.id] = { rewardPoints: 0, violationPoints: 0, netPoints: 0, count: 0, recentRecords: [] };
    });

    filteredDisciplineRecords.forEach(rec => {
      if (map[rec.studentId]) {
        if (rec.type === 'reward' || rec.points > 0) {
          map[rec.studentId].rewardPoints += Math.abs(rec.points);
        } else {
          map[rec.studentId].violationPoints += Math.abs(rec.points);
        }
        map[rec.studentId].netPoints += rec.points;
        map[rec.studentId].count += 1;
        map[rec.studentId].recentRecords.push(rec);
      }
    });

    return map;
  }, [students, filteredDisciplineRecords]);

  // Activity Category Mapping to satisfy Rule #11 (Dynamic reclassification when teacher changes activity category)
  const activityCategoryMap = useMemo(() => {
    const map: Record<string, 'Điểm HĐ học tập' | 'Điểm HĐ rèn luyện'> = {};
    const parseCat = (cat?: string): 'Điểm HĐ học tập' | 'Điểm HĐ rèn luyện' => {
      if (!cat) return 'Điểm HĐ học tập';
      if (cat.includes('rèn luyện')) return 'Điểm HĐ rèn luyện';
      return 'Điểm HĐ học tập';
    };

    if (flowerConfig) {
      map[flowerConfig.id] = parseCat(flowerConfig.category);
      map['flower_game'] = parseCat(flowerConfig.category);
    }
    if (racingConfig) {
      map[racingConfig.id] = parseCat(racingConfig.category);
      map['racing_game'] = parseCat(racingConfig.category);
    }
    if (keyboardTask) {
      map[keyboardTask.id] = parseCat(keyboardTask.category);
      map['keyboard_hero'] = parseCat(keyboardTask.category);
    }
    if (memoryConfig) {
      map[memoryConfig.id] = parseCat(memoryConfig.category);
      map['memory_game'] = parseCat(memoryConfig.category);
    }
    if (spyMission) {
      map[spyMission.id] = parseCat(spyMission.category);
      map['spy_game'] = parseCat(spyMission.category);
    }

    return map;
  }, [flowerConfig, racingConfig, keyboardTask, memoryConfig, spyMission]);

  // Unified Activity Points Aggregator for Vườn Thành Tích
  const unifiedStudentGardenStats = useMemo(() => {
    const statsMap: Record<
      string,
      {
        student: User;
        academicActivityPoints: number;
        trainingActivityPoints: number;
        totalActivityPoints: number;
        academicBreakdown: Record<string, number>;
        trainingBreakdown: Record<string, number>;
        history: {
          id: string;
          date: string;
          activityTitle: string;
          points: number;
          classification: 'Điểm HĐ học tập' | 'Điểm HĐ rèn luyện';
          reason?: string;
        }[];
      }
    > = {};

    students.forEach((st) => {
      statsMap[st.id] = {
        student: st,
        academicActivityPoints: 0,
        trainingActivityPoints: 0,
        totalActivityPoints: 0,
        academicBreakdown: {
          'Hái hoa học tập': 0,
          'Đường đua học tập': 0,
          'Anh hùng bàn phím': 0,
          'Thách thức thẻ nhớ': 0,
          'Truy tìm gián điệp': 0,
          'Quay Vườn thành tích': 0
        },
        trainingBreakdown: {
          'Hái hoa học tập': 0,
          'Đường đua học tập': 0,
          'Anh hùng bàn phím': 0,
          'Thách thức thẻ nhớ': 0,
          'Truy tìm gián điệp': 0,
          'Quay Vườn thành tích': 0
        },
        history: []
      };
    });

    const getClassification = (rec: LearningRecord | DisciplineRecord) => {
      if (rec.activityId && activityCategoryMap[rec.activityId]) {
        return activityCategoryMap[rec.activityId];
      }
      if (rec.pointType === 'training_activity') return 'Điểm HĐ rèn luyện';
      if (rec.pointType === 'academic_activity') return 'Điểm HĐ học tập';
      const catStr = (rec.category || rec.categoryName || rec.reason || rec.activityName || '').toLowerCase();
      if (catStr.includes('rèn luyện') || catStr.includes('discipline')) {
        return 'Điểm HĐ rèn luyện';
      }
      return 'Điểm HĐ học tập';
    };

    const getTitle = (rec: LearningRecord | DisciplineRecord) => {
      const name = rec.activityName || rec.categoryName || rec.reason || '';
      if (name.includes('Quay Vườn thành tích') || name.includes('Vườn thành tích') || rec.activityId === 'achievement_spin') {
        return 'Quay Vườn thành tích';
      }
      if (name.includes('Hái hoa')) return 'Hái hoa học tập';
      if (name.includes('Đường đua')) return 'Đường đua học tập';
      if (name.includes('Anh hùng bàn phím')) return 'Anh hùng bàn phím';
      if (name.toLowerCase().includes('thẻ nhớ')) return 'Thách thức thẻ nhớ';
      if (name.toLowerCase().includes('gián điệp')) return 'Truy tìm gián điệp';
      return rec.activityName || rec.categoryName || 'Hoạt động học tập';
    };

    // Aggregate Learning Records
    learningRecords.forEach((rec) => {
      const stData = statsMap[rec.studentId];
      if (!stData) return;
      const classif = getClassification(rec);
      const title = getTitle(rec);
      const pts = rec.points || 0;

      if (classif === 'Điểm HĐ học tập') {
        stData.academicActivityPoints += pts;
        stData.academicBreakdown[title] = (stData.academicBreakdown[title] || 0) + pts;
      } else {
        stData.trainingActivityPoints += pts;
        stData.trainingBreakdown[title] = (stData.trainingBreakdown[title] || 0) + pts;
      }

      stData.history.push({
        id: rec.id,
        date: rec.date,
        activityTitle: title,
        points: pts,
        classification: classif,
        reason: rec.note || rec.activityName
      });
    });

    // Aggregate Discipline Records
    disciplineRecords.forEach((rec) => {
      const stData = statsMap[rec.studentId];
      if (!stData) return;
      const classif = getClassification(rec);
      const title = getTitle(rec);
      const pts = rec.points || 0;

      if (classif === 'Điểm HĐ học tập') {
        stData.academicActivityPoints += pts;
        stData.academicBreakdown[title] = (stData.academicBreakdown[title] || 0) + pts;
      } else {
        stData.trainingActivityPoints += pts;
        stData.trainingBreakdown[title] = (stData.trainingBreakdown[title] || 0) + pts;
      }

      stData.history.push({
        id: rec.id,
        date: rec.date,
        activityTitle: title,
        points: pts,
        classification: classif,
        reason: rec.reason
      });
    });

    // Compute totals & sort history
    Object.values(statsMap).forEach((stData) => {
      stData.totalActivityPoints = stData.academicActivityPoints + stData.trainingActivityPoints;
      stData.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    return statsMap;
  }, [students, learningRecords, disciplineRecords, activityCategoryMap]);

  // Active student garden stats
  const currentViewStudentId = isTeacherOrAdmin ? (selectedStudentForBonus || currentUser.id) : currentUser.id;
  const activeGardenStudentStats = useMemo(() => {
    return (
      unifiedStudentGardenStats[currentViewStudentId] || {
        student: currentUser,
        academicActivityPoints: 0,
        trainingActivityPoints: 0,
        totalActivityPoints: 0,
        academicBreakdown: {},
        trainingBreakdown: {},
        history: []
      }
    );
  }, [unifiedStudentGardenStats, currentViewStudentId, currentUser]);

  // 3. Combined Student List with Full Stats
  const combinedStudentStats = useMemo(() => {
    return students.map(st => {
      const gData = unifiedStudentGardenStats[st.id] || {
        academicActivityPoints: 0,
        trainingActivityPoints: 0,
        totalActivityPoints: 0
      };
      const learnData = studentLearningMap[st.id] || { totalPoints: 0, count: 0, recentRecords: [] };
      const discData = studentDisciplineMap[st.id] || {
        rewardPoints: 0,
        violationPoints: 0,
        netPoints: 0,
        count: 0,
        recentRecords: []
      };

      const totalOverallPoints = Math.max(learnData.totalPoints + discData.netPoints, gData.totalActivityPoints);

      return {
        student: st,
        learningPoints: Math.max(learnData.totalPoints, gData.academicActivityPoints),
        learningCount: learnData.count,
        disciplineNetPoints: Math.max(discData.netPoints, gData.trainingActivityPoints),
        disciplineRewardPoints: discData.rewardPoints,
        disciplineViolationPoints: discData.violationPoints,
        disciplineCount: discData.count,
        totalOverallPoints,
        academicActivityPoints: gData.academicActivityPoints,
        trainingActivityPoints: gData.trainingActivityPoints,
        totalActivityPoints: gData.totalActivityPoints
      };
    });
  }, [students, studentLearningMap, studentDisciplineMap, unifiedStudentGardenStats]);

  // Leaderboards
  const overallLeaderboard = useMemo(() => {
    return [...combinedStudentStats].sort((a, b) => b.totalOverallPoints - a.totalOverallPoints);
  }, [combinedStudentStats]);

  const learningLeaderboard = useMemo(() => {
    return [...combinedStudentStats].sort((a, b) => b.learningPoints - a.learningPoints);
  }, [combinedStudentStats]);

  const disciplineLeaderboard = useMemo(() => {
    return [...combinedStudentStats].sort((a, b) => b.disciplineNetPoints - a.disciplineNetPoints);
  }, [combinedStudentStats]);

  // Calculate Spin Stats per student (Filtered by timeframe & week)
  const studentSpinStatsMap = useMemo(() => {
    const map: {
      [studentId: string]: {
        totalSpinPoints: number;
        learningSpinPoints: number;
        disciplineSpinPoints: number;
        spinCount: number;
        records: SpinHistoryRecord[];
      };
    } = {};

    students.forEach((st) => {
      map[st.id] = {
        totalSpinPoints: 0,
        learningSpinPoints: 0,
        disciplineSpinPoints: 0,
        spinCount: 0,
        records: []
      };
    });

    spinHistory.forEach((log) => {
      if (isRecordInTimeframe(log.date, undefined, log.week)) {
        if (map[log.studentId]) {
          map[log.studentId].totalSpinPoints += log.points;
          if (log.category === 'learning') {
            map[log.studentId].learningSpinPoints += log.points;
          } else {
            map[log.studentId].disciplineSpinPoints += log.points;
          }
          map[log.studentId].spinCount += 1;
          map[log.studentId].records.push(log);
        }
      }
    });

    return map;
  }, [students, spinHistory, timeframe, selectedSpinWeek]);

  // Current logged in student's personal spin stats
  const currentUserSpinStats = useMemo(() => {
    return (
      studentSpinStatsMap[currentUser.id] || {
        totalSpinPoints: 0,
        learningSpinPoints: 0,
        disciplineSpinPoints: 0,
        spinCount: 0,
        records: []
      }
    );
  }, [studentSpinStatsMap, currentUser.id]);

  // Team Discipline Summaries (Bảng thống kê thi đua rèn luyện theo tổ)
  const teamDisciplineSummaries = useMemo(() => {
    const teams = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];
    return teams
      .map((tName) => {
        const memberStats = combinedStudentStats.filter((item) => (item.student.team || '').includes(tName));
        const totalDiscipline = memberStats.reduce((acc, cur) => acc + cur.disciplineNetPoints, 0);
        const totalReward = memberStats.reduce((acc, cur) => acc + cur.disciplineRewardPoints, 0);
        const totalViolation = memberStats.reduce((acc, cur) => acc + cur.disciplineViolationPoints, 0);
        const count = Math.max(1, memberStats.length);

        const totalSpinDiscipline = memberStats.reduce((acc, cur) => {
          const sStat = studentSpinStatsMap[cur.student.id];
          return acc + (sStat ? sStat.disciplineSpinPoints : 0);
        }, 0);

        return {
          teamName: tName,
          membersCount: memberStats.length,
          totalDiscipline,
          avgDiscipline: Math.round((totalDiscipline / count) * 10) / 10,
          totalReward,
          totalViolation,
          totalSpinDiscipline
        };
      })
      .sort((a, b) => b.totalDiscipline - a.totalDiscipline);
  }, [combinedStudentStats, studentSpinStatsMap]);

  // Total spin points across all students
  const totalClassSpinPoints = useMemo(() => {
    return Object.values(studentSpinStatsMap).reduce((acc: number, cur: { totalSpinPoints: number }) => acc + cur.totalSpinPoints, 0);
  }, [studentSpinStatsMap]);

  const totalClassSpinCount = useMemo(() => {
    return Object.values(studentSpinStatsMap).reduce((acc: number, cur: { spinCount: number }) => acc + cur.spinCount, 0);
  }, [studentSpinStatsMap]);

  // Team summary calculations
  const teamSummaries = useMemo(() => {
    const teams = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];
    return teams.map(tName => {
      const memberStats = combinedStudentStats.filter(item => (item.student.team || '').includes(tName));
      const totalLearning = memberStats.reduce((acc, cur) => acc + cur.learningPoints, 0);
      const totalDiscipline = memberStats.reduce((acc, cur) => acc + cur.disciplineNetPoints, 0);
      const totalOverall = totalLearning + totalDiscipline;
      const count = Math.max(1, memberStats.length);

      return {
        teamName: tName,
        membersCount: memberStats.length,
        totalLearning,
        avgLearning: Math.round((totalLearning / count) * 10) / 10,
        totalDiscipline,
        avgDiscipline: Math.round((totalDiscipline / count) * 10) / 10,
        totalOverall,
        avgOverall: Math.round((totalOverall / count) * 10) / 10
      };
    });
  }, [combinedStudentStats]);

  // Effective target category for bonus points awarded from lucky spin
  const effectiveAwardCategory = useMemo(() => {
    if (spinAwardTarget === 'learning') return 'learning';
    if (spinAwardTarget === 'discipline') return 'discipline';
    if (scoreTypeBasis === 'discipline') return 'discipline';
    return 'learning';
  }, [spinAwardTarget, scoreTypeBasis]);

  // Calculate spin allowance & remaining spins for any student
  const getStudentSpinInfo = (studentId: string) => {
    const stat = combinedStudentStats.find((s) => s.student.id === studentId);
    if (!stat) {
      return {
        points: 0,
        spins: 0,
        usedSpins: 0,
        remainingSpins: 0,
        rangeLabel: 'Chưa đủ điểm'
      };
    }

    const points =
      scoreTypeBasis === 'learning'
        ? stat.learningPoints
        : scoreTypeBasis === 'discipline'
        ? stat.disciplineNetPoints
        : stat.totalOverallPoints;

    const usedSpins = usedSpinsMap[studentId] || 0;

    const matchedRule = pointRanges.find((r) => points >= r.minPoints && points <= r.maxPoints);
    if (!matchedRule) {
      const sorted = [...pointRanges].sort((a, b) => b.minPoints - a.minPoints);
      const highest = sorted[0];
      if (highest && points > highest.maxPoints) {
        const allowed = highest.spinsAllowed;
        return {
          points,
          spins: allowed,
          usedSpins,
          remainingSpins: Math.max(0, allowed - usedSpins),
          rangeLabel: highest.label
        };
      }
      return {
        points,
        spins: 0,
        usedSpins,
        remainingSpins: 0,
        rangeLabel: 'Chưa đạt khoảng thưởng'
      };
    }

    const allowed = matchedRule.spinsAllowed;
    return {
      points,
      spins: allowed,
      usedSpins,
      remainingSpins: Math.max(0, allowed - usedSpins),
      rangeLabel: matchedRule.label
    };
  };

  // Handle Lucky Harvest Spin
  const handleSpinLuckyWheel = () => {
    if (isSpinning) return;

    // Verify remaining spins for the selected student
    const spinInfo = getStudentSpinInfo(selectedStudentForBonus);
    if (spinInfo.remainingSpins <= 0 && currentUser.role === 'student') {
      alert('Bạn đã sử dụng hết số lượt quay thưởng khả dụng! Hãy cố gắng tích lũy thêm điểm nhé.');
      return;
    }

    setIsSpinning(true);
    setSpinResult(null);
    soundFx.playCoin();

    const slicesCount = possibleRewardPoints.length;
    const sliceAngle = 360 / slicesCount;
    const chosenIndex = Math.floor(Math.random() * slicesCount);
    const chosenBonus = possibleRewardPoints[chosenIndex];

    // Calculate rotation to align chosen slice with top pointer (0 deg)
    const sliceCenterAngle = chosenIndex * sliceAngle + sliceAngle / 2;
    const targetOffset = 360 - sliceCenterAngle;
    const extraSpins = 360 * 6; // 6 full rotations
    const currentMod = wheelRotation % 360;
    const neededAdd = (targetOffset - currentMod + 360) % 360;
    const newRotation = wheelRotation + extraSpins + neededAdd;

    setWheelRotation(newRotation);

    const finalCategory = spinTargetCategory || effectiveAwardCategory;
    const targetStudentObj = students.find((s) => s.id === selectedStudentForBonus);
    const targetName = targetStudentObj?.fullName || currentUser.fullName;
    const classId = targetStudentObj?.classId || 'c1';

    const spinTransactionId = 'spin_tx_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    const pointTypeLabel = finalCategory === 'learning' ? 'Điểm HĐ học tập' : 'Điểm HĐ rèn luyện';
    const destinationName = finalCategory === 'learning' ? 'Điểm học tập' : 'Điểm rèn luyện';

    setTimeout(async () => {
      setIsSpinning(false);
      if (!targetStudentObj || !targetStudentObj.classId) {
        alert('Học sinh chưa được gán lớp học.');
        return;
      }

      if (finalCategory === 'learning') {
        const newLearningRec: LearningRecord = {
          id: spinTransactionId,
          studentId: selectedStudentForBonus,
          studentName: targetName,
          classId: classId,
          activityName: 'Quay Vườn thành tích',
          activityId: 'achievement_spin',
          pointType: 'academic_activity',
          category: 'Điểm HĐ học tập',
          points: chosenBonus,
          reason: `Quay Vườn thành tích: +${chosenBonus}đ (${pointTypeLabel} → Cộng vào ${destinationName})`,
          date: new Date().toISOString().split('T')[0],
          week: selectedSpinWeek,
          month: new Date().getMonth() + 1,
          semester: 'Học kỳ 1'
        };
        const history: SpinHistoryRecord & { classId: string } = {
          id: spinTransactionId, classId, studentId: selectedStudentForBonus, studentName: targetName,
          points: chosenBonus, category: finalCategory, pointTypeLabel, destinationLabel: `Cộng vào ${destinationName}`,
          source: 'Quay Vườn thành tích', date: new Date().toISOString().split('T')[0], week: selectedSpinWeek, timeframeLabel: `Tuần ${selectedSpinWeek}`
        };
        const point: ActivityPointRecord = {
          id: spinTransactionId, attemptId: spinTransactionId, userId: selectedStudentForBonus, studentName: targetName,
          classId, activityId: 'achievement_spin', activityName: 'Quay Vườn thành tích', source: 'garden',
          category: 'Thi đua học tập', pointType: 'academic_activity', points: chosenBonus, isCorrect: true,
          participantName: targetName, questionId: `week_${selectedSpinWeek}`, date: history.date, timestamp: new Date().toISOString()
        };
        try {
          await saveGardenSpin(history, point, spinInfo.spins);
          onAddLearningRecord(newLearningRec);
          onActivityPointSaved?.(point);
        } catch (error) { alert(error instanceof Error ? error.message : 'Không thể lưu lượt quay.'); return; }
      } else {
        const newDisciplineRec: DisciplineRecord = {
          id: spinTransactionId,
          studentId: selectedStudentForBonus,
          studentName: targetName,
          classId: classId,
          type: 'reward',
          categoryName: 'Quay Vườn thành tích',
          activityId: 'achievement_spin',
          activityName: 'Quay Vườn thành tích',
          pointType: 'training_activity',
          category: 'Điểm HĐ rèn luyện',
          points: chosenBonus,
          reason: `Quay Vườn thành tích: +${chosenBonus}đ (${pointTypeLabel} → Cộng vào ${destinationName})`,
          date: new Date().toISOString().split('T')[0],
          week: selectedSpinWeek,
          month: new Date().getMonth() + 1,
          semester: 'Học kỳ 1',
          recordedBy: currentUser.fullName
        };
        const history: SpinHistoryRecord & { classId: string } = {
          id: spinTransactionId, classId, studentId: selectedStudentForBonus, studentName: targetName,
          points: chosenBonus, category: finalCategory, pointTypeLabel, destinationLabel: `Cộng vào ${destinationName}`,
          source: 'Quay Vườn thành tích', date: new Date().toISOString().split('T')[0], week: selectedSpinWeek, timeframeLabel: `Tuần ${selectedSpinWeek}`
        };
        const point: ActivityPointRecord = {
          id: spinTransactionId, attemptId: spinTransactionId, userId: selectedStudentForBonus, studentName: targetName,
          classId, activityId: 'achievement_spin', activityName: 'Quay Vườn thành tích', source: 'garden',
          category: 'Thi đua rèn luyện', pointType: 'training_activity', points: chosenBonus, isCorrect: true,
          participantName: targetName, questionId: `week_${selectedSpinWeek}`, date: history.date, timestamp: new Date().toISOString()
        };
        try {
          await saveGardenSpin(history, point, spinInfo.spins);
          onAddDisciplineRecord(newDisciplineRec);
          onActivityPointSaved?.(point);
        } catch (error) { alert(error instanceof Error ? error.message : 'Không thể lưu lượt quay.'); return; }
      }

      setSpinResult(chosenBonus);
      soundFx.playBonus();

      // Record spin used
      recordSpinUsed(selectedStudentForBonus);

      // Add to Spin History Log
      const newHistoryLog: SpinHistoryRecord = {
        id: spinTransactionId,
        studentId: selectedStudentForBonus,
        studentName: targetName,
        points: chosenBonus,
        category: finalCategory,
        pointTypeLabel,
        destinationLabel: `Cộng vào ${destinationName}`,
        source: 'Quay Vườn thành tích',
        date: new Date().toISOString().split('T')[0],
        week: selectedSpinWeek,
        timeframeLabel: `Tuần ${selectedSpinWeek}`
      };
      setSpinHistory((prev) => {
        const updated = [newHistoryLog, ...prev];
        try {
          localStorage.setItem('iten_garden_spin_history', JSON.stringify(updated.slice(0, 300)));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
    }, 4000);
  };

  // Filter student list based on current section (overall, learning, discipline)
  const currentLeaderboardList =
    gardenSection === 'learning'
      ? learningLeaderboard
      : gardenSection === 'discipline'
      ? disciplineLeaderboard
      : overallLeaderboard;

  const filteredDisplayList = currentLeaderboardList.filter(item => {
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      item.student.fullName.toLowerCase().includes(q) ||
      item.student.username.toLowerCase().includes(q) ||
      (item.student.team && item.student.team.toLowerCase().includes(q));
    const matchTeam = teamFilter === 'all' || item.student.team === teamFilter;
    return matchQuery && matchTeam;
  });

  return (
    <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
      
      {/* 1. HEADER & INTERACTIVE REWARD TRIGGER */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏆</span>
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                {isTeacherOrAdmin
                  ? 'Quản Lý Quay Thưởng & Thống Kê Vườn Thành Tích'
                  : 'Vườn Thành Tích & Thu Hoạch Quả Ngọt Cá Nhân'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTeacherOrAdmin
                  ? 'Thiết lập quy tắc quay thưởng, thống kê điểm thưởng của học sinh và phân tích rèn luyện theo tổ.'
                  : 'Theo dõi điểm quay thưởng cá nhân và kết quả thi đua rèn luyện theo tổ.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isTeacherOrAdmin && (
            <>
              {/* Applied Week Selector Badge for Teacher / Admin */}
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-300 text-xs font-bold text-amber-950 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Tuần áp dụng:</span>
                <select
                  value={selectedSpinWeek}
                  onChange={(e) => {
                    saveSelectedSpinWeek(parseInt(e.target.value, 10));
                    soundFx.playClick();
                  }}
                  className="bg-white border border-amber-300 rounded-xl px-2 py-1 font-black text-xs text-amber-950 focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                >
                  {Array.from({ length: 35 }, (_, idx) => idx + 1).map((w) => (
                    <option key={w} value={w}>
                      Tuần {w} {w === 4 ? '(hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleSpinActive(!isSpinActive);
                  soundFx.playSuccess();
                }}
                className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSpinActive
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                }`}
                title={isSpinActive ? 'Bấm để khóa quay thưởng' : 'Bấm để kích hoạt quay thưởng cho học sinh'}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isSpinActive ? 'bg-white animate-pulse' : 'bg-amber-600'}`} />
                <span>{isSpinActive ? '🚀 Quay thưởng: ĐANG BẬT' : '🔒 Quay thưởng: ĐANG TẮT'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsStatsSettingsOpen(true);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>⚙️ Thiết lập quay thưởng</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setSpinResult(null);
              setSelectedStudentForBonus(currentUser.role === 'student' ? currentUser.id : selectedStudentForBonus);
              setIsLuckyWheelOpen(true);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black rounded-2xl text-xs shadow-lg shadow-yellow-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>🎡 Thu Hoạch Quả Ngọt May Mắn</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CORE VƯỜN THÀNH TÍCH SUMMARY HUD - 🌱 Điểm HĐ học tập | 🌿 Điểm HĐ rèn luyện | ⭐ Tổng điểm hoạt động */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white shadow-xl border-2 border-emerald-500/40 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-emerald-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-inner">
              🌸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black tracking-wide text-emerald-300 uppercase">
                  VƯỜN THÀNH TÍCH ITEN
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-400/30">
                  Tổng hợp điểm hoạt động
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                {isTeacherOrAdmin
                  ? `Học sinh: ${activeGardenStudentStats.student.fullName} (${activeGardenStudentStats.student.className || 'Lớp 8A1'})`
                  : `Tài khoản: ${currentUser.fullName} — Tất cả điểm tích lũy từ Hoạt Động`}
              </p>
            </div>
          </div>

          {/* Teacher Student Selector */}
          {isTeacherOrAdmin && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-emerald-500/30 text-xs">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-emerald-200">Chọn HS xem vườn:</span>
              <select
                value={selectedStudentForBonus}
                onChange={(e) => {
                  setSelectedStudentForBonus(e.target.value);
                  soundFx.playClick();
                }}
                className="bg-slate-900 border border-emerald-500/40 rounded-xl px-2.5 py-1 text-xs font-black text-emerald-300 focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.fullName} ({st.team || 'Cá nhân'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 3 Prominent Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: 🌱 Điểm HĐ Học Tập */}
          <div className="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 shadow-lg relative overflow-hidden group hover:border-emerald-400 transition-all">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
              🌱
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <span className="text-base">🌱</span>
              <span>Điểm HĐ học tập</span>
            </div>
            <div className="text-3xl font-black text-emerald-300 flex items-baseline gap-1.5">
              +{activeGardenStudentStats.academicActivityPoints}
              <span className="text-xs font-bold text-emerald-400/80">điểm</span>
            </div>
            <p className="text-[11px] text-emerald-200/70 mt-2">
              Từ Hái hoa, Đường đua, Anh hùng bàn phím, Thẻ nhớ...
            </p>
          </div>

          {/* Card 2: 🌿 Điểm HĐ Rèn Luyện */}
          <div className="p-5 rounded-2xl bg-teal-950/80 border border-teal-500/40 shadow-lg relative overflow-hidden group hover:border-teal-400 transition-all">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
              🌿
            </div>
            <div className="flex items-center gap-2 text-teal-400 font-black text-xs uppercase tracking-wider mb-2">
              <span className="text-base">🌿</span>
              <span>Điểm HĐ rèn luyện</span>
            </div>
            <div className="text-3xl font-black text-teal-300 flex items-baseline gap-1.5">
              +{activeGardenStudentStats.trainingActivityPoints}
              <span className="text-xs font-bold text-teal-400/80">điểm</span>
            </div>
            <p className="text-[11px] text-teal-200/70 mt-2">
              Từ Gián điệp, Nề nếp hoạt động, Thi đua nhóm...
            </p>
          </div>

          {/* Card 3: ⭐ Tổng Điểm Hoạt Động */}
          <div className="p-5 rounded-2xl bg-amber-950/80 border border-amber-500/40 shadow-lg relative overflow-hidden group hover:border-amber-400 transition-all">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-15 pointer-events-none group-hover:scale-110 transition-transform">
              ⭐
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
              <span className="text-base">⭐</span>
              <span>Tổng điểm hoạt động</span>
            </div>
            <div className="text-3xl font-black text-amber-300 flex items-baseline gap-1.5">
              +{activeGardenStudentStats.totalActivityPoints}
              <span className="text-xs font-bold text-amber-400/80">điểm</span>
            </div>
            <p className="text-[11px] text-amber-200/70 mt-2">
              🌱 Điểm HĐ học tập + 🌿 Điểm HĐ rèn luyện
            </p>
          </div>
        </div>

        {/* Detailed Breakdown per Activity Table */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-800/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h5 className="font-black text-sm uppercase tracking-wide text-emerald-300 flex items-center gap-2">
              <span>📊 THỐNG KÊ CHI TIẾT NGUỒN ĐIỂM THEO TỪNG HOẠT ĐỘNG</span>
            </h5>
            <span className="text-[11px] text-emerald-400/80 font-bold">
              Tất cả hoạt động thuộc mục Hoạt Động
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Table 1: 🌱 Điểm HĐ Học Tập Breakdown */}
            <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-800/40 space-y-2.5">
              <div className="flex items-center justify-between font-black text-emerald-300 border-b border-emerald-800/50 pb-2">
                <span className="flex items-center gap-1.5">🌱 ĐIỂM HĐ HỌC TẬP</span>
                <span>ĐIỂM</span>
              </div>
              <div className="space-y-2">
                {Object.entries(activeGardenStudentStats.academicBreakdown).length > 0 ? (
                  Object.entries(activeGardenStudentStats.academicBreakdown).map(([actName, pts]) => (
                    <div key={actName} className="flex items-center justify-between text-emerald-100/90 hover:bg-emerald-900/30 p-1.5 rounded-lg transition-colors">
                      <span className="font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {actName}
                      </span>
                      <span className="font-black text-emerald-300">+{pts}đ</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-emerald-400/60 italic">Chưa có điểm HĐ học tập</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-emerald-800/50 font-black text-emerald-300">
                <span>TỔNG ĐIỂM HĐ HỌC TẬP</span>
                <span className="text-sm">+{activeGardenStudentStats.academicActivityPoints}đ</span>
              </div>
            </div>

            {/* Table 2: 🌿 Điểm HĐ Rèn Luyện Breakdown */}
            <div className="bg-teal-950/40 rounded-xl p-4 border border-teal-800/40 space-y-2.5">
              <div className="flex items-center justify-between font-black text-teal-300 border-b border-teal-800/50 pb-2">
                <span className="flex items-center gap-1.5">🌿 ĐIỂM HĐ RÈN LUYỆN</span>
                <span>ĐIỂM</span>
              </div>
              <div className="space-y-2">
                {Object.entries(activeGardenStudentStats.trainingBreakdown).length > 0 ? (
                  Object.entries(activeGardenStudentStats.trainingBreakdown).map(([actName, pts]) => (
                    <div key={actName} className="flex items-center justify-between text-teal-100/90 hover:bg-teal-900/30 p-1.5 rounded-lg transition-colors">
                      <span className="font-semibold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                        {actName}
                      </span>
                      <span className="font-black text-teal-300">+{pts}đ</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-3 text-teal-400/60 italic">Chưa có điểm HĐ rèn luyện</div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-teal-800/50 font-black text-teal-300">
                <span>TỔNG ĐIỂM HĐ RÈN LUYỆN</span>
                <span className="text-sm">+{activeGardenStudentStats.trainingActivityPoints}đ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity History Log Section */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-emerald-800/60 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h5 className="font-black text-sm uppercase tracking-wide text-amber-300 flex items-center gap-2">
              <span>📜 LỊCH SỬ ĐIỂM HOẠT ĐỘNG ({activeGardenStudentStats.student.fullName})</span>
            </h5>
            <span className="text-[11px] text-slate-400 font-bold">
              {activeGardenStudentStats.history.length} lịch sử ghi nhận
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
            {activeGardenStudentStats.history.length > 0 ? (
              activeGardenStudentStats.history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-800/70 p-2.5 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono text-[11px]">{item.date}</span>
                    <span className="font-bold text-slate-100">{item.activityTitle}</span>
                    {item.reason && <span className="text-slate-400 text-[11px] truncate max-w-xs">({item.reason})</span>}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.classification === 'Điểm HĐ học tập'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      }`}
                    >
                      {item.classification === 'Điểm HĐ học tập' ? '🌱 Điểm HĐ học tập' : '🌿 Điểm HĐ rèn luyện'}
                    </span>
                    <span
                      className={`font-black text-sm ${
                        item.points >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.points >= 0 ? `+${item.points}` : item.points}đ
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-500 italic">Chưa có lịch sử điểm hoạt động</div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROLE 1: STUDENT VIEW (GIAO DIỆN DÀNH CHO HỌC SINH CÁ NHÂN) */}
      {/* ========================================================================= */}
      {!isTeacherOrAdmin ? (
        <div className="space-y-6">
          
          {/* A. NƠI QUAY THƯỞNG: BANNER THÔNG BÁO THU HOẠCH QUẢ NGỌT */}
          {isSpinActive ? (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 shadow-lg border-2 border-yellow-300 flex items-center justify-between flex-wrap gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">🎉</span>
                  <h4 className="font-black text-base uppercase tracking-wide text-amber-950">
                    NƠI QUAY THƯỞNG THU HOẠCH QUẢ NGỌT
                  </h4>
                </div>
                <p className="text-xs font-bold opacity-95 leading-relaxed">
                  Mức điểm thi đua đạt được: <strong className="bg-white/60 px-2.5 py-0.5 rounded-md text-amber-950">{getStudentSpinInfo(currentUser.id).rangeLabel}</strong> — 
                  Áp dụng cho: <strong>Tuần {selectedSpinWeek}</strong>
                </p>
                <div className="flex items-center gap-2 text-xs pt-0.5">
                  <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 font-black">
                    Lượt quay còn lại: {getStudentSpinInfo(currentUser.id).remainingSpins} / {getStudentSpinInfo(currentUser.id).spins} lượt
                  </span>
                  <span className="text-amber-900 font-bold">
                    (Đã quay: {getStudentSpinInfo(currentUser.id).usedSpins} lượt)
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={getStudentSpinInfo(currentUser.id).remainingSpins <= 0}
                onClick={() => {
                  setSelectedStudentForBonus(currentUser.id);
                  setSpinResult(null);
                  setIsLuckyWheelOpen(true);
                  soundFx.playClick();
                }}
                className={`px-6 py-3.5 rounded-2xl font-black text-xs shadow-xl flex items-center gap-2 cursor-pointer transition-all ${
                  getStudentSpinInfo(currentUser.id).remainingSpins > 0
                    ? 'bg-slate-900 text-amber-300 hover:bg-slate-800 hover:scale-105 active:scale-95'
                    : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  {getStudentSpinInfo(currentUser.id).remainingSpins > 0
                    ? 'MỞ VÒNG XOAY QUAY THƯỞNG NGAY'
                    : 'BẠN ĐÃ HẾT LƯỢT QUAY THƯỞNG'}
                </span>
              </button>
            </div>
          ) : (
            <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg">
                  🔒
                </div>
                <div>
                  <h5 className="font-bold text-slate-800 text-sm">Chức năng quay thưởng hiện đang đóng</h5>
                  <p className="text-xs text-slate-500">
                    Giáo viên sẽ mở tính năng quay thưởng khi đến đợt tổng kết tuần/tháng.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* B. THỐNG KÊ ĐIỂM QUAY ĐƯỢC CỦA CÁ NHÂN HỌC SINH */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>THỐNG KÊ ĐIỂM QUAY THƯỞNG CỦA CÁ NHÂN BẠN (VƯỜN THÀNH TÍCH)</span>
              </h4>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                Tuần {selectedSpinWeek}
              </span>
            </div>

            {/* 4 Cards Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-md space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-amber-100 block">
                  🌟 Tổng Điểm Thưởng Quay Được
                </span>
                <div className="text-2xl font-black">
                  +{currentUserSpinStats.totalSpinPoints.toFixed(2)}đ
                </div>
                <span className="text-[10px] text-amber-100/90 block">
                  Cộng trực tiếp từ Vòng Xoay
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700 block flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" /> Điểm Quay Học Tập
                </span>
                <div className="text-2xl font-black text-blue-800">
                  +{currentUserSpinStats.learningSpinPoints.toFixed(2)}đ
                </div>
                <span className="text-[10px] text-blue-600 block">
                  Đã tính vào Điểm HĐ Học Tập
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Điểm Quay Rèn Luyện
                </span>
                <div className="text-2xl font-black text-emerald-800">
                  +{currentUserSpinStats.disciplineSpinPoints.toFixed(2)}đ
                </div>
                <span className="text-[10px] text-emerald-600 block">
                  Đã tính vào Điểm HĐ Rèn Luyện
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-purple-700 block">
                  🎡 Số Lượt Đã Quay Thành Công
                </span>
                <div className="text-2xl font-black text-purple-900">
                  {currentUserSpinStats.spinCount} lượt
                </div>
                <span className="text-[10px] text-purple-600 block">
                  Trên tổng số {getStudentSpinInfo(currentUser.id).spins} lượt cấp
                </span>
              </div>
            </div>

            {/* Student Personal Spin History Log Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-slate-800 uppercase flex items-center gap-1.5">
                  <span>📜</span> Nhật Ký Lượt Quay Thu Hoạch Của Bạn ({currentUserSpinStats.records.length})
                </h5>
              </div>

              {currentUserSpinStats.records.length === 0 ? (
                <div className="p-6 text-center text-slate-400 italic text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Bạn chưa thực hiện lượt quay thưởng nào. Hãy bấm "QUAY THƯỞNG NGAY" để nhận điểm thưởng!
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Thời gian quay</th>
                        <th className="p-2.5 text-center">Tuần</th>
                        <th className="p-2.5 text-center">Mốc điểm trúng</th>
                        <th className="p-2.5">Phân loại cộng điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentUserSpinStats.records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-600">{rec.date}</td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px]">
                              Tuần {rec.week}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs shadow-2xs">
                              +{rec.points}đ
                            </span>
                          </td>
                          <td className="p-2.5 font-bold">
                            {rec.category === 'learning' ? (
                              <span className="text-blue-700 flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" /> Điểm HĐ Học Tập
                              </span>
                            ) : (
                              <span className="text-emerald-700 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> Điểm HĐ Rèn Luyện
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* C. RIÊNG ĐIỂM HĐ RÈN LUYỆN, HIỆN BẢNG THỐNG KÊ CỦA TỔ */}
          <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-emerald-950 text-sm uppercase tracking-wide">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>BẢNG THỐNG KÊ ĐIỂM HĐ RÈN LUYỆN THEO TỔ LỚP</span>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                Tổ của bạn: {currentUser.team || 'Tổ 1'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {teamDisciplineSummaries.map((ts, idx) => {
                const isMyTeam = (currentUser.team || '').includes(ts.teamName);
                return (
                  <div
                    key={ts.teamName}
                    className={`p-4 rounded-2xl bg-white border transition-all space-y-3 ${
                      isMyTeam
                        ? 'border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                        : 'border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black ${
                          idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-black text-slate-900 text-sm">{ts.teamName}</span>
                      </div>
                      {isMyTeam && (
                        <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          Tổ của bạn 👈
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Tổng điểm rèn luyện:</span>
                        <span className="font-black text-emerald-700 text-sm">+{ts.totalDiscipline}đ</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Trung bình/bạn:</span>
                        <span className="font-bold text-slate-800">{ts.avgDiscipline}đ</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Điểm rèn luyện từ quay:</span>
                        <span className="font-bold text-amber-600">+{ts.totalSpinDiscipline}đ</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (

        /* ========================================================================= */
        /* ROLE 2: TEACHER / ADMIN VIEW (GIAO DIỆN DÀNH CHO GIÁO VIÊN) */
        /* ========================================================================= */
        <div className="space-y-6">

          {/* A. NƠI THIẾT LẬP QUAY THƯỞNG */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-4 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-amber-400 uppercase tracking-wide">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>NƠI THIẾT LẬP QUAY THƯỞNG CỦA GIÁO VIÊN</span>
              </div>
              <span className="text-xs font-bold text-slate-400">
                Đang áp dụng: <strong className="text-amber-300">Tuần {selectedSpinWeek}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Activation Toggle */}
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Trạng Thái Lượt Quay Học Sinh:</span>
                <button
                  type="button"
                  onClick={() => {
                    toggleSpinActive(!isSpinActive);
                    soundFx.playSuccess();
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-sm ${
                    isSpinActive
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                  }`}
                >
                  {isSpinActive ? '✓ ĐANG BẬT (Bấm để Tắt)' : '🚀 BẤM ĐỂ BẬT QUAY THƯỞNG'}
                </button>
              </div>

              {/* Card 2: Week Selector */}
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Chọn Tuần Áp Dụng Quay:</span>
                <select
                  value={selectedSpinWeek}
                  onChange={(e) => {
                    saveSelectedSpinWeek(parseInt(e.target.value, 10));
                    soundFx.playClick();
                  }}
                  className="w-full p-2.5 bg-slate-900 border border-slate-600 rounded-xl font-black text-xs text-amber-300 cursor-pointer"
                >
                  {Array.from({ length: 35 }, (_, idx) => idx + 1).map((w) => (
                    <option key={w} value={w}>
                      📅 Tuần {w} {w === 4 ? '(Tuần hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card 3: Settings Modal Launcher */}
              <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Bảng Thiết Lập Chi Tiết:</span>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setIsStatsSettingsOpen(true);
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-4 h-4" />
                  <span>CẤU HÌNH MỐC ĐIỂM & QUY TẮC</span>
                </button>
              </div>
            </div>
          </div>

          {/* B. CHO PHÉP THỐNG KÊ THEO: TUẦN, THÁNG, HỌC KỲ */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-amber-950">
                <Filter className="w-4 h-4 text-amber-700" />
                <span>BỘ LỌC THỜI GIAN THỐNG KÊ (TUẦN, THÁNG, HỌC KỲ):</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'all', label: 'Tất cả thời gian', icon: '🌐' },
                  { id: 'week', label: `Tuần ${selectedSpinWeek}`, icon: '📅' },
                  { id: 'month', label: 'Tháng này', icon: '🗓️' },
                  { id: 'semester1', label: 'Học kỳ I', icon: '🎓' },
                  { id: 'semester2', label: 'Học kỳ II', icon: '🎓' },
                ].map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setTimeframe(tf.id as TimeframePeriod);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      timeframe === tf.id
                        ? 'bg-amber-600 text-white shadow-xs scale-105'
                        : 'bg-white text-slate-700 hover:bg-amber-100/60 border border-slate-300'
                    }`}
                  >
                    <span>{tf.icon}</span>
                    <span>{tf.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* C. THỐNG KÊ SỐ ĐIỂM THƯỞNG CỦA HỌC SINH (QUAY TỪ VƯỜN THÀNH TÍCH) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-amber-500" />
                  <span>THỐNG KÊ SỐ ĐIỂM THƯỞNG HỌC SINH QUAY ĐƯỢC (VƯỜN THÀNH TÍCH)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Tổng hợp số điểm thưởng cộng từ vòng xoay theo khoảng thời gian chọn: <strong>{getTimeframeLabel(timeframe)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-950 font-black text-xs border border-amber-300">
                  🌟 Tổng điểm thưởng quay cả lớp: +{totalClassSpinPoints.toFixed(2)}đ
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-purple-100 text-purple-900 font-black text-xs border border-purple-300">
                  🎡 Tổng số lượt đã quay: {totalClassSpinCount} lượt
                </div>
              </div>
            </div>

            {/* Search & Team Filter Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm học sinh theo tên, tài khoản..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((tKey) => (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setTeamFilter(tKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      teamFilter === tKey
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    {tKey === 'all' ? `Tất cả (${students.length})` : tKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Spin Points & Stats Table for Teachers */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <th className="p-3 text-center w-12">STT</th>
                      <th className="p-3">Học sinh</th>
                      <th className="p-3">Tổ / Chức vụ</th>
                      <th className="p-3 text-center">Mức đạt được</th>
                      <th className="p-3 text-center">Lượt quay (Đã dùng/Cấp)</th>
                      <th className="p-3 text-right text-blue-800">Điểm quay Học tập</th>
                      <th className="p-3 text-right text-emerald-800">Điểm quay Rèn luyện</th>
                      <th className="p-3 text-right text-amber-900">TỔNG ĐIỂM QUAY THƯỞNG</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDisplayList.map((item, idx) => {
                      const spinInfo = getStudentSpinInfo(item.student.id);
                      const sSpinStats = studentSpinStatsMap[item.student.id] || {
                        totalSpinPoints: 0,
                        learningSpinPoints: 0,
                        disciplineSpinPoints: 0,
                        spinCount: 0
                      };

                      return (
                        <tr key={item.student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item.student.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block">{item.student.fullName}</span>
                                <span className="text-[10px] text-slate-400">{item.student.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="font-semibold text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded mr-1">
                              {item.student.team || 'Lớp 8A1'}
                            </span>
                            {item.student.position && item.student.position !== 'thành viên' && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                                {item.student.position}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                              {spinInfo.rangeLabel}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-slate-800">
                              {spinInfo.usedSpins} / {spinInfo.spins} lượt
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-bold">
                              (Còn {spinInfo.remainingSpins})
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-blue-700">
                            +{sSpinStats.learningSpinPoints.toFixed(2)}đ
                          </td>
                          <td className="p-3 text-right font-black text-emerald-700">
                            +{sSpinStats.disciplineSpinPoints.toFixed(2)}đ
                          </td>
                          <td className="p-3 text-right">
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-black text-sm border border-amber-300 inline-block shadow-2xs">
                              +{sSpinStats.totalSpinPoints.toFixed(2)} điểm
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForBonus(item.student.id);
                                setSpinResult(null);
                                setIsLuckyWheelOpen(true);
                                soundFx.playClick();
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition-all cursor-pointer shadow-2xs"
                              title="Hỗ trợ quay thưởng cho học sinh"
                            >
                              🎡 Quay hộ
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* D. RIÊNG ĐIỂM HĐ RÈN LUYỆN: CÓ THỂ THỐNG KÊ THEO TỔ */}
          <div className="p-5 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-black text-emerald-950 text-sm uppercase tracking-wide">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>THỐNG KÊ ĐIỂM HĐ RÈN LUYỆN THEO 4 TỔ (GIÁO VIÊN QLY)</span>
              </div>
              <span className="text-xs text-emerald-800 font-medium italic">
                Tự động tính toán tổng điểm rèn luyện & điểm thưởng rèn luyện từ quay của từng tổ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {teamDisciplineSummaries.map((ts, idx) => (
                <div
                  key={ts.teamName}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black ${
                        idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-black text-slate-900 text-sm">{ts.teamName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-bold">{ts.membersCount} thành viên</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-semibold">Tổng điểm rèn luyện:</span>
                      <span className="font-black text-emerald-700 text-sm">+{ts.totalDiscipline}đ</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Trung bình/bạn:</span>
                      <span className="font-bold text-slate-800">{ts.avgDiscipline}đ</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Cộng thưởng (Tuyên dương):</span>
                      <span className="font-bold text-blue-600">+{ts.totalReward}đ</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Trừ phạt (Nhắc nhở):</span>
                      <span className="font-bold text-rose-600">-{ts.totalViolation}đ</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-700">Điểm rèn luyện từ quay:</span>
                      <span className="text-amber-800">+{ts.totalSpinDiscipline}đ</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. LUCKY HARVEST SPIN MODAL */}
      {isLuckyWheelOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-yellow-300 space-y-3.5 animate-in fade-in zoom-in-95 duration-200 text-center my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="text-left">
                <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>🎡</span> Vòng Quay May Mắn (Thu Hoạch Quả Ngọt)
                </h4>
                <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Áp dụng cho: <strong>Tuần {selectedSpinWeek}</strong></span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsLuckyWheelOpen(false);
                  setSpinResult(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black transition-all cursor-pointer flex items-center gap-1 border border-rose-200 shadow-2xs hover:scale-105 active:scale-95"
                title="Thoát khỏi vòng quay"
              >
                <X className="w-4 h-4 text-rose-600" />
                <span>Thoát</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Quay số may mắn nhận điểm thưởng cho học sinh dựa trên số lượt khả dụng được giáo viên cấp.
              </p>

              {/* Target Category Information */}
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1.5">
                <label className="font-bold text-slate-700 uppercase block text-[10px]">
                  🎯 Mục tiêu cộng điểm thưởng:
                </label>
                {isTeacherOrAdmin ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSpinTargetCategory('learning')}
                      className={`p-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        spinTargetCategory === 'learning'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Cộng Học tập
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpinTargetCategory('discipline')}
                      className={`p-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        spinTargetCategory === 'discipline'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Cộng Rèn luyện
                    </button>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-100/80 text-amber-950 font-extrabold text-xs flex items-center gap-2 border border-amber-300">
                    {effectiveAwardCategory === 'learning' ? (
                      <>
                        <BookOpen className="w-4 h-4 text-blue-700" />
                        <span>Cộng trực tiếp vào [Điểm HĐ Học Tập]</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                        <span>Cộng trực tiếp vào [Điểm HĐ Rèn Luyện]</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Student selector (for teachers or self for students) */}
              <div className="text-left space-y-1">
                <label className="font-bold text-slate-700 uppercase block text-[10px]">
                  Học sinh nhận thưởng:
                </label>
                {isTeacherOrAdmin ? (
                  <select
                    value={selectedStudentForBonus}
                    onChange={(e) => setSelectedStudentForBonus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.team || 'Lớp 8A1'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 bg-slate-100 rounded-xl font-bold text-slate-900 text-xs border border-slate-200">
                    👤 {currentUser.fullName} ({currentUser.team || 'Lớp 8A1'})
                  </div>
                )}
              </div>

              {/* Student spin allowance badge */}
              {selectedStudentForBonus && (
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs font-bold text-amber-950 flex items-center justify-between gap-2">
                  <div>
                    <span className="block font-black text-amber-900 text-[11px]">
                      🎯 Mức đạt: {getStudentSpinInfo(selectedStudentForBonus).rangeLabel}
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      Điểm tích lũy: {getStudentSpinInfo(selectedStudentForBonus).points}đ
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-0.5 rounded-xl bg-amber-500 text-white font-black text-[11px] shadow-sm block whitespace-nowrap">
                      Còn {getStudentSpinInfo(selectedStudentForBonus).remainingSpins} / {getStudentSpinInfo(selectedStudentForBonus).spins} lượt
                    </span>
                    <span className="text-[9px] text-amber-800 block font-normal">
                      Đã dùng: {getStudentSpinInfo(selectedStudentForBonus).usedSpins}
                    </span>
                  </div>
                </div>
              )}

              {/* VISUAL LUCKY WHEEL ANIMATED CANVAS */}
              <div className="relative w-[220px] h-[220px] sm:w-[240px] sm:h-[240px] mx-auto my-2 flex items-center justify-center select-none">
                {/* Pointer Needle */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center drop-shadow-md">
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300 border-2 border-white -mt-2 shadow-xs" />
                </div>

                {/* Outer Golden Frame */}
                <div className="absolute inset-0 rounded-full border-4 sm:border-6 border-amber-400 shadow-2xl bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-600 p-1">
                  {/* Rotating Wheel Container */}
                  <div
                    className="w-full h-full rounded-full overflow-hidden shadow-inner"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.35, 1.0)' : 'none'
                    }}
                  >
                    <svg viewBox="0 0 270 270" className="w-full h-full">
                      {possibleRewardPoints.map((val, i) => {
                        const slicesCount = possibleRewardPoints.length;
                        const sliceAngle = 360 / slicesCount;
                        const colors = [
                          '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
                          '#ec4899', '#f97316', '#06b6d4', '#84cc16',
                          '#eab308', '#6366f1'
                        ];

                        const R = 135;
                        const CX = 135;
                        const CY = 135;

                        const startAngleRad = (i * sliceAngle - 90) * (Math.PI / 180);
                        const endAngleRad = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);

                        const x1 = CX + R * Math.cos(startAngleRad);
                        const y1 = CY + R * Math.sin(startAngleRad);
                        const x2 = CX + R * Math.cos(endAngleRad);
                        const y2 = CY + R * Math.sin(endAngleRad);

                        const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                        const pathData = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                        const midAngleRad = ((i + 0.5) * sliceAngle - 90) * (Math.PI / 180);
                        const textR = R * 0.65;
                        const tx = CX + textR * Math.cos(midAngleRad);
                        const ty = CY + textR * Math.sin(midAngleRad);
                        const rotationText = (i + 0.5) * sliceAngle;

                        return (
                          <g key={i}>
                            <path
                              d={pathData}
                              fill={colors[i % colors.length]}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                            <text
                              x={tx}
                              y={ty}
                              fill="#ffffff"
                              fontWeight="900"
                              fontSize={slicesCount > 8 ? '10' : '13'}
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{
                                filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.6))',
                                transformOrigin: `${tx}px ${ty}px`,
                                transform: `rotate(${rotationText}deg)`
                              }}
                            >
                              +{val}đ
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Center Shiny Hub Button */}
                <button
                  type="button"
                  disabled={isSpinning || (currentUser.role === 'student' && getStudentSpinInfo(selectedStudentForBonus).remainingSpins <= 0)}
                  onClick={handleSpinLuckyWheel}
                  className={`absolute z-30 w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-amber-200 shadow-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isSpinning
                      ? 'bg-slate-900 text-amber-400 animate-pulse'
                      : getStudentSpinInfo(selectedStudentForBonus).remainingSpins <= 0 && currentUser.role === 'student'
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 text-slate-950 font-black hover:scale-110 active:scale-95'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">
                    {isSpinning ? '...' : 'QUAY'}
                  </span>
                </button>
              </div>

              {/* Spin Result Presentation */}
              {spinResult !== null && (
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-amber-950 font-black shadow-xl space-y-2 animate-in zoom-in duration-300 border-2 border-amber-200">
                  {/* Exit button right on top of result display */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-amber-950/20">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1">
                      <span>🎉</span> Kết quả quay thưởng
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setIsLuckyWheelOpen(false);
                        setSpinResult(null);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] shadow-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <X className="w-3.5 h-3.5 text-amber-400" />
                      <span>THOÁT</span>
                    </button>
                  </div>

                  <div className="text-lg font-black pt-0.5">CHÚC MỪNG BẠN NHẬN ĐƯỢC +{spinResult} ĐIỂM!</div>
                  <p className="text-[11px] text-amber-950 font-extrabold">
                    Đã cộng thành công vào bảng [
                    {(spinTargetCategory || effectiveAwardCategory) === 'learning' ? 'Điểm học tập' : 'Điểm rèn luyện'}]!
                  </p>

                  {/* Complete & Exit Button */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setIsLuckyWheelOpen(false);
                        setSpinResult(null);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-102 active:scale-98"
                    >
                      <LogOut className="w-3.5 h-3.5 text-amber-400" />
                      <span>HOÀN TẤT & THOÁT NGAY</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Spin Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSpinning || (currentUser.role === 'student' && getStudentSpinInfo(selectedStudentForBonus).remainingSpins <= 0)}
                  onClick={handleSpinLuckyWheel}
                  className={`flex-1 py-3 font-black rounded-2xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isSpinning || (currentUser.role === 'student' && getStudentSpinInfo(selectedStudentForBonus).remainingSpins <= 0)
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-yellow-500/30 hover:scale-102 active:scale-98 cursor-pointer'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                  <span>
                    {isSpinning
                      ? 'ĐANG QUAY QUẢ NGỌT...'
                      : getStudentSpinInfo(selectedStudentForBonus).remainingSpins <= 0 && currentUser.role === 'student'
                      ? 'ĐÃ HẾT LƯỢT QUAY THƯỞNG'
                      : spinResult !== null
                      ? 'QUAY TIẾP LƯỢT MỚI'
                      : 'QUAY THƯỞNG NGAY (+ĐIỂM)'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSpinning}
                  onClick={() => {
                    soundFx.playClick();
                    setIsLuckyWheelOpen(false);
                    setSpinResult(null);
                  }}
                  className="px-4 py-3 font-extrabold rounded-2xl text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 shadow-2xs"
                  title="Thoát khỏi vòng quay"
                >
                  <X className="w-4 h-4 text-rose-600" />
                  <span>Thoát</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TEACHER STATS SETTINGS MODAL (THIẾT LẬP THỐNG KÊ KHOẢNG ĐIỂM QUAY THƯỞNG) */}
      {isStatsSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-slate-900">
                    Thiết Lập Thống Kê Khoảng Điểm Quay Thưởng
                  </h4>
                  <p className="text-xs text-slate-500">
                    Cấu hình quy tắc khoảng điểm tích lũy và số lượt quay thưởng tương ứng cho học sinh
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsStatsSettingsOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-2xs"
                title="Thoát khỏi bảng thiết lập"
              >
                <LogOut className="w-4 h-4 text-slate-600" />
                <span>Thoát</span>
              </button>
            </div>

            {/* ACTIVATION TOGGLE CARD */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3 shadow-md">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 font-black text-sm text-amber-400 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Trạng Thái Quay Thưởng Cho Học Sinh
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleSpinActive(!isSpinActive);
                    soundFx.playSuccess();
                  }}
                  className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm ${
                    isSpinActive
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                  }`}
                >
                  <span>{isSpinActive ? '✓ Đang Kích Hoạt (Bấm để Tắt)' : '🚀 Bấm Để Kích Hoạt Quay Thưởng'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isSpinActive
                  ? '🟢 Học sinh ĐÃ CÓ THỂ tiến hành quay thưởng trực tiếp tại Vườn thành tích cá nhân!'
                  : '🔴 Chức năng quay thưởng của học sinh hiện đang TẮT. Bấm "🚀 Bấm Để Kích Hoạt Quay Thưởng" để cho phép học sinh quay.'}
              </p>
            </div>

            {/* Score Basis Selector */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 text-xs">
              <label className="font-black text-amber-950 uppercase tracking-wider block flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-700" />
                1. Chọn loại điểm căn cứ để quy đổi lượt quay:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => saveScoreBasis('overall')}
                  className={`p-3 rounded-xl font-bold text-xs cursor-pointer transition-all border text-left flex items-center gap-2 ${
                    scoreTypeBasis === 'overall'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🌟</span>
                  <div>
                    <div className="font-extrabold">Điểm Toàn Diện</div>
                    <div className="text-[10px] opacity-80">Học tập + Rèn luyện</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => saveScoreBasis('learning')}
                  className={`p-3 rounded-xl font-bold text-xs cursor-pointer transition-all border text-left flex items-center gap-2 ${
                    scoreTypeBasis === 'learning'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>📚</span>
                  <div>
                    <div className="font-extrabold">Điểm HĐ Học Tập</div>
                    <div className="text-[10px] opacity-80">Chỉ tính điểm học tập</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => saveScoreBasis('discipline')}
                  className={`p-3 rounded-xl font-bold text-xs cursor-pointer transition-all border text-left flex items-center gap-2 ${
                    scoreTypeBasis === 'discipline'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>🎖️</span>
                  <div>
                    <div className="font-extrabold">Điểm HĐ Rèn Luyện</div>
                    <div className="text-[10px] opacity-80">Chỉ tính rèn luyện</div>
                  </div>
                </button>
              </div>

              {/* Bonus Point Category Target */}
              <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
                <label className="font-black text-amber-950 uppercase tracking-wider block">
                  2. Phân loại cộng điểm thưởng khi học sinh quay trúng:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => saveSpinAwardTarget('learning')}
                    className={`p-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all border text-left flex items-center gap-2 ${
                      spinAwardTarget === 'learning'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Cộng Điểm Học Tập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => saveSpinAwardTarget('discipline')}
                    className={`p-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all border text-left flex items-center gap-2 ${
                      spinAwardTarget === 'discipline'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cộng Điểm Rèn Luyện</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => saveSpinAwardTarget('auto')}
                    className={`p-2.5 rounded-xl font-bold text-xs cursor-pointer transition-all border text-left flex items-center gap-2 ${
                      spinAwardTarget === 'auto'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>Tự động theo loại căn cứ</span>
                  </button>
                </div>
              </div>

              {/* 3. Applied Week Selector (Teacher / Admin) */}
              <div className="pt-2 border-t border-amber-200/60 space-y-2">
                <label className="font-black text-amber-950 uppercase tracking-wider flex items-center justify-between flex-wrap gap-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-amber-700" />
                    3. Chọn tuần áp dụng quay thưởng:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-[11px]">
                    Đang chọn: Tuần {selectedSpinWeek}
                  </span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedSpinWeek}
                    onChange={(e) => {
                      saveSelectedSpinWeek(parseInt(e.target.value, 10));
                      soundFx.playClick();
                    }}
                    className="p-2 bg-white border border-amber-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs min-w-[140px]"
                  >
                    {Array.from({ length: 35 }, (_, idx) => idx + 1).map((w) => (
                      <option key={w} value={w}>
                        📅 Tuần {w} {w === 4 ? '(Tuần hiện tại)' : ''}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          saveSelectedSpinWeek(w);
                          soundFx.playClick();
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedSpinWeek === w
                            ? 'bg-amber-600 text-white font-extrabold shadow-2xs scale-105'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-100'
                        }`}
                      >
                        T{w}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  * Điểm quay trúng và lượt quay khả dụng sẽ được tính toán và liên kết trực tiếp với <strong>Tuần {selectedSpinWeek}</strong>.
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveSettingsTab('rules')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeSettingsTab === 'rules'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Khoảng điểm & Lượt quay</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab('rewardConfig')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeSettingsTab === 'rewardConfig'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Điểm thưởng vòng xoay</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab('studentStats')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeSettingsTab === 'studentStats'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Thống kê học sinh ({students.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSettingsTab('history')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeSettingsTab === 'history'
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                <span>📜 Lịch sử quay</span>
              </button>
            </div>

            {/* TAB 1: RULES CONFIGURATION */}
            {activeSettingsTab === 'rules' && (
              <div className="space-y-4">
                {/* Rule Form */}
                <form onSubmit={handleSaveRule} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h5 className="font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                    {editingRuleId ? <Edit2 className="w-3.5 h-3.5 text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{editingRuleId ? 'Chỉnh sửa khoảng điểm quay thưởng' : 'Thêm khoảng điểm quay thưởng mới'}</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Từ điểm (Min):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newMin}
                        onChange={(e) => setNewMin(parseInt(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Đến điểm (Max):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newMax}
                        onChange={(e) => setNewMax(parseInt(e.target.value) || 0)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Số lượt quay thưởng:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newSpins}
                        onChange={(e) => setNewSpins(parseInt(e.target.value) || 1)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 text-xs focus:ring-2 focus:ring-slate-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Tên / Nhãn khoảng điểm (tùy chọn):
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Mức 1 - Tích cực"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <span>{editingRuleId ? 'Cập Nhật Khoảng Điểm' : '+ Thêm Khoảng Điểm'}</span>
                    </button>
                    {editingRuleId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRuleId(null);
                          setNewLabel('');
                        }}
                        className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-300 transition-colors"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>

                {/* Rules List Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-black text-xs text-slate-800 uppercase">
                      Danh sách khoảng điểm hiện tại ({pointRanges.length})
                    </h5>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Khôi phục mặc định</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Khoảng điểm</th>
                          <th className="p-3 text-center">Khung điểm</th>
                          <th className="p-3 text-center">Số lượt quay</th>
                          <th className="p-3 text-center w-24">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pointRanges.map((rule) => (
                          <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{rule.label}</td>
                            <td className="p-3 text-center font-semibold text-slate-600">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                                {rule.minPoints} – {rule.maxPoints >= 9999 ? '∞' : rule.maxPoints}đ
                              </span>
                            </td>
                            <td className="p-3 text-center font-black text-amber-700">
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                🎡 {rule.spinsAllowed} lượt
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => startEditRule(rule)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Sửa"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REWARD CONFIG */}
            {activeSettingsTab === 'rewardConfig' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                  <h5 className="font-black text-amber-950 uppercase flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Thiết lập mốc điểm thưởng trên Vòng Xoay (Min, Max, Bước nhảy)
                  </h5>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Giáo viên có thể tùy chỉnh điểm thưởng tối thiểu, tối đa và khoảng cách giữa các mốc điểm.
                    Ví dụ: Thưởng từ 0.25 đến 1.0, khoảng cách mỗi mốc là 0.25 ➜ Học sinh có thể quay được các mốc: <strong>0.25đ, 0.5đ, 0.75đ, 1.0đ</strong>.
                  </p>

                  {/* Preset Quick Selectors */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Mẫu thiết lập mốc điểm phổ biến:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => saveRewardConfig({ minReward: 0.25, maxReward: 1.0, stepReward: 0.25 })}
                        className="p-2 rounded-xl bg-white border border-slate-300 font-bold text-[11px] text-slate-800 hover:bg-amber-100/60 cursor-pointer transition-colors shadow-2xs"
                      >
                        0.25đ ➜ 1.0đ (Bước 0.25)
                      </button>

                      <button
                        type="button"
                        onClick={() => saveRewardConfig({ minReward: 0.5, maxReward: 2.0, stepReward: 0.5 })}
                        className="p-2 rounded-xl bg-white border border-slate-300 font-bold text-[11px] text-slate-800 hover:bg-amber-100/60 cursor-pointer transition-colors shadow-2xs"
                      >
                        0.5đ ➜ 2.0đ (Bước 0.5)
                      </button>

                      <button
                        type="button"
                        onClick={() => saveRewardConfig({ minReward: 1.0, maxReward: 5.0, stepReward: 1.0 })}
                        className="p-2 rounded-xl bg-white border border-slate-300 font-bold text-[11px] text-slate-800 hover:bg-amber-100/60 cursor-pointer transition-colors shadow-2xs"
                      >
                        1.0đ ➜ 5.0đ (Bước 1.0)
                      </button>

                      <button
                        type="button"
                        onClick={() => saveRewardConfig({ minReward: 5.0, maxReward: 20.0, stepReward: 5.0 })}
                        className="p-2 rounded-xl bg-white border border-slate-300 font-bold text-[11px] text-slate-800 hover:bg-amber-100/60 cursor-pointer transition-colors shadow-2xs"
                      >
                        5.0đ ➜ 20.0đ (Bước 5.0)
                      </button>
                    </div>
                  </div>

                  {/* Custom Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mốc thưởng tối thiểu (Min):</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={rewardConfig.minReward}
                        onChange={(e) => saveRewardConfig({ ...rewardConfig, minReward: parseFloat(e.target.value) || 0.25 })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Mốc thưởng tối đa (Max):</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={rewardConfig.maxReward}
                        onChange={(e) => saveRewardConfig({ ...rewardConfig, maxReward: parseFloat(e.target.value) || 1.0 })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Khoảng cách mốc điểm (Step):</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={rewardConfig.stepReward}
                        onChange={(e) => saveRewardConfig({ ...rewardConfig, stepReward: parseFloat(e.target.value) || 0.25 })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Generated Segments Preview */}
                  <div className="p-3.5 rounded-2xl bg-white border border-amber-300 space-y-2">
                    <span className="font-black text-amber-950 block">
                      🎯 Xem trước các ô mốc điểm sẽ sinh ra trên Vòng Xoay ({possibleRewardPoints.length} ô):
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {possibleRewardPoints.map((val, idx) => (
                        <span key={idx} className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-xs shadow-sm">
                          +{val}đ
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SPIN HISTORY */}
            {activeSettingsTab === 'history' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium flex items-center justify-between flex-wrap gap-2">
                  <span>📜 Nhật ký Lịch sử quay thưởng của học sinh ({spinHistory.length} lượt quay):</span>
                  {spinHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Xóa tất cả lịch sử quay thưởng?')) {
                          setSpinHistory([]);
                          localStorage.removeItem('iten_garden_spin_history');
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg text-[11px] hover:bg-rose-700 cursor-pointer"
                    >
                      Xóa nhật ký
                    </button>
                  )}
                </div>

                {spinHistory.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Chưa có lượt quay thưởng nào được thực hiện trong khoảng thời gian qua.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-80 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5">Ngày quay</th>
                          <th className="p-2.5">Học sinh</th>
                          <th className="p-2.5 text-center">Thời gian thống kê</th>
                          <th className="p-2.5 text-center">Điểm quay được</th>
                          <th className="p-2.5">Loại cộng điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {spinHistory.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-500 font-medium">{log.date}</td>
                            <td className="p-2.5 font-bold text-slate-900">{log.studentName}</td>
                            <td className="p-2.5 text-center font-semibold text-slate-600">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                                {log.timeframeLabel}
                              </span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-300">
                                +{log.points}đ
                              </span>
                            </td>
                            <td className="p-2.5 font-bold">
                              {log.category === 'learning' ? (
                                <span className="text-blue-600 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" /> Điểm Học tập
                                </span>
                              ) : (
                                <span className="text-emerald-600 flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3" /> Điểm Rèn luyện
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {activeSettingsTab === 'studentStats' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                  <div>
                    📊 Thống kê chi tiết lượt quay dựa trên: <strong>
                      {scoreTypeBasis === 'learning' ? 'Điểm HĐ học tập' : scoreTypeBasis === 'discipline' ? 'Điểm HĐ rèn luyện' : 'Tổng điểm toàn diện'}
                    </strong>.
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResetStudentSpins()}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại tất cả lượt quay</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-white">
                      <tr>
                        <th className="p-3 w-10 text-center">STT</th>
                        <th className="p-3">Học sinh</th>
                        <th className="p-3 text-center">Điểm tích lũy</th>
                        <th className="p-3">Khoảng điểm đạt được</th>
                        <th className="p-3 text-center">Được cấp</th>
                        <th className="p-3 text-center">Đã dùng</th>
                        <th className="p-3 text-center">Còn lại</th>
                        <th className="p-3 text-center w-20">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((st, index) => {
                        const spinInfo = getStudentSpinInfo(st.id);
                        return (
                          <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400">{index + 1}</td>
                            <td className="p-3 font-bold text-slate-900">
                              {st.fullName}
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                ({st.team || 'Lớp 8A1'})
                              </span>
                            </td>
                            <td className="p-3 text-center font-black text-blue-700">
                              {spinInfo.points}đ
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                                {spinInfo.rangeLabel}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-black text-xs">
                                {spinInfo.spins}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-amber-700">
                              {spinInfo.usedSpins}
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300">
                                {spinInfo.remainingSpins}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {spinInfo.usedSpins > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleResetStudentSpins(st.id)}
                                  className="text-[10px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                                >
                                  Khôi phục
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Bottom Action Footer with Exit Button */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 italic">
                * Các thiết lập sẽ tự động áp dụng và lưu vào hệ thống thi đua Vườn Thành Tích.
              </span>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsStatsSettingsOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <LogOut className="w-4 h-4 text-amber-400" />
                <span>Thoát bảng thiết lập</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
