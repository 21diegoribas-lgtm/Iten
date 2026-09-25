import React, { useState, useMemo } from 'react';
import {
  User,
  ClassLogbookWeek,
  ClassLogbookPeriod,
  DayOfWeek,
  TimetableEntry
} from '../../types';
import { soundFx } from '../../utils/sound';

interface ClassLogbookManagerProps {
  currentUser: User;
  students: User[];
  classesList: { id: string; name: string; homeroomTeacher?: string }[];
  timetables?: TimetableEntry[];
  logbooks: ClassLogbookWeek[];
  onUpdateLogbooks: (updatedLogbooks: ClassLogbookWeek[]) => void;
}

const DAYS_OF_WEEK: DayOfWeek[] = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const COMMON_SUBJECTS = [
  { name: 'Toán học', short: 'Toán', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Ngữ Văn', short: 'Văn', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Tiếng Anh', short: 'Anh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'KHTN', short: 'KHTN', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'Vật Lý', short: 'Lý', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Hóa Học', short: 'Hóa', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Sinh Học', short: 'Sinh', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'Lịch Sử', short: 'Sử', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { name: 'Địa Lý', short: 'Địa', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { name: 'GDCD', short: 'GDCD', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { name: 'Tin Học', short: 'Tin', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { name: 'Công Nghệ', short: 'CN', color: 'bg-stone-50 text-stone-700 border-stone-200' },
  { name: 'Thể Dục', short: 'TD', color: 'bg-lime-50 text-lime-800 border-lime-200' },
  { name: 'Âm Nhạc', short: 'Nhạc', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  { name: 'Mỹ Thuật', short: 'Họa', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { name: 'Hoạt động trải nghiệm', short: 'HĐTN', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { name: 'Chào cờ', short: 'Chào cờ', color: 'bg-red-50 text-red-700 border-red-200' },
  { name: 'Sinh hoạt lớp', short: 'SHL', color: 'bg-green-50 text-green-700 border-green-200' }
];

export const ClassLogbookManager: React.FC<ClassLogbookManagerProps> = ({
  currentUser,
  classesList,
  timetables = [],
  logbooks,
  onUpdateLogbooks
}) => {
  // Permission checks
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isOfficer =
    currentUser.role === 'student' &&
    !!currentUser.position &&
    currentUser.position.toLowerCase() !== 'thành viên';

  const isClassLeader = currentUser.position === 'lớp trưởng';
  const isDeputyStudy = currentUser.position === 'lớp phó học tập' || currentUser.position === 'lớp phó';

  // State
  const [selectedClassId, setSelectedClassId] = useState<string>(
    currentUser.classId || classesList[0]?.id || 'c1'
  );
  const [selectedYear, setSelectedYear] = useState<string>('2025 - 2026');
  const [selectedSemester, setSelectedSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [activeTab, setActiveTab] = useState<'logbook_table' | 'statistics' | 'subject_summary' | 'multi_week'>('logbook_table');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showEditPeriodModal, setShowEditPeriodModal] = useState<boolean>(false);
  const [editingPeriod, setEditingPeriod] = useState<Partial<ClassLogbookPeriod> | null>(null);
  const [isNewPeriod, setIsNewPeriod] = useState<boolean>(false);
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [customSubjectInput, setCustomSubjectInput] = useState<string>('');

  const [showTeacherCommentModal, setShowTeacherCommentModal] = useState<boolean>(false);
  const [homeroomCommentDraft, setHomeroomCommentDraft] = useState<string>('');

  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Current class details
  const currentClass = useMemo(() => {
    return classesList.find(c => c.id === selectedClassId) || {
      id: selectedClassId,
      name: currentUser.className || 'Lớp 8A1',
      homeroomTeacher: 'Cô Lê Thị Mai'
    };
  }, [classesList, selectedClassId, currentUser]);

  const isHomeroomTeacherForCurrentClass =
    currentUser.role === 'teacher' &&
    (currentClass.homeroomTeacher?.toLowerCase().includes(currentUser.fullName.toLowerCase()) ||
      currentUser.teacherRole === 'giáo viên chủ nhiệm');

  // Can this user update logbook entries?
  const canEditLogbook =
    currentUser.role === 'admin' ||
    isHomeroomTeacherForCurrentClass ||
    currentUser.role === 'teacher' ||
    isOfficer;

  // Find or create current week logbook
  const currentWeekLogbook = useMemo(() => {
    let lb = logbooks.find(
      l =>
        l.classId === selectedClassId &&
        l.academicYear === selectedYear &&
        l.semester === selectedSemester &&
        l.weekNumber === selectedWeek
    );

    if (!lb) {
      // Create empty placeholder week structure
      lb = {
        id: `lb_w${selectedWeek}_${selectedClassId}`,
        classId: selectedClassId,
        className: currentClass.name,
        academicYear: selectedYear,
        semester: selectedSemester,
        weekNumber: selectedWeek,
        startDate: '2026-08-24',
        endDate: '2026-08-29',
        homeroomTeacherName: currentClass.homeroomTeacher || 'Cô Lê Thị Mai',
        classOfficerName: currentUser.fullName,
        status: 'draft',
        totalPeriods: 0,
        averageScore: 0,
        goodPeriodsCount: 0,
        entries: []
      };
    }
    return lb;
  }, [logbooks, selectedClassId, selectedYear, selectedSemester, selectedWeek, currentClass, currentUser]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let list = [...(currentWeekLogbook.entries || [])];

    if (filterDay !== 'all') {
      list = list.filter(e => e.day === filterDay);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        e =>
          e.subject.toLowerCase().includes(q) ||
          e.lessonContent.toLowerCase().includes(q) ||
          e.teacherName.toLowerCase().includes(q) ||
          (e.teacherComment && e.teacherComment.toLowerCase().includes(q))
      );
    }

    // Sort by Day order then Period
    const dayOrder: Record<DayOfWeek, number> = {
      'Thứ 2': 2,
      'Thứ 3': 3,
      'Thứ 4': 4,
      'Thứ 5': 5,
      'Thứ 6': 6,
      'Thứ 7': 7
    };

    return list.sort((a, b) => {
      const dDiff = (dayOrder[a.day] || 0) - (dayOrder[b.day] || 0);
      if (dDiff !== 0) return dDiff;
      return a.period - b.period;
    });
  }, [currentWeekLogbook, filterDay, searchQuery]);

  // Statistics calculation for current week
  const weekStats = useMemo(() => {
    const entries = currentWeekLogbook.entries || [];
    const total = entries.length;
    if (total === 0) {
      return {
        totalPeriods: 0,
        averageScore: 0,
        goodCount: 0,
        fairCount: 0,
        averageCount: 0,
        poorCount: 0,
        percentGood: 0,
        totalScore: 0
      };
    }

    let goodCount = 0; // >= 9.0 (Tốt)
    let fairCount = 0; // 7.0 - 8.5 (Khá)
    let averageCount = 0; // 5.0 - 6.5 (Trung bình)
    let poorCount = 0; // < 5.0 (Yếu)
    let totalScore = 0;

    entries.forEach(e => {
      const score = Number(e.score) || 0;
      totalScore += score;
      if (score >= 9) goodCount++;
      else if (score >= 7) fairCount++;
      else if (score >= 5) averageCount++;
      else poorCount++;
    });

    const averageScore = Number((totalScore / total).toFixed(2));
    const percentGood = Math.round((goodCount / total) * 100);

    return {
      totalPeriods: total,
      averageScore,
      goodCount,
      fairCount,
      averageCount,
      poorCount,
      percentGood,
      totalScore
    };
  }, [currentWeekLogbook]);

  // Subject summary stats
  const subjectSummary = useMemo(() => {
    const entries = currentWeekLogbook.entries || [];
    const map: Record<
      string,
      {
        subject: string;
        teacherName: string;
        periodCount: number;
        totalScore: number;
        goodCount: number;
        comments: string[];
      }
    > = {};

    entries.forEach(e => {
      if (!map[e.subject]) {
        map[e.subject] = {
          subject: e.subject,
          teacherName: e.teacherName,
          periodCount: 0,
          totalScore: 0,
          goodCount: 0,
          comments: []
        };
      }
      map[e.subject].periodCount += 1;
      const score = Number(e.score) || 0;
      map[e.subject].totalScore += score;
      if (score >= 9) map[e.subject].goodCount += 1;
      if (e.teacherComment && e.teacherComment.trim()) {
        map[e.subject].comments.push(e.teacherComment);
      }
    });

    return Object.values(map).map(item => ({
      ...item,
      avgScore: Number((item.totalScore / item.periodCount).toFixed(2)),
      percentGood: Math.round((item.goodCount / item.periodCount) * 100)
    }));
  }, [currentWeekLogbook]);

  // All weeks of this class for multi-week view
  const classWeeks = useMemo(() => {
    return logbooks
      .filter(
        l =>
          l.classId === selectedClassId &&
          l.academicYear === selectedYear &&
          l.semester === selectedSemester
      )
      .sort((a, b) => a.weekNumber - b.weekNumber);
  }, [logbooks, selectedClassId, selectedYear, selectedSemester]);

  // Helper to save modified logbook
  const saveLogbook = (updatedLb: ClassLogbookWeek) => {
    const existingIndex = logbooks.findIndex(
      l =>
        l.classId === updatedLb.classId &&
        l.academicYear === updatedLb.academicYear &&
        l.semester === updatedLb.semester &&
        l.weekNumber === updatedLb.weekNumber
    );

    let updatedList: ClassLogbookWeek[];
    if (existingIndex >= 0) {
      updatedList = [...logbooks];
      updatedList[existingIndex] = updatedLb;
    } else {
      updatedList = [updatedLb, ...logbooks];
    }
    onUpdateLogbooks(updatedList);
  };

  // Handlers for period editing
  const handleOpenAddPeriod = (day?: DayOfWeek, periodNum?: number) => {
    soundFx.playClick();
    setIsNewPeriod(true);
    setIsCustomSubject(false);
    setCustomSubjectInput('');

    const defaultDay = day || 'Thứ 2';
    const defaultPeriod = periodNum || 1;

    setEditingPeriod({
      id: `p_${Date.now()}`,
      day: defaultDay,
      date: currentWeekLogbook.startDate || new Date().toISOString().split('T')[0],
      period: defaultPeriod,
      session: 'Sáng',
      subject: 'Toán học',
      lessonContent: '',
      score: 10,
      classification: 'Tốt',
      teacherName: 'Thầy Nguyễn Hữu Hùng',
      teacherSignature: true,
      teacherComment: 'Lớp học trật tự, tập trung và phát biểu hăng hái.',
      absentStudents: 'Đủ',
      updatedBy: `${currentUser.fullName} (${currentUser.position || currentUser.role})`,
      updatedAt: new Date().toISOString()
    });
    setShowEditPeriodModal(true);
  };

  const handleOpenEditPeriod = (period: ClassLogbookPeriod) => {
    soundFx.playClick();
    setIsNewPeriod(false);
    const isKnown = COMMON_SUBJECTS.some(s => s.name.toLowerCase() === (period.subject || '').toLowerCase());
    setIsCustomSubject(!isKnown);
    setCustomSubjectInput(!isKnown ? (period.subject || '') : '');
    setEditingPeriod({ ...period });
    setShowEditPeriodModal(true);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = (isCustomSubject ? customSubjectInput : (editingPeriod?.subject || ''))?.trim();
    if (!editingPeriod || !finalSubject || !editingPeriod.lessonContent) {
      alert('Vui lòng chọn hoặc nhập đầy đủ Tên môn học và Nội dung bài dạy!');
      return;
    }

    soundFx.playSuccess();

    const scoreNum = Number(editingPeriod.score) || 10;
    let autoClass: 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu' = 'Tốt';
    if (scoreNum >= 9) autoClass = 'Tốt';
    else if (scoreNum >= 7) autoClass = 'Khá';
    else if (scoreNum >= 5) autoClass = 'Trung bình';
    else autoClass = 'Yếu';

    const periodData: ClassLogbookPeriod = {
      id: editingPeriod.id || `p_${Date.now()}`,
      day: editingPeriod.day || 'Thứ 2',
      date: editingPeriod.date || '2026-08-24',
      period: Number(editingPeriod.period) || 1,
      session: editingPeriod.session || 'Sáng',
      subject: finalSubject,
      lessonContent: editingPeriod.lessonContent,
      score: scoreNum,
      classification: editingPeriod.classification || autoClass,
      teacherName: editingPeriod.teacherName || 'Giáo viên bộ môn',
      teacherSignature: editingPeriod.teacherSignature ?? true,
      teacherComment: editingPeriod.teacherComment || 'Tiết học tốt.',
      absentStudents: editingPeriod.absentStudents || 'Đủ',
      updatedBy: `${currentUser.fullName} (${currentUser.position || currentUser.role})`,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    let entries = [...(currentWeekLogbook.entries || [])];
    if (isNewPeriod) {
      // Remove any duplicate for same day & period if exists
      entries = entries.filter(
        item => !(item.day === periodData.day && item.period === periodData.period && item.session === periodData.session)
      );
      entries.push(periodData);
    } else {
      const idx = entries.findIndex(item => item.id === periodData.id);
      if (idx >= 0) {
        entries[idx] = periodData;
      } else {
        entries.push(periodData);
      }
    }

    const updatedLb: ClassLogbookWeek = {
      ...currentWeekLogbook,
      entries,
      totalPeriods: entries.length,
      averageScore: Number((entries.reduce((s, x) => s + (Number(x.score) || 0), 0) / (entries.length || 1)).toFixed(2)),
      goodPeriodsCount: entries.filter(x => Number(x.score) >= 9).length,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    saveLogbook(updatedLb);
    setShowEditPeriodModal(false);
    setEditingPeriod(null);
  };

  const handleDeletePeriod = (periodId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tiết học này khỏi Sổ đầu bài?')) return;
    soundFx.playTrash();

    const entries = (currentWeekLogbook.entries || []).filter(p => p.id !== periodId);
    const updatedLb: ClassLogbookWeek = {
      ...currentWeekLogbook,
      entries,
      totalPeriods: entries.length,
      averageScore: entries.length > 0 ? Number((entries.reduce((s, x) => s + (Number(x.score) || 0), 0) / entries.length).toFixed(2)) : 0,
      goodPeriodsCount: entries.filter(x => Number(x.score) >= 9).length,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    saveLogbook(updatedLb);
  };

  // Auto-fill from timetable
  const handleAutoFillFromTimetable = () => {
    soundFx.playClick();
    const timetable = timetables.find(t => t.classId === selectedClassId) || {
      schedule: [
        {
          day: 'Thứ 2',
          periods: [
            { period: 1, subject: 'Chào cờ', teacherName: 'Toàn trường' },
            { period: 2, subject: 'Toán học', teacherName: 'Thầy Nguyễn Hữu Hùng' },
            { period: 3, subject: 'Ngữ Văn', teacherName: 'Cô Lê Thị Mai' },
            { period: 4, subject: 'Tiếng Anh', teacherName: 'Cô Sarah Miller' },
            { period: 5, subject: 'Vật Lý', teacherName: 'Thầy Trần Văn Tuấn' }
          ]
        },
        {
          day: 'Thứ 3',
          periods: [
            { period: 1, subject: 'Vật Lý', teacherName: 'Thầy Trần Văn Tuấn' },
            { period: 2, subject: 'Hóa Học', teacherName: 'Cô Hoàng Lan' },
            { period: 3, subject: 'Lịch Sử', teacherName: 'Thầy Vũ Hải Nam' },
            { period: 4, subject: 'Địa Lý', teacherName: 'Cô Nguyễn Thu Hương' },
            { period: 5, subject: 'Toán học', teacherName: 'Thầy Nguyễn Hữu Hùng' }
          ]
        },
        {
          day: 'Thứ 4',
          periods: [
            { period: 1, subject: 'Toán học', teacherName: 'Thầy Nguyễn Hữu Hùng' },
            { period: 2, subject: 'Ngữ Văn', teacherName: 'Cô Lê Thị Mai' },
            { period: 3, subject: 'Sinh Học', teacherName: 'Cô Phạm Phương Thảo' },
            { period: 4, subject: 'Tin Học', teacherName: 'Thầy Trịnh Văn Bình' },
            { period: 5, subject: 'Tiếng Anh', teacherName: 'Cô Sarah Miller' }
          ]
        },
        {
          day: 'Thứ 5',
          periods: [
            { period: 1, subject: 'Tiếng Anh', teacherName: 'Cô Sarah Miller' },
            { period: 2, subject: 'GDCD', teacherName: 'Thầy Đỗ Minh Đức' },
            { period: 3, subject: 'Công Nghệ', teacherName: 'Cô Đinh Như Quỳnh' },
            { period: 4, subject: 'Thể Dục', teacherName: 'Thầy Bùi Phi Long' },
            { period: 5, subject: 'Ngữ Văn', teacherName: 'Cô Lê Thị Mai' }
          ]
        },
        {
          day: 'Thứ 6',
          periods: [
            { period: 1, subject: 'Toán học', teacherName: 'Thầy Nguyễn Hữu Hùng' },
            { period: 2, subject: 'Ngữ Văn', teacherName: 'Cô Lê Thị Mai' },
            { period: 3, subject: 'Mỹ Thuật', teacherName: 'Cô Phan Bích Vân' },
            { period: 4, subject: 'Âm Nhạc', teacherName: 'Thầy Hoàng Đăng Khoa' },
            { period: 5, subject: 'Sinh Học', teacherName: 'Cô Phạm Phương Thảo' }
          ]
        },
        {
          day: 'Thứ 7',
          periods: [
            { period: 1, subject: 'KHTN', teacherName: 'Thầy Trần Văn Tuấn' },
            { period: 2, subject: 'Lịch Sử', teacherName: 'Thầy Vũ Hải Nam' },
            { period: 3, subject: 'Địa Lý', teacherName: 'Cô Nguyễn Thu Hương' },
            { period: 4, subject: 'Hoạt động trải nghiệm', teacherName: 'Cô Lê Thị Mai' },
            { period: 5, subject: 'Sinh hoạt lớp', teacherName: 'Cô Lê Thị Mai' }
          ]
        }
      ]
    };

    if (!window.confirm('Hệ thống sẽ tự động điền danh sách tiết học và giáo viên trong tuần theo Thời khóa biểu của lớp. Bạn có muốn tiếp tục?')) {
      return;
    }

    const existingEntries = [...(currentWeekLogbook.entries || [])];
    const newEntries: ClassLogbookPeriod[] = [...existingEntries];

    timetable.schedule.forEach(s => {
      const day = s.day as DayOfWeek;
      s.periods.forEach(p => {
        const hasExisting = existingEntries.some(e => e.day === day && e.period === p.period);
        if (!hasExisting) {
          newEntries.push({
            id: `p_gen_${day}_${p.period}_${Date.now()}`,
            day,
            date: currentWeekLogbook.startDate || '2026-08-24',
            period: p.period,
            session: 'Sáng',
            subject: p.subject,
            lessonContent: `Bài học tuần ${selectedWeek} - Môn ${p.subject}`,
            score: 10,
            classification: 'Tốt',
            teacherName: p.teacherName,
            teacherSignature: true,
            teacherComment: 'Học sinh chú ý nghe giảng, tiếp thu tốt.',
            absentStudents: 'Đủ',
            updatedBy: `${currentUser.fullName} (Tự động điền)`,
            updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
          });
        }
      });
    });

    const updatedLb: ClassLogbookWeek = {
      ...currentWeekLogbook,
      entries: newEntries,
      totalPeriods: newEntries.length,
      averageScore: Number((newEntries.reduce((s, x) => s + (Number(x.score) || 0), 0) / newEntries.length).toFixed(2)),
      goodPeriodsCount: newEntries.filter(x => Number(x.score) >= 9).length,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    saveLogbook(updatedLb);
    soundFx.playSuccess();
  };

  // Homeroom comment & approval
  const handleSaveHomeroomComment = () => {
    soundFx.playSuccess();
    const updatedLb: ClassLogbookWeek = {
      ...currentWeekLogbook,
      homeroomTeacherComment: homeroomCommentDraft,
      homeroomTeacherSignature: true,
      status: 'approved',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    saveLogbook(updatedLb);
    setShowTeacherCommentModal(false);
  };

  const getSubjectBadge = (subjectName: string) => {
    const matched = COMMON_SUBJECTS.find(s => subjectName.toLowerCase().includes(s.short.toLowerCase()) || subjectName.toLowerCase().includes(s.name.toLowerCase()));
    if (matched) {
      return matched.color;
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Banner & Class Selector */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 text-9xl opacity-15 select-none">📖</div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
                <span>📚</span> SỔ ĐẦU BÀI ĐIỆN TỬ
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/80 text-xs font-bold backdrop-blur-md">
                Năm học {selectedYear}
              </span>
            </div>

            {/* Role indicator badge */}
            <div className="text-xs">
              {currentUser.role === 'student' ? (
                isOfficer ? (
                  <span className="bg-amber-400 text-amber-950 font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                    👑 Cán sự lớp: Có quyền ghi & cập nhật Sổ đầu bài
                  </span>
                ) : (
                  <span className="bg-white/20 text-white font-medium px-3 py-1 rounded-full backdrop-blur-md">
                    👀 Học sinh thành viên: Xem cập nhật Sổ đầu bài
                  </span>
                )
              ) : isHomeroomTeacherForCurrentClass ? (
                <span className="bg-rose-500 text-white font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                  ⭐ Giáo viên chủ nhiệm: Quản lý & Ký duyệt Sổ đầu bài
                </span>
              ) : (
                <span className="bg-white/20 text-white font-medium px-3 py-1 rounded-full backdrop-blur-md">
                  👨‍🏫 Giáo viên / Quản trị viên
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black mb-1 flex items-center gap-2">
                Sổ đầu bài {currentClass.name}
              </h2>
              <p className="text-sm text-blue-100 font-medium">
                GVCN: {currentClass.homeroomTeacher || 'Cô Lê Thị Mai'} • Cán sự trực sổ:{' '}
                {currentWeekLogbook.classOfficerName || 'Trần Thị Bích'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {canEditLogbook && (
                <>
                  <button
                    onClick={() => handleOpenAddPeriod()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>➕</span> Ghi tiết học mới
                  </button>
                  <button
                    onClick={handleAutoFillFromTimetable}
                    className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Tự động tạo danh sách tiết học theo Thời khóa biểu lớp"
                  >
                    <span>⚡</span> Điền theo TKB
                  </button>
                </>
              )}
              {isHomeroomTeacherForCurrentClass && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    setHomeroomCommentDraft(currentWeekLogbook.homeroomTeacherComment || '');
                    setShowTeacherCommentModal(true);
                  }}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>✍️</span> GVCN Nhận xét & Ký duyệt
                </button>
              )}
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowPrintModal(true);
                }}
                className="px-3.5 py-2 bg-white text-blue-900 hover:bg-blue-50 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>🖨️</span> In sổ đầu bài
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Class / Year / Semester / Week selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select (if teacher or admin) */}
          {isTeacherOrAdmin ? (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Lớp học
              </label>
              <select
                value={selectedClassId}
                onChange={e => {
                  soundFx.playClick();
                  setSelectedClassId(e.target.value);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-blue-500 cursor-pointer"
              >
                {classesList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.homeroomTeacher ? `(${c.homeroomTeacher})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Lớp của bạn
              </label>
              <div className="px-3 py-1.5 bg-blue-50 text-blue-900 text-xs font-black rounded-xl border border-blue-100">
                {currentClass.name}
              </div>
            </div>
          )}

          {/* Academic Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Năm học
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-blue-500 cursor-pointer"
            >
              <option value="2025 - 2026">2025 - 2026</option>
              <option value="2026 - 2027">2026 - 2027</option>
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Học kỳ
            </label>
            <select
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-blue-500 cursor-pointer"
            >
              <option value="Học kỳ 1">Học kỳ 1</option>
              <option value="Học kỳ 2">Học kỳ 2</option>
            </select>
          </div>

          {/* Week Select */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tuần học
            </label>
            <div className="flex items-center gap-1">
              <button
                disabled={selectedWeek <= 1}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedWeek(w => Math.max(1, w - 1));
                }}
                className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-black cursor-pointer"
              >
                ◀
              </button>
              <select
                value={selectedWeek}
                onChange={e => {
                  soundFx.playClick();
                  setSelectedWeek(Number(e.target.value));
                }}
                className="bg-blue-50 border border-blue-200 text-blue-900 text-xs font-extrabold rounded-xl px-3 py-1.5 focus:outline-blue-500 cursor-pointer"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>
                    Tuần {w} {w === 4 ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </select>
              <button
                disabled={selectedWeek >= 35}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedWeek(w => Math.min(35, w + 1));
                }}
                className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded-lg text-xs font-black cursor-pointer"
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('logbook_table');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'logbook_table'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Sổ đầu bài tuần
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('statistics');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'statistics'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Thống kê bảng
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('subject_summary');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'subject_summary'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📚 Theo môn học
          </button>
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('multi_week');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'multi_week'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📈 Ma trận tuần
          </button>
        </div>
      </div>

      {/* 3. Top Metrics Banner for Current Week */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng số tiết học</span>
            <span className="text-xl">📝</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{weekStats.totalPeriods}</span>
            <span className="text-xs text-slate-400 font-semibold">tiết / tuần</span>
          </div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">
            {weekStats.totalPeriods >= 25 ? '✓ Đầy đủ lịch học' : 'Đang cập nhật thêm'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Điểm trung bình tuần</span>
            <span className="text-xl">⭐</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{weekStats.averageScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 10 điểm</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            Xếp loại: {weekStats.averageScore >= 9.5 ? 'Xuất sắc 🏆' : weekStats.averageScore >= 8.5 ? 'Tốt 🌟' : 'Khá'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tiết học loại Tốt</span>
            <span className="text-xl">🎯</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{weekStats.goodCount}</span>
            <span className="text-xs text-slate-400 font-semibold">
              ({weekStats.percentGood}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Khá: {weekStats.fairCount} • TB: {weekStats.averageCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Trạng thái duyệt</span>
            <span className="text-xl">🖋️</span>
          </div>
          <div className="mt-2">
            {currentWeekLogbook.status === 'approved' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                ✓ GVCN đã ký duyệt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-xs">
                ⏳ Chờ GVCN duyệt
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1 truncate">
            {currentWeekLogbook.homeroomTeacherName || 'Cô Lê Thị Mai'}
          </div>
        </div>
      </div>

      {/* 4. Homeroom Teacher's Weekly Evaluation Note */}
      {currentWeekLogbook.homeroomTeacherComment && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
            ✍️
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">
                Nhận xét & Đánh giá tổng kết tuần của Giáo viên chủ nhiệm
              </h4>
              <span className="text-[11px] text-amber-700 font-bold">
                {currentWeekLogbook.homeroomTeacherName || 'Cô Lê Thị Mai'} • Đã ký
              </span>
            </div>
            <p className="text-xs text-amber-950 font-medium mt-1 leading-relaxed">
              "{currentWeekLogbook.homeroomTeacherComment}"
            </p>
          </div>
        </div>
      )}

      {/* 5. VIEW 1: SỔ ĐẦU BÀI TUẦN DẠNG BẢNG CHUẨN QUY */}
      {activeTab === 'logbook_table' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Filter & Day Tab header */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setFilterDay('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterDay === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Toàn bộ tuần (Thứ 2 - 7)
              </button>
              {DAYS_OF_WEEK.map(d => {
                const dayPeriods = (currentWeekLogbook.entries || []).filter(e => e.day === d);
                return (
                  <button
                    key={d}
                    onClick={() => setFilterDay(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      filterDay === d
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{d}</span>
                    <span className="text-[10px] opacity-75 font-mono">({dayPeriods.length})</span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm môn, bài học, giáo viên..."
                className="w-56 pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-blue-500"
              />
              <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Sổ đầu bài Table */}
          {filteredEntries.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-blue-50 flex items-center justify-center text-3xl">
                📖
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Chưa có dữ liệu tiết học trong {filterDay === 'all' ? `Tuần ${selectedWeek}` : filterDay}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                {canEditLogbook
                  ? 'Ban cán sự lớp hoặc Giáo viên có thể bấm Ghi tiết học mới hoặc Điền theo Thời khóa biểu.'
                  : 'Sổ đầu bài tuần này chưa được cập nhật. Vui lòng quay lại sau.'}
              </p>
              {canEditLogbook && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleOpenAddPeriod(filterDay === 'all' ? 'Thứ 2' : (filterDay as DayOfWeek))}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    ➕ Ghi tiết học đầu tiên
                  </button>
                  <button
                    onClick={handleAutoFillFromTimetable}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    ⚡ Điền tự động theo TKB
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3 w-16 text-center">Thứ</th>
                    <th className="py-3 px-2 w-12 text-center">Tiết</th>
                    <th className="py-3 px-3 w-36">Môn học</th>
                    <th className="py-3 px-4 min-w-[220px]">Tên bài học / Nội dung giảng dạy</th>
                    <th className="py-3 px-4 min-w-[180px]">Nhận xét của Giáo viên</th>
                    <th className="py-3 px-2 w-20 text-center">Sĩ số</th>
                    <th className="py-3 px-2 w-20 text-center">Điểm</th>
                    <th className="py-3 px-3 w-32">Giáo viên</th>
                    <th className="py-3 px-2 w-16 text-center">Ký tên</th>
                    {canEditLogbook && <th className="py-3 px-3 w-20 text-center">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((period, idx) => {
                    const isNewDayGroup = idx === 0 || filteredEntries[idx - 1].day !== period.day;
                    const dayCount = filteredEntries.filter(p => p.day === period.day).length;

                    return (
                      <tr
                        key={period.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* Day Column with visual grouping */}
                        <td className="py-3 px-3 text-center align-top font-bold text-slate-800 bg-slate-50/40">
                          {isNewDayGroup ? (
                            <div className="sticky top-0">
                              <span className="inline-block font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md text-[11px]">
                                {period.day}
                              </span>
                              <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                {period.date ? period.date.split('-').slice(1).reverse().join('/') : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300">"</span>
                          )}
                        </td>

                        {/* Period Number */}
                        <td className="py-3 px-2 text-center align-middle font-black text-slate-700">
                          <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-200/60 inline-flex items-center justify-center text-xs">
                            {period.period}
                          </span>
                        </td>

                        {/* Subject */}
                        <td className="py-3 px-3 align-middle">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-bold text-[11px] border ${getSubjectBadge(
                              period.subject
                            )}`}
                          >
                            {period.subject}
                          </span>
                        </td>

                        {/* Lesson Content */}
                        <td className="py-3 px-4 align-middle font-semibold text-slate-800 leading-snug">
                          {period.lessonContent}
                        </td>

                        {/* Teacher Comment */}
                        <td className="py-3 px-4 align-middle text-slate-600 italic leading-snug text-[11px]">
                          {period.teacherComment ? (
                            <span>“{period.teacherComment}”</span>
                          ) : (
                            <span className="text-slate-400 not-italic">-</span>
                          )}
                        </td>

                        {/* Absent */}
                        <td className="py-3 px-2 text-center align-middle font-medium text-slate-600 text-[11px]">
                          {period.absentStudents === 'Đủ' ? (
                            <span className="text-emerald-700 font-bold">Đủ</span>
                          ) : (
                            <span className="text-rose-600 font-semibold">{period.absentStudents || 'Đủ'}</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-3 px-2 text-center align-middle">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full font-black text-xs ${
                              period.score >= 9.5
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : period.score >= 8.5
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : period.score >= 7
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {period.score}
                          </span>
                        </td>

                        {/* Teacher */}
                        <td className="py-3 px-3 align-middle font-bold text-slate-700 text-[11px]">
                          {period.teacherName}
                        </td>

                        {/* Signature */}
                        <td className="py-3 px-2 text-center align-middle">
                          {period.teacherSignature ? (
                            <span className="inline-flex items-center text-emerald-600 text-base font-bold" title="Đã ký xác nhận">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs" title="Chưa ký">
                              —
                            </span>
                          )}
                        </td>

                        {/* Action buttons (for Officers & Teachers) */}
                        {canEditLogbook && (
                          <td className="py-3 px-3 text-center align-middle">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditPeriod(period)}
                                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all cursor-pointer text-xs"
                                title="Chỉnh sửa tiết học"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeletePeriod(period.id)}
                                className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer text-xs"
                                title="Xóa tiết học"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer note & Quick Add row button */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-medium">
              <span>📌 Thống kê:</span>
              <span className="font-bold text-slate-700">{filteredEntries.length} tiết hiển thị</span>
              <span>•</span>
              <span>
                Cập nhật lần cuối:{' '}
                <strong className="text-slate-700">{currentWeekLogbook.updatedAt || 'Hôm nay'}</strong>
              </span>
            </div>

            {canEditLogbook && (
              <button
                onClick={() => handleOpenAddPeriod()}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>➕</span> Ghi thêm tiết học vào Sổ đầu bài
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. VIEW 2: THỐNG KÊ DẠNG BẢNG CHI TIẾT */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Weekly Summary Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  📊 Bảng tổng hợp thi đua học tập - Tuần {selectedWeek}
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng kết các chỉ số học tập, chất lượng tiết học và xếp loại tuần theo biểu mẫu thi đua
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-black text-xs">
                {currentClass.name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-2xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4 border-b border-slate-200">Chỉ số thi đua</th>
                    <th className="py-3 px-4 border-b border-slate-200 text-center">Số lượng</th>
                    <th className="py-3 px-4 border-b border-slate-200 text-center">Tỷ lệ %</th>
                    <th className="py-3 px-4 border-b border-slate-200">Đánh giá / Tiêu chuẩn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4 font-bold text-slate-800">Tổng số tiết học trong tuần</td>
                    <td className="py-3 px-4 text-center font-black text-slate-800">{weekStats.totalPeriods}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-500">100%</td>
                    <td className="py-3 px-4 text-slate-600">Đầy đủ theo phân phối chương trình của trường</td>
                  </tr>
                  <tr className="bg-emerald-50/40">
                    <td className="py-3 px-4 font-bold text-emerald-900 flex items-center gap-1.5">
                      <span>🌟</span> Tiết học loại Tốt (Điểm 9.0 - 10.0)
                    </td>
                    <td className="py-3 px-4 text-center font-black text-emerald-700">{weekStats.goodCount}</td>
                    <td className="py-3 px-4 text-center font-black text-emerald-700">{weekStats.percentGood}%</td>
                    <td className="py-3 px-4 text-emerald-800 font-medium">Học sinh nghiêm túc, phát biểu sôi nổi, làm bài tốt</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-blue-900 flex items-center gap-1.5">
                      <span>👍</span> Tiết học loại Khá (Điểm 7.0 - 8.5)
                    </td>
                    <td className="py-3 px-4 text-center font-black text-blue-700">{weekStats.fairCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">
                      {weekStats.totalPeriods > 0 ? Math.round((weekStats.fairCount / weekStats.totalPeriods) * 100) : 0}%
                    </td>
                    <td className="py-3 px-4 text-slate-600">Lớp trật tự, cần tích cực hơn trong thảo luận nhóm</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-amber-900 flex items-center gap-1.5">
                      <span>⚠️</span> Tiết học loại Trung bình (Điểm 5.0 - 6.5)
                    </td>
                    <td className="py-3 px-4 text-center font-black text-amber-700">{weekStats.averageCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-700">
                      {weekStats.totalPeriods > 0 ? Math.round((weekStats.averageCount / weekStats.totalPeriods) * 100) : 0}%
                    </td>
                    <td className="py-3 px-4 text-slate-600">Còn học sinh chưa chuẩn bị bài kỹ</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-bold text-rose-900 flex items-center gap-1.5">
                      <span>❌</span> Tiết học loại Yếu (Điểm &lt; 5.0)
                    </td>
                    <td className="py-3 px-4 text-center font-black text-rose-700">{weekStats.poorCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-rose-700">
                      {weekStats.totalPeriods > 0 ? Math.round((weekStats.poorCount / weekStats.totalPeriods) * 100) : 0}%
                    </td>
                    <td className="py-3 px-4 text-slate-600">Mất trật tự hoặc vi phạm nề nếp</td>
                  </tr>
                  <tr className="bg-blue-50/60 font-black">
                    <td className="py-3.5 px-4 text-blue-900 text-sm">ĐIỂM TRUNG BÌNH TUẦN</td>
                    <td className="py-3.5 px-4 text-center text-blue-700 text-base">{weekStats.averageScore} / 10</td>
                    <td className="py-3.5 px-4 text-center text-blue-700">-</td>
                    <td className="py-3.5 px-4 text-blue-900">
                      Xếp loại tuần:{' '}
                      <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs uppercase tracking-wider">
                        {weekStats.averageScore >= 9.5 ? 'Xuất sắc' : weekStats.averageScore >= 8.5 ? 'Tốt' : 'Khá'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW 3: THEO DÕI THEO MÔN HỌC */}
      {activeTab === 'subject_summary' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-800">
                📚 Bảng thống kê điểm tiết học theo Môn học - Tuần {selectedWeek}
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi kết quả dạy và học của từng môn trong tuần của lớp {currentClass.name}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Môn học</th>
                  <th className="py-3 px-4">Giáo viên giảng dạy</th>
                  <th className="py-3 px-3 text-center">Số tiết</th>
                  <th className="py-3 px-3 text-center">Số tiết Tốt</th>
                  <th className="py-3 px-3 text-center">Điểm TB môn</th>
                  <th className="py-3 px-4">Nhận xét tiêu biểu của Giáo viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectSummary.map(sub => (
                  <tr key={sub.subject} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg border font-bold text-[11px] ${getSubjectBadge(sub.subject)}`}>
                        {sub.subject}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{sub.teacherName}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{sub.periodCount}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-emerald-700 font-bold">
                        {sub.goodCount} ({sub.percentGood}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-black text-xs ${
                          sub.avgScore >= 9.5
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.avgScore >= 8.5
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sub.avgScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic text-[11px]">
                      {sub.comments[0] ? `“${sub.comments[0]}”` : 'Tiết học đạt yêu cầu.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. VIEW 4: MA TRẬN TOÀN HỌC KỲ */}
      {activeTab === 'multi_week' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-800">
                📈 Ma trận Sổ đầu bài qua các tuần học - {selectedSemester} ({selectedYear})
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi tiến độ, điểm trung bình và trạng thái ký duyệt Sổ đầu bài của các tuần
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 text-center w-20">Tuần</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-3 text-center">Tổng tiết</th>
                  <th className="py-3 px-3 text-center">Tiết Tốt</th>
                  <th className="py-3 px-3 text-center">Điểm TB</th>
                  <th className="py-3 px-4 text-center">Xếp loại tuần</th>
                  <th className="py-3 px-4 text-center">Trạng thái GVCN</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classWeeks.map(w => (
                  <tr
                    key={w.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      w.weekNumber === selectedWeek ? 'bg-blue-50/50 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-black text-blue-700">Tuần {w.weekNumber}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {w.startDate} → {w.endDate}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{w.totalPeriods || w.entries.length}</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-bold">
                      {w.goodPeriodsCount || w.entries.filter(e => e.score >= 9).length}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full text-xs">
                        {w.averageScore || 9.5}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        Xuất sắc 🏆
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {w.status === 'approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                          ✓ Đã duyệt
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                          Chưa duyệt
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedWeek(w.weekNumber);
                          setActiveTab('logbook_table');
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. MODAL: GHI & CHỈNH SỬA TIẾT HỌC (Cho Cán sự lớp & Giáo viên) */}
      {showEditPeriodModal && editingPeriod && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  📖
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {isNewPeriod ? 'Ghi tiết học vào Sổ đầu bài' : 'Chỉnh sửa thông tin tiết học'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentClass.name} • Tuần {selectedWeek}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditPeriodModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="space-y-4 text-xs">
              {/* Row 1: Thứ & Ngày & Tiết */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thứ trong tuần *</label>
                  <select
                    value={editingPeriod.day || 'Thứ 2'}
                    onChange={e => setEditingPeriod({ ...editingPeriod, day: e.target.value as DayOfWeek })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-blue-500"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày dạy *</label>
                  <input
                    type="date"
                    value={editingPeriod.date || ''}
                    onChange={e => setEditingPeriod({ ...editingPeriod, date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiết số *</label>
                  <select
                    value={editingPeriod.period || 1}
                    onChange={e => setEditingPeriod({ ...editingPeriod, period: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-blue-500"
                  >
                    {[1, 2, 3, 4, 5].map(p => (
                      <option key={p} value={p}>
                        Tiết {p} (Sáng)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Môn học (Kèm tùy chọn Khác tự nhập) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Môn học *</label>
                  <div>
                    {!isCustomSubject ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSubject(true);
                          const currentSub = editingPeriod.subject || '';
                          const isKnown = COMMON_SUBJECTS.some(s => s.name.toLowerCase() === currentSub.toLowerCase());
                          setCustomSubjectInput(isKnown ? '' : currentSub);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>✍️</span> Tự nhập môn khác
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSubject(false);
                          setEditingPeriod(prev => prev ? ({ ...prev, subject: 'Toán học' }) : null);
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>↩️</span> Chọn môn có sẵn
                      </button>
                    )}
                  </div>
                </div>

                {!isCustomSubject ? (
                  <select
                    value={
                      COMMON_SUBJECTS.some(s => s.name === editingPeriod.subject)
                        ? editingPeriod.subject
                        : '__OTHER__'
                    }
                    onChange={e => {
                      if (e.target.value === '__OTHER__') {
                        setIsCustomSubject(true);
                        setCustomSubjectInput('');
                        setEditingPeriod(prev => prev ? ({ ...prev, subject: '' }) : null);
                      } else {
                        setEditingPeriod(prev => prev ? ({ ...prev, subject: e.target.value }) : null);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-blue-500"
                  >
                    <optgroup label="Danh sách môn học có sẵn">
                      {COMMON_SUBJECTS.map(s => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </optgroup>
                    <option value="__OTHER__" className="font-bold text-blue-600">
                      ➕ Khác (Tự nhập tên môn học...)
                    </option>
                  </select>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={customSubjectInput}
                        onChange={e => {
                          setCustomSubjectInput(e.target.value);
                          setEditingPeriod(prev => prev ? ({ ...prev, subject: e.target.value }) : null);
                        }}
                        placeholder="Nhập tên môn học (vd: Kỹ năng sống, Tiếng Pháp, STEM, GDQP, Chuyên đề...)"
                        className="flex-1 p-2.5 bg-amber-50/60 border border-amber-300 rounded-xl font-bold text-slate-800 focus:outline-amber-500 placeholder:font-normal placeholder:text-slate-400 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomSubject(false);
                          setEditingPeriod(prev => prev ? ({ ...prev, subject: 'Toán học' }) : null);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer whitespace-nowrap"
                      >
                        Chọn có sẵn
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-700 font-medium">
                      💡 Bạn đang ở chế độ tự nhập môn học mới cho Sổ đầu bài.
                    </p>
                  </div>
                )}
              </div>

              {/* Row 3: Tên bài học / Nội dung giảng dạy */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên bài học / Nội dung giảng dạy *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editingPeriod.lessonContent || ''}
                  onChange={e => setEditingPeriod({ ...editingPeriod, lessonContent: e.target.value })}
                  placeholder="Ví dụ: Đại số: Hằng đẳng thức đáng nhớ (Bình phương của một tổng)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-blue-500"
                />
              </div>

              {/* Row 4: Giáo viên & Điểm số */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giáo viên giảng dạy *</label>
                  <input
                    type="text"
                    required
                    value={editingPeriod.teacherName || ''}
                    onChange={e => setEditingPeriod({ ...editingPeriod, teacherName: e.target.value })}
                    placeholder="Tên Thầy/Cô..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm tiết học (0 - 10) *</label>
                  <select
                    value={editingPeriod.score ?? 10}
                    onChange={e => setEditingPeriod({ ...editingPeriod, score: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 focus:outline-blue-500"
                  >
                    <option value={10}>10.0</option>
                    <option value={9.5}>9.5</option>
                    <option value={9}>9.0</option>
                    <option value={8.5}>8.5</option>
                    <option value={8}>8.0</option>
                    <option value={7.5}>7.5</option>
                    <option value={7}>7.0</option>
                    <option value={6.5}>6.5</option>
                    <option value={6}>6.0</option>
                    <option value={5.5}>5.5</option>
                    <option value={5}>5.0</option>
                    <option value={4.5}>4.5</option>
                    <option value={4}>4.0</option>
                    <option value={3.5}>3.5</option>
                    <option value={3}>3.0</option>
                    <option value={2}>2.0</option>
                    <option value={1}>1.0</option>
                    <option value={0}>0.0</option>
                  </select>
                </div>
              </div>

              {/* Row 5: Nhận xét & Sĩ số vắng */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nhận xét của Giáo viên</label>
                  <input
                    type="text"
                    value={editingPeriod.teacherComment || ''}
                    onChange={e => setEditingPeriod({ ...editingPeriod, teacherComment: e.target.value })}
                    placeholder="vd: Lớp học nghiêm túc, phát biểu hăng hái..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Học sinh vắng</label>
                  <input
                    type="text"
                    value={editingPeriod.absentStudents || 'Đủ'}
                    onChange={e => setEditingPeriod({ ...editingPeriod, absentStudents: e.target.value })}
                    placeholder="vd: Đủ / Vắng Nam (P)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* Teacher Signature confirmation */}
              <div className="p-3 bg-blue-50/60 rounded-xl flex items-center justify-between border border-blue-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="teacher_sign_cb"
                    checked={editingPeriod.teacherSignature ?? true}
                    onChange={e => setEditingPeriod({ ...editingPeriod, teacherSignature: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-md cursor-pointer"
                  />
                  <label htmlFor="teacher_sign_cb" className="font-bold text-blue-900 cursor-pointer">
                    Xác nhận Giáo viên đã ký tên vào Sổ đầu bài giấy
                  </label>
                </div>
                <span className="text-[10px] text-blue-700 font-semibold">Bút ký điện tử ✓</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditPeriodModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  {isNewPeriod ? 'Lưu vào Sổ đầu bài' : 'Cập nhật thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: GVCN NHẬN XÉT & KÝ DUYỆT TUẦN */}
      {showTeacherCommentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                  ✍️
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Đánh giá & Ký duyệt Sổ đầu bài Tuần {selectedWeek}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dành cho Giáo viên chủ nhiệm: {currentClass.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTeacherCommentModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 font-medium">Tổng số tiết học:</span>
                  <strong className="text-slate-800 ml-1">{weekStats.totalPeriods} tiết</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Điểm TB tuần:</span>
                  <strong className="text-emerald-700 ml-1 font-black">{weekStats.averageScore} / 10</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Tiết tốt:</span>
                  <strong className="text-blue-700 ml-1">{weekStats.goodCount} ({weekStats.percentGood}%)</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhận xét chung của Giáo viên chủ nhiệm về nề nếp và học tập *
                </label>
                <textarea
                  rows={4}
                  value={homeroomCommentDraft}
                  onChange={e => setHomeroomCommentDraft(e.target.value)}
                  placeholder="Ví dụ: Tuần học nề nếp tốt, các tiết học sôi nổi, chuẩn bị bài chu đáo. Đề nghị lớp tiếp tục phát huy tinh thần thi đua..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-blue-500 text-xs"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                <span className="text-emerald-700 font-black text-base">✓</span>
                <span className="text-emerald-900 font-bold text-xs">
                  Xác nhận ký duyệt điện tử và niêm yết kết quả thi đua tuần cho lớp {currentClass.name}.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherCommentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveHomeroomComment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md cursor-pointer"
                >
                  Lưu & Ký duyệt Sổ đầu bài
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 11. MODAL: IN SỔ ĐẦU BÀI (Print-ready standard view) */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🖨️</span>
                <h3 className="text-lg font-black text-slate-800">
                  Xem trước bản in Sổ đầu bài - {currentClass.name} (Tuần {selectedWeek})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <span>🖨️</span> In ngay
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Layout */}
            <div className="p-6 border border-slate-300 rounded-2xl text-slate-900 font-serif space-y-6 bg-white">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-wider">TRƯỜNG THCS CHU VĂN AN</p>
                  <p className="text-xs font-bold text-slate-700">LỚP: {currentClass.name.toUpperCase()}</p>
                </div>
                <div className="text-center">
                  <h2 className="text-base font-black uppercase tracking-widest text-slate-900">
                    SỔ ĐẦU BÀI TUẦN {selectedWeek}
                  </h2>
                  <p className="text-xs font-medium text-slate-600">
                    Năm học: {selectedYear} • {selectedSemester}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold">GVCN: {currentClass.homeroomTeacher || 'Cô Lê Thị Mai'}</p>
                  <p className="text-slate-600">Cán sự: {currentWeekLogbook.classOfficerName || 'Trần Thị Bích'}</p>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left text-[11px] border-collapse border border-slate-400 font-sans">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-center">
                    <th className="border border-slate-400 p-1.5 w-14">Thứ</th>
                    <th className="border border-slate-400 p-1.5 w-10">Tiết</th>
                    <th className="border border-slate-400 p-1.5 w-28">Môn học</th>
                    <th className="border border-slate-400 p-1.5">Tên bài học / Nội dung công việc</th>
                    <th className="border border-slate-400 p-1.5 w-36">Nhận xét của GV</th>
                    <th className="border border-slate-400 p-1.5 w-12">Sĩ số</th>
                    <th className="border border-slate-400 p-1.5 w-12">Điểm</th>
                    <th className="border border-slate-400 p-1.5 w-24">Giáo viên</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map(p => (
                    <tr key={p.id} className="border-b border-slate-300">
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{p.day}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">{p.period}</td>
                      <td className="border border-slate-300 p-1.5 font-bold">{p.subject}</td>
                      <td className="border border-slate-300 p-1.5">{p.lessonContent}</td>
                      <td className="border border-slate-300 p-1.5 italic text-[10px]">{p.teacherComment || '-'}</td>
                      <td className="border border-slate-300 p-1.5 text-center">{p.absentStudents || 'Đủ'}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-black">{p.score}</td>
                      <td className="border border-slate-300 p-1.5 font-semibold">{p.teacherName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary & Signatures */}
              <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-6 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 mb-1 uppercase tracking-wide">
                    Tổng kết tuần {selectedWeek}:
                  </h4>
                  <p>
                    • Tổng số tiết: <strong>{weekStats.totalPeriods}</strong> • Điểm trung bình tuần:{' '}
                    <strong>{weekStats.averageScore}/10</strong>
                  </p>
                  <p>
                    • Tiết tốt: <strong>{weekStats.goodCount}</strong> • Tiết khá: <strong>{weekStats.fairCount}</strong>
                  </p>
                  <p className="mt-2 italic text-slate-700">
                    Ý kiến GVCN: "{currentWeekLogbook.homeroomTeacherComment || 'Nề nếp học tập tốt.'}"
                  </p>
                </div>

                <div className="grid grid-cols-2 text-center">
                  <div>
                    <p className="font-bold">CÁN SỰ GHI SỔ</p>
                    <p className="text-[10px] text-slate-500 italic mb-10">(Ký và ghi rõ họ tên)</p>
                    <p className="font-bold">{currentWeekLogbook.classOfficerName || 'Trần Thị Bích'}</p>
                  </div>
                  <div>
                    <p className="font-bold">GIÁO VIÊN CHỦ NHIỆM</p>
                    <p className="text-[10px] text-slate-500 italic mb-10">(Ký và duyệt)</p>
                    <p className="font-bold">{currentClass.homeroomTeacher || 'Cô Lê Thị Mai'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
