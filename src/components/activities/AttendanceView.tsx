import React, { useEffect, useMemo, useState } from 'react';
import type { ActivityPointRecord, AttendanceRecord, User } from '../../types';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';

interface AttendanceViewProps {
  currentUser: User; students: User[]; attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onSaveAttendance?: (records: AttendanceRecord[]) => Promise<void>;
  onAwardAttendance?: (points: ActivityPointRecord[]) => Promise<void>;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
}
const STATUSES: AttendanceRecord['status'][] = ['Có mặt', 'Đi muộn', 'Vắng có phép', 'Vắng không phép'];
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dayName = (value: string): AttendanceRecord['dayOfWeek'] | undefined =>
  ([undefined, 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'] as const)[new Date(`${value}T00:00:00`).getDay()];

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser, students, attendanceRecords, onUpdateAttendance, onSaveAttendance }) => {
  const today = localDate();
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [date, setDate] = useState(today);
  const [reportMonth, setReportMonth] = useState(today.slice(0, 7));
  const [classId, setClassId] = useState(currentUser.classId || 'all');
  const [team, setTeam] = useState('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [localRecords, setLocalRecords] = useState(attendanceRecords);
  useEffect(() => setLocalRecords(attendanceRecords), [attendanceRecords]);
  const canEdit = currentUser.role === 'admin' || currentUser.role === 'teacher' || (currentUser.role === 'student' && !!currentUser.position && currentUser.position !== 'thành viên');

  const classes = useMemo(() => [...new Map(students.filter(s => s.classId).map(s => [s.classId!, s.className || s.classId!])).entries()], [students]);
  const teams = useMemo(() => [...new Set(students.map(s => s.team).filter(Boolean) as string[])], [students]);
  const shown = useMemo(() => students.filter(s => {
    const q = search.trim().toLocaleLowerCase('vi');
    return (classId === 'all' || s.classId === classId) && (team === 'all' || s.team === team) && (!q || s.fullName.toLocaleLowerCase('vi').includes(q));
  }), [students, classId, team, search]);
  const daily = useMemo(() => new Map(localRecords.filter(r => r.date === date).map(r => [r.studentId, r])), [localRecords, date]);

  const recordFor = (student: User, status: AttendanceRecord['status'], note?: string): AttendanceRecord => {
    const month = Number(date.slice(5, 7));
    return { id: `${student.classId || ''}_${student.id}_${date}`, classId: student.classId || '', date,
      studentId: student.id, studentName: student.fullName, status, note: note?.trim() || undefined, monthNumber: month,
      semester: month >= 8 || month === 1 ? 'Học kỳ 1' : 'Học kỳ 2', dayOfWeek: dayName(date), recordedBy: currentUser.fullName };
  };
  const save = async (changed: AttendanceRecord[]) => {
    setSaving(true); setError('');
    const previous = localRecords;
    const ids = new Set(changed.map(r => r.id));
    const next = [...localRecords.filter(r => !ids.has(r.id)), ...changed];
    setLocalRecords(next);
    onUpdateAttendance(next);
    try {
      await onSaveAttendance?.(changed);
    } catch (reason) {
      setLocalRecords(previous);
      onUpdateAttendance(previous);
      setError(reason instanceof Error ? reason.message : 'Không thể lưu điểm danh.');
    }
    finally { setSaving(false); }
  };
  const moveDate = (amount: number) => { const next = new Date(`${date}T00:00:00`); next.setDate(next.getDate() + amount); setDate(localDate(next)); };
  const marked = shown.filter(s => daily.has(s.id)).length;
  const present = shown.filter(s => daily.get(s.id)?.status === 'Có mặt').length;
  const late = shown.filter(s => daily.get(s.id)?.status === 'Đi muộn').length;
  const excused = shown.filter(s => daily.get(s.id)?.status === 'Vắng có phép').length;
  const unexcused = shown.filter(s => daily.get(s.id)?.status === 'Vắng không phép').length;
  const monthlyAbsences = useMemo(() => {
    const visibleIds = new Set(shown.map(student => student.id));
    const map = new Map<string, { student: User; excusedDates: string[]; unexcusedDates: string[] }>();
    localRecords
      .filter(record => visibleIds.has(record.studentId) && record.date.startsWith(reportMonth) && (record.status === 'Vắng có phép' || record.status === 'Vắng không phép'))
      .forEach(record => {
        const student = shown.find(item => item.id === record.studentId);
        if (!student) return;
        const item = map.get(student.id) || { student, excusedDates: [], unexcusedDates: [] };
        if (record.status === 'Vắng có phép') item.excusedDates.push(record.date);
        else item.unexcusedDates.push(record.date);
        map.set(student.id, item);
      });
    return [...map.values()].sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, 'vi'));
  }, [localRecords, shown, reportMonth]);
  const excusedStudents = monthlyAbsences.filter(item => item.excusedDates.length > 0).length;
  const unexcusedStudents = monthlyAbsences.filter(item => item.unexcusedDates.length > 0).length;
  const excusedAbsenceCount = monthlyAbsences.reduce((total, item) => total + item.excusedDates.length, 0);
  const unexcusedAbsenceCount = monthlyAbsences.reduce((total, item) => total + item.unexcusedDates.length, 0);

  return <div className="bg-white rounded-3xl border border-sky-100 shadow-sm overflow-hidden">
    <header className="p-5 sm:p-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-between gap-4 flex-wrap">
      <div><h2 className="text-xl font-black flex items-center gap-2"><CheckCircle2 className="w-6 h-6" /> Điểm danh hằng ngày</h2><p className="text-xs font-semibold text-white/85 mt-1">Điểm danh hôm nay hoặc xem lại ngày trước.</p></div>
      {view === 'daily' && <div className="flex items-center gap-2 bg-white/15 p-1.5 rounded-2xl">
        <button onClick={() => moveDate(-1)} className="p-2 rounded-xl hover:bg-white/20" title="Ngày trước"><ChevronLeft className="w-4 h-4" /></button>
        <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)} className="px-3 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold" />
        <button onClick={() => moveDate(1)} disabled={date >= today} className="p-2 rounded-xl hover:bg-white/20 disabled:opacity-30" title="Ngày sau"><ChevronRight className="w-4 h-4" /></button>
        {date !== today && <button onClick={() => setDate(today)} className="px-3 py-2 rounded-xl bg-white text-blue-700 text-xs font-black">Hôm nay</button>}
      </div>}
    </header>
    <div className="p-5 sm:p-6 space-y-4">
      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200">
        <button onClick={() => setView('daily')} className={`py-2.5 rounded-xl text-xs font-black ${view === 'daily' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Điểm danh ngày</button>
        <button onClick={() => setView('monthly')} className={`py-2.5 rounded-xl text-xs font-black ${view === 'monthly' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Báo cáo tháng</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs font-bold text-slate-600">Lớp<select value={classId} onChange={e => setClassId(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50">{currentUser.role === 'admin' && <option value="all">Tất cả lớp</option>}{classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Tổ<select value={team} onChange={e => setTeam(e.target.value)} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"><option value="all">Tất cả tổ</option>{teams.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">Tìm học sinh<div className="relative mt-1"><Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nhập họ tên..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs" /></div></label>
      </div>
      {view === 'daily' ? <>
      <div className="flex items-center justify-between gap-3 flex-wrap rounded-2xl bg-sky-50 border border-sky-100 p-3 text-xs font-bold text-slate-700">
        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-sky-600" /> {date === today ? 'Hôm nay' : 'Ngày đã chọn'}: {date}</span>
        <span className="flex items-center gap-1.5 flex-wrap"><Users className="w-4 h-4 text-sky-600" /> Đã điểm danh {marked}/{shown.length} · <span className="text-emerald-700">Có mặt {present}</span> · <span className="text-amber-700">Đi muộn {late}</span> · <span className="text-sky-700">Vắng có phép {excused}</span> · <span className="text-rose-700">Vắng không phép {unexcused}</span></span>
        {canEdit && <button disabled={saving || !shown.length} onClick={() => save(shown.map(s => recordFor(s, 'Có mặt', daily.get(s.id)?.note)))} className="px-3 py-2 rounded-xl bg-emerald-600 text-white disabled:bg-slate-300">Tất cả có mặt</button>}
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">{error}</p>}
      {saving && <p role="status" className="text-xs font-bold text-sky-700">Đang lưu lên hệ thống...</p>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[720px] text-xs">
        <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-left">Học sinh</th><th className="p-3 text-left">Lớp</th><th className="p-3 text-left">Tổ</th><th className="p-3 text-left">Trạng thái</th><th className="p-3 text-left">Ghi chú</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{shown.map(student => { const rec = daily.get(student.id); return <tr key={student.id} className="hover:bg-sky-50/40">
          <td className="p-3 font-bold text-slate-800">{student.fullName}</td><td className="p-3 text-slate-600">{student.className || '—'}</td><td className="p-3 text-slate-600">{student.team || '—'}</td>
          <td className="p-3"><select disabled={!canEdit || saving} value={rec?.status || ''} onChange={e => save([recordFor(student, e.target.value as AttendanceRecord['status'], rec?.note)])} className="w-full p-2 rounded-lg border border-slate-200 bg-white disabled:bg-slate-50"><option value="" disabled>Chưa điểm danh</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></td>
          <td className="p-3"><input disabled={!canEdit || saving || !rec} defaultValue={rec?.note || ''} key={`${rec?.id || student.id}_${rec?.note || ''}`} onBlur={e => rec && e.target.value !== (rec.note || '') && save([recordFor(student, rec.status, e.target.value)])} placeholder={rec ? 'Thêm ghi chú' : 'Chọn trạng thái trước'} className="w-full p-2 rounded-lg border border-slate-200 disabled:bg-slate-50" /></td>
        </tr>; })}{!shown.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-semibold">Không có học sinh phù hợp bộ lọc.</td></tr>}</tbody>
      </table></div>
      </> : <>
        <div className="flex items-end justify-between gap-3 flex-wrap rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
          <label className="text-xs font-bold text-slate-600">Tháng báo cáo<input type="month" value={reportMonth} max={today.slice(0, 7)} onChange={e => setReportMonth(e.target.value)} className="block mt-1 p-2.5 rounded-xl border border-indigo-200 bg-white text-slate-800" /></label>
          <div className="flex gap-3 flex-wrap text-xs font-black"><span className="px-3 py-2 rounded-xl bg-sky-100 text-sky-800">Vắng có phép: {excusedAbsenceCount} lượt ({excusedStudents} học sinh)</span><span className="px-3 py-2 rounded-xl bg-rose-100 text-rose-800">Vắng không phép: {unexcusedAbsenceCount} lượt ({unexcusedStudents} học sinh)</span></div>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[720px] text-xs">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-3 text-left">Học sinh</th><th className="p-3 text-left">Lớp / Tổ</th><th className="p-3 text-left">Vắng có phép</th><th className="p-3 text-left">Vắng không phép</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{monthlyAbsences.map(item => <tr key={item.student.id}>
            <td className="p-3 font-bold text-slate-800">{item.student.fullName}</td><td className="p-3 text-slate-600">{item.student.className || '—'} · {item.student.team || '—'}</td>
            <td className="p-3"><div className="flex gap-1.5 flex-wrap">{item.excusedDates.length ? item.excusedDates.map(value => <span key={value} className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold">{value.slice(8, 10)}/{value.slice(5, 7)}</span>) : '—'}</div></td>
            <td className="p-3"><div className="flex gap-1.5 flex-wrap">{item.unexcusedDates.length ? item.unexcusedDates.map(value => <span key={value} className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold">{value.slice(8, 10)}/{value.slice(5, 7)}</span>) : '—'}</div></td>
          </tr>)}{!monthlyAbsences.length && <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-semibold">Không có học sinh vắng trong tháng và bộ lọc đã chọn.</td></tr>}</tbody>
        </table></div>
      </>}
    </div>
  </div>;
};
