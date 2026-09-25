import React, { useState, useMemo } from 'react';
import { StudentSelectControl } from '../StudentSelectControl';
import {
  User,
  DisciplineRecord,
  Complaint,
  PointUsageTransaction
} from '../../types';
import { REWARD_CATEGORIES, VIOLATION_CATEGORIES } from '../../mockData';
import { soundFx } from '../../utils/sound';

export const TRAINING_REWARD_PRESETS = [
  { id: 'tr1', name: '10 điểm tốt học tập', points: 10, defaultReason: 'Đạt điểm 10 kiểm tra học tập xuất sắc' },
  { id: 'tr2', name: 'Phát biểu xây dựng bài tích cực', points: 2, defaultReason: 'Tích cực hăng hái phát biểu xây dựng bài trong giờ học' },
  { id: 'tr3', name: 'Trực nhật lớp học sạch sẽ xuất sắc', points: 5, defaultReason: 'Thực hiện trực nhật vệ sinh lớp học và hành lang sạch đẹp' },
  { id: 'tr4', name: 'Giúp đỡ bạn học vượt khó', points: 5, defaultReason: 'Tích cực giúp đỡ bạn cùng tiến trong học tập' },
  { id: 'tr5', name: 'Tham gia phong trào thi đua trường', points: 8, defaultReason: 'Hăng hái tham gia các hoạt động phong trào Đoàn / Đội / Nhà trường' },
  { id: 'tr6', name: 'Gương mẫu nề nếp tác phong', points: 5, defaultReason: 'Gương mẫu thực hiện tốt nề nếp và nội quy lớp học' },
];

export const TRAINING_VIOLATION_PRESETS = [
  { id: 'tv1', name: 'Đi học muộn / Trễ giờ sinh hoạt', points: 2, defaultReason: 'Đi học trễ không có lý do chính đáng' },
  { id: 'tv2', name: 'Không làm bài tập về nhà', points: 2, defaultReason: 'Chưa hoàn thành bài tập về nhà theo yêu cầu' },
  { id: 'tv3', name: 'Nói chuyện / Mất trật tự trong giờ', points: 2, defaultReason: 'Mất trật tự, gây ảnh hưởng đến giờ học' },
  { id: 'tv4', name: 'Không mặc đồng phục / Đeo khăn quàng', points: 2, defaultReason: 'Chưa thực hiện đúng quy định về đồng phục học sinh' },
  { id: 'tv5', name: 'Trực nhật không sạch / Trễ hạn', points: 3, defaultReason: 'Trực nhật trễ giờ hoặc chưa vệ sinh sạch sẽ' },
  { id: 'tv6', name: 'Thiếu đồ dùng / Bài cũ', points: 2, defaultReason: 'Không chuẩn bị bài cũ hoặc thiếu dụng cụ học tập' },
  { id: 'tv7', name: 'Vi phạm thái độ / Tác phong', points: 5, defaultReason: 'Có thái độ / tác phong chưa phù hợp quy định' },
];
import {
  Award,
  AlertTriangle,
  Gift,
  Plus,
  MessageSquarePlus,
  CheckCircle2,
  Filter,
  Users,
  Search,
  Sparkles,
  Calendar,
  Layers,
  Printer,
  ChevronRight,
  TrendingUp,
  XCircle,
  Trophy,
  UserCheck,
  Pencil,
  Trash2,
  X
} from 'lucide-react';

interface TrainingCompetitionTabProps {
  currentUser: User;
  disciplineRecords: DisciplineRecord[];
  complaints: Complaint[];
  students: User[];
  pointUsageTransactions?: PointUsageTransaction[];
  onAddPointUsageTransaction?: (tx: PointUsageTransaction) => void;
  onCancelPointUsageTransaction?: (txId: string, cancelledBy: string) => void;
  onAddDisciplineRecord: (rec: DisciplineRecord) => void;
  onUpdateDisciplineRecord?: (rec: DisciplineRecord) => void;
  onDeleteDisciplineRecord?: (id: string) => void;
  onAddComplaint: (cp: Complaint) => void;
  onResolveComplaint: (id: string, response: string) => void;
}

export const TrainingCompetitionTab: React.FC<TrainingCompetitionTabProps> = ({
  currentUser,
  disciplineRecords,
  complaints,
  students,
  pointUsageTransactions = [],
  onAddPointUsageTransaction,
  onCancelPointUsageTransaction,
  onAddDisciplineRecord,
  onUpdateDisciplineRecord,
  onDeleteDisciplineRecord,
  onAddComplaint,
  onResolveComplaint
}) => {
  // Main Sub-tabs: 'records' (Ghi nhận & Nhật ký) | 'team_weekly_table' (Thống kê theo tuần & theo tổ dạng bảng)
  const [subTab, setSubTab] = useState<'records' | 'team_weekly_table'>('team_weekly_table');

  const [filterType, setFilterType] = useState<'all' | 'reward' | 'violation'>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  const filterMaxWeeks = selectedSemester === 'Học kỳ 2' ? 17 : 18;

  // New discipline record form (teacher / officer)
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [formSemester, setFormSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const maxWeeksForRecord = formSemester === 'Học kỳ 2' ? 17 : 18;
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [recordType, setRecordType] = useState<'reward' | 'violation'>('reward');
  const [categoryName, setCategoryName] = useState(TRAINING_REWARD_PRESETS[0].name);
  const [customCategory, setCustomCategory] = useState('');
  const [points, setPoints] = useState(TRAINING_REWARD_PRESETS[0].points);
  const [reason, setReason] = useState(TRAINING_REWARD_PRESETS[0].defaultReason);

  const handleRecordTypeChange = (newType: 'reward' | 'violation') => {
    setRecordType(newType);
    const firstPreset = newType === 'reward' ? TRAINING_REWARD_PRESETS[0] : TRAINING_VIOLATION_PRESETS[0];
    setCategoryName(firstPreset.name);
    setPoints(firstPreset.points);
    setReason(firstPreset.defaultReason);
    setCustomCategory('');
  };

  const handleSelectCategory = (val: string) => {
    setCategoryName(val);
    if (val === 'Khác') {
      setCustomCategory('');
      return;
    }
    const presetList = recordType === 'reward' ? TRAINING_REWARD_PRESETS : TRAINING_VIOLATION_PRESETS;
    const found = presetList.find((p) => p.name === val);
    if (found) {
      setPoints(found.points);
      setReason(found.defaultReason);
    }
  };

  // Complaint form (student)
  const [compTitle, setCompTitle] = useState('');
  const [compContent, setCompContent] = useState('');
  const [compTarget, setCompTarget] = useState<'cán sự lớp' | 'giáo viên'>('giáo viên');

  // Used points state & modal for Training/Discipline
  const [showUsePointsModal, setShowUsePointsModal] = useState(false);
  const [usePointsStudentId, setUsePointsStudentId] = useState(students[0]?.id || '');
  const [usePointsAmount, setUsePointsAmount] = useState<number>(10);
  const [usePointsNote, setUsePointsNote] = useState<string>('Khấu trừ / Đổi quà rèn luyện');

  const handleOpenUsePointsModal = (stId?: string) => {
    if (!isTeacherOrAdmin) {
      alert('⚠️ Bạn không có quyền thực hiện thao tác này. Chỉ Giáo viên và Quản trị viên mới có quyền nhập điểm và sử dụng điểm đã dùng!');
      soundFx.playError();
      return;
    }
    soundFx.playClick();
    if (stId) setUsePointsStudentId(stId);
    else if (students.length > 0) setUsePointsStudentId(students[0].id);
    setUsePointsAmount(10);
    setUsePointsNote('Đổi quà / Trừ điểm thưởng rèn luyện');
    setShowUsePointsModal(true);
  };

  const handleToggleUseRecord = (rec: DisciplineRecord) => {
    if (!isTeacherOrAdmin) {
      alert('⚠️ Bạn không có quyền thực hiện thao tác này. Chỉ Giáo viên và Quản trị viên mới có quyền nhập điểm và sử dụng điểm đã dùng!');
      soundFx.playError();
      return;
    }
    soundFx.playClick();
    if (!onUpdateDisciplineRecord) return;
    const isCurrentlyUsed = !!rec.isUsed;
    onUpdateDisciplineRecord({
      ...rec,
      isUsed: !isCurrentlyUsed,
      usedPoints: !isCurrentlyUsed ? Math.abs(rec.points) : 0,
      usedNote: !isCurrentlyUsed ? 'Đã sử dụng điểm rèn luyện' : undefined
    });
  };

  const handleToggleUseStudentDiscipline = (stId: string, _markUsed?: boolean) => {
    if (!isTeacherOrAdmin) {
      alert('⚠️ Bạn không có quyền thực hiện thao tác này. Chỉ Giáo viên và Quản trị viên mới có quyền nhập điểm và sử dụng điểm đã dùng!');
      soundFx.playError();
      return;
    }
    soundFx.playClick();
    handleOpenUsePointsModal(stId);
  };

  const handleDeductDisciplinePointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacherOrAdmin) {
      alert('⚠️ Bạn không có quyền thực hiện thao tác này. Chỉ Giáo viên và Quản trị viên mới có quyền nhập điểm và sử dụng điểm đã dùng!');
      soundFx.playError();
      return;
    }
    const student = students.find((s) => s.id === usePointsStudentId);
    if (!student) return;
    if (usePointsAmount <= 0) {
      alert('Số điểm sử dụng phải lớn hơn 0!');
      return;
    }

    let remainingToDeduct = usePointsAmount;
    const stRecords = disciplineRecords
      .filter((r) => (r.studentId === usePointsStudentId || r.studentName === student.fullName) && r.points > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let totalDeducted = 0;
    if (onUpdateDisciplineRecord) {
      stRecords.forEach((rec) => {
        if (remainingToDeduct <= 0) return;
        const recMax = rec.points;
        const currentUsed = rec.usedPoints !== undefined ? rec.usedPoints : (rec.isUsed ? recMax : 0);
        const availableInRec = Math.max(0, recMax - currentUsed);

        if (availableInRec > 0) {
          const deductThisRec = Math.min(remainingToDeduct, availableInRec);
          const newUsed = currentUsed + deductThisRec;
          remainingToDeduct -= deductThisRec;
          totalDeducted += deductThisRec;

          onUpdateDisciplineRecord({
            ...rec,
            isUsed: newUsed >= recMax,
            usedPoints: newUsed,
            usedNote: usePointsNote.trim() || 'Khấu trừ điểm rèn luyện'
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
        id: 'put_train_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        studentId: student.id,
        studentName: student.fullName,
        className: student.className || '8A1',
        team: student.team || 'Tổ 1',
        pointType: 'training',
        amount: usePointsAmount,
        content: usePointsNote.trim() || 'Khấu trừ / Đổi quà rèn luyện',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        performedBy: currentUser.fullName || 'Giáo viên',
        performedRole: performedRoleTitle,
        status: 'active'
      });
    }

    soundFx.playSuccess();
    setShowUsePointsModal(false);
    alert(`🎉 Đã khấu trừ thành công ${usePointsAmount} điểm rèn luyện của học sinh ${student.fullName}!`);
  };

  // Edit discipline record modal state
  const [editingDisciplineRecord, setEditingDisciplineRecord] = useState<DisciplineRecord | null>(null);
  const [editStudentId, setEditStudentId] = useState<string>('');
  const [editType, setEditType] = useState<'reward' | 'violation'>('reward');
  const [editCategoryName, setEditCategoryName] = useState<string>('');
  const [editPoints, setEditPoints] = useState<number>(5);
  const [editWeek, setEditWeek] = useState<number>(1);
  const [editSemester, setEditSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const [editReason, setEditReason] = useState<string>('');

  const startEditDisciplineRecord = (rec: DisciplineRecord) => {
    setEditingDisciplineRecord(rec);
    setEditStudentId(rec.studentId);
    setEditType(rec.type);
    setEditCategoryName(rec.categoryName);
    setEditPoints(Math.abs(rec.points));
    setEditWeek(rec.week);
    setEditSemester(rec.semester);
    setEditReason(rec.reason);
    soundFx.playClick();
  };

  const handleSaveEditDisciplineRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDisciplineRecord) return;
    const st = students.find((s) => s.id === editStudentId);
    if (!st || !editReason.trim()) {
      alert('Vui lòng chọn học sinh và nhập lý do / mô tả!');
      return;
    }

    const calcPoints = editType === 'reward' ? Math.abs(editPoints) : -Math.abs(editPoints);
    const updated: DisciplineRecord = {
      ...editingDisciplineRecord,
      studentId: st.id,
      studentName: st.fullName,
      classId: st.classId || 'c1',
      type: editType,
      categoryName: editCategoryName.trim() || (editType === 'reward' ? 'Khen thưởng' : 'Vi phạm'),
      points: calcPoints,
      reason: editReason.trim(),
      week: editWeek,
      semester: editSemester
    };

    if (onUpdateDisciplineRecord) {
      onUpdateDisciplineRecord(updated);
    }
    soundFx.playSuccess();
    setEditingDisciplineRecord(null);
    alert(`🎉 Cập nhật ghi nhận rèn luyện cho ${st.fullName} thành công!`);
  };

  const handleDeleteDisciplineRecord = (id: string, studentName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ghi nhận rèn luyện của học sinh ${studentName}?`)) {
      if (onDeleteDisciplineRecord) {
        onDeleteDisciplineRecord(id);
      }
      soundFx.playClick();
    }
  };

  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isOfficer =
    currentUser.role === 'student' &&
    currentUser.position &&
    currentUser.position.trim().toLowerCase() !== 'thành viên' &&
    currentUser.position.trim().toLowerCase() !== 'thanh vien';

  const isPrivileged = isTeacherOrAdmin || isOfficer;
  const canAddDiscipline = isPrivileged;

  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudentId = studentId || students[0]?.id || '';
    const st = students.find((s) => s.id === targetStudentId);
    if (!st || !reason.trim()) {
      alert('Vui lòng chọn học sinh và nhập nội dung / lý do thi đua!');
      return;
    }
    const finalCat = categoryName === 'Khác' ? customCategory.trim() || 'Khác' : categoryName;
    soundFx.playSuccess();

    const calcPoints = recordType === 'reward' ? Math.abs(points) : -Math.abs(points);
    const recordedByTitle = isTeacherOrAdmin
      ? ' (GV)'
      : isOfficer
      ? ` (${currentUser.position || 'Ban cán sự'})`
      : ' (Thành viên)';

    onAddDisciplineRecord({
      id: 'dr_' + Date.now(),
      studentId: st.id,
      studentName: st.fullName,
      classId: st.classId || 'c1',
      type: recordType,
      categoryName: finalCat,
      points: calcPoints,
      reason: reason.trim(),
      date: new Date().toISOString().substring(0, 10),
      week: selectedWeek,
      month: 8,
      semester: formSemester,
      recordedBy: currentUser.fullName + recordedByTitle
    });
    setReason('');
    setCustomCategory('');
    setShowQuickAddModal(false);
    alert(`🎉 Đã ghi nhận điểm rèn luyện cho học sinh ${st.fullName} (${calcPoints >= 0 ? '+' : ''}${calcPoints}đ) thành công!`);
  };

  const handleSendComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle.trim() || !compContent.trim()) return;
    soundFx.playSuccess();
    onAddComplaint({
      id: 'cp_' + Date.now(),
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      className: currentUser.className || 'Lớp 8A1',
      title: compTitle.trim(),
      content: compContent.trim(),
      target: compTarget,
      status: 'Đang chờ',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });
    setCompTitle('');
    setCompContent('');
    alert('✅ Đã gửi khiếu nại rèn luyện thành công!');
  };

  // Filtered individual discipline records
  const filteredRecords = useMemo(() => {
    return disciplineRecords.filter((r) => {
      if (currentUser.role === 'student' && !isPrivileged && r.studentId !== currentUser.id)
        return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (selectedSemester !== 'all' && r.semester !== selectedSemester) return false;
      if (selectedWeekFilter !== 'all' && r.week !== selectedWeekFilter) return false;

      // Filter by Team
      if (selectedTeamFilter !== 'all') {
        const st = students.find((s) => s.id === r.studentId);
        if (st && st.team !== selectedTeamFilter) return false;
      }

      return true;
    });
  }, [
    disciplineRecords,
    currentUser,
    isPrivileged,
    filterType,
    selectedSemester,
    selectedWeekFilter,
    selectedTeamFilter,
    students
  ]);

  const totalPoints = filteredRecords.reduce((acc, curr) => acc + curr.points, 100);

  // List of unique teams
  const TEAMS_LIST = ['Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'];

  // ================= COMPUTED STATISTICS BY TEAM & WEEK =================
  const teamStatsSummary = useMemo(() => {
    return TEAMS_LIST.map((teamName) => {
      // Students in this team
      const teamStudents = students.filter((s) => (s.team || 'Tổ 1') === teamName);

      // Records for this team with active filters
      const teamRecords = disciplineRecords.filter((r) => {
        const st = students.find((s) => s.id === r.studentId);
        if (!st || (st.team || 'Tổ 1') !== teamName) return false;

        const matchSemester = selectedSemester === 'all' || r.semester === selectedSemester;
        const matchWeek = selectedWeekFilter === 'all' || r.week === selectedWeekFilter;
        return matchSemester && matchWeek;
      });

      let totalPos = 0;
      let totalNeg = 0;
      let rewardCount = 0;
      let violationCount = 0;

      teamRecords.forEach((r) => {
        if (r.points >= 0) {
          totalPos += r.points;
          rewardCount++;
        } else {
          totalNeg += Math.abs(r.points);
          violationCount++;
        }
      });

      const netPoints = totalPos - totalNeg;
      // Base score per student = 100
      const baseTotalScore = teamStudents.length * 100 + netPoints;
      const avgScore =
        teamStudents.length > 0
          ? Math.round((baseTotalScore / teamStudents.length) * 10) / 10
          : 100;

      return {
        teamName,
        studentCount: teamStudents.length,
        rewardCount,
        violationCount,
        totalPos,
        totalNeg,
        netPoints,
        avgScore,
        teamStudents,
        teamRecords
      };
    }).sort((a, b) => b.avgScore - a.avgScore); // Ranked by highest average score
  }, [students, disciplineRecords, selectedSemester, selectedWeekFilter]);

  // Weekly Matrix (Rows = Week 1..4 or filterMaxWeeks, Cols = Teams)
  const weeklyMatrix = useMemo(() => {
    const weeksCount = selectedSemester === 'Học kỳ 2' ? 17 : 18;
    const weeksToDisplay =
      selectedWeekFilter !== 'all' ? [Number(selectedWeekFilter)] : [1, 2, 3, 4];

    return weeksToDisplay.map((wNum) => {
      const teamScores: Record<string, { pos: number; neg: number; net: number }> = {};

      TEAMS_LIST.forEach((tName) => {
        const wRecords = disciplineRecords.filter((r) => {
          const st = students.find((s) => s.id === r.studentId);
          return (
            st &&
            (st.team || 'Tổ 1') === tName &&
            r.week === wNum &&
            (selectedSemester === 'all' || r.semester === selectedSemester)
          );
        });

        let pos = 0;
        let neg = 0;
        wRecords.forEach((r) => {
          if (r.points >= 0) pos += r.points;
          else neg += Math.abs(r.points);
        });

        teamScores[tName] = { pos, neg, net: pos - neg };
      });

      // Find top team for this week
      let topTeam = 'Tổ 1';
      let maxNet = -999;
      TEAMS_LIST.forEach((tName) => {
        if (teamScores[tName].net > maxNet) {
          maxNet = teamScores[tName].net;
          topTeam = tName;
        }
      });

      return {
        weekNumber: wNum,
        teamScores,
        topTeam
      };
    });
  }, [disciplineRecords, students, selectedSemester, selectedWeekFilter]);

  // Overall ranked individual member stats for TRAINING / CONDUCT COMPETITION
  const allTrainingMembersRanked = useMemo(() => {
    return students
      .map((st) => {
        const stRecs = disciplineRecords.filter((r) => {
          return (
            r.studentId === st.id &&
            (selectedSemester === 'all' || r.semester === selectedSemester) &&
            (selectedWeekFilter === 'all' || r.week === selectedWeekFilter)
          );
        });

        let pos = 0;
        let neg = 0;
        let rewardCount = 0;
        let violationCount = 0;
        const categoryMap: Record<string, number> = {};

        stRecs.forEach((r) => {
          if (r.points >= 0) {
            rewardCount++;
            pos += r.points;
          } else {
            violationCount++;
            neg += Math.abs(r.points);
          }
          if (r.categoryName) {
            categoryMap[r.categoryName] = (categoryMap[r.categoryName] || 0) + r.points;
          }
        });

        const net = pos - neg;
        const finalScore = 100 + net;
        const topCategoriesStr = Object.entries(categoryMap)
          .map(([cName, p]) => `${cName} (${p >= 0 ? `+${p}` : p}đ)`)
          .join(', ');

        const recUsedPoints = stRecs.reduce((acc, r) => {
          if (r.usedPoints !== undefined) return acc + r.usedPoints;
          return acc + (r.isUsed ? Math.abs(r.points) : 0);
        }, 0);

        const txUsed = pointUsageTransactions
          ? pointUsageTransactions
              .filter(
                (tx) =>
                  (tx.studentId === st.id || tx.studentName === st.fullName) &&
                  tx.pointType === 'training' &&
                  tx.status === 'active'
              )
              .reduce((acc, tx) => acc + tx.amount, 0)
          : 0;

        const usedPoints = Math.max(recUsedPoints, txUsed);
        const rewardRecs = stRecs.filter((r) => r.points > 0);
        const allUsed =
          rewardRecs.length > 0 &&
          (usedPoints >= pos ||
            rewardRecs.every(
              (r) => r.isUsed || (r.usedPoints !== undefined && r.usedPoints >= r.points)
            ));

        const remainingPoints = Math.max(0, pos - usedPoints);

        return {
          student: st,
          team: st.team || 'Tổ 1',
          pos,
          neg,
          net,
          finalScore,
          rewardCount,
          violationCount,
          usedPoints,
          remainingPoints,
          allUsed,
          topCategoriesStr: topCategoriesStr || 'Không có vi phạm / khen thưởng',
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
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [
    students,
    disciplineRecords,
    selectedSemester,
    selectedWeekFilter,
    selectedTeamFilter,
    searchStudentQuery
  ]);

  // Student level breakdown by Team
  const studentDetailedByTeam = useMemo(() => {
    return TEAMS_LIST.map((tName) => {
      const teamStudents = students.filter((s) => (s.team || 'Tổ 1') === tName);

      const studentRows = teamStudents
        .map((st) => {
          const stRecs = disciplineRecords.filter((r) => {
            return (
              r.studentId === st.id &&
              (selectedSemester === 'all' || r.semester === selectedSemester) &&
              (selectedWeekFilter === 'all' || r.week === selectedWeekFilter)
            );
          });

          let pos = 0;
          let neg = 0;
          let rewards = 0;
          let violations = 0;
          const categoryMap: Record<string, number> = {};

          stRecs.forEach((r) => {
            if (r.points >= 0) {
              pos += r.points;
              rewards++;
            } else {
              neg += Math.abs(r.points);
              violations++;
            }
            if (r.categoryName) {
              categoryMap[r.categoryName] = (categoryMap[r.categoryName] || 0) + r.points;
            }
          });

          const net = pos - neg;
          const finalScore = 100 + net;
          const topCategoriesStr = Object.entries(categoryMap)
            .map(([cName, p]) => `${cName} (${p >= 0 ? `+${p}` : p}đ)`)
            .join(', ');

          return {
            st,
            pos,
            neg,
            net: pos - neg,
            finalScore,
            rewards,
            violations,
            topCategoriesStr: topCategoriesStr || 'Chưa có ghi nhận',
            records: stRecs
          };
        })
        .filter((sItem) => {
          if (!searchStudentQuery.trim()) return true;
          const q = searchStudentQuery.toLowerCase();
          return sItem.st.fullName.toLowerCase().includes(q);
        });

      return {
        teamName: tName,
        studentRows
      };
    });
  }, [students, disciplineRecords, selectedSemester, selectedWeekFilter, searchStudentQuery]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-9xl opacity-20 select-none">🏆</div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/25 text-xs font-bold uppercase tracking-wider backdrop-blur-md inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Thống Kê Nề Nếp & Hạnh Kiểm Học Sinh
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 mb-1">
              ĐIỂM RÈN LUYỆN LỚP HỌC
            </h2>
            <p className="text-sm font-medium text-white/95 max-w-2xl">
              Thống kê nề nếp rèn luyện, khen thưởng & vi phạm theo <strong>Tuần học</strong> và <strong>Tổ thi đua</strong> dưới dạng bảng ma trận trực quan.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isPrivileged ? (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowQuickAddModal(true);
                }}
                className="px-4 py-2.5 bg-slate-900 text-emerald-300 hover:bg-black font-black rounded-2xl text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-emerald-400/40"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>➕ Nhập Điểm Rèn Luyện</span>
              </button>
            ) : (
              <div className="text-[11px] bg-white/20 backdrop-blur-xs px-3 py-2 rounded-2xl font-bold text-white flex items-center gap-1.5 border border-white/30">
                <span>🔒 Quyền nhập điểm: Cán sự / GV / Admin</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 font-black rounded-2xl text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              <span>In / Xuất Bảng Điểm</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-emerald-100 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setSubTab('team_weekly_table');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'team_weekly_table'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md scale-102'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📊 THỐNG KÊ THEO TUẦN & THEO TỔ (DẠNG BẢNG)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setSubTab('records');
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              subTab === 'records'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md scale-102'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>📋 NHẬT KÝ GHI NHẬN CHI TIẾT</span>
          </button>
        </div>

        <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-200">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Lớp 8A1 • Trường THCS Chu Văn An</span>
        </div>
      </div>

      {/* VIEW MODE 1: WEEKLY & TEAM SUMMARY TABLE (THỐNG KÊ THEO TUẦN VÀ THEO TỔ DẠNG BẢNG) */}
      {subTab === 'team_weekly_table' && (
        <div className="space-y-6">
          {/* Top Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Bộ Lọc Bảng Thống Kê Điểm Rèn Luyện Theo Tuần & Theo Tổ:</span>
              </div>
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

              {/* Team Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">👥 Chọn Tổ Thi Đua:</label>
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

              {/* Type Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">⭐ Phân Loại Ghi Nhận:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="all">Tất cả (Khen thưởng & Vi phạm)</option>
                  <option value="reward">Khen thưởng (+)</option>
                  <option value="violation">Vi phạm (-)</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE 1: BẢNG TỔNG HỢP XẾP HẠNG THI ĐỦA CÁC TỔ */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>🏆</span> BẢNG TỔNG HỢP ĐIỂM RÈN LUYỆN THEO TỔ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thống kê tổng điểm cộng, điểm trừ và xếp hạng rèn luyện trung bình theo tổ (Điểm gốc = 100đ / HS).
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {selectedWeekFilter === 'all' ? 'Tất cả các tuần' : `Tuần ${selectedWeekFilter}`}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                    <th className="p-3 text-center w-12">Xếp Hạng</th>
                    <th className="p-3 min-w-[140px]">Tên Tổ Thi Đua</th>
                    <th className="p-3 text-center">Số HS</th>
                    <th className="p-3 text-center bg-emerald-50 text-emerald-900">Lượt Khen Thưởng (+)</th>
                    <th className="p-3 text-center bg-rose-50 text-rose-900">Lượt Vi Phạm (-)</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-900">Tổng Điểm Trừ (-)</th>
                    <th className="p-3 text-center bg-amber-50 text-amber-900">Tổng Điểm Cộng (+)</th>
                    <th className="p-3 text-center bg-emerald-100 text-emerald-950">ĐTB Rèn Luyện Tổ</th>
                    <th className="p-3 text-center">Đánh Giá Thi Đua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamStatsSummary
                    .filter((t) => selectedTeamFilter === 'all' || t.teamName === selectedTeamFilter)
                    .map((team, idx) => (
                      <tr key={team.teamName} className="hover:bg-emerald-50/30 transition-colors font-medium">
                        <td className="p-3 text-center font-black">
                          {idx === 0 ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-xs border border-amber-300">
                              🥇 Hạng 1
                            </span>
                          ) : idx === 1 ? (
                            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-black text-xs">
                              🥈 Hạng 2
                            </span>
                          ) : idx === 2 ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-black text-xs">
                              🥉 Hạng 3
                            </span>
                          ) : (
                            <span className="text-slate-500 font-bold">Hạng {idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3 font-black text-slate-900 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-600" />
                            <span>{team.teamName}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-600">{team.studentCount} HS</td>
                        <td className="p-3 text-center font-black text-emerald-700 bg-emerald-50/30">
                          {team.rewardCount} lần
                        </td>
                        <td className="p-3 text-center font-black text-rose-600 bg-rose-50/30">
                          {team.violationCount} lần
                        </td>
                        <td className="p-3 text-center font-black text-rose-700 bg-rose-50/30">
                          -{team.totalNeg}đ
                        </td>
                        <td className="p-3 text-center font-black text-amber-700 bg-amber-50/30">
                          +{team.totalPos}đ
                        </td>
                        <td className="p-3 text-center font-black text-emerald-800 text-base bg-emerald-100/40">
                          {team.avgScore}đ
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full font-black text-[11px] ${
                              team.avgScore >= 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {team.avgScore >= 102
                              ? 'Xuất Sắc 🌟'
                              : team.avgScore >= 100
                              ? 'Tốt 👍'
                              : 'Cần Cố Gắng ⚠️'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: MA TRẬN THỐNG KÊ ĐIỂM THEO TỪNG TUẦN (TUẦN X TỔ) */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>🗓️</span> BẢNG MA TRẬN ĐIỂM RÈN LUYỆN THEO TỪNG TUẦN X THEO TỔ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bảng ma trận so sánh điểm cộng / trừ rèn luyện của 4 Tổ thi đua qua các tuần học.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                    <th className="p-3 w-28 text-center">Tuần Học</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-900">Tổ 1 (Điểm Ròng)</th>
                    <th className="p-3 text-center bg-emerald-50 text-emerald-900">Tổ 2 (Điểm Ròng)</th>
                    <th className="p-3 text-center bg-amber-50 text-amber-900">Tổ 3 (Điểm Ròng)</th>
                    <th className="p-3 text-center bg-purple-50 text-purple-900">Tổ 4 (Điểm Ròng)</th>
                    <th className="p-3 text-center bg-teal-100 text-teal-950">Tổ Dẫn Đầu Tuần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weeklyMatrix.map((row) => (
                    <tr key={row.weekNumber} className="hover:bg-slate-50 transition-colors font-medium">
                      <td className="p-3 text-center font-black text-slate-800 bg-slate-50">
                        Tuần {row.weekNumber}
                      </td>

                      {TEAMS_LIST.map((tName) => {
                        const score = row.teamScores[tName];
                        return (
                          <td key={tName} className="p-3 text-center">
                            <div className="font-black text-slate-800">
                              {score.net >= 0 ? `+${score.net}` : score.net}đ
                            </div>
                            <div className="text-[10px] text-slate-400">
                              (+{score.pos} / -{score.neg})
                            </div>
                          </td>
                        );
                      })}

                      <td className="p-3 text-center font-black text-teal-800 bg-teal-50">
                        <span className="px-2.5 py-1 rounded-full bg-teal-200 text-teal-900 text-[11px] inline-flex items-center gap-1 font-black">
                          👑 {row.topTeam}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 3: BẢNG XẾP HẠNG & THỐNG KÊ CHI TIẾT ĐIỂM RÈN LUYỆN CÁ NHÂN TOÀN LỚP */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-3">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  <span>BẢNG XẾP HẠNG & THỐNG KÊ CHI TIẾT ĐIỂM RÈN LUYỆN CÁ NHÂN TOÀN LỚP</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thống kê đầy đủ điểm khen thưởng, điểm vi phạm, điểm ròng và tổng điểm rèn luyện (gốc 100đ) của từng học sinh.
                </p>
              </div>

              {/* Search student box */}
              <div className="relative w-full sm:w-auto sm:min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  placeholder="Tìm học sinh theo tên..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchStudentQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchStudentQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                    <th className="p-3 text-center w-12">Hạng</th>
                    <th className="p-3 min-w-[170px]">Học Sinh</th>
                    <th className="p-3 text-center">Tổ</th>
                    <th className="p-3 text-center bg-emerald-50 text-emerald-900">Khen Thưởng (+)</th>
                    <th className="p-3 text-center bg-rose-50 text-rose-900">Vi Phạm (-)</th>
                    <th className="p-3 text-center bg-blue-50 text-blue-900">Tổng ĐRL (Gốc 100)</th>
                    <th className="p-3 text-center bg-amber-100/60 text-amber-900 min-w-[120px]">Điểm Đã Sử Dụng</th>
                    <th className="p-3 text-center bg-emerald-200/80 text-emerald-950 min-w-[130px] text-sm">ĐIỂM THƯỞNG CÒN LẠI</th>
                    <th className="p-3 text-center min-w-[130px] bg-indigo-100/80 text-indigo-950">Đánh Dấu Sử Dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTrainingMembersRanked.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-400 text-xs font-medium">
                        Không tìm thấy học sinh phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    allTrainingMembersRanked.map((item, idx) => (
                      <tr key={item.student.id} className="hover:bg-emerald-50/20 transition-colors font-medium">
                        <td className="p-3 text-center font-black">
                          {idx === 0 ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-xs border border-amber-300 shadow-2xs">
                              🥇 Hạng 1
                            </span>
                          ) : idx === 1 ? (
                            <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 font-black text-xs border border-slate-300">
                              🥈 Hạng 2
                            </span>
                          ) : idx === 2 ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-black text-xs border border-amber-200">
                              🥉 Hạng 3
                            </span>
                          ) : (
                            <span className="text-slate-500 font-bold">#{idx + 1}</span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.student.avatar}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-black text-slate-900">{item.student.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{item.student.position || 'Thành viên'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-center font-bold text-slate-700">
                          {item.team}
                        </td>

                        <td className="p-3 text-center font-black text-emerald-700 bg-emerald-50/30">
                          +{item.pos}đ
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({item.rewardCount} lượt)
                          </div>
                        </td>

                        <td className="p-3 text-center font-black text-rose-600 bg-rose-50/30">
                          -{item.neg}đ
                          <div className="text-[10px] text-slate-400 font-normal">
                            ({item.violationCount} lượt)
                          </div>
                        </td>

                        <td className="p-3 text-center font-black text-emerald-900 text-sm bg-blue-50/30">
                          {item.finalScore}đ
                        </td>

                        {/* ĐÃ SỬ DỤNG */}
                        <td className="p-3 text-center font-bold bg-amber-50/30">
                          <div className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-amber-200 text-amber-900 font-black">
                            <span>-{item.usedPoints}đ</span>
                          </div>
                        </td>

                        {/* ĐIỂM THƯỞNG CÒN LẠI */}
                        <td className="p-3 text-center bg-emerald-100/40">
                          <div className="inline-block px-3 py-1.5 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-2xs">
                            +{item.remainingPoints} điểm
                          </div>
                        </td>

                        {/* ĐÁNH DẤU SỬ DỤNG */}
                        <td className="p-3 text-center bg-indigo-50/20">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {isTeacherOrAdmin ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenUsePointsModal(item.student.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-2xs ${
                                    item.usedPoints > 0
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                      : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
                                  }`}
                                  title="Mở giao diện tự tay nhập số điểm rèn luyện muốn áp dụng / khấu trừ (Chỉ Giáo viên và Quản trị viên)"
                                >
                                  <span>{item.usedPoints > 0 ? '☑ Đã dùng' : '☐ Nhập điểm dùng'}</span>
                                  <span className="text-[10px] bg-white/80 px-1.5 py-0.2 rounded-md font-bold text-slate-700">
                                    {item.usedPoints > 0 ? `-${item.usedPoints}đ` : 'Điền điểm'}
                                  </span>
                                </button>
                              </>
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

          {/* TABLE 4: BẢNG CHI TIẾT HỌC SINH THEO TỪNG TỔ */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>👨‍🎓</span> BẢNG CHI TIẾT HỌC SINH PHÂN THEO TỔ THI ĐỦA
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bảng danh sách chi tiết điểm rèn luyện cá nhân từng học sinh thuộc từng Tổ.
                </p>
              </div>
              {searchStudentQuery && (
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Đang lọc theo: "{searchStudentQuery}"
                </span>
              )}
            </div>

            <div className="space-y-6">
              {studentDetailedByTeam
                .filter((tGroup) => selectedTeamFilter === 'all' || tGroup.teamName === selectedTeamFilter)
                .map((tGroup) => (
                  <div key={tGroup.teamName} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-800 text-white p-3 px-4 font-black text-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>{tGroup.teamName.toUpperCase()}</span>
                      </div>
                      <span className="text-xs font-normal text-slate-300">
                        {tGroup.studentRows.length} Thành viên
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2.5 w-10 text-center">STT</th>
                            <th className="p-2.5 min-w-[160px]">Họ và Tên Học Sinh</th>
                            <th className="p-2.5 text-center">Chức vụ</th>
                            <th className="p-2.5 text-center bg-emerald-50 text-emerald-900">Khen thưởng (+)</th>
                            <th className="p-2.5 text-center bg-rose-50 text-rose-900">Vi phạm (-)</th>
                            <th className="p-2.5 text-center bg-blue-50 text-blue-900">Điểm Ròng Tuần</th>
                            <th className="p-2.5 text-center bg-emerald-100 text-emerald-950">Điểm Tổng Kết (Gốc 100)</th>
                            <th className="p-2.5 min-w-[180px]">Nội Dung Nổi Bật</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tGroup.studentRows.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-4 text-center text-slate-400">
                                Không có học sinh trong tổ này phù hợp từ khóa tìm kiếm.
                              </td>
                            </tr>
                          ) : (
                            tGroup.studentRows.map((sRow, idx) => (
                              <tr key={sRow.st.id} className="hover:bg-slate-50">
                                <td className="p-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="p-2.5 font-black text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <img src={sRow.st.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                    <span>{sRow.st.fullName}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center font-bold text-slate-600">
                                  {sRow.st.position || 'Thành viên'}
                                </td>
                                <td className="p-2.5 text-center font-black text-emerald-700 bg-emerald-50/20">
                                  +{sRow.pos}đ ({sRow.rewards} lượt)
                                </td>
                                <td className="p-2.5 text-center font-black text-rose-600 bg-rose-50/20">
                                  -{sRow.neg}đ ({sRow.violations} lượt)
                                </td>
                                <td className="p-2.5 text-center font-black text-blue-700 bg-blue-50/20">
                                  {sRow.net >= 0 ? `+${sRow.net}` : sRow.net}đ
                                </td>
                                <td className="p-2.5 text-center font-black text-emerald-800 bg-emerald-100/30 text-sm">
                                  {sRow.finalScore}đ
                                </td>
                                <td className="p-2.5 text-[11px] text-slate-600 font-medium">
                                  <span className="line-clamp-1 bg-slate-50 p-1 rounded border border-slate-100">
                                    {sRow.topCategoriesStr}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DETAILED RECORDS LOG & FORM */}
      {subTab === 'records' && (
        <div className="space-y-6">
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                🌟
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase">Tổng điểm rèn luyện</span>
                <div className="text-2xl font-black text-slate-800">{totalPoints} điểm</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl font-bold">
                🎁
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase">Khen thưởng</span>
                <div className="text-2xl font-black text-slate-800">
                  {disciplineRecords.filter((r) => r.type === 'reward').length} lần
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase">Vi phạm / Trừ điểm</span>
                <div className="text-2xl font-black text-slate-800">
                  {disciplineRecords.filter((r) => r.type === 'violation').length} lần
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Records List & Filter */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>📋</span> Danh sách ghi nhận rèn luyện
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedSemester}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSemester(val);
                      if (
                        val === 'Học kỳ 2' &&
                        typeof selectedWeekFilter === 'number' &&
                        selectedWeekFilter > 17
                      ) {
                        setSelectedWeekFilter('all');
                      }
                    }}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="all">Tất cả học kỳ</option>
                    <option value="Học kỳ 1">Học kỳ 1 (18 tuần)</option>
                    <option value="Học kỳ 2">Học kỳ 2 (17 tuần)</option>
                  </select>
                  <select
                    value={selectedWeekFilter === 'all' ? 'all' : String(selectedWeekFilter)}
                    onChange={(e) =>
                      setSelectedWeekFilter(
                        e.target.value === 'all' ? 'all' : Number(e.target.value)
                      )
                    }
                    className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                  >
                    <option value="all">Tất cả các tuần (Tuần 1 - {filterMaxWeeks})</option>
                    {Array.from({ length: filterMaxWeeks }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pb-2 flex-wrap">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-bold">Lọc loại:</span>
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    filterType === 'all' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('reward')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    filterType === 'reward' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Khen thưởng
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('violation')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    filterType === 'violation' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Vi phạm
                </button>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Chưa có bản ghi thi đua rèn luyện nào.</p>
                ) : (
                  filteredRecords.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{r.studentName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.type === 'reward'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {r.categoryName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{r.reason}</p>
                        <div className="text-[11px] text-slate-400">
                          Tuần {r.week} • {r.semester} • Ngày {r.date} • Ghi bởi: {r.recordedBy}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`text-base font-black px-3 py-1.5 rounded-xl whitespace-nowrap ${
                            r.points > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {r.points > 0 ? `+${r.points}` : r.points} điểm
                        </div>

                        {isPrivileged && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditDisciplineRecord(r)}
                              title="Cập nhật / Sửa bản ghi"
                              className="p-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDisciplineRecord(r.id, r.studentName)}
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

            {/* Right Column: Actions (Input for Teachers/Officers or Complaint for Students) */}
            <div className="space-y-6">
              {isPrivileged && (
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-600" /> Nhập điểm rèn luyện / Khen thưởng
                  </h3>
                  <form onSubmit={handleAddRecord} className="space-y-3 text-xs">
                    <StudentSelectControl
                      students={students}
                      selectedStudentId={studentId}
                      onSelectStudent={(id) => setStudentId(id)}
                      label="Học sinh"
                      themeColor="emerald"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Học kỳ</label>
                        <select
                          value={formSemester}
                          onChange={(e) => {
                            const sem = e.target.value as 'Học kỳ 1' | 'Học kỳ 2';
                            setFormSemester(sem);
                            if (sem === 'Học kỳ 2' && selectedWeek > 17) {
                              setSelectedWeek(17);
                            }
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                        >
                          <option value="Học kỳ 1">Học kỳ 1 (18 tuần)</option>
                          <option value="Học kỳ 2">Học kỳ 2 (17 tuần)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tuần (1 - {maxWeeksForRecord})
                        </label>
                        <select
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                        >
                          {Array.from({ length: maxWeeksForRecord }, (_, i) => i + 1).map((w) => (
                            <option key={w} value={w}>
                              Tuần {w}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Loại thi đua</label>
                        <select
                          value={recordType}
                          onChange={(e) => handleRecordTypeChange(e.target.value as 'reward' | 'violation')}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                        >
                          <option value="reward">🎁 Khen thưởng (+)</option>
                          <option value="violation">⚠️ Vi phạm (-)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          {recordType === 'reward' ? 'Điểm cộng (+)' : 'Điểm trừ (-)'}
                        </label>
                        <input
                          type="number"
                          value={points}
                          onChange={(e) => setPoints(Number(e.target.value))}
                          className={`w-full p-2.5 font-bold border rounded-xl ${
                            recordType === 'reward'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : 'bg-rose-50 border-rose-200 text-rose-900'
                          }`}
                          min={1}
                          max={50}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {recordType === 'reward' ? '🎁 Danh mục khen thưởng có sẵn' : '⚠️ Danh mục vi phạm có sẵn'}
                      </label>
                      <select
                        value={categoryName}
                        onChange={(e) => handleSelectCategory(e.target.value)}
                        className={`w-full p-2.5 font-bold border rounded-xl text-slate-800 ${
                          recordType === 'reward'
                            ? 'bg-emerald-50/60 border-emerald-200 focus:ring-emerald-500'
                            : 'bg-rose-50/60 border-rose-200 focus:ring-rose-500'
                        }`}
                      >
                        {(recordType === 'reward' ? TRAINING_REWARD_PRESETS : TRAINING_VIOLATION_PRESETS).map(
                          (p) => (
                            <option key={p.id} value={p.name}>
                              {p.name} ({recordType === 'reward' ? `+${p.points}` : `-${p.points}`}đ)
                            </option>
                          )
                        )}
                        <option value="Khác">✏️ Khác (Tự nhập tiêu chí mới & điểm)...</option>
                      </select>
                    </div>
                    {categoryName === 'Khác' && (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Tên danh mục / tiêu chí tùy chỉnh
                        </label>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="Nhập tên tiêu chí khen thưởng / vi phạm tùy chỉnh..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Lý do chi tiết</label>
                      <textarea
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nhập lý do..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Xác nhận ghi nhận
                    </button>
                  </form>
                </div>
              )}

              {currentUser.role === 'student' && (
                <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquarePlus className="w-4 h-4 text-amber-600" /> Gửi khiếu nại thi đua
                  </h3>
                  <form onSubmit={handleSendComplaint} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Gửi tới</label>
                      <select
                        value={compTarget}
                        onChange={(e) => setCompTarget(e.target.value as any)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      >
                        <option value="cán sự lớp">Ban cán sự lớp</option>
                        <option value="giáo viên">Giáo viên chủ nhiệm</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Tiêu đề</label>
                      <input
                        type="text"
                        value={compTitle}
                        onChange={(e) => setCompTitle(e.target.value)}
                        placeholder="Tiêu đề khiếu nại..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nội dung</label>
                      <textarea
                        rows={3}
                        value={compContent}
                        onChange={(e) => setCompContent(e.target.value)}
                        placeholder="Mô tả vấn đề cần khiếu nại..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Gửi khiếu nại
                    </button>
                  </form>
                </div>
              )}

              {/* Complaints list */}
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-3">
                <h3 className="text-md font-bold text-slate-800 mb-2">
                  💬 Danh sách khiếu nại ({complaints.length})
                </h3>
                {complaints.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-3 bg-amber-50/40 rounded-2xl border border-amber-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{cp.studentName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                        {cp.status}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-700">{cp.title}</p>
                    <p className="text-slate-600">{cp.content}</p>
                    {cp.response && (
                      <p className="text-emerald-700 font-medium italic mt-1">
                        Phản hồi: {cp.response}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cập Nhật Điểm Thi Đua Rèn Luyện (Cho Ban Cán Sự / Giáo Viên / Admin) */}
      {editingDisciplineRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-900 rounded-xl font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">Cập Nhật Điểm Rèn Luyện</h3>
                  <p className="text-xs text-slate-500">Chỉnh sửa thông tin thi đua rèn luyện của học sinh</p>
                </div>
              </div>
              <button
                onClick={() => setEditingDisciplineRecord(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDisciplineRecord} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Chọn học sinh</label>
                <select
                  value={editStudentId}
                  onChange={(e) => setEditStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.team || 'Tổ 1'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hình thức thi đua</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('reward')}
                    className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      editType === 'reward'
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    🌟 Khen Thưởng (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('violation')}
                    className={`p-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      editType === 'violation'
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    ⚠️ Vi Phạm (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên danh mục / tiêu chí</label>
                <input
                  type="text"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  placeholder="Nhập danh mục / tiêu chí..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung chi tiết / Lý do</label>
                <textarea
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Nhập chi tiết sự việc..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editType === 'reward' ? 'Điểm cộng (+)' : 'Điểm trừ (-)'}
                  </label>
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
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDisciplineRecord(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl cursor-pointer shadow-md"
                >
                  💾 Lưu Cập Nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD TRAINING DISCIPLINE RECORD MODAL */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                <span>Nhập Điểm Thi Đua Rèn Luyện Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-950 space-y-1">
              <div className="font-bold flex items-center gap-1 text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Đang ghi nhận với vai trò:</span>
              </div>
              <p className="text-[11px] font-bold text-emerald-800">
                👤 {currentUser.fullName} - {currentUser.role === 'teacher' ? 'Giáo Viên' : currentUser.role === 'admin' ? 'Quản Trị Viên' : currentUser.position || 'Cán sự lớp'}
              </p>
            </div>

            <form onSubmit={handleAddRecord} className="space-y-3.5 text-xs">
              {/* Student Select with Team filter and Search */}
              <StudentSelectControl
                students={students}
                selectedStudentId={studentId || students[0]?.id || ''}
                onSelectStudent={(id) => setStudentId(id)}
                label="1. Chọn học sinh (*)"
                themeColor="emerald"
              />

              {/* Record Type */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Hình thức thi đua (*)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRecordTypeChange('reward')}
                    className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      recordType === 'reward'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs ring-2 ring-emerald-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🎁 Khen Thưởng (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRecordTypeChange('violation')}
                    className={`p-2.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      recordType === 'violation'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs ring-2 ring-rose-300'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚠️ Vi Phạm Trừ Điểm (-)
                  </button>
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    {recordType === 'reward' ? '3. Danh mục khen thưởng có sẵn' : '3. Danh mục vi phạm có sẵn'}
                  </label>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                    {recordType === 'reward' ? TRAINING_REWARD_PRESETS.length : TRAINING_VIOLATION_PRESETS.length} danh mục mẫu
                  </span>
                </div>
                <select
                  value={categoryName}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className={`w-full p-2.5 font-bold border rounded-xl text-slate-800 focus:outline-none focus:ring-2 ${
                    recordType === 'reward'
                      ? 'bg-emerald-50/60 border-emerald-200 focus:ring-emerald-500'
                      : 'bg-rose-50/60 border-rose-200 focus:ring-rose-500'
                  }`}
                >
                  {(recordType === 'reward' ? TRAINING_REWARD_PRESETS : TRAINING_VIOLATION_PRESETS).map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} ({recordType === 'reward' ? `+${p.points}` : `-${p.points}`}đ)
                    </option>
                  ))}
                  <option value="Khác">✏️ Khác (Tự nhập tiêu chí mới & điểm tương ứng)...</option>
                </select>
              </div>

              {categoryName === 'Khác' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên tiêu chí / danh mục tự nhập (*)</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder={
                      recordType === 'reward'
                        ? 'Nhập tên tiêu chí khen thưởng tùy chỉnh...'
                        : 'Nhập tên tiêu chí vi phạm tùy chỉnh...'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              )}

              {/* Reason / Details */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Lý do / Nội dung chi tiết (*)</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Diễn giải chi tiết lý do khen thưởng hoặc vi phạm..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                ></textarea>
              </div>

              {/* Points & Week */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {recordType === 'reward' ? 'Điểm cộng (+)' : 'Điểm trừ (-)'}
                  </label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    min={1}
                    max={50}
                    className={`w-full p-2.5 font-bold border rounded-xl ${
                      recordType === 'reward'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tuần ghi nhận</label>
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Tuần {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Semester */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Học kỳ</label>
                <select
                  value={formSemester}
                  onChange={(e) => setFormSemester(e.target.value as 'Học kỳ 1' | 'Học kỳ 2')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="Học kỳ 1">Học kỳ 1</option>
                  <option value="Học kỳ 2">Học kỳ 2</option>
                </select>
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
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span>💾 Xác Nhận Nhập Điểm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ĐỔI / KHẤU TRỪ ĐIỂM RÈN LUYỆN */}
      {showUsePointsModal && isTeacherOrAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">⚡</span>
                <span>Khấu Trừ & Sử Dụng Điểm Rèn Luyện</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUsePointsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeductDisciplinePointsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Chọn học sinh (*)</label>
                <select
                  value={usePointsStudentId}
                  onChange={(e) => setUsePointsStudentId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {students.map((st) => {
                    const stStat = allTrainingMembersRanked.find(p => p.student.id === st.id);
                    const rem = stStat ? stStat.remainingPoints : 0;
                    return (
                      <option key={st.id} value={st.id}>
                        {st.fullName} ({st.team || 'Tổ 1'}) — Còn {rem}đ thưởng
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Show selected student stats */}
              {(() => {
                const selectedStat = allTrainingMembersRanked.find(p => p.student.id === usePointsStudentId);
                if (!selectedStat) return null;
                return (
                  <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold block">Khen thưởng</span>
                      <span className="font-black text-sm text-slate-800">+{selectedStat.pos}đ</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold block">Đã dùng</span>
                      <span className="font-black text-sm text-amber-700">-{selectedStat.usedPoints}đ</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold block">Điểm thưởng còn</span>
                      <span className="font-black text-base text-emerald-700">+{selectedStat.remainingPoints}đ</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Số điểm thưởng muốn khấu trừ / đổi (*)</label>
                <input
                  type="number"
                  value={usePointsAmount}
                  onChange={(e) => setUsePointsAmount(Number(e.target.value))}
                  min={1}
                  max={200}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-black text-slate-900 text-base focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Hệ thống sẽ tự động tick chọn và khấu trừ số điểm tương ứng từ các lượt khen thưởng rèn luyện của học sinh.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Lí do / Mục đích sử dụng điểm (*)</label>
                <input
                  type="text"
                  value={usePointsNote}
                  onChange={(e) => setUsePointsNote(e.target.value)}
                  placeholder="VD: Đổi vé xem phim, Đổi phần thưởng rèn luyện..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span>⚡ Xác Nhận Khấu Trừ Điểm</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
