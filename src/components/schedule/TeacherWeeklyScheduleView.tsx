import React, { useState, useMemo } from 'react';
import {
  User,
  TeacherWeeklyTimetable,
  TeacherDaySchedule,
  TeacherPeriodTask,
  TeacherWorkSchedule
} from '../../types';
import { soundFx } from '../../utils/sound';
import { createDefaultTeacherWeeklyTimetable } from '../../mockData';
import {
  Calendar,
  Clock,
  Edit3,
  Plus,
  Printer,
  FileText,
  CheckCircle,
  Sun,
  Moon,
  Sparkles,
  BookOpen,
  Users,
  AlertCircle,
  Coffee,
  Briefcase,
  Copy,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';

interface TeacherWeeklyScheduleViewProps {
  currentUser: User;
  teachers?: User[];
  teacherWeeklyTimetables?: TeacherWeeklyTimetable[];
  onUpdateTeacherWeeklyTimetables?: (timetables: TeacherWeeklyTimetable[]) => void;
  // Legacy support props if needed
  teacherSchedules?: TeacherWorkSchedule[];
  onAddTeacherSchedule?: (s: TeacherWorkSchedule) => void;
  onUpdateTeacherSchedule?: (s: TeacherWorkSchedule) => void;
  onDeleteTeacherSchedule?: (id: string) => void;
}

const DAYS_OF_WEEK: ('Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7' | 'Chủ Nhật')[] = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật'
];

const MORNING_PERIODS_INFO = [
  { period: 1, time: '07:00 - 07:45' },
  { period: 2, time: '07:50 - 08:35' },
  { period: 3, time: '08:50 - 09:35' },
  { period: 4, time: '09:40 - 10:25' },
  { period: 5, time: '10:30 - 11:15' }
];

const AFTERNOON_PERIODS_INFO = [
  { period: 1, time: '13:30 - 14:15' },
  { period: 2, time: '14:20 - 15:05' },
  { period: 3, time: '15:20 - 16:05' },
  { period: 4, time: '16:10 - 16:55' },
  { period: 5, time: '17:00 - 17:45' }
];

const TASK_TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Lên lớp': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '📚' },
  'Họp hội đồng': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: '👥' },
  'Chấm bài': { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: '✍️' },
  'Chủ nhiệm': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🎖️' },
  'Trực ban': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', icon: '🛡️' },
  'Bồi dưỡng': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🏆' },
  'Khác': { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: '📌' }
};

export const TeacherWeeklyScheduleView: React.FC<TeacherWeeklyScheduleViewProps> = ({
  currentUser,
  teachers = [],
  teacherWeeklyTimetables = [],
  onUpdateTeacherWeeklyTimetables
}) => {
  // Semester & Week Selection
  const [selectedSemester, setSelectedSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const [selectedWeek, setSelectedWeek] = useState<number>(4);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(currentUser.id);
  const [viewMode, setViewMode] = useState<'matrix' | 'cards' | 'agenda'>('matrix');

  // Internal schedule store (in case prop is undefined)
  const [localTimetables, setLocalTimetables] = useState<TeacherWeeklyTimetable[]>(() => {
    if (teacherWeeklyTimetables && teacherWeeklyTimetables.length > 0) {
      return teacherWeeklyTimetables;
    }
    return [
      createDefaultTeacherWeeklyTimetable(currentUser.id, currentUser.fullName, 4, 'Học kỳ 1')
    ];
  });

  // Modal states
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<TeacherWeeklyTimetable | null>(null);
  const [activeEditDayIdx, setActiveEditDayIdx] = useState<number>(0);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickDay, setQuickDay] = useState<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7' | 'Chủ Nhật'>('Thứ 2');
  const [quickSession, setQuickSession] = useState<'morning' | 'afternoon'>('morning');
  const [quickPeriod, setQuickPeriod] = useState<number>(1);
  const [quickTask, setQuickTask] = useState('');
  const [quickLocation, setQuickLocation] = useState('');
  const [quickType, setQuickType] = useState<any>('Lên lớp');

  // Determine active teacher name
  const currentSelectedTeacher = useMemo(() => {
    if (selectedTeacherId === currentUser.id) return currentUser;
    return teachers.find(t => t.id === selectedTeacherId) || currentUser;
  }, [selectedTeacherId, currentUser, teachers]);

  // Max weeks based on semester
  const maxWeeks = selectedSemester === 'Học kỳ 2' ? 17 : 18;

  // Active timetable resolution
  const activeTimetable = useMemo<TeacherWeeklyTimetable>(() => {
    const found = localTimetables.find(
      t =>
        t.teacherId === selectedTeacherId &&
        t.semester === selectedSemester &&
        t.weekNumber === selectedWeek
    );

    if (found) return found;

    // Generate fallback template
    return createDefaultTeacherWeeklyTimetable(
      selectedTeacherId,
      currentSelectedTeacher.fullName,
      selectedWeek,
      selectedSemester
    );
  }, [localTimetables, selectedTeacherId, selectedSemester, selectedWeek, currentSelectedTeacher]);

  // Update schedule handler
  const handleSaveTimetable = (saved: TeacherWeeklyTimetable) => {
    const updated = localTimetables.some(
      t =>
        t.teacherId === saved.teacherId &&
        t.semester === saved.semester &&
        t.weekNumber === saved.weekNumber
    )
      ? localTimetables.map(t =>
          t.teacherId === saved.teacherId &&
          t.semester === saved.semester &&
          t.weekNumber === saved.weekNumber
            ? saved
            : t
        )
      : [...localTimetables, saved];

    setLocalTimetables(updated);
    if (onUpdateTeacherWeeklyTimetables) {
      onUpdateTeacherWeeklyTimetables(updated);
    }
    soundFx.playSuccess();
    setIsEditingModalOpen(false);
  };

  // Open Edit Modal with deep clone
  const handleOpenEdit = () => {
    soundFx.playClick();
    const cloned: TeacherWeeklyTimetable = JSON.parse(JSON.stringify(activeTimetable));
    
    // Ensure all 7 days exist with full 5 morning and 5 afternoon periods
    cloned.days = DAYS_OF_WEEK.map(dName => {
      const existing = cloned.days.find(d => d.day === dName);
      const morningPeriods: TeacherPeriodTask[] = [1, 2, 3, 4, 5].map(pNum => {
        const found = existing?.morningPeriods?.find(p => p.period === pNum);
        return found || { period: pNum, task: '', location: '', type: 'Khác' as const, status: 'Đã lên lịch' as const };
      });
      const afternoonPeriods: TeacherPeriodTask[] = [1, 2, 3, 4, 5].map(pNum => {
        const found = existing?.afternoonPeriods?.find(p => p.period === pNum);
        return found || { period: pNum, task: '', location: '', type: 'Khác' as const, status: 'Đã lên lịch' as const };
      });

      return {
        day: dName,
        date: existing?.date || '',
        morningPeriods,
        afternoonPeriods,
        notes: existing?.notes || ''
      };
    });

    setEditingTimetable(cloned);
    setActiveEditDayIdx(0);
    setIsEditingModalOpen(true);
  };

  // Quick Add Task into specific slot
  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim()) {
      alert('Vui lòng nhập tên công việc hoặc môn học!');
      return;
    }

    const cloned: TeacherWeeklyTimetable = JSON.parse(JSON.stringify(activeTimetable));
    const dayObj = cloned.days.find(d => d.day === quickDay);
    if (dayObj) {
      const targetList = quickSession === 'morning' ? dayObj.morningPeriods : dayObj.afternoonPeriods;
      const targetPeriod = targetList.find(p => p.period === quickPeriod);
      if (targetPeriod) {
        targetPeriod.task = quickTask.trim();
        targetPeriod.location = quickLocation.trim();
        targetPeriod.type = quickType;
        targetPeriod.status = 'Đã lên lịch';
      } else {
        targetList.push({
          period: quickPeriod,
          task: quickTask.trim(),
          location: quickLocation.trim(),
          type: quickType,
          status: 'Đã lên lịch'
        });
      }
    }

    handleSaveTimetable(cloned);
    setQuickTask('');
    setQuickLocation('');
    setIsQuickAddOpen(false);
  };

  // Print schedule
  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  // Reset to default standard template
  const handleResetToTemplate = () => {
    if (confirm('Bạn có muốn nạp lại bảng mẫu chuẩn công tác tuần cho tuần này không?')) {
      const defaultTable = createDefaultTeacherWeeklyTimetable(
        selectedTeacherId,
        currentSelectedTeacher.fullName,
        selectedWeek,
        selectedSemester
      );
      handleSaveTimetable(defaultTable);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-7 border border-amber-100 shadow-sm space-y-6">
      {/* 1. TOP HEADER & FILTER BAR */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-md">
            💼
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2">
              <span>Lịch làm việc cá nhân</span>
              <span className="text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-xl border border-teal-200 text-xs sm:text-sm font-bold">
                {currentSelectedTeacher.fullName} ({currentSelectedTeacher.role === 'admin' ? 'Quản trị viên / BGH' : 'Giáo viên'})
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Bảng thời khóa biểu công tác từ <strong className="text-slate-700">Thứ 2 đến Chủ Nhật</strong> (Buổi sáng, Buổi chiều & Ghi chú công việc).
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setIsQuickAddOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4 text-teal-600" />
            <span>Thêm việc nhanh</span>
          </button>

          {/* Edit Weekly Timetable Button */}
          <button
            type="button"
            onClick={handleOpenEdit}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>Nhập / Sửa Lịch Tuần {selectedWeek}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border border-slate-200 cursor-pointer transition-all shadow-2xs"
            title="In / Xuất lịch làm việc"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. FILTER CONTROLS (SEMESTER, WEEK, TEACHER SELECTOR & VIEW MODES) */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Semester Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-600">Học kỳ:</span>
            <select
              value={selectedSemester}
              onChange={e => {
                const sem = e.target.value as any;
                setSelectedSemester(sem);
                if (sem === 'Học kỳ 2' && selectedWeek > 17) {
                  setSelectedWeek(17);
                }
              }}
              className="bg-transparent text-xs font-bold text-teal-800 focus:outline-none cursor-pointer"
            >
              <option value="Học kỳ 1">Học kỳ 1 (18 tuần)</option>
              <option value="Học kỳ 2">Học kỳ 2 (17 tuần)</option>
            </select>
          </div>

          {/* Week Selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
            <span className="text-xs font-bold text-slate-600">Chọn tuần:</span>
            <select
              value={selectedWeek}
              onChange={e => setSelectedWeek(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-teal-800 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>
                  Tuần {w} {w === 4 ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Admin Switch Teacher */}
          {currentUser.role === 'admin' && teachers.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-600">Xem lịch của:</span>
              <select
                value={selectedTeacherId}
                onChange={e => setSelectedTeacherId(e.target.value)}
                className="bg-transparent text-xs font-bold text-teal-800 focus:outline-none cursor-pointer"
              >
                <option value={currentUser.id}>{currentUser.fullName} (Tôi)</option>
                {teachers
                  .filter(t => t.id !== currentUser.id)
                  .map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.subject || 'GV'})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Apply date info */}
          <span className="text-xs text-slate-500 font-semibold hidden md:inline">
            📅 Áp dụng từ: <strong>{activeTimetable.startDate || '24/08/2026'}</strong>
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-teal-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'matrix'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📊 Bảng tuần</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🗂️ Thẻ từng ngày</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'agenda'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📋 Nhiệm vụ</span>
          </button>
        </div>
      </div>

      {/* 3. WEEKLY FOCUS NOTE BANNER (GHI CHÚ TRỌNG TÂM TOÀN TUẦN) */}
      <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 p-4 rounded-2xl border-2 border-amber-200 shadow-xs flex items-start gap-3">
        <span className="text-xl p-1.5 bg-amber-200/60 rounded-xl text-amber-800">📌</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
              Ghi chú trọng tâm tuần {selectedWeek} ({selectedSemester})
            </h4>
            <button
              type="button"
              onClick={handleOpenEdit}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline cursor-pointer"
            >
              Chỉnh sửa ghi chú
            </button>
          </div>
          <p className="text-xs text-amber-900/90 font-semibold mt-1 leading-relaxed">
            {activeTimetable.weeklyNotes ||
              'Chưa có ghi chú trọng tâm tuần. Bấm vào "Nhập / Sửa Lịch Tuần" để thêm nhiệm vụ chỉ đạo, kế hoạch chuyên môn.'}
          </p>
        </div>
      </div>

      {/* 4. MAIN VIEW COMPONENT */}
      {viewMode === 'matrix' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs bg-white">
          <table className="w-full text-left border-collapse min-w-[980px]">
            {/* Table Header: Days of Week (Monday to Sunday) */}
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold border-b border-slate-200">
                <th className="p-3.5 text-center w-28 bg-slate-200/80 border-r border-slate-200">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Buổi / Tiết</span>
                  </div>
                </th>
                {DAYS_OF_WEEK.map(dName => {
                  const dayObj = activeTimetable.days.find(d => d.day === dName);
                  const isSunday = dName === 'Chủ Nhật';
                  const isToday = dName === 'Thứ 2'; // Demo active indicator
                  return (
                    <th
                      key={dName}
                      className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${
                        isSunday
                          ? 'bg-rose-50 text-rose-800'
                          : isToday
                          ? 'bg-teal-100/70 text-teal-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="font-black text-sm">{dName}</div>
                      {dayObj?.date && (
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                          {dayObj.date}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* ========================================================= */}
              {/* SECTION: BUỔI SÁNG (MORNING SESSION: TIẾT 1 - 5) */}
              {/* ========================================================= */}
              <tr className="bg-amber-100/60 border-y border-amber-200">
                <td
                  colSpan={8}
                  className="px-4 py-2 text-xs font-black text-amber-900 flex items-center gap-2"
                >
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>BUỔI SÁNG (5 TIẾT: 07:00 - 11:15)</span>
                </td>
              </tr>

              {MORNING_PERIODS_INFO.map(pInfo => (
                <tr key={`morning_${pInfo.period}`} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                  {/* Period Time Column */}
                  <td className="p-2.5 bg-amber-50/30 text-center border-r border-slate-200 text-xs font-bold text-slate-700">
                    <div className="font-extrabold text-amber-800">Tiết {pInfo.period}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{pInfo.time}</div>
                  </td>

                  {/* 7 Days Columns */}
                  {DAYS_OF_WEEK.map(dName => {
                    const dayObj = activeTimetable.days.find(d => d.day === dName);
                    const taskObj = dayObj?.morningPeriods?.find(p => p.period === pInfo.period);
                    const hasTask = taskObj && taskObj.task.trim().length > 0;
                    const typeStyle = hasTask ? TASK_TYPE_STYLES[taskObj.type || 'Khác'] || TASK_TYPE_STYLES['Khác'] : null;

                    return (
                      <td
                        key={`${dName}_m_${pInfo.period}`}
                        onClick={() => {
                          setQuickDay(dName);
                          setQuickSession('morning');
                          setQuickPeriod(pInfo.period);
                          setQuickTask(taskObj?.task || '');
                          setQuickLocation(taskObj?.location || '');
                          setQuickType(taskObj?.type || 'Lên lớp');
                          setIsQuickAddOpen(true);
                        }}
                        className={`p-2 border-r border-slate-200 last:border-r-0 align-top cursor-pointer transition-all hover:ring-2 hover:ring-teal-300 hover:ring-inset ${
                          dName === 'Chủ Nhật' ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {hasTask ? (
                          <div
                            className={`p-2 rounded-xl border text-xs space-y-1 transition-all shadow-2xs ${typeStyle?.bg} ${typeStyle?.border}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/80 border border-slate-200/60 text-slate-700">
                                {typeStyle?.icon} {taskObj.type || 'Lên lớp'}
                              </span>
                              {taskObj.status === 'Hoàn thành' && (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </div>
                            <div className={`font-bold text-xs leading-snug ${typeStyle?.text}`}>
                              {taskObj.task}
                            </div>
                            {taskObj.location && (
                              <div className="text-[10px] text-slate-500 font-medium truncate">
                                📍 {taskObj.location}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full min-h-[50px] flex items-center justify-center text-slate-300 hover:text-teal-600 text-[11px] font-semibold">
                            + Thêm
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* ========================================================= */}
              {/* SECTION: BUỔI CHIỀU (AFTERNOON SESSION: TIẾT 1 - 5) */}
              {/* ========================================================= */}
              <tr className="bg-sky-100/60 border-y border-sky-200">
                <td
                  colSpan={8}
                  className="px-4 py-2 text-xs font-black text-sky-900 flex items-center gap-2"
                >
                  <Moon className="w-4 h-4 text-sky-600" />
                  <span>BUỔI CHIỀU (5 TIẾT: 13:30 - 17:45)</span>
                </td>
              </tr>

              {AFTERNOON_PERIODS_INFO.map(pInfo => (
                <tr key={`afternoon_${pInfo.period}`} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                  {/* Period Time Column */}
                  <td className="p-2.5 bg-sky-50/30 text-center border-r border-slate-200 text-xs font-bold text-slate-700">
                    <div className="font-extrabold text-sky-800">Tiết {pInfo.period}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{pInfo.time}</div>
                  </td>

                  {/* 7 Days Columns */}
                  {DAYS_OF_WEEK.map(dName => {
                    const dayObj = activeTimetable.days.find(d => d.day === dName);
                    const taskObj = dayObj?.afternoonPeriods?.find(p => p.period === pInfo.period);
                    const hasTask = taskObj && taskObj.task.trim().length > 0;
                    const typeStyle = hasTask ? TASK_TYPE_STYLES[taskObj.type || 'Khác'] || TASK_TYPE_STYLES['Khác'] : null;

                    return (
                      <td
                        key={`${dName}_a_${pInfo.period}`}
                        onClick={() => {
                          setQuickDay(dName);
                          setQuickSession('afternoon');
                          setQuickPeriod(pInfo.period);
                          setQuickTask(taskObj?.task || '');
                          setQuickLocation(taskObj?.location || '');
                          setQuickType(taskObj?.type || 'Họp hội đồng');
                          setIsQuickAddOpen(true);
                        }}
                        className={`p-2 border-r border-slate-200 last:border-r-0 align-top cursor-pointer transition-all hover:ring-2 hover:ring-sky-300 hover:ring-inset ${
                          dName === 'Chủ Nhật' ? 'bg-rose-50/20' : ''
                        }`}
                      >
                        {hasTask ? (
                          <div
                            className={`p-2 rounded-xl border text-xs space-y-1 transition-all shadow-2xs ${typeStyle?.bg} ${typeStyle?.border}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/80 border border-slate-200/60 text-slate-700">
                                {typeStyle?.icon} {taskObj.type || 'Khác'}
                              </span>
                              {taskObj.status === 'Hoàn thành' && (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </div>
                            <div className={`font-bold text-xs leading-snug ${typeStyle?.text}`}>
                              {taskObj.task}
                            </div>
                            {taskObj.location && (
                              <div className="text-[10px] text-slate-500 font-medium truncate">
                                📍 {taskObj.location}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full min-h-[50px] flex items-center justify-center text-slate-300 hover:text-sky-600 text-[11px] font-semibold">
                            + Thêm
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* ========================================================= */}
              {/* SECTION: PHẦN GHI CHÚ (DAILY NOTES FROM MON TO SUN) */}
              {/* ========================================================= */}
              <tr className="bg-emerald-100/60 border-y border-emerald-200">
                <td
                  colSpan={8}
                  className="px-4 py-2 text-xs font-black text-emerald-900 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>PHẦN GHI CHÚ & LƯU Ý TRONG NGÀY (THỨ 2 - CHỦ NHẬT)</span>
                </td>
              </tr>

              <tr className="bg-emerald-50/20 border-b border-slate-200">
                <td className="p-3 text-center bg-emerald-50/40 border-r border-slate-200 text-xs font-black text-emerald-900">
                  <div className="flex items-center justify-center gap-1">
                    <span>📝 Ghi chú</span>
                  </div>
                </td>

                {DAYS_OF_WEEK.map(dName => {
                  const dayObj = activeTimetable.days.find(d => d.day === dName);
                  const note = dayObj?.notes;
                  return (
                    <td
                      key={`note_${dName}`}
                      onClick={handleOpenEdit}
                      className="p-2.5 border-r border-slate-200 last:border-r-0 align-top cursor-pointer hover:bg-emerald-100/30 transition-colors"
                    >
                      {note && note.trim().length > 0 ? (
                        <div className="bg-white p-2.5 rounded-xl border border-emerald-200/70 text-xs font-medium text-slate-700 shadow-2xs leading-relaxed">
                          <span className="font-bold text-emerald-800 text-[11px] block mb-0.5">
                            📌 Lưu ý:
                          </span>
                          {note}
                        </div>
                      ) : (
                        <div className="text-slate-300 text-center py-2 text-[11px] font-medium italic">
                          (Chưa có ghi chú)
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 5. CARDS VIEW (7 DAILY CARDS WITH MORNING, AFTERNOON & NOTES) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {DAYS_OF_WEEK.map(dName => {
            const dayObj = activeTimetable.days.find(d => d.day === dName);
            const isSunday = dName === 'Chủ Nhật';
            const morningTasks = dayObj?.morningPeriods?.filter(p => p.task.trim().length > 0) || [];
            const afternoonTasks = dayObj?.afternoonPeriods?.filter(p => p.task.trim().length > 0) || [];

            return (
              <div
                key={dName}
                className={`rounded-2xl p-4 border space-y-3 transition-all hover:shadow-md ${
                  isSunday
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-teal-50/30 border-teal-100 hover:border-teal-200'
                }`}
              >
                {/* Card Day Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">📅</span>
                    <h4 className="font-black text-slate-800 text-sm">{dName}</h4>
                  </div>
                  {dayObj?.date && (
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {dayObj.date}
                    </span>
                  )}
                </div>

                {/* Morning Tasks in Card */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Buổi Sáng ({morningTasks.length} tiết/việc)</span>
                  </div>
                  <div className="space-y-1">
                    {morningTasks.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-1 pl-2">Trống tiết / Nghỉ</p>
                    ) : (
                      morningTasks.map(t => {
                        const style = TASK_TYPE_STYLES[t.type || 'Khác'] || TASK_TYPE_STYLES['Khác'];
                        return (
                          <div
                            key={`m_card_${t.period}`}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between ${style.bg} ${style.border}`}
                          >
                            <div>
                              <span className="font-bold text-slate-800">T{t.period}: {t.task}</span>
                              {t.location && (
                                <span className="text-[10px] text-slate-500 block">📍 {t.location}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200">
                              {style.icon} {t.type}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Afternoon Tasks in Card */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <div className="text-[11px] font-black text-sky-800 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-sky-500" />
                    <span>Buổi Chiều ({afternoonTasks.length} tiết/việc)</span>
                  </div>
                  <div className="space-y-1">
                    {afternoonTasks.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-1 pl-2">Trống tiết / Nghỉ</p>
                    ) : (
                      afternoonTasks.map(t => {
                        const style = TASK_TYPE_STYLES[t.type || 'Khác'] || TASK_TYPE_STYLES['Khác'];
                        return (
                          <div
                            key={`a_card_${t.period}`}
                            className={`p-2 rounded-xl border text-xs flex items-center justify-between ${style.bg} ${style.border}`}
                          >
                            <div>
                              <span className="font-bold text-slate-800">T{t.period}: {t.task}</span>
                              {t.location && (
                                <span className="text-[10px] text-slate-500 block">📍 {t.location}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200">
                              {style.icon} {t.type}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Daily Note in Card */}
                <div className="pt-2 border-t border-slate-200/60 space-y-1">
                  <div className="text-[11px] font-black text-emerald-800 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ghi chú công việc:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200 font-medium leading-relaxed">
                    {dayObj?.notes || 'Không có ghi chú đặc biệt.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. AGENDA VIEW (TASK LIST BY DAY) */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {DAYS_OF_WEEK.map(dName => {
            const dayObj = activeTimetable.days.find(d => d.day === dName);
            const allTasks = [
              ...(dayObj?.morningPeriods?.filter(p => p.task.trim().length > 0).map(p => ({ ...p, sessionName: 'Sáng' })) || []),
              ...(dayObj?.afternoonPeriods?.filter(p => p.task.trim().length > 0).map(p => ({ ...p, sessionName: 'Chiều' })) || [])
            ];

            return (
              <div key={dName} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    <h4 className="font-black text-slate-800 text-sm">{dName}</h4>
                    {dayObj?.date && <span className="text-xs text-slate-500 font-semibold">({dayObj.date})</span>}
                  </div>
                  {dayObj?.notes && (
                    <span className="text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      📌 {dayObj.notes}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {allTasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Không có lịch lên lớp hoặc họp trong ngày này.</p>
                  ) : (
                    allTasks.map((t, idx) => {
                      const style = TASK_TYPE_STYLES[t.type || 'Khác'] || TASK_TYPE_STYLES['Khác'];
                      return (
                        <div key={idx} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${style.bg} ${style.border}`}>
                          <div>
                            <div className="font-extrabold text-slate-800">
                              [{t.sessionName} Tiết {t.period}] {t.task}
                            </div>
                            {t.location && <div className="text-[10px] text-slate-500">📍 {t.location}</div>}
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                            {style.icon} {t.type}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. FULL MODAL: EDIT WEEKLY SCHEDULE (THỨ 2 ĐẾN CHỦ NHẬT) */}
      {/* ========================================================================= */}
      {isEditingModalOpen && editingTimetable && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border-4 border-teal-500 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✏️</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    Nhập & Cập nhật Lịch làm việc tuần {editingTimetable.weekNumber} ({editingTimetable.semester})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Giáo viên / Quản trị viên: <strong>{editingTimetable.teacherName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* General Meta Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Học kỳ</label>
                <select
                  value={editingTimetable.semester}
                  onChange={e =>
                    setEditingTimetable({
                      ...editingTimetable,
                      semester: e.target.value as any
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Học kỳ 1">Học kỳ 1</option>
                  <option value="Học kỳ 2">Học kỳ 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số tuần</label>
                <select
                  value={editingTimetable.weekNumber}
                  onChange={e =>
                    setEditingTimetable({
                      ...editingTimetable,
                      weekNumber: Number(e.target.value)
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {Array.from({ length: editingTimetable.semester === 'Học kỳ 2' ? 17 : 18 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Tuần {w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày bắt đầu tuần</label>
                <input
                  type="text"
                  value={editingTimetable.startDate}
                  onChange={e =>
                    setEditingTimetable({
                      ...editingTimetable,
                      startDate: e.target.value
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  placeholder="VD: 24/08/2026"
                />
              </div>
            </div>

            {/* Weekly General Notes Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                📌 Ghi chú trọng tâm toàn tuần:
              </label>
              <textarea
                value={editingTimetable.weeklyNotes || ''}
                onChange={e =>
                  setEditingTimetable({
                    ...editingTimetable,
                    weeklyNotes: e.target.value
                  })
                }
                rows={2}
                placeholder="Nhập nhiệm vụ trọng tâm, kế hoạch chuyên môn, lưu ý BGH..."
                className="w-full p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            {/* DAY SELECTOR TABS (THỨ 2 -> CHỦ NHẬT) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
              {DAYS_OF_WEEK.map((dName, idx) => (
                <button
                  key={dName}
                  type="button"
                  onClick={() => setActiveEditDayIdx(idx)}
                  className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    activeEditDayIdx === idx
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {dName}
                </button>
              ))}
            </div>

            {/* ACTIVE DAY EDITOR */}
            {editingTimetable.days[activeEditDayIdx] && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-teal-900 flex items-center gap-1.5">
                    <span>📅 Chỉnh sửa {editingTimetable.days[activeEditDayIdx].day}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...editingTimetable };
                      updated.days[activeEditDayIdx].morningPeriods.forEach(p => { p.task = ''; p.location = ''; });
                      updated.days[activeEditDayIdx].afternoonPeriods.forEach(p => { p.task = ''; p.location = ''; });
                      updated.days[activeEditDayIdx].notes = '';
                      setEditingTimetable(updated);
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa trắng ngày này
                  </button>
                </div>

                {/* 1. BUỔI SÁNG INPUTS (5 TIẾT) */}
                <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2.5">
                  <h5 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-600" />
                    <span>BUỔI SÁNG (Tiết 1 - 5)</span>
                  </h5>

                  <div className="space-y-2">
                    {editingTimetable.days[activeEditDayIdx].morningPeriods.map((p, pIdx) => (
                      <div key={`edit_m_${p.period}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-amber-100">
                        <span className="sm:col-span-2 text-xs font-black text-amber-800">
                          Tiết {p.period} ({MORNING_PERIODS_INFO[p.period - 1]?.time})
                        </span>
                        <input
                          type="text"
                          value={p.task}
                          placeholder="Tên môn / Công việc (VD: Ngữ Văn 8A1)"
                          onChange={e => {
                            const updated = { ...editingTimetable };
                            updated.days[activeEditDayIdx].morningPeriods[pIdx].task = e.target.value;
                            setEditingTimetable(updated);
                          }}
                          className="sm:col-span-5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        />
                        <input
                          type="text"
                          value={p.location || ''}
                          placeholder="Phòng / Địa điểm"
                          onChange={e => {
                            const updated = { ...editingTimetable };
                            updated.days[activeEditDayIdx].morningPeriods[pIdx].location = e.target.value;
                            setEditingTimetable(updated);
                          }}
                          className="sm:col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        />
                        <select
                          value={p.type || 'Lên lớp'}
                          onChange={e => {
                            const updated = { ...editingTimetable };
                            updated.days[activeEditDayIdx].morningPeriods[pIdx].type = e.target.value as any;
                            setEditingTimetable(updated);
                          }}
                          className="sm:col-span-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        >
                          <option value="Lên lớp">📚 Lên lớp</option>
                          <option value="Họp hội đồng">👥 Họp hội đồng</option>
                          <option value="Chấm bài">✍️ Chấm bài</option>
                          <option value="Chủ nhiệm">🎖️ Chủ nhiệm</option>
                          <option value="Trực ban">🛡️ Trực ban</option>
                          <option value="Bồi dưỡng">🏆 Bồi dưỡng</option>
                          <option value="Khác">📌 Khác</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. BUỔI CHIỀU INPUTS (5 TIẾT) */}
                <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-200 space-y-2.5">
                  <h5 className="text-xs font-black text-sky-900 flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-sky-600" />
                    <span>BUỔI CHIỀU (Tiết 1 - 5)</span>
                  </h5>

                  <div className="space-y-2">
                    {editingTimetable.days[activeEditDayIdx].afternoonPeriods.map((p, pIdx) => (
                      <div key={`edit_a_${p.period}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-sky-100">
                        <span className="sm:col-span-2 text-xs font-black text-sky-800">
                          Tiết {p.period} ({AFTERNOON_PERIODS_INFO[p.period - 1]?.time})
                        </span>
                        <input
                          type="text"
                          value={p.task}
                          placeholder="Tên môn / Công việc (VD: Họp Tổ chuyên môn)"
                          onChange={e => {
                            const updated = { ...editingTimetable };
                            updated.days[activeEditDayIdx].afternoonPeriods[pIdx].task = e.target.value;
                            setEditingTimetable(updated);
                          }}
                          className="sm:col-span-5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        />
                        <input
                          type="text"
                          value={p.location || ''}
                          placeholder="Phòng / Địa điểm"
                          onChange={e => {
                            const updated = { ...editingTimetable };
                            updated.days[activeEditDayIdx].afternoonPeriods[pIdx].location = e.target.value;
                            setEditingTimetable(updated);
                          }}
                          className="sm:col-span-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        />
                        <select
                          value={p.type || 'Khác'}
                          onChange={e => {
                            const updated = { ...editingTimetable };
                            updated.days[activeEditDayIdx].afternoonPeriods[pIdx].type = e.target.value as any;
                            setEditingTimetable(updated);
                          }}
                          className="sm:col-span-3 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        >
                          <option value="Lên lớp">📚 Lên lớp</option>
                          <option value="Họp hội đồng">👥 Họp hội đồng</option>
                          <option value="Chấm bài">✍️ Chấm bài</option>
                          <option value="Chủ nhiệm">🎖️ Chủ nhiệm</option>
                          <option value="Trực ban">🛡️ Trực ban</option>
                          <option value="Bồi dưỡng">🏆 Bồi dưỡng</option>
                          <option value="Khác">📌 Khác</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. PHẦN GHI CHÚ TRONG NGÀY */}
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1.5">
                  <label className="block text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>PHẦN GHI CHÚ / LƯU Ý TRONG NGÀY ({editingTimetable.days[activeEditDayIdx].day}):</span>
                  </label>
                  <textarea
                    value={editingTimetable.days[activeEditDayIdx].notes || ''}
                    onChange={e => {
                      const updated = { ...editingTimetable };
                      updated.days[activeEditDayIdx].notes = e.target.value;
                      setEditingTimetable(updated);
                    }}
                    rows={2}
                    placeholder="Ghi chú nhắc việc, tài liệu cần nộp, lưu ý học sinh..."
                    className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResetToTemplate}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs border border-amber-200 cursor-pointer"
              >
                ⚡ Nạp mẫu TKB chuẩn tuần
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveTimetable(editingTimetable)}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu lịch làm việc</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: QUICK ADD TASK INTO A PERIOD SLOT */}
      {/* ========================================================================= */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-teal-400 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>➕</span> Thêm nhanh công việc vào Lịch
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thứ trong tuần</label>
                  <select
                    value={quickDay}
                    onChange={e => setQuickDay(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buổi & Tiết</label>
                  <div className="flex gap-1.5">
                    <select
                      value={quickSession}
                      onChange={e => setQuickSession(e.target.value as any)}
                      className="w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="morning">Sáng</option>
                      <option value="afternoon">Chiều</option>
                    </select>
                    <select
                      value={quickPeriod}
                      onChange={e => setQuickPeriod(Number(e.target.value))}
                      className="w-1/2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value={1}>Tiết 1</option>
                      <option value={2}>Tiết 2</option>
                      <option value={3}>Tiết 3</option>
                      <option value={4}>Tiết 4</option>
                      <option value={5}>Tiết 5</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên công việc / Môn học:
                </label>
                <input
                  type="text"
                  value={quickTask}
                  onChange={e => setQuickTask(e.target.value)}
                  placeholder="VD: Ngữ Văn 8A1, Họp chuyên môn, Chấm bài..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phòng / Địa điểm</label>
                  <input
                    type="text"
                    value={quickLocation}
                    onChange={e => setQuickLocation(e.target.value)}
                    placeholder="VD: Phòng 201"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại</label>
                  <select
                    value={quickType}
                    onChange={e => setQuickType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Lên lớp">📚 Lên lớp</option>
                    <option value="Họp hội đồng">👥 Họp hội đồng</option>
                    <option value="Chấm bài">✍️ Chấm bài</option>
                    <option value="Chủ nhiệm">🎖️ Chủ nhiệm</option>
                    <option value="Trực ban">🛡️ Trực ban</option>
                    <option value="Bồi dưỡng">🏆 Bồi dưỡng</option>
                    <option value="Khác">📌 Khác</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Lưu vào lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
