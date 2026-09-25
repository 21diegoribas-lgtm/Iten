import React, { useState, useMemo } from 'react';
import { StudentSelectControl } from '../StudentSelectControl';
import {
  User,
  LearningRecord,
  PointUsageTransaction
} from '../../types';
import { soundFx } from '../../utils/sound';
import {
  BookOpen,
  Plus,
  Filter,
  Users,
  Search,
  Pencil,
  Trash2,
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface LearningCompetitionTabProps {
  currentUser: User;
  learningRecords: LearningRecord[];
  students: User[];
  pointUsageTransactions?: PointUsageTransaction[];
  onAddPointUsageTransaction?: (tx: PointUsageTransaction) => void;
  onCancelPointUsageTransaction?: (txId: string, cancelledBy: string) => void;
  onAddLearningRecord: (rec: LearningRecord) => void;
  onUpdateLearningRecord?: (rec: LearningRecord) => void;
  onDeleteLearningRecord?: (id: string) => void;
}

export const LearningCompetitionTab: React.FC<LearningCompetitionTabProps> = ({
  currentUser,
  learningRecords,
  students,
  pointUsageTransactions = [],
  onAddPointUsageTransaction,
  onCancelPointUsageTransaction,
  onAddLearningRecord,
  onUpdateLearningRecord,
  onDeleteLearningRecord
}) => {
  // Privileges: Only Teacher or Admin can add/edit/delete learning records
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isStudent = currentUser.role === 'student';
  const canAddRecord = isTeacherOrAdmin;

  // Quick Modal state
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);

  // Point usage modal state
  const [showUsePointsModal, setShowUsePointsModal] = useState<boolean>(false);
  const [usePointsStudentId, setUsePointsStudentId] = useState<string>('');
  const [usePointsAmount, setUsePointsAmount] = useState<number>(5);
  const [usePointsNote, setUsePointsNote] = useState<string>('Đổi phần thưởng học tập');

  // Filters State
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  const filterMaxWeeks = selectedSemester === 'Học kỳ 2' ? 17 : 18;

  // List of standard school subjects
  const SUBJECTS_LIST = [
    'Toán',
    'Ngữ Văn',
    'Tiếng Anh',
    'Vật Lý',
    'Hóa Học',
    'Sinh Học',
    'Lịch Sử',
    'Địa Lý',
    'Tin Học',
    'GDCD',
    'Công Nghệ',
    'Hoạt động trải nghiệm'
  ];

  const TEAMS_LIST = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

  // ================= FORM ENTRY STATE (Nhập điểm học tập) =================
  const [formWeek, setFormWeek] = useState<number>(4);
  const [formTeam, setFormTeam] = useState<string>('all');
  const [formStudentId, setFormStudentId] = useState<string>(students[0]?.id || '');
  const [formSubjectName, setFormSubjectName] = useState<string>('Toán');
  const [formRewardPoints, setFormRewardPoints] = useState<number>(0);
  const [formRewardReason, setFormRewardReason] = useState<string>('');
  const [formViolationPoints, setFormViolationPoints] = useState<number>(0);
  const [formViolationReason, setFormViolationReason] = useState<string>('');
  const [formSemester, setFormSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');

  // Filtered students in form based on chosen team
  const formFilteredStudents = useMemo(() => {
    if (formTeam === 'all') return students;
    return students.filter((s) => (s.team || 'Tổ 1') === formTeam);
  }, [students, formTeam]);

  // Edit modal state
  const [editingRecord, setEditingRecord] = useState<LearningRecord | null>(null);
  const [editStudentId, setEditStudentId] = useState<string>('');
  const [editType, setEditType] = useState<'reward' | 'violation'>('reward');
  const [editSubjectName, setEditSubjectName] = useState<string>('Toán');
  const [editActivityName, setEditActivityName] = useState<string>('');
  const [editPoints, setEditPoints] = useState<number>(5);
  const [editWeek, setEditWeek] = useState<number>(1);
  const [editSemester, setEditSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const [editNote, setEditNote] = useState<string>('');

  const startEditRecord = (rec: LearningRecord) => {
    if (!canAddRecord) return;
    setEditingRecord(rec);
    setEditStudentId(rec.studentId);
    setEditType(rec.type);
    setEditSubjectName(rec.subjectName || 'Toán');
    setEditActivityName(rec.activityName);
    setEditPoints(Math.abs(rec.points));
    setEditWeek(rec.week);
    setEditSemester(rec.semester);
    setEditNote(rec.note || '');
    soundFx.playClick();
  };

  const handleSaveEditRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !canAddRecord) return;
    const st = students.find((s) => s.id === editStudentId);
    if (!st || !editActivityName.trim()) {
      alert('Vui lòng chọn học sinh và nhập nội dung lí do!');
      return;
    }

    const calcPoints = editType === 'reward' ? Math.abs(editPoints) : -Math.abs(editPoints);
    const updated: LearningRecord = {
      ...editingRecord,
      studentId: st.id,
      studentName: st.fullName,
      classId: st.classId || 'c1',
      categoryType: 'subject',
      subjectName: editSubjectName,
      type: editType,
      activityName: editActivityName.trim(),
      points: calcPoints,
      week: editWeek,
      semester: editSemester,
      note: editNote.trim() || undefined
    };

    if (onUpdateLearningRecord) {
      onUpdateLearningRecord(updated);
    }
    soundFx.playSuccess();
    setEditingRecord(null);
    alert(`🎉 Cập nhật ghi nhận điểm học tập cho ${st.fullName} thành công!`);
  };

  const handleDeleteRecord = (id: string, studentName: string) => {
    if (!canAddRecord) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ghi nhận điểm của học sinh ${studentName}?`)) {
      if (onDeleteLearningRecord) {
        onDeleteLearningRecord(id);
      }
      soundFx.playClick();
    }
  };

  // Toggle 'isUsed' / 'isApplied' status for a single record
  const handleToggleApplyRecord = (rec: LearningRecord) => {
    if (!canAddRecord || !onUpdateLearningRecord) return;
    const isNowUsed = !(rec.isUsed || rec.isApplied);
    const updated: LearningRecord = {
      ...rec,
      isUsed: isNowUsed,
      isApplied: isNowUsed,
      usedPoints: isNowUsed ? Math.abs(rec.points) : 0,
      usedNote: isNowUsed ? (rec.usedNote || 'Giáo viên/Admin đã đánh dấu sử dụng') : undefined
    };
    onUpdateLearningRecord(updated);
    soundFx.playClick();
  };

  // Update exact used points amount on a record
  const handleSetRecordUsedAmount = (rec: LearningRecord, amount: number) => {
    if (!canAddRecord || !onUpdateLearningRecord) return;
    const clamped = Math.max(0, Math.min(Math.abs(rec.points), amount));
    const isNowUsed = clamped > 0;
    onUpdateLearningRecord({
      ...rec,
      isUsed: isNowUsed,
      isApplied: isNowUsed,
      usedPoints: clamped,
      usedNote: isNowUsed ? (rec.usedNote || 'Giáo viên/Admin nhập điểm sử dụng') : undefined
    });
  };

  // Open modal for deducting / using points for a student with manual input
  const handleToggleApplyStudent = (studentId: string, _applyState?: boolean) => {
    if (!canAddRecord) return;
    handleOpenUsePointsModal(studentId);
  };

  // Open modal for deducting / using points for a student (Teachers/Admins only)
  const handleOpenUsePointsModal = (stId?: string) => {
    if (!canAddRecord) return;
    soundFx.playClick();
    setUsePointsStudentId(stId || students[0]?.id || '');
    setUsePointsAmount(5);
    setUsePointsNote('Đổi phần thưởng học tập');
    setShowUsePointsModal(true);
  };

  // Handle deduction submit
  const handleDeductPointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddRecord) return;
    const st = students.find((s) => s.id === usePointsStudentId);
    if (!st) {
      alert('Vui lòng chọn học sinh!');
      return;
    }
    if (usePointsAmount <= 0) {
      alert('Số điểm sử dụng phải lớn hơn 0!');
      return;
    }

    const stRecs = learningRecords
      .filter((r) => (r.studentId === st.id || r.studentName === st.fullName) && r.points > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let remainingToDeduct = usePointsAmount;

    if (onUpdateLearningRecord) {
      stRecs.forEach((rec) => {
        if (remainingToDeduct <= 0) return;
        const recMax = Math.abs(rec.points);
        const currentUsed = rec.usedPoints !== undefined ? rec.usedPoints : (rec.isUsed || rec.isApplied ? recMax : 0);
        const available = recMax - currentUsed;

        if (available > 0) {
          const deduct = Math.min(available, remainingToDeduct);
          const newUsed = currentUsed + deduct;
          remainingToDeduct -= deduct;

          onUpdateLearningRecord({
            ...rec,
            isUsed: true,
            isApplied: true,
            usedPoints: newUsed,
            usedNote: usePointsNote.trim() || 'Giáo viên/Admin đã trừ sử dụng điểm'
          });
        }
      });
    }

    if (onAddPointUsageTransaction) {
      const performedRoleTitle =
        currentUser.role === 'admin'
          ? 'Quản trị viên'
          : currentUser.role === 'teacher'
          ? 'Giáo viên'
          : 'Cán sự lớp';

      onAddPointUsageTransaction({
        id: 'put_acad_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        studentId: st.id,
        studentName: st.fullName,
        className: st.className || '8A1',
        team: st.team || 'Tổ 1',
        pointType: 'academic',
        amount: usePointsAmount,
        content: usePointsNote.trim() || 'Đổi phần thưởng học tập',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        performedBy: currentUser.fullName || 'Giáo viên',
        performedRole: performedRoleTitle,
        status: 'active'
      });
    }

    soundFx.playSuccess();
    alert(`🎉 Đã khấu trừ thành công ${usePointsAmount} điểm học tập của học sinh ${st.fullName}!`);
    setShowUsePointsModal(false);
  };

  // Submit new learning record
  const handleAddRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddRecord) {
      alert('Chỉ có Giáo viên hoặc Quản trị viên mới có quyền nhập điểm học tập!');
      return;
    }
    const st = students.find((s) => s.id === formStudentId);
    if (!st) {
      alert('Vui lòng chọn học sinh!');
      return;
    }

    if (formRewardPoints <= 0 && formViolationPoints <= 0) {
      alert('Vui lòng nhập điểm cộng hoặc điểm trừ (lớn hơn 0)!');
      return;
    }

    soundFx.playSuccess();

    const recordedByTitle = ' (GV)';

    let addedCount = 0;

    // Add reward record if reward points > 0
    if (formRewardPoints > 0) {
      const rewardRec: LearningRecord = {
        id: `lr_${Date.now()}_r_${Math.random().toString(36).substring(2, 6)}`,
        studentId: st.id,
        studentName: st.fullName,
        classId: st.classId || 'c1',
        categoryType: 'subject',
        subjectName: formSubjectName,
        type: 'reward',
        activityName: formRewardReason.trim() || `Phát biểu / BTVN tốt môn ${formSubjectName}`,
        points: Math.abs(formRewardPoints),
        date: new Date().toISOString().substring(0, 10),
        week: formWeek,
        month: 8,
        semester: formSemester,
        recordedBy: currentUser.fullName + recordedByTitle
      };
      onAddLearningRecord(rewardRec);
      addedCount++;
    }

    // Add violation record if violation points > 0
    if (formViolationPoints > 0) {
      const violationRec: LearningRecord = {
        id: `lr_${Date.now()}_v_${Math.random().toString(36).substring(2, 6)}`,
        studentId: st.id,
        studentName: st.fullName,
        classId: st.classId || 'c1',
        categoryType: 'subject',
        subjectName: formSubjectName,
        type: 'violation',
        activityName: formViolationReason.trim() || `Chưa hoàn thành BTVN / vi phạm môn ${formSubjectName}`,
        points: -Math.abs(formViolationPoints),
        date: new Date().toISOString().substring(0, 10),
        week: formWeek,
        month: 8,
        semester: formSemester,
        recordedBy: currentUser.fullName + recordedByTitle
      };
      onAddLearningRecord(violationRec);
      addedCount++;
    }

    // Reset form fields
    setFormRewardPoints(0);
    setFormRewardReason('');
    setFormViolationPoints(0);
    setFormViolationReason('');
    setShowQuickAddModal(false);

    alert(`🎉 Đã nhập thành công ${addedCount} bản ghi điểm học tập cho ${st.fullName}!`);
  };

  // Filtered learning records for display log
  const filteredRecords = useMemo(() => {
    return learningRecords.filter((r) => {
      // If user is a student, only show records belonging to themselves
      if (isStudent && r.studentId !== currentUser.id && r.studentName !== currentUser.fullName) {
        return false;
      }

      if (selectedSemester !== 'all' && r.semester !== selectedSemester) return false;
      if (selectedWeekFilter !== 'all' && r.week !== selectedWeekFilter) return false;
      if (selectedSubjectFilter !== 'all' && r.subjectName !== selectedSubjectFilter) return false;

      // Filter by team
      if (selectedTeamFilter !== 'all') {
        const st = students.find((s) => s.id === r.studentId);
        if (st && (st.team || 'Tổ 1') !== selectedTeamFilter) return false;
      }

      // Search student filter
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.toLowerCase();
        if (
          !r.studentName.toLowerCase().includes(q) &&
          !r.activityName.toLowerCase().includes(q) &&
          !(r.subjectName || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    learningRecords,
    isStudent,
    currentUser.id,
    currentUser.fullName,
    selectedSemester,
    selectedWeekFilter,
    selectedSubjectFilter,
    selectedTeamFilter,
    searchStudentQuery,
    students
  ]);

  // Personal score statistics per student (by Subject & Week)
  const personalStudentStats = useMemo(() => {
    // If user is a student, only show their own student object
    const targetStudents = isStudent
      ? students.filter((st) => st.id === currentUser.id || st.fullName === currentUser.fullName)
      : students;

    return targetStudents
      .map((st) => {
        const stTeam = st.team || 'Tổ 1';

        // Filter student's records matching current filters
        const stRecs = learningRecords.filter((r) => {
          if (r.studentId !== st.id && r.studentName !== st.fullName) return false;
          if (selectedSemester !== 'all' && r.semester !== selectedSemester) return false;
          if (selectedWeekFilter !== 'all' && r.week !== selectedWeekFilter) return false;
          if (selectedSubjectFilter !== 'all' && r.subjectName !== selectedSubjectFilter) return false;
          return true;
        });

        let totalPos = 0; // All positive reward points earned
        let totalNeg = 0; // All negative points
        let usedPoints = 0; // Total points marked as used

        const rewardReasons: string[] = [];
        const violationReasons: string[] = [];
        const subjectsMap: Record<string, { pos: number; neg: number }> = {};

        stRecs.forEach((r) => {
          const sName = r.subjectName || 'Môn học';
          if (!subjectsMap[sName]) subjectsMap[sName] = { pos: 0, neg: 0 };

          const isUsed = !!(r.isUsed || r.isApplied);
          const rMax = Math.abs(r.points);
          const recUsed = r.usedPoints !== undefined ? r.usedPoints : (isUsed ? rMax : 0);

          if (r.points >= 0) {
            totalPos += r.points;
            subjectsMap[sName].pos += r.points;
            usedPoints += recUsed;
            if (r.activityName) rewardReasons.push(`${sName}: ${r.activityName} (+${r.points}đ)`);
          } else {
            totalNeg += rMax;
            subjectsMap[sName].neg += rMax;
            if (r.activityName) violationReasons.push(`${sName}: ${r.activityName} (-${rMax}đ)`);
          }
        });

        const net = totalPos - totalNeg; // Total net earned

        const txUsed = pointUsageTransactions
          ? pointUsageTransactions
              .filter(
                (tx) =>
                  (tx.studentId === st.id || tx.studentName === st.fullName) &&
                  tx.pointType === 'academic' &&
                  tx.status === 'active'
              )
              .reduce((acc, tx) => acc + tx.amount, 0)
          : 0;

        const effectiveUsed = Math.max(usedPoints, txUsed);
        const remainingPoints = Math.max(0, net - effectiveUsed); // Auto remaining balance
        const allApplied = stRecs.length > 0 && (effectiveUsed >= net || stRecs.every((r) => !!(r.isUsed || r.isApplied)));
        const hasApplied = effectiveUsed > 0 || stRecs.some((r) => !!(r.isUsed || r.isApplied));

        return {
          student: st,
          team: stTeam,
          pos: totalPos,
          neg: totalNeg,
          net,
          usedPoints: effectiveUsed,
          remainingPoints,
          allApplied,
          hasApplied,
          rewardReasons,
          violationReasons,
          subjectsMap,
          stRecs,
          recordCount: stRecs.length
        };
      })
      .filter((item) => {
        if (selectedTeamFilter !== 'all' && item.team !== selectedTeamFilter) return false;
        if (!searchStudentQuery.trim()) return true;
        const q = searchStudentQuery.toLowerCase();
        return (
          item.student.fullName.toLowerCase().includes(q) ||
          item.team.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.remainingPoints - a.remainingPoints);
  }, [
    students,
    learningRecords,
    isStudent,
    currentUser.id,
    currentUser.fullName,
    selectedSemester,
    selectedWeekFilter,
    selectedSubjectFilter,
    selectedTeamFilter,
    searchStudentQuery
  ]);

  // Overall Statistics computation
  const tabStats = useMemo(() => {
    let totalPositivePoints = 0;
    let totalNegativePoints = 0;
    let totalUsedPoints = 0;

    filteredRecords.forEach((r) => {
      const isUsed = !!(r.isUsed || r.isApplied);
      const rMax = Math.abs(r.points);
      const recUsed = r.usedPoints !== undefined ? r.usedPoints : (isUsed ? rMax : 0);

      if (r.points >= 0) {
        totalPositivePoints += r.points;
        totalUsedPoints += recUsed;
      } else {
        totalNegativePoints += rMax;
      }
    });

    const netPoints = totalPositivePoints - totalNegativePoints;
    const remainingPoints = Math.max(0, netPoints - totalUsedPoints);

    return {
      totalRecords: filteredRecords.length,
      totalPositivePoints,
      totalNegativePoints,
      netPoints,
      totalUsedPoints,
      remainingPoints
    };
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-amber-200">
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>ĐIỂM HỌC TẬP CÁ NHÂN</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight drop-shadow-sm">
            BẢNG ĐIỂM HỌC TẬP LỚP HỌC
          </h2>
          <p className="text-sm font-medium text-white/90 max-w-2xl">
            Thống kê điểm học tập cá nhân chi tiết theo từng Bộ Môn và từng Tuần học.
          </p>
        </div>

        {canAddRecord ? (
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setShowQuickAddModal(true);
            }}
            className="px-5 py-3 bg-amber-400 text-slate-950 hover:bg-amber-300 font-black rounded-2xl text-xs shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-amber-300/60"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>➕ Nhập Điểm Học Tập</span>
          </button>
        ) : (
          <div className="text-[11px] bg-white/20 backdrop-blur-xs px-3 py-2 rounded-2xl font-bold text-white flex items-center gap-1.5 border border-white/30">
            <span>👁️ Bạn đang xem điểm thống kê cá nhân ({currentUser.fullName})</span>
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Bộ Lọc Bảng Thống Kê & Ghi Nhận Điểm Học Tập:</span>
          </div>
          <span className="text-slate-500 font-normal">
            Hiển thị {filteredRecords.length} ghi nhận học tập
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Semester filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">🎓 Học kỳ:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">Tất cả các học kỳ</option>
              <option value="Học kỳ 1">Học kỳ 1 (18 tuần)</option>
              <option value="Học kỳ 2">Học kỳ 2 (17 tuần)</option>
            </select>
          </div>

          {/* Week filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">🗓️ Tuần học:</label>
            <select
              value={selectedWeekFilter === 'all' ? 'all' : String(selectedWeekFilter)}
              onChange={(e) =>
                setSelectedWeekFilter(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">Tất cả các tuần (Tuần 1 - {filterMaxWeeks})</option>
              {Array.from({ length: filterMaxWeeks }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Tuần {w}
                </option>
              ))}
            </select>
          </div>

          {/* Subject filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">📘 Bộ Môn Học:</label>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">Tất cả các bộ môn học</option>
              {SUBJECTS_LIST.map((sub) => (
                <option key={sub} value={sub}>
                  Môn {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">👥 Chọn Tổ:</label>
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="all">Tất cả các Tổ (Tổ 1 - Tổ 4)</option>
              {TEAMS_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold">
            📘
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Tổng Tích Lũy (+)</span>
            <div className="text-2xl font-black text-slate-800">
              +{tabStats.totalPositivePoints} điểm
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Tổng Điểm Trừ (-)</span>
            <div className="text-2xl font-black text-rose-600">
              -{tabStats.totalNegativePoints} điểm
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl font-bold">
            🔖
          </div>
          <div className="flex-1">
            <span className="text-xs text-slate-500 font-bold uppercase">Điểm Đã Sử Dụng</span>
            <div className="text-2xl font-black text-amber-700">
              -{tabStats.totalUsedPoints} điểm
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
            🏆
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-100 font-extrabold uppercase tracking-wide">Số Điểm Học Tập Còn Lại</span>
              {canAddRecord && (
                <button
                  type="button"
                  onClick={() => handleOpenUsePointsModal()}
                  className="px-2 py-0.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 font-black text-[10px] shadow-xs cursor-pointer transition-colors"
                >
                  ⚡ Đổi / Trừ điểm
                </button>
              )}
            </div>
            <div className="text-2xl font-black text-white mt-0.5">
              +{tabStats.remainingPoints} điểm
            </div>
          </div>
        </div>
      </div>

      {/* BẢNG THỐNG KÊ ĐIỂM CÁ NHÂN THEO BỘ MÔN VÀ TỪNG TUẦN */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>BẢNG THỐNG KÊ ĐIỂM CÁ NHÂN THEO BỘ MÔN & QUẢN LÝ SỐ DƯ ĐIỂM HỌC TẬP</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thống kê tổng điểm tích lũy, số điểm giáo viên/admin đã đánh dấu sử dụng và <strong>Số Điểm Học Tập Còn Lại</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canAddRecord && (
              <button
                type="button"
                onClick={() => handleOpenUsePointsModal()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>⚡ Đổi / Khấu trừ Điểm Học Tập</span>
              </button>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                placeholder="Tìm tên học sinh..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold w-44"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blue-50/80 text-blue-950 font-black border-b border-blue-200">
                <th className="p-3 text-center w-10">STT</th>
                <th className="p-3 min-w-[160px]">Họ và Tên Học Sinh</th>
                <th className="p-3 text-center">Tổ</th>
                <th className="p-3 text-center bg-emerald-100/60 text-emerald-900">Điểm Tích Lũy (+/-)</th>
                <th className="p-3 text-center bg-amber-100/60 text-amber-900 min-w-[130px]">Điểm Đã Sử Dụng</th>
                <th className="p-3 text-center bg-emerald-200/80 text-emerald-950 min-w-[140px] text-sm">SỐ ĐIỂM CÒN LẠI</th>
                <th className="p-3 min-w-[200px]">Lí Do Ghi Nhận</th>
                <th className="p-3 text-center min-w-[130px] bg-indigo-100/80 text-indigo-950">Đánh Dấu Sử Dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {personalStudentStats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                    Chưa có học sinh hoặc ghi nhận điểm học tập phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                personalStudentStats.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-black text-slate-800">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.student.avatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{item.student.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {item.student.position || 'Thành viên'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600">{item.team}</td>
                    
                    {/* TÍCH LŨY */}
                    <td className="p-3 text-center font-black bg-emerald-50/20">
                      <span className="text-emerald-700 font-bold">+{item.pos}đ</span>
                      {item.neg > 0 && <span className="text-rose-600 text-[10px] block">(-{item.neg}đ)</span>}
                      <div className="text-xs font-black text-slate-800 border-t border-slate-200/60 mt-0.5 pt-0.5">
                        = {item.net >= 0 ? `+${item.net}` : item.net}đ
                      </div>
                    </td>

                    {/* ĐÃ SỬ DỤNG */}
                    <td className="p-3 text-center font-bold bg-amber-50/30">
                      <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-amber-200 text-amber-900 font-black">
                        <span>-{item.usedPoints}đ</span>
                      </div>
                    </td>

                    {/* SỐ ĐIỂM CÒN LẠI */}
                    <td className="p-3 text-center bg-emerald-100/40">
                      <div className="inline-block px-3 py-1.5 rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-2xs">
                        +{item.remainingPoints} điểm
                      </div>
                    </td>

                    <td className="p-3 text-[11px] font-medium text-slate-600 space-y-1">
                      {item.rewardReasons.length > 0 && (
                        <div className="text-emerald-700 font-semibold flex items-start gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                          <span>{item.rewardReasons.slice(0, 2).join('; ')}</span>
                        </div>
                      )}
                      {item.violationReasons.length > 0 && (
                        <div className="text-rose-600 font-semibold flex items-start gap-1">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                          <span>{item.violationReasons.slice(0, 2).join('; ')}</span>
                        </div>
                      )}
                      {item.rewardReasons.length === 0 && item.violationReasons.length === 0 && (
                        <span className="text-slate-400 italic">Chưa có ghi nhận</span>
                      )}
                    </td>

                    {/* ĐÁNH DẤU SỬ DỤNG */}
                    <td className="p-3 text-center bg-indigo-50/20">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {canAddRecord ? (
                          <button
                            type="button"
                            onClick={() => handleOpenUsePointsModal(item.student.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black text-[11px] shadow-2xs transition-all cursor-pointer"
                            title="Mở form nhập số điểm muốn áp dụng cho học sinh này"
                          >
                            <span>☑ Áp dụng điểm</span>
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-black inline-block ${
                              item.remainingPoints === 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.remainingPoints === 0 ? 'Đã dùng hết' : `Còn ${item.remainingPoints}đ`}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NHẬT KÝ CHI TIẾT CÁC LẦN GHI NHẬN ĐIỂM HỌC TẬP */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>📋</span> Nhật Ký Ghi Nhận Chi Tiết ({filteredRecords.length})
          </h3>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchStudentQuery}
              onChange={(e) => setSearchStudentQuery(e.target.value)}
              placeholder="Tìm tên học sinh / lí do..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold w-48 focus:w-60 transition-all"
            />
          </div>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredRecords.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-12">
              Chưa có ghi nhận điểm học tập nào phù hợp với bộ lọc.
            </p>
          ) : (
            filteredRecords.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors flex-wrap sm:flex-nowrap ${
                  r.isApplied
                    ? 'bg-slate-100/80 border-slate-300 opacity-80'
                    : 'bg-slate-50 border-slate-200 hover:bg-blue-50/20'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-800 text-sm">{r.studentName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Môn {r.subjectName || 'Học'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      Tuần {r.week}
                    </span>
                    {r.isApplied && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Đã áp dụng (Không cộng dồn)
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Lí do: {r.activityName}</p>
                  <div className="text-[11px] text-slate-400">
                    {r.semester} • Ngày {r.date} • Ghi bởi: {r.recordedBy}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`text-sm font-black px-3 py-1.5 rounded-xl whitespace-nowrap ${
                      r.isApplied
                        ? 'bg-slate-200 text-slate-600 line-through'
                        : r.points >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {r.points >= 0 ? `+${r.points}` : r.points} điểm
                  </div>

                  {canAddRecord && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleApplyRecord(r)}
                        title={r.isApplied ? 'Bỏ đánh dấu áp dụng' : 'Đánh dấu điểm đã áp dụng'}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 border ${
                          r.isApplied
                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!r.isApplied}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer pointer-events-none"
                        />
                        <span>{r.isApplied ? 'Đã áp dụng' : 'Chưa dùng'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditRecord(r)}
                        title="Sửa bản ghi"
                        className="p-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r.id, r.studentName)}
                        title="Xóa bản ghi"
                        className="p-1.5 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: ĐỔI / KHẤU TRỪ ĐIỂM HỌC TẬP */}
      {showUsePointsModal && isTeacherOrAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-100 text-amber-700">⚡</span>
                <span>Khấu Trừ & Sử Dụng Điểm Học Tập</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUsePointsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeductPointsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Chọn học sinh (*)</label>
                <select
                  value={usePointsStudentId}
                  onChange={(e) => setUsePointsStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  {students.map((st) => {
                    const stStat = personalStudentStats.find(p => p.student.id === st.id);
                    const rem = stStat ? stStat.remainingPoints : 0;
                    return (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.team || 'Tổ 1'}) — Còn {rem}đ
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Show selected student stats */}
              {(() => {
                const selectedStat = personalStudentStats.find(p => p.student.id === usePointsStudentId);
                if (!selectedStat) return null;
                return (
                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold block">Tích lũy</span>
                      <span className="font-black text-sm text-slate-800">+{selectedStat.pos}đ</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold block">Đã dùng</span>
                      <span className="font-black text-sm text-amber-700">-{selectedStat.usedPoints}đ</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold block">Số dư còn lại</span>
                      <span className="font-black text-base text-emerald-700">+{selectedStat.remainingPoints}đ</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Số điểm muốn khấu trừ / đổi (*)</label>
                <input
                  type="number"
                  value={usePointsAmount}
                  onChange={(e) => setUsePointsAmount(Number(e.target.value))}
                  min={1}
                  max={200}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-base focus:ring-2 focus:ring-amber-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Hệ thống sẽ tự động tick chọn và khấu trừ số điểm tương ứng từ các lần tích lũy điểm học tập của học sinh.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Lí do / Mục đích sử dụng điểm (*)</label>
                <input
                  type="text"
                  value={usePointsNote}
                  onChange={(e) => setUsePointsNote(e.target.value)}
                  placeholder="VD: Đổi vé xem phim, Đổi quà học kỳ, Trừ điểm đổi quà..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUsePointsModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span>⚡ Xác Nhận Khấu Trừ Điểm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NHẬP ĐIỂM HỌC TẬP MỚI */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-blue-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Nhập Điểm Học Tập Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRecordSubmit} className="space-y-3.5 text-xs">
              {/* 1. Tuần */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Tuần học (*)</label>
                <select
                  value={formWeek}
                  onChange={(e) => setFormWeek(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: filterMaxWeeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Tuần {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Tổ */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Chọn Tổ (*)</label>
                <select
                  value={formTeam}
                  onChange={(e) => {
                    setFormTeam(e.target.value);
                    const matched = students.filter((s) => e.target.value === 'all' || (s.team || 'Tổ 1') === e.target.value);
                    if (matched.length > 0) setFormStudentId(matched[0].id);
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả các Tổ (Tổ 1 - Tổ 4)</option>
                  {TEAMS_LIST.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Tên (Học sinh) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Tên học sinh (*)</label>
                <select
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {formFilteredStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.team || 'Tổ 1'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Môn học */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Bộ môn học (*)</label>
                <select
                  value={formSubjectName}
                  onChange={(e) => setFormSubjectName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  {SUBJECTS_LIST.map((sub) => (
                    <option key={sub} value={sub}>
                      Môn {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Điểm cộng & Lí do */}
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Điểm cộng (+) & Lí do</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">Điểm cộng</label>
                    <input
                      type="number"
                      value={formRewardPoints}
                      onChange={(e) => setFormRewardPoints(Number(e.target.value))}
                      min={0}
                      max={50}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold text-emerald-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-emerald-800 mb-1">Lí do cộng điểm</label>
                    <input
                      type="text"
                      value={formRewardReason}
                      onChange={(e) => setFormRewardReason(e.target.value)}
                      placeholder="VD: Phát biểu xây dựng bài, làm BTVN xuất sắc..."
                      className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Điểm trừ & Lí do */}
              <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200 space-y-2">
                <div className="font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Điểm trừ (-) & Lí do</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">Điểm trừ</label>
                    <input
                      type="number"
                      value={formViolationPoints}
                      onChange={(e) => setFormViolationPoints(Number(e.target.value))}
                      min={0}
                      max={50}
                      placeholder="0"
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl font-bold text-rose-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">Lí do trừ điểm</label>
                    <input
                      type="text"
                      value={formViolationReason}
                      onChange={(e) => setFormViolationReason(e.target.value)}
                      placeholder="VD: Thiếu BTVN, hổng kiến thức, mất trật tự..."
                      className="w-full p-2 bg-white border border-rose-300 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span>💾 Xác Nhận Nhập Điểm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base">Cập Nhật Điểm Học Tập</h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditRecord} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Học sinh</label>
                <select
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.team || 'Tổ 1'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bộ môn học</label>
                <select
                  value={editSubjectName}
                  onChange={(e) => setEditSubjectName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {SUBJECTS_LIST.map((sub) => (
                    <option key={sub} value={sub}>
                      Môn {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Loại điểm</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('reward')}
                    className={`p-2 rounded-xl font-bold border ${
                      editType === 'reward'
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Cộng điểm (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('violation')}
                    className={`p-2 rounded-xl font-bold border ${
                      editType === 'violation'
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Trừ điểm (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lí do ghi nhận (*)</label>
                <input
                  type="text"
                  value={editActivityName}
                  onChange={(e) => setEditActivityName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điểm</label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                    min={1}
                    max={50}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuần học</label>
                  <select
                    value={editWeek}
                    onChange={(e) => setEditWeek(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {Array.from({ length: filterMaxWeeks }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
