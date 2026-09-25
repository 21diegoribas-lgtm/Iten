import React, { useState, useMemo } from 'react';
import { User, LearningRecord, DisciplineRecord, PointUsageTransaction } from '../../types';
import { soundFx } from '../../utils/sound';
import { getAvatarUrl } from '../../utils/avatarHelper';
import {
  Sparkles,
  Search,
  CheckSquare,
  History,
  AlertTriangle,
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Plus,
  RefreshCw,
  Calendar,
  Users,
  Check,
  Zap,
  Tag
} from 'lucide-react';

interface PointUsageManagerProps {
  currentUser: User;
  students: User[];
  classesList?: any[];
  learningRecords: LearningRecord[];
  disciplineRecords: DisciplineRecord[];
  pointUsageTransactions: PointUsageTransaction[];
  onAddPointUsageTransaction: (tx: PointUsageTransaction) => void;
  onCancelPointUsageTransaction: (txId: string, cancelledBy: string) => void;
}

interface StudentCardInputState {
  learningPointsToUse: string; // string so teacher can backspace, clear, type any number
  trainingPointsToUse: string; // string so teacher can backspace, clear, type any number
  reason: string;
}

const COMMON_REASONS = [
  '🎁 Đổi quà khen thưởng học tập',
  '🎟️ Đổi voucher / vé trải nghiệm ngoại khóa',
  '✏️ Đổi bộ dụng cụ học tập & sách vở',
  '🏅 Đổi huy hiệu Sao Chăm Ngoan ITEN',
  '🎯 Đổi quà rèn luyện & nếp sống',
  '⭐ Đổi điểm thưởng giờ sinh hoạt lớp',
  '🔄 Chốt điểm sử dụng học kỳ'
];

export const PointUsageManager: React.FC<PointUsageManagerProps> = ({
  currentUser,
  students,
  classesList = [],
  learningRecords,
  disciplineRecords,
  pointUsageTransactions,
  onAddPointUsageTransaction,
  onCancelPointUsageTransaction
}) => {
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';

  // Active view tab: 'students_list' | 'bulk_entry' | 'history'
  const [activeTab, setActiveTab] = useState<'students_list' | 'bulk_entry' | 'history'>('students_list');
  const [studentViewMode, setStudentViewMode] = useState<'cards' | 'table'>('cards');

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyPointTypeFilter, setHistoryPointTypeFilter] = useState<'all' | 'academic' | 'training'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  // Input states per student card: learningPointsToUse, trainingPointsToUse, reason
  const [studentCardInputs, setStudentCardInputs] = useState<Record<string, StudentCardInputState>>({});

  // Toggle 'Đã áp dụng' checkbox for a student card/row (Teachers/Admins only)
  const handleToggleApplyStudentCard = (studentId: string) => {
    if (!isTeacherOrAdmin) return;
    soundFx.playClick();
    const current = studentCardInputs[studentId];
    const hasCurrent =
      (current?.learningPointsToUse && current.learningPointsToUse !== '' && Number(current.learningPointsToUse) > 0) ||
      (current?.trainingPointsToUse && current.trainingPointsToUse !== '' && Number(current.trainingPointsToUse) > 0);

    if (hasCurrent) {
      // Untick and clear inputs
      setStudentCardInputs((prev) => ({
        ...prev,
        [studentId]: {
          learningPointsToUse: '',
          trainingPointsToUse: '',
          reason: prev[studentId]?.reason || ''
        }
      }));
    } else {
      // Tick to activate input fields
      setStudentCardInputs((prev) => ({
        ...prev,
        [studentId]: {
          learningPointsToUse: '0',
          trainingPointsToUse: '0',
          reason: prev[studentId]?.reason || 'Khấu trừ / Đổi quà khen thưởng'
        }
      }));
    }
  };

  // Toast / notification state after applying points
  const [lastAppliedToast, setLastAppliedToast] = useState<{
    studentName: string;
    details: string;
  } | null>(null);

  // Cancellation modal state
  const [cancellingTx, setCancellingTx] = useState<PointUsageTransaction | null>(null);

  // Bulk / Multiple students point usage selection
  const [selectedStudentIdsForBulk, setSelectedStudentIdsForBulk] = useState<string[]>([]);
  const [bulkPointType, setBulkPointType] = useState<'academic' | 'training'>('academic');
  const [bulkAmount, setBulkAmount] = useState<number>(10);
  const [bulkReason, setBulkReason] = useState<string>('Đổi phần thưởng học tập & rèn luyện');
  const [bulkDate, setBulkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Calculate balances per student dynamically from source records and active transactions (Idempotent source of truth)
  const studentBalancesMap = useMemo(() => {
    const map: Record<
      string,
      {
        student: User;
        totalAcademicEarned: number;
        usedAcademic: number;
        remainingAcademic: number;
        totalTrainingEarned: number;
        usedTraining: number;
        remainingTraining: number;
      }
    > = {};

    students.forEach((st) => {
      // 1. Academic points: Sum of positive learning records
      const stLearning = learningRecords.filter(
        (r) => (r.studentId === st.id || r.studentName === st.fullName) && r.points > 0
      );
      const totalAcademicEarned = stLearning.reduce((acc, r) => acc + r.points, 0);

      // Active academic point usage transactions
      const usedAcademic = pointUsageTransactions
        .filter(
          (tx) =>
            (tx.studentId === st.id || tx.studentName === st.fullName) &&
            tx.pointType === 'academic' &&
            tx.status === 'active'
        )
        .reduce((acc, tx) => acc + tx.amount, 0);

      const remainingAcademic = Math.max(0, totalAcademicEarned - usedAcademic);

      // 2. Training points: Base 100 + positive reward discipline records
      const stDiscipline = disciplineRecords.filter(
        (r) => (r.studentId === st.id || r.studentName === st.fullName) && r.points > 0
      );
      const rewardPoints = stDiscipline.reduce((acc, r) => acc + r.points, 0);
      const totalTrainingEarned = 100 + rewardPoints;

      // Active training point usage transactions
      const usedTraining = pointUsageTransactions
        .filter(
          (tx) =>
            (tx.studentId === st.id || tx.studentName === st.fullName) &&
            tx.pointType === 'training' &&
            tx.status === 'active'
        )
        .reduce((acc, tx) => acc + tx.amount, 0);

      const remainingTraining = Math.max(0, totalTrainingEarned - usedTraining);

      map[st.id] = {
        student: st,
        totalAcademicEarned,
        usedAcademic,
        remainingAcademic,
        totalTrainingEarned,
        usedTraining,
        remainingTraining
      };
    });

    return map;
  }, [students, learningRecords, disciplineRecords, pointUsageTransactions]);

  // Overall system summary stats
  const overallStats = useMemo(() => {
    let totalAcademicUsed = 0;
    let totalTrainingUsed = 0;
    let totalActiveTx = 0;

    pointUsageTransactions.forEach((tx) => {
      if (tx.status === 'active') {
        totalActiveTx += 1;
        if (tx.pointType === 'academic') totalAcademicUsed += tx.amount;
        if (tx.pointType === 'training') totalTrainingUsed += tx.amount;
      }
    });

    return {
      totalAcademicUsed,
      totalTrainingUsed,
      totalActiveTx,
      totalStudents: students.length
    };
  }, [pointUsageTransactions, students]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (selectedClass !== 'all' && st.className !== selectedClass && st.classId !== selectedClass) return false;
      if (selectedTeam !== 'all' && st.team !== selectedTeam) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = st.fullName.toLowerCase().includes(q);
        const teamMatch = st.team?.toLowerCase().includes(q);
        const posMatch = st.position?.toLowerCase().includes(q);
        return nameMatch || teamMatch || posMatch;
      }
      return true;
    });
  }, [students, selectedClass, selectedTeam, searchQuery]);

  // Filtered transactions history
  const filteredHistory = useMemo(() => {
    return pointUsageTransactions.filter((tx) => {
      if (historyPointTypeFilter !== 'all' && tx.pointType !== historyPointTypeFilter) return false;
      if (historyStatusFilter !== 'all' && tx.status !== historyStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const stMatch = tx.studentName.toLowerCase().includes(q);
        const contentMatch = tx.content.toLowerCase().includes(q);
        const performerMatch = tx.performedBy.toLowerCase().includes(q);
        return stMatch || contentMatch || performerMatch;
      }
      return true;
    });
  }, [pointUsageTransactions, historyPointTypeFilter, historyStatusFilter, searchQuery]);

  // Count of students currently having valid entered points ready to confirm
  const enteredCount = useMemo(() => {
    return filteredStudents.filter((st) => {
      const card = studentCardInputs[st.id];
      if (!card) return false;
      const l = parseInt(card.learningPointsToUse.trim() || '0', 10);
      const t = parseInt(card.trainingPointsToUse.trim() || '0', 10);
      return l > 0 || t > 0;
    }).length;
  }, [filteredStudents, studentCardInputs]);

  // Handle Input Changes for a student card (Teachers/Admins only)
  const handleLearningInputChange = (studentId: string, value: string) => {
    if (!isTeacherOrAdmin) return;
    setStudentCardInputs((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { learningPointsToUse: '', trainingPointsToUse: '', reason: '' }),
        learningPointsToUse: value
      }
    }));
  };

  const handleTrainingInputChange = (studentId: string, value: string) => {
    if (!isTeacherOrAdmin) return;
    setStudentCardInputs((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { learningPointsToUse: '', trainingPointsToUse: '', reason: '' }),
        trainingPointsToUse: value
      }
    }));
  };

  const handleReasonInputChange = (studentId: string, value: string) => {
    if (!isTeacherOrAdmin) return;
    setStudentCardInputs((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { learningPointsToUse: '', trainingPointsToUse: '', reason: '' }),
        reason: value
      }
    }));
  };

  // Execute Confirmation for a student card (Teachers/Admins only)
  const handleConfirmStudentPoints = (student: User) => {
    if (!isTeacherOrAdmin) {
      alert('⚠️ Bạn không có quyền thực hiện thao tác này. Chỉ Giáo viên và Quản trị viên mới có quyền áp dụng và trừ điểm!');
      soundFx.playError();
      return;
    }

    const cardInput = studentCardInputs[student.id] || {
      learningPointsToUse: '',
      trainingPointsToUse: '',
      reason: ''
    };

    const balance = studentBalancesMap[student.id];
    if (!balance) return;

    const trimmedLearning = cardInput.learningPointsToUse.trim();
    const trimmedTraining = cardInput.trainingPointsToUse.trim();

    const numLearning = trimmedLearning === '' ? 0 : parseInt(trimmedLearning, 10);
    const numTraining = trimmedTraining === '' ? 0 : parseInt(trimmedTraining, 10);

    // Validation checks
    if (isNaN(numLearning) || isNaN(numTraining) || (numLearning <= 0 && numTraining <= 0)) {
      alert('⚠️ Vui lòng nhập số điểm học tập hoặc điểm rèn luyện muốn sử dụng (lớn hơn 0)!');
      soundFx.playError();
      return;
    }

    if (numLearning < 0 || numTraining < 0) {
      alert('⚠️ Số điểm sử dụng không được là số âm!');
      soundFx.playError();
      return;
    }

    if (numLearning > balance.remainingAcademic) {
      alert(
        `⚠️ Số điểm học tập sử dụng (${numLearning}đ) không được lớn hơn số điểm hiện có (${balance.remainingAcademic}đ)!`
      );
      soundFx.playError();
      return;
    }

    if (numTraining > balance.remainingTraining) {
      alert(
        `⚠️ Số điểm rèn luyện sử dụng (${numTraining}đ) không được lớn hơn số điểm hiện có (${balance.remainingTraining}đ)!`
      );
      soundFx.playError();
      return;
    }

    const performedRoleTitle =
      currentUser.role === 'admin'
        ? 'Quản trị viên'
        : currentUser.role === 'teacher'
        ? 'Giáo viên'
        : 'Cán sự lớp';

    const defaultReason = cardInput.reason.trim() || 'Đổi phần thưởng học tập & rèn luyện';
    const dateStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const appliedDetailsParts: string[] = [];

    // 1. Create Academic Transaction if > 0
    if (numLearning > 0) {
      const txAcademic: PointUsageTransaction = {
        id: 'put_acad_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        studentId: student.id,
        studentName: student.fullName,
        className: student.className || '8A1',
        team: student.team || 'Tổ 1',
        pointType: 'academic',
        amount: numLearning,
        content: `${defaultReason} (-${numLearning}đ học tập)`,
        date: dateStr,
        time: timeStr,
        performedBy: currentUser.fullName || 'Giáo viên',
        performedRole: performedRoleTitle,
        status: 'active'
      };
      onAddPointUsageTransaction(txAcademic);
      appliedDetailsParts.push(`-${numLearning}đ Học tập (còn ${balance.remainingAcademic - numLearning}đ)`);
    }

    // 2. Create Training Transaction if > 0
    if (numTraining > 0) {
      const txTraining: PointUsageTransaction = {
        id: 'put_train_' + (Date.now() + 1) + '_' + Math.random().toString(36).substring(2, 7),
        studentId: student.id,
        studentName: student.fullName,
        className: student.className || '8A1',
        team: student.team || 'Tổ 1',
        pointType: 'training',
        amount: numTraining,
        content: `${defaultReason} (-${numTraining}đ rèn luyện)`,
        date: dateStr,
        time: timeStr,
        performedBy: currentUser.fullName || 'Giáo viên',
        performedRole: performedRoleTitle,
        status: 'active'
      };
      onAddPointUsageTransaction(txTraining);
      appliedDetailsParts.push(`-${numTraining}đ Rèn luyện (còn ${balance.remainingTraining - numTraining}đ)`);
    }

    soundFx.playSuccess();

    // Reset student card input state
    setStudentCardInputs((prev) => ({
      ...prev,
      [student.id]: {
        learningPointsToUse: '',
        trainingPointsToUse: '',
        reason: ''
      }
    }));

    // Toast confirmation
    setLastAppliedToast({
      studentName: student.fullName,
      details: appliedDetailsParts.join(' • ')
    });

    setTimeout(() => {
      setLastAppliedToast((cur) => (cur?.studentName === student.fullName ? null : cur));
    }, 6000);
  };

  // Batch Confirm for all students with valid inputs entered (Teachers/Admins only)
  const handleBatchConfirmAll = () => {
    if (!isTeacherOrAdmin) return;
    const validStudents = students.filter((st) => {
      const cardInput = studentCardInputs[st.id];
      if (!cardInput) return false;
      const balance = studentBalancesMap[st.id];
      if (!balance) return false;

      const numL = parseInt(cardInput.learningPointsToUse.trim() || '0', 10);
      const numT = parseInt(cardInput.trainingPointsToUse.trim() || '0', 10);

      const lValid = !isNaN(numL) && numL >= 0 && numL <= balance.remainingAcademic;
      const tValid = !isNaN(numT) && numT >= 0 && numT <= balance.remainingTraining;

      return lValid && tValid && (numL > 0 || numT > 0);
    });

    if (validStudents.length === 0) {
      alert('⚠️ Chưa có học sinh nào được nhập số điểm hợp lệ lớn hơn 0 để xác nhận!');
      soundFx.playError();
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xác nhận và trừ điểm đã dùng cho ${validStudents.length} học sinh?`)) {
      return;
    }

    validStudents.forEach((st) => {
      handleConfirmStudentPoints(st);
    });

    soundFx.playSuccess();
  };

  // Bulk deduction execution for selected students (Teachers/Admins only)
  const handleExecuteBulkDeduction = () => {
    if (!isTeacherOrAdmin) return;
    if (selectedStudentIdsForBulk.length === 0) {
      alert('Vui lòng chọn ít nhất 1 học sinh để điền điểm đã dùng!');
      return;
    }
    if (bulkAmount <= 0) {
      alert('Số điểm sử dụng phải lớn hơn 0!');
      return;
    }

    const performedRoleTitle =
      currentUser.role === 'admin'
        ? 'Quản trị viên'
        : currentUser.role === 'teacher'
        ? 'Giáo viên'
        : 'Cán sự lớp';

    let successCount = 0;

    selectedStudentIdsForBulk.forEach((stId) => {
      const st = students.find((s) => s.id === stId);
      if (!st) return;

      const balance = studentBalancesMap[stId];
      const remaining =
        bulkPointType === 'academic'
          ? balance?.remainingAcademic || 0
          : balance?.remainingTraining || 0;

      if (remaining >= bulkAmount) {
        const newTx: PointUsageTransaction = {
          id: 'put_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          studentId: st.id,
          studentName: st.fullName,
          className: st.className || '8A1',
          team: st.team || 'Tổ 1',
          pointType: bulkPointType,
          amount: bulkAmount,
          content: bulkReason.trim() || 'Đổi phần thưởng học tập & rèn luyện',
          date: bulkDate,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          performedBy: currentUser.fullName || 'Giáo viên',
          performedRole: performedRoleTitle,
          status: 'active'
        };
        onAddPointUsageTransaction(newTx);
        successCount += 1;
      }
    });

    soundFx.playSuccess();
    setBulkSuccessMsg(
      `✅ Đã ghi nhận áp dụng ${bulkAmount}đ cho ${successCount}/${selectedStudentIdsForBulk.length} học sinh đủ điều kiện!`
    );
    setSelectedStudentIdsForBulk([]);
    setTimeout(() => setBulkSuccessMsg(null), 5000);
  };

  // Handle cancellation confirmation (Teachers/Admins only)
  const handleExecuteCancelTx = () => {
    if (!isTeacherOrAdmin || !cancellingTx) return;
    onCancelPointUsageTransaction(
      cancellingTx.id,
      currentUser.fullName || 'Giáo viên/Admin'
    );
    soundFx.playSuccess();
    setCancellingTx(null);
  };

  // Toggle student selection for bulk
  const toggleStudentSelectionForBulk = (stId: string) => {
    soundFx.playClick();
    setSelectedStudentIdsForBulk((prev) =>
      prev.includes(stId) ? prev.filter((id) => id !== stId) : [...prev, stId]
    );
  };

  const handleSelectAllStudentsForBulk = () => {
    soundFx.playClick();
    if (selectedStudentIdsForBulk.length === filteredStudents.length) {
      setSelectedStudentIdsForBulk([]);
    } else {
      setSelectedStudentIdsForBulk(filteredStudents.map((s) => s.id));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 select-none animate-in fade-in duration-300 w-full min-w-0 max-w-full">
      {/* HEADER & HERO BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-xl border-2 sm:border-4 border-amber-200/80 relative overflow-hidden w-full min-w-0">
        <div className="absolute -right-4 -bottom-4 sm:-right-8 sm:-bottom-8 opacity-15 sm:opacity-20 text-6xl sm:text-8xl lg:text-9xl pointer-events-none select-none">
          🎯
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
          <div className="space-y-1.5 max-w-2xl min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-wider border border-white/30 shadow-xs">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-200 animate-spin" />
                <span className="truncate">HỆ THỐNG QUẢN LÝ ĐIỂM ITEN</span>
              </div>
              {isTeacherOrAdmin ? (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-600/90 text-white font-black text-[10px] sm:text-xs border border-emerald-300 shadow-xs">
                  <span className="truncate">👑 Giáo viên / Quản trị viên (Toàn quyền)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-sky-600/90 text-white font-black text-[10px] sm:text-xs border border-sky-300 shadow-xs">
                  <span className="truncate">🔒 Học sinh (Chế độ chỉ xem)</span>
                </div>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2">
              <span>🎯 QUẢN LÝ & SỬ DỤNG ĐIỂM HỌC TẬP - RÈN LUYỆN</span>
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm font-semibold leading-relaxed line-clamp-2 sm:line-clamp-none">
              {isTeacherOrAdmin
                ? 'Nhập trực tiếp số Điểm học tập và Điểm rèn luyện muốn sử dụng cho từng học sinh. Ô nhập số linh hoạt, tính toán số dư theo thời gian thực và ghi nhận chính xác sau khi bấm Xác nhận.'
                : 'Theo dõi điểm tích lũy học tập, điểm rèn luyện và lịch sử các lần đổi quà/sử dụng điểm. Chỉ Giáo viên và Quản trị viên mới có quyền nhập điểm và áp dụng trừ điểm.'}
            </p>
          </div>

          {/* OVERVIEW STATS BADGES */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3 min-w-0">
            <div className="bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/25 text-center min-w-0 shadow-sm">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-amber-100 font-extrabold block truncate">
                ⭐ Học tập
              </span>
              <span className="text-base sm:text-xl font-black text-amber-200">
                {overallStats.totalAcademicUsed}đ
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/25 text-center min-w-0 shadow-sm">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-emerald-100 font-extrabold block truncate">
                🌱 Rèn luyện
              </span>
              <span className="text-base sm:text-xl font-black text-emerald-200">
                {overallStats.totalTrainingUsed}đ
              </span>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-white/25 text-center min-w-0 shadow-sm">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-sky-100 font-extrabold block truncate">
                📋 Giao dịch
              </span>
              <span className="text-base sm:text-xl font-black text-white">
                {overallStats.totalActiveTx}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST POPUP NOTIFICATION */}
      {lastAppliedToast && (
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg border-2 border-emerald-300 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-black shrink-0">
              🎉
            </div>
            <div>
              <div className="font-black text-sm">
                Đã áp dụng thành công cho học sinh {lastAppliedToast.studentName}!
              </div>
              <div className="text-xs text-emerald-100 font-semibold mt-0.5">
                {lastAppliedToast.details} (Tổng điểm tích lũy giữ nguyên).
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLastAppliedToast(null)}
            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-3xl border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('students_list');
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'students_list'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {isTeacherOrAdmin
                ? 'DANH SÁCH HỌC SINH & Ô NHẬP ĐIỂM SỬ DỤNG'
                : 'BẢNG ĐIỂM HỌC SINH (CHẾ ĐỘ XEM)'}
            </span>
          </button>

          {isTeacherOrAdmin && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setActiveTab('bulk_entry');
              }}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'bulk_entry'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>ÁP DỤNG ĐIỂM HÀNG LOẠT</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setActiveTab('history');
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>LỊCH SỬ GIAO DỊCH ({pointUsageTransactions.length})</span>
          </button>
        </div>

        {/* Global Search box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên học sinh / nội dung..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {/* VIEW 1: STUDENT CARDS GRID WITH REAL EDITABLE INPUT NUMBERS */}
      {activeTab === 'students_list' && (
        <div className="space-y-4">
          {/* Quick Filters & View Mode */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Lọc theo tổ:</span>
              </span>
              {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedTeam(t);
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                    selectedTeam === t
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t === 'all' ? 'Tất cả tổ' : t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Switch Cards / Table view */}
              <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setStudentViewMode('cards');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    studentViewMode === 'cards'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>🎴 Dạng Thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setStudentViewMode('table');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    studentViewMode === 'table'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📋 Dạng Bảng</span>
                </button>
              </div>

              {isTeacherOrAdmin && enteredCount > 0 && (
                <button
                  type="button"
                  onClick={handleBatchConfirmAll}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
                  title="Xác nhận trừ điểm cho tất cả học sinh đã nhập số điểm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>XÁC NHẬN ({enteredCount} bạn)</span>
                </button>
              )}

              <div className="text-xs font-bold text-slate-500">
                Hiển thị: <strong className="text-slate-800">{filteredStudents.length}</strong> học sinh
              </div>
            </div>
          </div>

          {/* Guidelines Banner */}
          <div className="bg-amber-50/80 border border-amber-300/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950 font-medium shadow-2xs">
            <span className="text-base mt-0.5 shrink-0">💡</span>
            <div className="space-y-1">
              {isTeacherOrAdmin ? (
                <>
                  <p>
                    <strong>Hướng dẫn cho Giáo viên/Quản trị viên:</strong> Mỗi học sinh có 2 ô nhập số điểm riêng biệt: <strong className="text-amber-900">⭐ Điểm học tập</strong> và <strong className="text-emerald-900">🌱 Điểm rèn luyện</strong>.
                  </p>
                  <p className="text-amber-900">
                    Giáo viên có thể gõ bất kỳ số điểm nguyên dương nào (ví dụ: 1, 5, 15, 23, 37...). Hệ thống hiển thị số điểm còn lại dự kiến ngay lập tức. Sau khi kiểm tra, bấm <strong>&quot;XÁC NHẬN&quot;</strong> để hoàn tất trừ điểm.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Thông tin cho Học sinh:</strong> Bạn đang ở chế độ xem bảng điểm. Bạn có thể kiểm tra số điểm học tập & rèn luyện hiện có cũng như lịch sử các lần đổi điểm.
                  </p>
                  <p className="text-amber-900">
                    Chỉ có <strong>Giáo viên</strong> và <strong>Quản trị viên</strong> mới có quyền ghi nhận, điều chỉnh hoặc khấu trừ số điểm đã sử dụng.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* MODE 1: STUDENT CARDS GRID */}
          {studentViewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl border-2 border-slate-200 p-8 space-y-2">
                <div className="text-4xl">🔍</div>
                <h4 className="text-base font-black text-slate-700">Không tìm thấy học sinh nào</h4>
                <p className="text-xs text-slate-400">Vui lòng thử thay đổi từ khóa tìm kiếm hoặc bộ lọc tổ.</p>
              </div>
            ) : (
              filteredStudents.map((st) => {
                const balance = studentBalancesMap[st.id] || {
                  totalAcademicEarned: 0,
                  usedAcademic: 0,
                  remainingAcademic: 0,
                  totalTrainingEarned: 100,
                  usedTraining: 0,
                  remainingTraining: 100
                };

                const cardInput = studentCardInputs[st.id] || {
                  learningPointsToUse: '',
                  trainingPointsToUse: '',
                  reason: ''
                };

                const isSelf = currentUser.id === st.id;

                // Parse Learning Points Input
                const enteredLearning = cardInput.learningPointsToUse.trim();
                const numLearning = enteredLearning === '' ? 0 : parseInt(enteredLearning, 10);
                const isLearningValid = !isNaN(numLearning) && numLearning >= 0;
                const isLearningOverLimit = isLearningValid && numLearning > balance.remainingAcademic;
                const expectedRemainingLearning = isLearningValid
                  ? Math.max(0, balance.remainingAcademic - numLearning)
                  : balance.remainingAcademic;

                // Parse Training Points Input
                const enteredTraining = cardInput.trainingPointsToUse.trim();
                const numTraining = enteredTraining === '' ? 0 : parseInt(enteredTraining, 10);
                const isTrainingValid = !isNaN(numTraining) && numTraining >= 0;
                const isTrainingOverLimit = isTrainingValid && numTraining > balance.remainingTraining;
                const expectedRemainingTraining = isTrainingValid
                  ? Math.max(0, balance.remainingTraining - numTraining)
                  : balance.remainingTraining;

                // Has student applied points previously
                const hasAppliedBefore = balance.usedAcademic > 0 || balance.usedTraining > 0;
                const hasCurrentInput = numLearning > 0 || numTraining > 0;

                // Can confirm validation
                const canConfirm =
                  isTeacherOrAdmin &&
                  isLearningValid &&
                  isTrainingValid &&
                  !isLearningOverLimit &&
                  !isTrainingOverLimit &&
                  (numLearning > 0 || numTraining > 0);

                return (
                  <div
                    key={st.id}
                    id={`student-card-${st.id}`}
                    className={`bg-white rounded-3xl border-2 p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between ${
                      hasCurrentInput
                        ? 'border-amber-400 ring-2 ring-amber-300/60 bg-gradient-to-b from-amber-50/20 to-white'
                        : isSelf
                        ? 'border-amber-300 ring-1 ring-amber-200'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <div>
                      {/* Student Header */}
                      <div className="flex items-center gap-3 mb-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={getAvatarUrl(st)}
                            alt={st.fullName}
                            className="w-13 h-13 rounded-2xl object-cover bg-amber-100 border-2 border-amber-300 shadow-xs"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-slate-800 text-base truncate flex items-center gap-1.5">
                            <span>{st.fullName}</span>
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
                              {st.team || 'Tổ 1'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px] border border-sky-200">
                              {st.position || 'Thành viên'}
                            </span>
                            {isSelf && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] border border-amber-300">
                                ★ Bạn
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 1. ⭐ ĐIỂM HỌC TẬP SECTION */}
                      <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200 space-y-2.5 mb-3">
                        <div className="flex items-center justify-between text-xs font-black text-amber-950">
                          <span className="flex items-center gap-1">
                            <span>⭐</span>
                            <span>ĐIỂM HỌC TẬP</span>
                          </span>
                          <span className="text-amber-800 bg-white px-2 py-0.5 rounded-lg border border-amber-300 font-black text-xs shadow-2xs">
                            CÒN LẠI: +{balance.remainingAcademic}đ
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-white/90 p-2 rounded-xl border border-amber-100">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-extrabold">
                              Tổng nhận được
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              +{balance.totalAcademicEarned}đ
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-extrabold">
                              Đã sử dụng
                            </span>
                            <span className="font-bold text-amber-700 text-xs">
                              -{balance.usedAcademic}đ
                            </span>
                          </div>
                        </div>

                        {/* Ô NHẬP SỐ ĐIỂM HỌC TẬP ĐÃ DÙNG */}
                        {isTeacherOrAdmin && (
                          <div className="pt-2 border-t border-amber-200/70 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-black text-amber-950 uppercase tracking-wide">
                                Số điểm học tập đã dùng:
                              </label>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                (Tối đa: {balance.remainingAcademic}đ)
                              </span>
                            </div>

                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max={balance.remainingAcademic}
                                value={cardInput.learningPointsToUse}
                                onChange={(e) => handleLearningInputChange(st.id, e.target.value)}
                                placeholder="0"
                                className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-slate-900 font-black text-sm outline-none transition-all placeholder:text-slate-400"
                              />
                              {balance.remainingAcademic > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLearningInputChange(
                                      st.id,
                                      balance.remainingAcademic.toString()
                                    )
                                  }
                                  className="absolute right-2 top-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer"
                                >
                                  Toàn bộ
                                </button>
                              )}
                            </div>

                            {/* Quick presets for learning */}
                            <div className="flex gap-1.5 flex-wrap">
                              {[5, 10, 15, 20, 30].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleLearningInputChange(st.id, val.toString())}
                                  disabled={val > balance.remainingAcademic}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                                    val > balance.remainingAcademic
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                      : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-100'
                                  }`}
                                >
                                  +{val}đ
                                </button>
                              ))}
                            </div>

                            {/* Real-time Dynamic Result */}
                            {isLearningOverLimit ? (
                              <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                <span>⚠️ Số điểm sử dụng không được lớn hơn {balance.remainingAcademic}đ.</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 font-bold">
                                <span className="text-slate-500">Sau khi áp dụng:</span>
                                <span className="text-amber-900 font-black">
                                  {enteredLearning === '' ? (
                                    <span className="text-slate-400 font-normal">Chưa nhập số điểm</span>
                                  ) : (
                                    <span className="underline decoration-amber-400 decoration-2">
                                      +{expectedRemainingLearning}đ
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 2. 🌱 ĐIỂM RÈN LUYỆN SECTION */}
                      <div className="bg-emerald-50/80 rounded-2xl p-3.5 border border-emerald-200 space-y-2.5 mb-3">
                        <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                          <span className="flex items-center gap-1">
                            <span>🌱</span>
                            <span>ĐIỂM RÈN LUYỆN</span>
                          </span>
                          <span className="text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 font-black text-xs shadow-2xs">
                            CÒN LẠI: +{balance.remainingTraining}đ
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-white/90 p-2 rounded-xl border border-emerald-100">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-extrabold">
                              Tổng nhận được
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              +{balance.totalTrainingEarned}đ
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-extrabold">
                              Đã sử dụng
                            </span>
                            <span className="font-bold text-emerald-700 text-xs">
                              -{balance.usedTraining}đ
                            </span>
                          </div>
                        </div>

                        {/* Ô NHẬP SỐ ĐIỂM RÈN LUYỆN ĐÃ DÙNG */}
                        {isTeacherOrAdmin && (
                          <div className="pt-2 border-t border-emerald-200/70 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-black text-emerald-950 uppercase tracking-wide">
                                Số điểm rèn luyện đã dùng:
                              </label>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                (Tối đa: {balance.remainingTraining}đ)
                              </span>
                            </div>

                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max={balance.remainingTraining}
                                value={cardInput.trainingPointsToUse}
                                onChange={(e) => handleTrainingInputChange(st.id, e.target.value)}
                                placeholder="0"
                                className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-slate-900 font-black text-sm outline-none transition-all placeholder:text-slate-400"
                              />
                              {balance.remainingTraining > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleTrainingInputChange(
                                      st.id,
                                      balance.remainingTraining.toString()
                                    )
                                  }
                                  className="absolute right-2 top-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                                >
                                  Toàn bộ
                                </button>
                              )}
                            </div>

                            {/* Quick presets for training */}
                            <div className="flex gap-1.5 flex-wrap">
                              {[5, 10, 15, 20, 30].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleTrainingInputChange(st.id, val.toString())}
                                  disabled={val > balance.remainingTraining}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                                    val > balance.remainingTraining
                                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                      : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  +{val}đ
                                </button>
                              ))}
                            </div>

                            {/* Real-time Dynamic Result */}
                            {isTrainingOverLimit ? (
                              <div className="p-2 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                                <span>⚠️ Số điểm sử dụng không được lớn hơn {balance.remainingTraining}đ.</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-xl border border-emerald-200 font-bold">
                                <span className="text-slate-500">Sau khi áp dụng:</span>
                                <span className="text-emerald-900 font-black">
                                  {enteredTraining === '' ? (
                                    <span className="text-slate-400 font-normal">Chưa nhập số điểm</span>
                                  ) : (
                                    <span className="underline decoration-emerald-400 decoration-2">
                                      +{expectedRemainingTraining}đ
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION: REASON, CHECKBOX STATUS & CONFIRM BUTTON */}
                    {isTeacherOrAdmin ? (
                      <div className="space-y-2.5 pt-3 border-t border-slate-100">
                        {/* Lý do / Nội dung */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Lý do / Nội dung sử dụng:
                          </label>
                          <input
                            type="text"
                            value={cardInput.reason}
                            onChange={(e) => handleReasonInputChange(st.id, e.target.value)}
                            placeholder="VD: Đổi quà khen thưởng, nếp sống..."
                            className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-amber-400 focus:bg-white transition-all"
                          />
                        </div>

                        {/* Checkbox Đã áp dụng & Nút Xác nhận */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <label
                            onClick={() => handleToggleApplyStudentCard(st.id)}
                            className="inline-flex items-center gap-2 select-none cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
                            title="Tick để mở/đánh dấu ô nhập điểm cho học sinh này"
                          >
                            <input
                              type="checkbox"
                              checked={hasCurrentInput || hasAppliedBefore}
                              onChange={() => handleToggleApplyStudentCard(st.id)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={`text-xs font-black ${
                                hasCurrentInput
                                  ? 'text-amber-700 font-extrabold'
                                  : hasAppliedBefore
                                  ? 'text-emerald-700'
                                  : 'text-slate-500'
                              }`}
                            >
                              {hasCurrentInput
                                ? '☑ Sẵn sàng áp dụng'
                                : hasAppliedBefore
                                ? '☑ Đã từng áp dụng'
                                : '☐ Đã áp dụng'}
                            </span>
                          </label>

                          <button
                            type="button"
                            onClick={() => handleConfirmStudentPoints(st)}
                            disabled={!canConfirm}
                            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                              canConfirm
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white cursor-pointer active:scale-98 ring-2 ring-amber-300/60'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            }`}
                            title={
                              canConfirm
                                ? 'Nhấn để trừ điểm và tạo giao dịch'
                                : 'Vui lòng nhập số điểm hợp lệ lớn hơn 0 và không vượt quá số dư'
                            }
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>XÁC NHẬN</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Tổng đã dùng: <strong className="text-slate-800 font-bold">{balance.usedAcademic + balance.usedTraining}đ</strong></span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[11px] border border-slate-200">
                          🔒 Chỉ xem
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          )}

          {/* MODE 2: COMPREHENSIVE TABLE VIEW */}
          {studentViewMode === 'table' && (
            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-800 text-white text-xs font-black uppercase tracking-wider">
                      <th className="p-3.5 text-center w-12">STT</th>
                      <th className="p-3.5 text-center w-28">Trạng thái</th>
                      <th className="p-3.5 min-w-[200px]">Học sinh</th>
                      <th className="p-3.5 bg-amber-900/60 min-w-[220px]">
                        ⭐ Điểm học tập (Còn / Đã dùng)
                      </th>
                      <th className="p-3.5 bg-emerald-900/60 min-w-[220px]">
                        🌱 Điểm rèn luyện (Còn / Đã dùng)
                      </th>
                      <th className="p-3.5 min-w-[180px]">Lý do / Ghi chú</th>
                      <th className="p-3.5 text-center w-32">{isTeacherOrAdmin ? 'Thao tác' : 'Quyền hạn'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold">
                          Không tìm thấy học sinh nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((st, idx) => {
                        const balance = studentBalancesMap[st.id] || {
                          totalAcademicEarned: 0,
                          usedAcademic: 0,
                          remainingAcademic: 0,
                          totalTrainingEarned: 100,
                          usedTraining: 0,
                          remainingTraining: 100
                        };

                        const cardInput = studentCardInputs[st.id] || {
                          learningPointsToUse: '',
                          trainingPointsToUse: '',
                          reason: ''
                        };

                        // Parse Learning
                        const enteredLearning = cardInput.learningPointsToUse.trim();
                        const numLearning = enteredLearning === '' ? 0 : parseInt(enteredLearning, 10);
                        const isLearningValid = !isNaN(numLearning) && numLearning >= 0;
                        const isLearningOverLimit = isLearningValid && numLearning > balance.remainingAcademic;
                        const expectedRemainingLearning = isLearningValid
                          ? Math.max(0, balance.remainingAcademic - numLearning)
                          : balance.remainingAcademic;

                        // Parse Training
                        const enteredTraining = cardInput.trainingPointsToUse.trim();
                        const numTraining = enteredTraining === '' ? 0 : parseInt(enteredTraining, 10);
                        const isTrainingValid = !isNaN(numTraining) && numTraining >= 0;
                        const isTrainingOverLimit = isTrainingValid && numTraining > balance.remainingTraining;
                        const expectedRemainingTraining = isTrainingValid
                          ? Math.max(0, balance.remainingTraining - numTraining)
                          : balance.remainingTraining;

                        const hasCurrentInput = numLearning > 0 || numTraining > 0;
                        const hasAppliedBefore = balance.usedAcademic > 0 || balance.usedTraining > 0;

                        const canConfirm =
                          isTeacherOrAdmin &&
                          isLearningValid &&
                          isTrainingValid &&
                          !isLearningOverLimit &&
                          !isTrainingOverLimit &&
                          (numLearning > 0 || numTraining > 0);

                        return (
                          <tr
                            key={st.id}
                            className={`hover:bg-amber-50/30 transition-colors ${
                              hasCurrentInput ? 'bg-amber-50/40 font-semibold' : ''
                            }`}
                          >
                            {/* STT */}
                            <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>

                            {/* Checkbox / Trạng thái */}
                            <td className="p-3 text-center">
                              {isTeacherOrAdmin ? (
                                <label
                                  onClick={() => handleToggleApplyStudentCard(st.id)}
                                  className="inline-flex items-center justify-center p-1 cursor-pointer"
                                  title="Tick để mở/đóng nhập điểm cho học sinh này"
                                >
                                  <input
                                    type="checkbox"
                                    checked={hasCurrentInput || hasAppliedBefore}
                                    onChange={() => handleToggleApplyStudentCard(st.id)}
                                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                  />
                                </label>
                              ) : (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    hasAppliedBefore
                                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {hasAppliedBefore ? 'Đã dùng' : 'Chưa dùng'}
                                </span>
                              )}
                            </td>

                            {/* Học sinh info */}
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={getAvatarUrl(st)}
                                  alt={st.fullName}
                                  className="w-8 h-8 rounded-full border border-slate-200 shrink-0 object-cover"
                                />
                                <div>
                                  <div className="font-bold text-slate-900">{st.fullName}</div>
                                  <div className="text-[10px] text-slate-500 font-semibold">
                                    {st.className || '8A1'} • <span className="text-amber-700">{st.team || 'Tổ 1'}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Điểm học tập */}
                            <td className="p-3 bg-amber-50/40">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">
                                    Còn: <strong className="text-amber-900">+{balance.remainingAcademic}đ</strong>
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    (Đã dùng: -{balance.usedAcademic}đ)
                                  </span>
                                </div>
                                {isTeacherOrAdmin && (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      max={balance.remainingAcademic}
                                      value={cardInput.learningPointsToUse}
                                      onChange={(e) => handleLearningInputChange(st.id, e.target.value)}
                                      placeholder="0"
                                      className="w-20 px-2 py-1 bg-white border border-amber-300 rounded-lg text-xs font-black text-slate-900 focus:ring-2 focus:ring-amber-200 outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-amber-800">
                                      {numLearning > 0 ? `👉 Còn: +${expectedRemainingLearning}đ` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Điểm rèn luyện */}
                            <td className="p-3 bg-emerald-50/40">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500">
                                    Còn: <strong className="text-emerald-900">+{balance.remainingTraining}đ</strong>
                                  </span>
                                  <span className="text-slate-400 text-[10px]">
                                    (Đã dùng: -{balance.usedTraining}đ)
                                  </span>
                                </div>
                                {isTeacherOrAdmin && (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min="0"
                                      max={balance.remainingTraining}
                                      value={cardInput.trainingPointsToUse}
                                      onChange={(e) => handleTrainingInputChange(st.id, e.target.value)}
                                      placeholder="0"
                                      className="w-20 px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-black text-slate-900 focus:ring-2 focus:ring-emerald-200 outline-none"
                                    />
                                    <span className="text-[10px] font-bold text-emerald-800">
                                      {numTraining > 0 ? `👉 Còn: +${expectedRemainingTraining}đ` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Lý do */}
                            <td className="p-3">
                              {isTeacherOrAdmin ? (
                                <input
                                  type="text"
                                  value={cardInput.reason}
                                  onChange={(e) => handleReasonInputChange(st.id, e.target.value)}
                                  placeholder="Đổi quà khen thưởng..."
                                  className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:bg-white focus:border-amber-400"
                                />
                              ) : (
                                <span className="text-slate-600 text-xs">
                                  {balance.usedAcademic > 0 || balance.usedTraining > 0
                                    ? `Đã dùng ${balance.usedAcademic + balance.usedTraining}đ thưởng`
                                    : 'Chưa trừ điểm'}
                                </span>
                              )}
                            </td>

                            {/* Nút xác nhận */}
                            <td className="p-3 text-center">
                              {isTeacherOrAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmStudentPoints(st)}
                                  disabled={!canConfirm}
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 w-full transition-all cursor-pointer ${
                                    canConfirm
                                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs active:scale-95'
                                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>XÁC NHẬN</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-bold">
                                  🔒 Chỉ xem
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BULK / BATCH POINT USAGE ENTRY */}
      {activeTab === 'bulk_entry' && isTeacherOrAdmin && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>ÁP DỤNG ĐIỂM HÀNG LOẠT CHO NHIỀU HỌC SINH</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Chọn các học sinh muốn áp dụng điểm chung (Ví dụ: Trao quà nếp sống, quà học tập đồng loạt cho tổ hoặc lớp).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllStudentsForBulk}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  {selectedStudentIdsForBulk.length === filteredStudents.length
                    ? 'Bỏ chọn tất cả'
                    : 'Chọn tất cả học sinh'}
                </button>
              </div>
            </div>

            {bulkSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-900 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            {/* Bulk Form Config */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  1. Loại điểm áp dụng:
                </label>
                <select
                  value={bulkPointType}
                  onChange={(e) =>
                    setBulkPointType(e.target.value as 'academic' | 'training')
                  }
                  className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold text-xs text-slate-800"
                >
                  <option value="academic">⭐ Điểm Học Tập</option>
                  <option value="training">🌱 Điểm Rèn Luyện</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  2. Số điểm áp dụng mỗi bạn:
                </label>
                <input
                  type="number"
                  min={1}
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(Number(e.target.value))}
                  className="w-full p-2 bg-white border border-amber-300 rounded-xl font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  3. Nội dung / Lí do:
                </label>
                <input
                  type="text"
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder="Lí do sử dụng điểm..."
                  className="w-full p-2 bg-white border border-amber-300 rounded-xl font-semibold text-xs text-slate-800"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleExecuteBulkDeduction}
                  disabled={selectedStudentIdsForBulk.length === 0}
                  className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    selectedStudentIdsForBulk.length > 0
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Áp Dụng ({selectedStudentIdsForBulk.length} bạn)</span>
                </button>
              </div>
            </div>

            {/* Selectable students list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredStudents.map((st) => {
                const isSelected = selectedStudentIdsForBulk.includes(st.id);
                const balance = studentBalancesMap[st.id];
                const rem =
                  bulkPointType === 'academic'
                    ? balance?.remainingAcademic || 0
                    : balance?.remainingTraining || 0;
                const isEligible = rem >= bulkAmount;

                return (
                  <div
                    key={st.id}
                    onClick={() => toggleStudentSelectionForBulk(st.id)}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-100/90 border-amber-500 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-amber-500 rounded cursor-pointer pointer-events-none"
                      />
                      <img
                        src={getAvatarUrl(st)}
                        alt=""
                        className="w-8 h-8 rounded-xl object-cover border border-amber-200"
                      />
                      <div className="min-w-0 truncate">
                        <div className="font-black text-slate-800 text-xs truncate">
                          {st.fullName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {st.team || 'Tổ 1'} • Còn:{' '}
                          <strong className={rem > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                            +{rem}đ
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      {!isEligible && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                          Thiếu điểm
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: POINT USAGE TRANSACTION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>NHẬT KÝ CHI TIẾT CÁC LẦN ÁP DỤNG & SỬ DỤNG ĐIỂM</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Danh sách các giao dịch áp dụng điểm học tập và rèn luyện. Giáo viên/Admin có thể xem chi tiết hoặc hủy giao dịch để hoàn điểm.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={historyPointTypeFilter}
                onChange={(e) =>
                  setHistoryPointTypeFilter(
                    e.target.value as 'all' | 'academic' | 'training'
                  )
                }
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700"
              >
                <option value="all">Tất cả loại điểm</option>
                <option value="academic">⭐ Điểm Học Tập</option>
                <option value="training">🌱 Điểm Rèn Luyện</option>
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) =>
                  setHistoryStatusFilter(
                    e.target.value as 'all' | 'active' | 'cancelled'
                  )
                }
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">🟢 Đang áp dụng</option>
                <option value="cancelled">🔴 Đã hủy</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-amber-50/80 text-amber-950 font-black border-b border-amber-200">
                  <th className="p-3 text-center w-10">STT</th>
                  <th className="p-3 min-w-[110px]">Thời Gian</th>
                  <th className="p-3 min-w-[160px]">Học Sinh</th>
                  <th className="p-3 text-center min-w-[130px]">Loại Điểm</th>
                  <th className="p-3 text-center min-w-[110px]">Điểm Đã Áp Dụng</th>
                  <th className="p-3 min-w-[200px]">Nội Dung / Lí Do</th>
                  <th className="p-3 min-w-[140px]">Người Thực Hiện</th>
                  <th className="p-3 text-center min-w-[110px]">Trạng Thái</th>
                  {isTeacherOrAdmin && (
                    <th className="p-3 text-center min-w-[90px]">Thao Tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-8 text-center text-slate-400 font-medium"
                    >
                      Chưa có lịch sử áp dụng điểm nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((tx, idx) => {
                    const isAcademic = tx.pointType === 'academic';
                    const isCancelled = tx.status === 'cancelled';

                    return (
                      <tr
                        key={tx.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCancelled ? 'bg-slate-50/60 opacity-60 line-through' : ''
                        }`}
                      >
                        <td className="p-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-semibold text-slate-600">
                          <div>{tx.date}</div>
                          {tx.time && (
                            <div className="text-[10px] text-slate-400">{tx.time}</div>
                          )}
                        </td>
                        <td className="p-3 font-black text-slate-800">
                          <div>{tx.studentName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {tx.className || '8A1'} • {tx.team || 'Tổ 1'}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 border ${
                              isAcademic
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                            }`}
                          >
                            {isAcademic ? '⭐ Điểm Học Tập' : '🌱 Điểm Rèn Luyện'}
                          </span>
                        </td>
                        <td className="p-3 text-center font-black text-rose-600 text-sm">
                          -{tx.amount}đ
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {tx.content}
                        </td>
                        <td className="p-3 font-medium text-slate-600">
                          <div className="font-bold text-slate-800">{tx.performedBy}</div>
                          <div className="text-[10px] text-slate-400">
                            {tx.performedRole}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block ${
                              isCancelled
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isCancelled ? '🔴 Đã Hủy' : '🟢 Đang Áp Dụng'}
                          </span>
                        </td>
                        {isTeacherOrAdmin && (
                          <td className="p-3 text-center">
                            {!isCancelled ? (
                              <button
                                type="button"
                                onClick={() => {
                                  soundFx.playClick();
                                  setCancellingTx(tx);
                                }}
                                className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors cursor-pointer"
                              >
                                🗑️ Hủy
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                Đã hoàn điểm
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: HỦY GIAO DỊCH SỬ DỤNG ĐIỂM (HOÀN ĐIỂM) */}
      {cancellingTx && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-rose-300 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl font-black mx-auto shadow-inner">
                🗑️
              </div>
              <h3 className="text-lg font-black text-slate-900">
                XÁC NHẬN HỦY GIAO DỊCH
              </h3>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed px-2">
                Bạn có chắc chắn muốn hủy giao dịch sử dụng{' '}
                <strong className="text-rose-600">
                  {cancellingTx.amount}đ{' '}
                  {cancellingTx.pointType === 'academic' ? 'học tập' : 'rèn luyện'}
                </strong>{' '}
                của học sinh <strong className="text-slate-900">{cancellingTx.studentName}</strong> không?
              </p>
            </div>

            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <div>
                <strong>Nội dung:</strong> {cancellingTx.content}
              </div>
              <div>
                <strong>Ngày thực hiện:</strong> {cancellingTx.date} ({cancellingTx.time})
              </div>
              <p className="text-[11px] text-rose-700 italic pt-1 border-t border-rose-200">
                ★ Lưu ý: Sau khi hủy, {cancellingTx.amount}đ sẽ được tự động cộng hoàn trả lại số dư cho học sinh.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingTx(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer"
              >
                Không, giữ lại
              </button>
              <button
                type="button"
                onClick={handleExecuteCancelTx}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl cursor-pointer shadow-md"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
