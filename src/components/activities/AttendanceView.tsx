import React, { useState, useMemo } from 'react';
import {
  User,
  AttendanceRecord,
  ActivityPointRecord
} from '../../types';
import { soundFx } from '../../utils/sound';
import {
  CheckSquare,
  Calendar,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  Filter,
  Search,
  Award,
  Sparkles,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Settings,
  Plus,
  RefreshCw,
  Users
} from 'lucide-react';

interface AttendanceViewProps {
  currentUser: User;
  students: User[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (recs: AttendanceRecord[]) => void;
  onSaveAttendance?: (recs: AttendanceRecord[]) => Promise<void>;
  onAwardAttendance?: (points: ActivityPointRecord[]) => Promise<void>;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentUser,
  students,
  attendanceRecords,
  onUpdateAttendance,
  onSaveAttendance,
  onAwardAttendance,
  onActivityPointSaved
}) => {
  // Check privileges: Teacher, Admin, or Class Officers (lớp trưởng, lớp phó, tổ trưởng...)
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isOfficer =
    currentUser.role === 'student' &&
    currentUser.position &&
    currentUser.position !== 'thành viên';
  const canEdit = isTeacherOrAdmin || isOfficer;

  // View Mode: 'matrix' (Weekly grid), 'stats' (Statistics), 'summary' (Summary table)
  const [viewMode, setViewMode] = useState<'matrix' | 'stats' | 'summary'>('matrix');

  // Filters state
  const [selectedSemester, setSelectedSemester] = useState<'Học kỳ 1' | 'Học kỳ 2'>('Học kỳ 1');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(8); // Month 8 default
  const [selectedWeek, setSelectedWeek] = useState<number>(4); // Week 4 default
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Day of Week for quick daily action
  const [selectedDay, setSelectedDay] = useState<'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7'>('Thứ 6');

  // Local editing notes modal state
  const [activeNoteRecord, setActiveNoteRecord] = useState<{
    studentId: string;
    studentName: string;
    day: string;
    currentNote: string;
    currentStatus: AttendanceRecord['status'];
  } | null>(null);
  const [tempNoteText, setTempNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const daysOfWeek: ('Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7')[] = [
    'Thứ 2',
    'Thứ 3',
    'Thứ 4',
    'Thứ 5',
    'Thứ 6',
    'Thứ 7'
  ];

  // Helper date calculation for week days
  const getDayDate = (day: string, week: number): string => {
    const dayOffsets: Record<string, number> = {
      'Thứ 2': 0,
      'Thứ 3': 1,
      'Thứ 4': 2,
      'Thứ 5': 3,
      'Thứ 6': 4,
      'Thứ 7': 5
    };
    const offset = dayOffsets[day] ?? 0;
    const now = new Date();
    const academicStartYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const augustFirst = new Date(academicStartYear, 7, 1);
    const baseMonday = new Date(academicStartYear, 7, 1 - ((augustFirst.getDay() + 6) % 7));
    const weekDiff = (week - 1) * 7;
    const targetDate = new Date(baseMonday);
    targetDate.setDate(baseMonday.getDate() + weekDiff + offset);

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dateNum = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${dateNum}`;
  };

  // Filter students based on team and search query
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      const matchTeam = selectedTeam === 'all' || st.team === selectedTeam;
      const matchSearch =
        !searchQuery ||
        st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchTeam && matchSearch;
    });
  }, [students, selectedTeam, searchQuery]);

  // Find record for a student on a specific day and week
  const getRecord = (studentId: string, day: string, week: number): AttendanceRecord | undefined => {
    return attendanceRecords.find(
      (r) => r.studentId === studentId && r.weekNumber === week && r.dayOfWeek === day
    );
  };

  // Cycle or toggle status for a student on a specific day
  const handleToggleStatus = async (student: User, day: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7') => {
    if (!canEdit) {
      alert('Bạn không có quyền chỉnh sửa điểm danh! Chỉ Ban cán sự lớp và Giáo viên mới có thể thực hiện.');
      return;
    }

    const existing = getRecord(student.id, day, selectedWeek);
    const dateStr = getDayDate(day, selectedWeek);

    const statusCycle: AttendanceRecord['status'][] = ['Có mặt', 'Vắng có phép', 'Vắng không phép', 'Đi muộn'];
    let nextStatus: AttendanceRecord['status'] = 'Có mặt';

    if (existing) {
      const currentIdx = statusCycle.indexOf(existing.status);
      nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
    }

    soundFx.playClick();

    let changed: AttendanceRecord;
    let updated: AttendanceRecord[];
    if (existing) {
      changed = { ...existing, status: nextStatus, recordedBy: currentUser.fullName };
      const updated = attendanceRecords.map((r) =>
        r.id === existing.id ? changed : r
      );
      if (!onSaveAttendance) return;
      setSaving(true); try { await onSaveAttendance([changed]); onUpdateAttendance(updated); setSaveError(''); }
      catch { setSaveError('Không lưu được trạng thái điểm danh.'); } finally { setSaving(false); }
    } else {
      const classId = student.classId || currentUser.classId;
      if (!classId || !onSaveAttendance) return;
      changed = {
        id: `${classId}_${student.id}_${dateStr}`,
        classId,
        date: dateStr,
        studentId: student.id,
        studentName: student.fullName,
        status: nextStatus,
        weekNumber: selectedWeek,
        monthNumber: Number(dateStr.slice(5, 7)),
        semester: selectedSemester,
        dayOfWeek: day,
        recordedBy: currentUser.fullName
      };
      updated = [...attendanceRecords, changed];
      setSaving(true); try { await onSaveAttendance([changed]); onUpdateAttendance(updated); setSaveError(''); }
      catch { setSaveError('Không lưu được trạng thái điểm danh.'); } finally { setSaving(false); }
    }
  };

  // Batch action: Mark all students present for selected day
  const handleMarkAllPresentDay = async (day: 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6' | 'Thứ 7') => {
    if (!canEdit) return;
    soundFx.playSuccess();
    const dateStr = getDayDate(day, selectedWeek);

    let updatedList = [...attendanceRecords];

    filteredStudents.forEach((st) => {
      const existingIdx = updatedList.findIndex(
        (r) => r.studentId === st.id && r.weekNumber === selectedWeek && r.dayOfWeek === day
      );
      if (existingIdx >= 0) {
        updatedList[existingIdx] = {
          ...updatedList[existingIdx],
          status: 'Có mặt'
        };
      } else {
        const classId = st.classId || currentUser.classId;
        if (!classId) return;
        updatedList.push({
          id: `${classId}_${st.id}_${dateStr}`,
          classId,
          date: dateStr,
          studentId: st.id,
          studentName: st.fullName,
          status: 'Có mặt',
          weekNumber: selectedWeek,
          monthNumber: Number(dateStr.slice(5, 7)),
          semester: selectedSemester,
          dayOfWeek: day,
          recordedBy: currentUser.fullName
        });
      }
    });

    if (!onSaveAttendance) return;
    const changed = updatedList.filter(record => record.date === dateStr && filteredStudents.some(student => student.id === record.studentId));
    setSaving(true);
    try { await onSaveAttendance(changed); onUpdateAttendance(updatedList); setSaveError(''); }
    catch { setSaveError('Không thể lưu điểm danh hàng loạt.'); return; }
    finally { setSaving(false); }
    alert(`Đã đánh dấu TẤT CẢ học sinh CÓ MẶT cho ngày ${day} (Tuần ${selectedWeek})!`);
  };

  // Save note modal submit
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteRecord) return;
    soundFx.playSuccess();

    const { studentId, day } = activeNoteRecord;
    const existing = getRecord(studentId, day, selectedWeek);

    if (existing) {
      const updated = attendanceRecords.map((r) =>
        r.id === existing.id ? { ...r, note: tempNoteText.trim() } : r
      );
      if (!onSaveAttendance) return;
      const changed = { ...existing, note: tempNoteText.trim(), recordedBy: currentUser.fullName };
      setSaving(true); try { await onSaveAttendance([changed]); onUpdateAttendance(updated.map(r => r.id === existing.id ? changed : r)); }
      catch { setSaveError('Không lưu được ghi chú.'); return; } finally { setSaving(false); }
    } else {
      const st = students.find((s) => s.id === studentId);
      if (st) {
        const classId = st.classId || currentUser.classId;
        if (!classId || !onSaveAttendance) return;
        const changed: AttendanceRecord = {
            id: `${classId}_${st.id}_${getDayDate(day, selectedWeek)}`,
            classId,
            date: getDayDate(day, selectedWeek),
            studentId: st.id,
            studentName: st.fullName,
            status: activeNoteRecord.currentStatus,
            note: tempNoteText.trim(),
            weekNumber: selectedWeek,
            monthNumber: Number(getDayDate(day, selectedWeek).slice(5, 7)),
            semester: selectedSemester,
            dayOfWeek: day as any,
            recordedBy: currentUser.fullName
          };
        setSaving(true); try { await onSaveAttendance([changed]); onUpdateAttendance([...attendanceRecords, changed]); }
        catch { setSaveError('Không lưu được ghi chú.'); return; } finally { setSaving(false); }
      }
    }
    setActiveNoteRecord(null);
    setTempNoteText('');
  };

  // Compute Overall Statistics based on selected semester/month/week filters
  const filteredRecordsForStats = useMemo(() => {
    return attendanceRecords.filter((r) => {
      const matchSemester = !r.semester || r.semester === selectedSemester;
      const matchMonth =
        selectedMonth === 'all' || !r.monthNumber || r.monthNumber === selectedMonth;
      const matchWeek = !selectedWeek || !r.weekNumber || r.weekNumber === selectedWeek;
      return matchSemester && matchMonth && matchWeek;
    });
  }, [attendanceRecords, selectedSemester, selectedMonth, selectedWeek]);

  // Overall counts
  const statsCounts = useMemo(() => {
    let present = 0;
    let absentPermission = 0;
    let absentNoPermission = 0;
    let late = 0;

    filteredRecordsForStats.forEach((r) => {
      if (r.status === 'Có mặt') present++;
      else if (r.status === 'Vắng có phép') absentPermission++;
      else if (r.status === 'Vắng không phép') absentNoPermission++;
      else if (r.status === 'Đi muộn') late++;
    });

    const total = present + absentPermission + absentNoPermission + late;
    const rate = total > 0 ? Math.round((present / total) * 1000) / 10 : 100;

    return { total, present, absentPermission, absentNoPermission, late, rate };
  }, [filteredRecordsForStats]);

  // Student level summary computation for summary table
  const studentSummaries = useMemo(() => {
    return filteredStudents.map((st, idx) => {
      const stRecords = attendanceRecords.filter((r) => {
        const matchStudent = r.studentId === st.id;
        const matchSemester = !r.semester || r.semester === selectedSemester;
        const matchMonth =
          selectedMonth === 'all' || !r.monthNumber || r.monthNumber === selectedMonth;
        return matchStudent && matchSemester && matchMonth;
      });

      let p = 0;
      let ap = 0;
      let anp = 0;
      let l = 0;

      stRecords.forEach((r) => {
        if (r.status === 'Có mặt') p++;
        else if (r.status === 'Vắng có phép') ap++;
        else if (r.status === 'Vắng không phép') anp++;
        else if (r.status === 'Đi muộn') l++;
      });

      const totalRecorded = p + ap + anp + l;
      const attendanceRate =
        totalRecorded > 0 ? Math.round((p / totalRecorded) * 1000) / 10 : 100;

      // Estimated training points (+5 for 100% attendance with no late/unexcused absence; -2 per unexcused)
      let estimatedPoints = 0;
      if (totalRecorded > 0 && anp === 0 && l === 0 && ap === 0) {
        estimatedPoints = +5;
      } else {
        estimatedPoints = -2 * anp - 1 * l;
      }

      return {
        st,
        stIndex: idx + 1,
        totalRecorded,
        p,
        ap,
        anp,
        l,
        attendanceRate,
        estimatedPoints,
        records: stRecords
      };
    });
  }, [filteredStudents, attendanceRecords, selectedSemester, selectedMonth]);

  // Award points to all 100% attendance students at once
  const handleRewardPerfectAttendance = async () => {
    if (!isTeacherOrAdmin) {
      alert('Chỉ Giáo viên / Quản trị viên mới có thể cộng điểm thưởng thi đua hàng loạt!');
      return;
    }

    const perfectStudents = studentSummaries.filter(
      (s) => s.totalRecorded > 0 && s.anp === 0 && s.l === 0
    );

    if (perfectStudents.length === 0) {
      alert('Chưa có học sinh nào đạt chuyên cần 100% trong khoảng thời gian này!');
      return;
    }

    if (onAwardAttendance) {
      soundFx.playSuccess();
      const date = new Date().toISOString().substring(0, 10);
      const points: ActivityPointRecord[] = perfectStudents.map(({ st }) => ({
        id: `attendance_${st.classId || currentUser.classId}_${selectedSemester}_${selectedMonth}_${st.id}`.replace(/\s+/g, '_'),
        attemptId: `attendance_${st.classId || currentUser.classId}_${selectedSemester}_${selectedMonth}_${st.id}`.replace(/\s+/g, '_'),
        userId: st.id, studentName: st.fullName, classId: st.classId || currentUser.classId || '',
        activityId: `attendance_${selectedSemester}_${selectedMonth}`, activityName: 'Chuyên cần xuất sắc',
        source: 'attendance', category: 'Điểm HĐ rèn luyện', pointType: 'training_activity', points: 5,
        isCorrect: true, participantName: `Chuyên cần 100% - Tuần ${selectedWeek}`, questionId: `attendance_${selectedWeek}`,
        date, timestamp: new Date().toLocaleString('vi-VN'),
      }));
      setSaving(true);
      try { await onAwardAttendance(points); points.forEach(point => onActivityPointSaved?.(point)); setSaveError(''); }
      catch { setSaveError('Không thể lưu điểm thưởng chuyên cần.'); return; }
      finally { setSaving(false); }

      alert(
        `🎉 Đã thưởng thành công +5 điểm rèn luyện chuyên cần cho ${perfectStudents.length} học sinh đạt 100% chuyên cần!`
      );
    }
  };

  // Helper status badge styling
  const renderStatusBadge = (status: AttendanceRecord['status'], note?: string) => {
    switch (status) {
      case 'Có mặt':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-[11px] shadow-2xs border border-emerald-200"
            title={note || 'Có mặt'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Có mặt</span>
          </span>
        );
      case 'Vắng có phép':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold text-[11px] shadow-2xs border border-amber-200"
            title={note || 'Nghỉ có phép'}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Có phép</span>
          </span>
        );
      case 'Vắng không phép':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 font-bold text-[11px] shadow-2xs border border-rose-200 animate-pulse"
            title={note || 'Vắng không lý do'}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Không phép</span>
          </span>
        );
      case 'Đi muộn':
        return (
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-100 text-orange-800 font-bold text-[11px] shadow-2xs border border-orange-200"
            title={note || 'Đến muộn'}
          >
            <Clock className="w-3.5 h-3.5 text-orange-600" />
            <span>Đi muộn</span>
          </span>
        );
      default:
        return (
          <span className="text-slate-400 font-semibold text-[11px] italic">Chưa tích</span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-amber-100 shadow-sm space-y-6">
      {saveError && <div role="alert" className="fixed top-4 right-4 z-[200] max-w-md rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 shadow-lg">{saveError}<button className="ml-3 underline" onClick={() => setSaveError('')}>Đóng</button></div>}
      {saving && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5 font-bold text-slate-800">Đang lưu điểm danh...</p></div>}
      {/* 1. Header & Context */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                SỔ ĐIỂM DANH & QUẢN LÝ CHUYÊN CẦN LỚP HỌC
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi điểm danh theo ngày trong tuần, xem thống kê tuần cũ/tháng cũ/học kỳ cũ và tổng kết điểm thi đua chuyên cần.
              </p>
            </div>
          </div>
        </div>

        {/* User privilege badge & Save button */}
        <div className="flex items-center gap-3 flex-wrap">
          {canEdit ? (
            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Quyền: {currentUser.role === 'teacher' ? 'Giáo viên' : currentUser.role === 'admin' ? 'Quản trị viên' : `Ban cán sự (${currentUser.position})`}
              </span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 flex items-center gap-1.5">
              <span>👀 Chế độ xem cá nhân / lớp học</span>
            </span>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => {
                soundFx.playSuccess();
                alert('💾 Đã lưu và đồng bộ toàn bộ bảng điểm danh lên hệ thống thành công!');
              }}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-2xl text-xs shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>LƯU ĐIỂM DANH</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Navigation Mode Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setViewMode('matrix');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'matrix'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>📌 Điểm Danh Theo Tuần</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setViewMode('stats');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'stats'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>📊 Thống Kê Chuyên Cần</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setViewMode('summary');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'summary'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>📑 Bảng Tổng Kết Chuyên Cần</span>
          </button>
        </div>

        {/* Quick batch action button for privileged users */}
        {canEdit && viewMode === 'matrix' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">Nhanh cho ngày:</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as any)}
              className="p-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
            >
              {daysOfWeek.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleMarkAllPresentDay(selectedDay)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
              title="Đánh dấu tất cả học sinh có mặt hôm nay"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đánh dấu CÓ MẶT {selectedDay}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Global Filters Bar (Semester, Month, Week, Team, Search) */}
      <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-blue-900 border-b border-blue-100 pb-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Bộ lọc thời gian & Tìm kiếm lịch sử điểm danh:</span>
          </div>
          <span className="text-[11px] font-normal text-slate-500">
            Xem lại tuần cũ, tháng cũ hoặc học kỳ cũ bất kỳ lúc nào
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Semester selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">🎓 Học kỳ:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as any)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 shadow-2xs"
            >
              <option value="Học kỳ 1">Học kỳ 1 (Tuần 1 - 18)</option>
              <option value="Học kỳ 2">Học kỳ 2 (Tuần 19 - 35)</option>
            </select>
          </div>

          {/* Month selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">📅 Tháng:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 shadow-2xs"
            >
              <option value="all">Tất cả các tháng</option>
              <option value={8}>Tháng 8 (Bắt đầu HK1)</option>
              <option value={9}>Tháng 9</option>
              <option value={10}>Tháng 10</option>
              <option value={11}>Tháng 11</option>
              <option value={12}>Tháng 12</option>
              <option value={1}>Tháng 1 (Bắt đầu HK2)</option>
              <option value={2}>Tháng 2</option>
              <option value={3}>Tháng 3</option>
              <option value={4}>Tháng 4</option>
              <option value={5}>Tháng 5</option>
            </select>
          </div>

          {/* Week selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">🗓️ Tuần học:</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-black text-blue-700 shadow-2xs"
            >
              {[...Array(selectedSemester === 'Học kỳ 2' ? 17 : 18)].map((_, i) => {
                const wNum = selectedSemester === 'Học kỳ 2' ? i + 19 : i + 1;
                return (
                  <option key={wNum} value={wNum}>
                    Tuần {wNum} {wNum === 4 ? '(Tuần hiện tại)' : '(Tuần cũ)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Team filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">👥 Lọc theo Tổ:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 shadow-2xs"
            >
              <option value="all">Tất cả các tổ trong lớp</option>
              <option value="Tổ 1">Tổ 1</option>
              <option value="Tổ 2">Tổ 2</option>
              <option value="Tổ 3">Tổ 3</option>
              <option value="Tổ 4">Tổ 4</option>
            </select>
          </div>

          {/* Student search input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">🔍 Tìm học sinh:</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên học sinh..."
                className="w-full p-2 pl-7 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 text-xs shadow-2xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* MODE 1: WEEKLY MATRIX GRID */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">
                📌 BẢNG ĐIỂM DANH TÍCH CHỌN: Tuần {selectedWeek} ({selectedSemester})
              </span>
              <span className="text-slate-500 font-medium">({filteredStudents.length} học sinh)</span>
            </div>

            {/* Instruction legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold flex-wrap">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Có mặt
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Vắng có phép
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Vắng không phép
              </span>
              <span className="flex items-center gap-1 text-orange-700">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Đi muộn
              </span>
            </div>
          </div>

          {/* Grid Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3 w-10 text-center">STT</th>
                  <th className="p-3 min-w-[180px]">Họ và tên học sinh</th>
                  <th className="p-3 w-20 text-center">Tổ</th>

                  {/* Day of week columns */}
                  {daysOfWeek.map((day) => {
                    const dateStr = getDayDate(day, selectedWeek);
                    const formattedDate = dateStr.substring(8, 10) + '/' + dateStr.substring(5, 7);
                    return (
                      <th key={day} className="p-3 text-center min-w-[100px] border-l border-slate-200 bg-slate-50/80">
                        <div className="font-bold text-slate-900">{day}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{formattedDate}</div>
                      </th>
                    );
                  })}

                  <th className="p-3 text-center min-w-[90px] border-l border-slate-200 bg-blue-50/50 text-blue-900">
                    Tổng tuần
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                      Không tìm thấy học sinh phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, idx) => {
                    // Calculate summary counts for this student in this week
                    let weekPresent = 0;
                    let weekAbsent = 0;
                    let weekLate = 0;

                    daysOfWeek.forEach((d) => {
                      const rec = getRecord(st.id, d, selectedWeek);
                      if (rec?.status === 'Có mặt') weekPresent++;
                      else if (rec?.status === 'Vắng có phép' || rec?.status === 'Vắng không phép') weekAbsent++;
                      else if (rec?.status === 'Đi muộn') weekLate++;
                    });

                    return (
                      <tr key={st.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={st.avatar}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{st.fullName}</div>
                              {st.position && st.position !== 'thành viên' && (
                                <div className="text-[10px] text-amber-700 font-bold">{st.position}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-600">{st.team || '-'}</td>

                        {/* Attendance Ticks per Day */}
                        {daysOfWeek.map((day) => {
                          const rec = getRecord(st.id, day, selectedWeek);
                          return (
                            <td key={day} className="p-2 text-center border-l border-slate-100">
                              <div className="flex items-center justify-center gap-1">
                                {canEdit ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(st, day)}
                                    className="cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                    title="Nhấn để đổi trạng thái điểm danh (Có mặt -> Có phép -> Không phép -> Đi muộn)"
                                  >
                                    {rec ? renderStatusBadge(rec.status, rec.note) : renderStatusBadge('Có mặt')}
                                  </button>
                                ) : (
                                  <div>{rec ? renderStatusBadge(rec.status, rec.note) : renderStatusBadge('Có mặt')}</div>
                                )}

                                {/* Note icon button if note exists or for editing note */}
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveNoteRecord({
                                        studentId: st.id,
                                        studentName: st.fullName,
                                        day,
                                        currentNote: rec?.note || '',
                                        currentStatus: rec?.status || 'Có mặt'
                                      });
                                      setTempNoteText(rec?.note || '');
                                    }}
                                    className={`p-1 rounded-md text-[10px] cursor-pointer transition-colors ${
                                      rec?.note
                                        ? 'text-amber-600 hover:bg-amber-100 bg-amber-50 font-bold'
                                        : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                                    }`}
                                    title={rec?.note ? `Ghi chú: ${rec.note}` : 'Thêm ghi chú/lý do'}
                                  >
                                    📝
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}

                        {/* Week summary badge */}
                        <td className="p-3 text-center border-l border-slate-200 bg-blue-50/20 font-bold">
                          <div className="text-[11px] space-y-0.5">
                            <span className="text-emerald-700 font-black">{weekPresent} có mặt</span>
                            {weekAbsent > 0 && (
                              <div className="text-rose-600 text-[10px]">{weekAbsent} vắng</div>
                            )}
                            {weekLate > 0 && (
                              <div className="text-orange-600 text-[10px]">{weekLate} muộn</div>
                            )}
                          </div>
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

      {/* MODE 2: STATISTICS VIEW */}
      {viewMode === 'stats' && (
        <div className="space-y-6">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-md space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-100 flex items-center justify-between">
                <span>Tổng Lượt Điểm Danh</span>
                <Users className="w-4 h-4 text-blue-200" />
              </div>
              <div className="text-2xl font-black">{statsCounts.total} lượt</div>
              <div className="text-[11px] text-blue-100">
                Theo học kỳ & tháng đã chọn
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-md space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center justify-between">
                <span>Tỷ Lệ Có Mặt</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              </div>
              <div className="text-2xl font-black">{statsCounts.rate}%</div>
              <div className="text-[11px] text-emerald-100">
                {statsCounts.present} lượt có mặt đúng giờ
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl text-white shadow-md space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-100 flex items-center justify-between">
                <span>Lượt Vắng Học</span>
                <AlertCircle className="w-4 h-4 text-rose-200" />
              </div>
              <div className="text-2xl font-black">
                {statsCounts.absentPermission + statsCounts.absentNoPermission} lượt
              </div>
              <div className="text-[11px] text-rose-100">
                {statsCounts.absentPermission} có phép / {statsCounts.absentNoPermission} không phép
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl text-white shadow-md space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-100 flex items-center justify-between">
                <span>Lượt Đi Muộn</span>
                <Clock className="w-4 h-4 text-amber-200" />
              </div>
              <div className="text-2xl font-black">{statsCounts.late} lần</div>
              <div className="text-[11px] text-amber-100">Đến sau 7h30 sáng</div>
            </div>
          </div>

          {/* Honor & Warning Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Honor 100% Attendance List */}
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl border border-amber-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 text-white rounded-xl">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-amber-950">
                      🏆 Tuyên Dương Học Sinh Chuyên Cần 100%
                    </h4>
                    <p className="text-xs text-amber-800">
                      Tham gia học tập đầy đủ, đúng giờ, không có nghỉ hay muộn.
                    </p>
                  </div>
                </div>

                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={handleRewardPerfectAttendance}
                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cộng +5Đ Rèn Luyện</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {studentSummaries.filter((s) => s.totalRecorded > 0 && s.anp === 0 && s.l === 0).length === 0 ? (
                  <div className="p-6 text-center text-amber-800/70 text-xs italic">
                    Chưa có học sinh nào đạt 100% chuyên cần trong khoảng thời gian đã chọn.
                  </div>
                ) : (
                  studentSummaries
                    .filter((s) => s.totalRecorded > 0 && s.anp === 0 && s.l === 0)
                    .map((s) => (
                      <div
                        key={s.st.id}
                        className="p-3 bg-white rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={s.st.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="font-bold text-slate-800">{s.st.fullName}</div>
                            <div className="text-[10px] text-slate-500">{s.st.team}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                            100% Chuyên cần
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Warning List for Absences / Lates */}
            <div className="p-5 bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl border border-rose-200 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-500 text-white rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-rose-950">
                    ⚠️ Học Sinh Cần Lưu Ý Chuyên Cần
                  </h4>
                  <p className="text-xs text-rose-800">
                    Danh sách học sinh có lượt nghỉ hoặc đi muộn cần nhắc nhở.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {studentSummaries.filter((s) => s.anp > 0 || s.l > 0 || s.ap > 0).length === 0 ? (
                  <div className="p-6 text-center text-rose-800/70 text-xs italic">
                    🎉 Tuyệt vời! Không có học sinh nào vắng hoặc đi muộn.
                  </div>
                ) : (
                  studentSummaries
                    .filter((s) => s.anp > 0 || s.l > 0 || s.ap > 0)
                    .map((s) => (
                      <div
                        key={s.st.id}
                        className="p-3 bg-white rounded-2xl border border-rose-200/80 flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={s.st.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <div className="font-bold text-slate-800">{s.st.fullName}</div>
                            <div className="text-[10px] text-slate-500">{s.st.team}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-bold">
                          {s.anp > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                              {s.anp} vắng không phép
                            </span>
                          )}
                          {s.l > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">
                              {s.l} đi muộn
                            </span>
                          )}
                          {s.ap > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">
                              {s.ap} vắng có phép
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: SUMMARY TABLE VIEW */}
      {viewMode === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">
                📑 BẢNG TỔNG KẾT KẾT QUẢ ĐIỂM DANH ({selectedSemester} - Tháng {selectedMonth === 'all' ? 'Tất cả' : selectedMonth})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  window.print();
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In Bảng Tổng Kết</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-200">
                  <th className="p-3 w-10 text-center">STT</th>
                  <th className="p-3 min-w-[180px]">Họ và tên</th>
                  <th className="p-3 text-center">Tổ / Chức vụ</th>
                  <th className="p-3 text-center bg-emerald-50 text-emerald-900">Có mặt</th>
                  <th className="p-3 text-center bg-amber-50 text-amber-900">Nghỉ có phép</th>
                  <th className="p-3 text-center bg-rose-50 text-rose-900">Nghỉ không phép</th>
                  <th className="p-3 text-center bg-orange-50 text-orange-900">Đi muộn</th>
                  <th className="p-3 text-center bg-blue-50 text-blue-900">Tỷ lệ chuyên cần</th>
                  <th className="p-3 text-center min-w-[120px]">Điểm rèn luyện</th>
                  <th className="p-3 min-w-[140px]">Đánh giá chuyên cần</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSummaries.map((s) => (
                  <tr key={s.st.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{s.stIndex}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <img src={s.st.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <span>{s.st.fullName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-bold text-slate-700">{s.st.team || '-'}</div>
                      {s.st.position && s.st.position !== 'thành viên' && (
                        <div className="text-[10px] text-amber-700 font-bold">{s.st.position}</div>
                      )}
                    </td>
                    <td className="p-3 text-center font-black text-emerald-700 bg-emerald-50/20">
                      {s.p} buổi
                    </td>
                    <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/20">
                      {s.ap} buổi
                    </td>
                    <td className="p-3 text-center font-black text-rose-600 bg-rose-50/20">
                      {s.anp} buổi
                    </td>
                    <td className="p-3 text-center font-bold text-orange-600 bg-orange-50/20">
                      {s.l} lần
                    </td>
                    <td className="p-3 text-center font-black text-blue-700 bg-blue-50/20">
                      {s.attendanceRate}%
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full font-black text-xs ${
                          s.estimatedPoints > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.estimatedPoints < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {s.estimatedPoints > 0 ? `+${s.estimatedPoints}đ` : `${s.estimatedPoints}đ`}
                      </span>
                    </td>
                    <td className="p-3">
                      {s.attendanceRate === 100 ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <span>🌟</span> Chuyên cần xuất sắc
                        </span>
                      ) : s.anp > 0 ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <span>⚠️</span> Cần kiểm điểm vắng
                        </span>
                      ) : (
                        <span className="text-slate-600 font-semibold">Tốt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}
      {activeNoteRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-800">
                📝 Thêm Ghi Chú Điểm Danh ({activeNoteRecord.day})
              </h4>
              <button
                type="button"
                onClick={() => setActiveNoteRecord(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Học sinh:</label>
                <div className="p-2.5 bg-slate-50 rounded-xl font-bold text-slate-900 text-xs">
                  {activeNoteRecord.studentName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung ghi chú / Lý do vắng / Đi muộn:
                </label>
                <textarea
                  value={tempNoteText}
                  onChange={(e) => setTempNoteText(e.target.value)}
                  placeholder="VD: Có đơn xin nghỉ sốt nhẹ, đi muộn 15 phút do hỏng xe..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveNoteRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Lưu Ghi Chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
