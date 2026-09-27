import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Eye, FileAudio, Plus, Save, Send, Trash2 } from 'lucide-react';
import { auth } from '../../lib/firebase';
import type { ClassItem, User } from '../../types';

type QuestionType = 'multiple_choice' | 'fill_blank' | 'matching' | 'essay' | 'true_false';
type TestMode = 'live' | 'homework';

interface OnlineQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  promptAfter?: string;
  matchingPairs?: Array<{ left: string; right: string; answer?: string }>;
  audioDataUrl?: string;
  audioName?: string;
}

interface OnlineTest {
  id: string;
  title: string;
  description: string;
  classIds: string[];
  createdBy: string;
  createdByName: string;
  mode: TestMode;
  status: 'draft' | 'active' | 'closed';
  startAt: string;
  endAt: string;
  durationMinutes: number;
  questions: OnlineQuestion[];
  mySubmission?: TestSubmission;
}

interface IntegrityEvent { type: string; at: string; detail?: string }
interface TestSubmission {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  classId: string;
  status: 'in_progress' | 'submitted';
  answers: Record<string, string>;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  integrityEvents: IntegrityEvent[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const questionLabels: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm', fill_blank: 'Điền vào chỗ trống', matching: 'Matching', essay: 'Tự luận', true_false: 'Đúng / Sai',
};
const newQuestion = (): OnlineQuestion => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  type: 'multiple_choice', prompt: '', points: 1, options: ['', '', '', ''], correctAnswer: 'A', promptAfter: '', matchingPairs: [{ left: '', right: '', answer: '1' }],
});

const optionLetter = (index: number) => String.fromCharCode(65 + index);
const matchingLetter = (index: number) => String.fromCharCode(97 + index);
const readMatchingAnswer = (value: string, letter: string) =>
  value.split(',').map(part => part.trim().split('-')).find(([key]) => key === letter)?.[1] || '';
const writeMatchingAnswer = (value: string, letter: string, number: string) => {
  const answers = new Map(value.split(',').map(part => part.trim().split('-') as [string, string]).filter(([key]) => key));
  if (number) answers.set(letter, number); else answers.delete(letter);
  return [...answers.entries()].map(([key, answer]) => `${key}-${answer}`).join(',');
};
const summarizeIntegrityEvents = (events: IntegrityEvent[]) => {
  const counts: Record<string, number> = {};
  events.forEach(event => { counts[event.type] = (counts[event.type] || 0) + 1; });
  return Object.entries(counts);
};
const getDeadlineInfo = (test: OnlineTest) => {
  if (!test.endAt) return { expired: false, label: 'Không giới hạn thời gian' };
  const deadline = new Date(test.endAt);
  const difference = deadline.getTime() - Date.now();
  const formatted = deadline.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  if (difference <= 0) return { expired: true, label: `Đã hết hạn (${formatted})` };
  const days = Math.ceil(difference / 86_400_000);
  return { expired: false, label: `Còn ${days} ngày (hạn ${formatted})` };
};
const formatCountdown = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].filter((_, index) => hours > 0 || index > 0).map(value => String(value).padStart(2, '0')).join(':');
};
const getTestDisplayTitle = (test: OnlineTest) =>
  test.mode === 'live' && test.durationMinutes > 0 ? `${test.title} – ${test.durationMinutes} phút` : test.title;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!auth.currentUser) throw new Error('Phiên đăng nhập đã hết hạn.');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error || `Yêu cầu thất bại (HTTP ${response.status}).`);
  return result as T;
}

export const OnlineTestsTab: React.FC<{ currentUser: User; classesList: ClassItem[] }> = ({ currentUser, classesList }) => {
  const isStaff = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const [tests, setTests] = useState<OnlineTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<OnlineTest | null>(null);
  const [taking, setTaking] = useState<OnlineTest | null>(null);
  const [submission, setSubmission] = useState<TestSubmission | null>(null);
  const [reviewing, setReviewing] = useState<OnlineTest | null>(null);
  const [startingTestId, setStartingTestId] = useState('');
  const [updatingTestId, setUpdatingTestId] = useState('');
  const [deletingTestId, setDeletingTestId] = useState('');
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const autoSubmitStarted = useRef(false);
  const [monitorTest, setMonitorTest] = useState<OnlineTest | null>(null);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [expandedWarnings, setExpandedWarnings] = useState('');
  const [message, setMessage] = useState('');

  const loadTests = async () => {
    setLoading(true); setError('');
    try { setTests((await api<{ tests: OnlineTest[] }>('/api/online-tests')).tests); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Không tải được bài kiểm tra.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadTests(); }, [currentUser.id, currentUser.classId]);

  useEffect(() => {
    if (!monitorTest || !isStaff) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const result = await api<{ submissions: TestSubmission[] }>(`/api/online-tests/${monitorTest.id}/submissions`);
        if (!cancelled) setSubmissions(result.submissions);
      } catch (caught) { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Không tải được tiến độ.'); }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [monitorTest?.id, isStaff]);

  const createDraft = () => setEditing({
    id: `test_${Date.now()}`, title: '', description: '', classIds: currentUser.classId ? [currentUser.classId] : [],
    createdBy: currentUser.id, createdByName: currentUser.fullName, mode: 'live', status: 'draft', startAt: '', endAt: '', durationMinutes: 0, questions: [newQuestion()],
  });

  const saveTest = async (activate = false) => {
    if (!editing?.title.trim() || !editing.classIds.length || !editing.questions.length) { setError('Cần nhập tên bài, chọn lớp và có ít nhất một câu hỏi.'); return; }
    const totalPoints = editing.questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0);
    if (editing.questions.some(question => !Number.isFinite(question.points) || question.points <= 0)) { setError('Mỗi câu hỏi phải có số điểm lớn hơn 0.'); return; }
    if (totalPoints > 10) { setError(`Tổng điểm hiện là ${totalPoints}. Tổng điểm của bài kiểm tra không được vượt quá 10.`); return; }
    try {
      const test = { ...editing, startAt: '', status: activate ? 'active' as const : editing.status };
      await api(`/api/online-tests/${test.id}`, { method: 'PUT', body: JSON.stringify(test) });
      setEditing(null); setMessage(activate ? 'Đã phát bài kiểm tra.' : 'Đã lưu bài kiểm tra.'); await loadTests();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không lưu được bài kiểm tra.'); }
  };

  const finishTest = async (test: OnlineTest) => {
    if (updatingTestId) return;
    setUpdatingTestId(test.id);
    try {
      await api(`/api/online-tests/${test.id}`, { method: 'PUT', body: JSON.stringify({ ...test, status: 'closed', startAt: '' }) });
      setMessage(`Đã kết thúc bài kiểm tra “${test.title}”.`);
      await loadTests();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể kết thúc bài kiểm tra.'); }
    finally { setUpdatingTestId(''); }
  };

  const deleteTest = async (test: OnlineTest) => {
    if (deletingTestId) return;
    const accepted = window.confirm(
      `XÓA VĨNH VIỄN BÀI KIỂM TRA\n\nBạn có chắc muốn xóa “${test.title}”?\n\nThao tác này sẽ xóa luôn:\n• Nội dung đề và các câu hỏi\n• Tất cả bài làm của học sinh\n• Điểm số và trạng thái nộp bài\n• Nhật ký cảnh báo trong quá trình làm bài\n\nDữ liệu không thể khôi phục. Chọn OK để xóa, Cancel để giữ lại.`
    );
    if (!accepted) return;
    setDeletingTestId(test.id);
    try {
      const result = await api<{ deletedSubmissions: number }>(`/api/online-tests/${test.id}`, { method: 'DELETE' });
      setMessage(`Đã xóa bài “${test.title}” và ${result.deletedSubmissions} bài làm liên quan.`);
      if (monitorTest?.id === test.id) setMonitorTest(null);
      if (editing?.id === test.id) setEditing(null);
      await loadTests();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể xóa bài kiểm tra.'); }
    finally { setDeletingTestId(''); }
  };

  const attachAudio = (questionId: string, file?: File) => {
    if (!file) return;
    if (file.size > 700_000) { setError('File nghe tối đa 700 KB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setEditing(current => current ? ({ ...current, questions: current.questions.map(q => q.id === questionId ? { ...q, audioDataUrl: String(reader.result), audioName: file.name } : q) }) : current);
    reader.readAsDataURL(file);
  };

  const startTest = async (test: OnlineTest) => {
    if (startingTestId || test.mySubmission?.status === 'submitted') return;
    setStartingTestId(test.id);
    try {
      const result = await api<{ submission: TestSubmission }>(`/api/online-tests/${test.id}/start`, { method: 'POST' });
      autoSubmitStarted.current = false; setSubmission(result.submission); setTaking(test); setError('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể bắt đầu bài.'); }
    finally { setStartingTestId(''); }
  };

  useEffect(() => {
    if (!taking || !submission) return;
    const record = (type: string, detail?: string) => setSubmission(current => current ? ({ ...current, integrityEvents: [...current.integrityEvents, { type, detail, at: new Date().toISOString() }] }) : current);
    const visibility = () => { if (document.hidden) record('Rời tab/chuyển màn hình'); };
    const blur = () => record('Mất tiêu điểm cửa sổ');
    const resize = () => record('Thay đổi kích thước hoặc zoom', `${window.innerWidth}x${window.innerHeight}`);
    const context = (event: MouseEvent) => { event.preventDefault(); record('Nhấp chuột phải'); };
    const clipboard = (event: ClipboardEvent) => { event.preventDefault(); record(event.type === 'copy' ? 'Sao chép' : 'Dán nội dung'); };
    const keydown = (event: KeyboardEvent) => { if (event.key === 'PrintScreen') record('Nhấn phím Print Screen'); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', blur); window.addEventListener('resize', resize);
    document.addEventListener('contextmenu', context); document.addEventListener('copy', clipboard); document.addEventListener('paste', clipboard); document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', blur); window.removeEventListener('resize', resize); document.removeEventListener('contextmenu', context); document.removeEventListener('copy', clipboard); document.removeEventListener('paste', clipboard); document.removeEventListener('keydown', keydown); };
  }, [taking?.id, submission?.id]);

  const saveProgress = async (submit = false) => {
    if (!taking || !submission || savingSubmission) return;
    setSavingSubmission(true);
    try {
      const result = await api<{ submission: TestSubmission }>(`/api/online-tests/${taking.id}/submit`, {
        method: 'POST', body: JSON.stringify({ ...submission, submitted: submit }),
      });
      setSubmission(result.submission);
      if (submit) { setMessage(`Đã nộp bài. Điểm tự động: ${result.submission.score ?? 0}/${result.submission.maxScore ?? 0}`); setTaking(null); await loadTests(); }
      else setMessage('Đã lưu tiến độ.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không lưu được bài làm.'); }
    finally { setSavingSubmission(false); }
  };

  useEffect(() => {
    if (!taking || !submission || taking.mode !== 'live' || taking.durationMinutes <= 0) {
      setRemainingSeconds(null);
      return;
    }
    const expiresAt = new Date(submission.startedAt).getTime() + taking.durationMinutes * 60_000;
    const updateCountdown = () => setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [taking?.id, taking?.mode, taking?.durationMinutes, submission?.id, submission?.startedAt]);

  useEffect(() => {
    if (remainingSeconds !== 0 || !taking || !submission || autoSubmitStarted.current) return;
    autoSubmitStarted.current = true;
    setMessage('Đã hết thời gian. Hệ thống đang tự động nộp bài...');
    void saveProgress(true);
  }, [remainingSeconds, taking?.id, submission?.id]);

  const availableTests = useMemo(() => tests.filter(test => isStaff || test.classIds.includes(currentUser.classId || '')), [tests, isStaff, currentUser.classId]);
  if (loading) return <div className="p-8 text-center font-bold text-indigo-700">Đang tải bài kiểm tra...</div>;

  if (reviewing?.mySubmission) return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-xl"><button onClick={() => setReviewing(null)} className="mb-5 inline-flex items-center rounded-xl border-2 border-white bg-white px-5 py-3 font-black text-emerald-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-emerald-50 active:scale-95">← Quay lại danh sách bài test</button><div><p className="text-sm font-bold opacity-90">Kết quả bài kiểm tra</p><h2 className="text-2xl font-black">{getTestDisplayTitle(reviewing)}</h2><p className="mt-2 font-bold">Điểm tự động: {reviewing.mySubmission.score ?? 0}/{reviewing.mySubmission.maxScore ?? 0}</p></div></div>
      {reviewing.questions.map((question, index) => <div key={question.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><h3 className="font-black">Câu {index + 1}{question.type !== 'fill_blank' ? `: ${question.prompt}` : ''}</h3><span className="text-xs font-bold text-indigo-600">{question.points} điểm</span></div>{question.type === 'fill_blank' && <p className="mt-3">{question.prompt} <b className="rounded-lg bg-amber-100 px-3 py-1 text-amber-800">{reviewing.mySubmission?.answers[question.id] || 'Chưa trả lời'}</b> {question.promptAfter}</p>}{question.type !== 'fill_blank' && <div className="mt-3 rounded-xl bg-slate-50 p-3"><span className="text-xs font-black uppercase text-slate-500">Câu trả lời của em</span><p className="mt-1 font-bold text-slate-800">{reviewing.mySubmission?.answers[question.id] || 'Chưa trả lời'}</p></div>}</div>)}
    </div>
  );

  if (taking && submission) return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-indigo-700 p-6 text-white"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-black">{getTestDisplayTitle(taking)}</h2><p className="text-sm opacity-90">Không rời tab, đổi cửa sổ hoặc dùng chuột phải trong lúc làm bài.</p></div>{remainingSeconds !== null && <div className={`rounded-2xl px-5 py-3 text-center shadow-lg ${remainingSeconds <= 60 ? 'animate-pulse bg-rose-500' : 'bg-white/15'}`}><p className="text-xs font-black uppercase tracking-wider">Thời gian còn lại</p><p className="font-mono text-3xl font-black">{formatCountdown(remainingSeconds)}</p></div>}</div></div>
      {taking.questions.map((question, index) => (
        <div key={question.id} className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="flex justify-between gap-3"><h3 className="font-black">Câu {index + 1}{question.type !== 'fill_blank' ? `: ${question.prompt}` : ''}</h3><span className="text-xs font-bold text-indigo-600">{question.points} điểm</span></div>
          {question.audioDataUrl && <audio controls src={question.audioDataUrl} className="mt-3 w-full" />}
          <div className="mt-4">
            {question.type === 'multiple_choice' && question.options?.map((option, optionIndex) => <label key={optionIndex} className="mb-2 flex cursor-pointer items-start gap-2 rounded-xl border p-3"><input type="radio" name={question.id} checked={submission.answers[question.id] === optionLetter(optionIndex)} onChange={() => setSubmission({ ...submission, answers: { ...submission.answers, [question.id]: optionLetter(optionIndex) } })} /><b>{optionLetter(optionIndex)}.</b><span>{option}</span></label>)}
            {question.type === 'true_false' && <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4"><p className="mb-3 font-black text-slate-700">Câu trả lời của em:</p><div className="grid max-w-md grid-cols-2 gap-3">{['Yes', 'No'].map(option => <label key={option} className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-black ${submission.answers[question.id] === option ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}><input type="radio" className="h-4 w-4" name={question.id} checked={submission.answers[question.id] === option} onChange={() => setSubmission({ ...submission, answers: { ...submission.answers, [question.id]: option } })} /> {option}</label>)}</div></div>}
            {question.type === 'fill_blank' && <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-4"><span>{question.prompt}</span><input size={Math.max(5, (submission.answers[question.id] || '').length + 1)} className="max-w-full rounded-lg border-b-2 border-indigo-400 bg-white px-2 py-2 text-center font-bold outline-none transition-[width] duration-200 focus:border-indigo-600" value={submission.answers[question.id] || ''} onChange={event => setSubmission({ ...submission, answers: { ...submission.answers, [question.id]: event.target.value } })} placeholder="....." /><span>{question.promptAfter}</span></div>}
            {question.type === 'matching' && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="space-y-2">{question.matchingPairs?.map((pair, pairIndex) => { const letter = matchingLetter(pairIndex); return <div key={pairIndex} className="grid min-h-16 grid-cols-[2rem_1fr_5rem] items-center gap-2 rounded-xl border p-3"><b>{letter}.</b><span>{pair.left}</span><select aria-label={`Đáp án cho ${letter}`} className="rounded-lg border p-2" value={readMatchingAnswer(submission.answers[question.id] || '', letter)} onChange={event => setSubmission({ ...submission, answers: { ...submission.answers, [question.id]: writeMatchingAnswer(submission.answers[question.id] || '', letter, event.target.value) } })}><option value="">--</option>{question.matchingPairs?.map((_, numberIndex) => <option key={numberIndex} value={String(numberIndex + 1)}>{numberIndex + 1}</option>)}</select></div>; })}</div><div className="space-y-2">{question.matchingPairs?.map((pair, pairIndex) => <div key={pairIndex} className="flex min-h-16 items-center rounded-xl border bg-slate-50 p-3"><b className="mr-2">{pairIndex + 1}.</b> {pair.right}</div>)}</div></div>}
            {question.type === 'essay' && <textarea rows={6} className="w-full rounded-xl border p-3" value={submission.answers[question.id] || ''} onChange={event => setSubmission({ ...submission, answers: { ...submission.answers, [question.id]: event.target.value } })} />}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-3"><button disabled={savingSubmission} onClick={() => void saveProgress(false)} className="rounded-xl bg-slate-200 px-5 py-3 font-bold transition active:scale-95 disabled:cursor-wait disabled:opacity-60">{savingSubmission ? 'Đang lưu...' : 'Lưu tạm'}</button><button disabled={savingSubmission} onClick={() => void saveProgress(true)} className="rounded-xl bg-indigo-600 px-5 py-3 font-black text-white shadow-md transition hover:bg-indigo-700 active:scale-95 disabled:cursor-wait disabled:opacity-60"><Send className="mr-2 inline h-4 w-4" />{savingSubmission ? 'Đang nộp...' : 'Nộp bài'}</button></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-600 p-4 sm:p-6 text-white shadow-xl"><div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h1 className="text-xl sm:text-2xl font-black">📝 Kiểm tra online</h1><p className="mt-1 text-sm opacity-90">Tạo đề, giao bài, làm bài và theo dõi tiến độ theo lớp.</p></div>{isStaff && <button onClick={createDraft} className="w-full rounded-xl bg-white px-4 py-2.5 font-black text-indigo-700 sm:w-auto"><Plus className="mr-1 inline h-4 w-4" />Tạo bài kiểm tra</button>}</div></div>
      {(error || message) && <div className={`rounded-xl border p-3 text-sm font-bold ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}

      {editing && <div className="space-y-5 rounded-3xl border border-indigo-100 bg-white p-4 shadow-xl sm:p-6">
        <div className="flex flex-col items-stretch gap-3 rounded-2xl bg-gradient-to-r from-indigo-700 to-violet-600 p-4 text-white sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-indigo-100">Thiết lập đề</p><h2 className="text-xl font-black">Soạn bài kiểm tra</h2></div><button onClick={() => setEditing(null)} className="w-full rounded-xl border-2 border-white bg-rose-600 px-4 py-2 font-black text-white shadow-lg transition hover:bg-rose-700 active:scale-95 sm:w-auto">✕ Đóng</button></div>
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2"><label className="space-y-2"><span className="text-xs font-black uppercase text-slate-600">Tên bài kiểm tra</span><input className="w-full rounded-xl border border-slate-300 bg-white p-3 font-bold outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Ví dụ: Kiểm tra 15 phút chương 1" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label><label className="space-y-2"><span className="text-xs font-black uppercase text-slate-600">Hình thức</span><select className="w-full rounded-xl border border-slate-300 bg-white p-3 font-bold outline-none focus:border-indigo-500" value={editing.mode} onChange={e => setEditing({ ...editing, mode: e.target.value as TestMode, startAt: '' })}><option value="live">Kiểm tra trực tiếp</option><option value="homework">Giao về nhà</option></select></label><label className="space-y-2 lg:col-span-2"><span className="text-xs font-black uppercase text-slate-600">Mô tả và hướng dẫn</span><textarea rows={3} className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Nội dung hướng dẫn dành cho học sinh" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></label></div>
        <div className="grid gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 lg:grid-cols-2"><div><p className="text-xs font-black uppercase text-amber-800">Thời gian làm bài</p><p className="mt-2 text-sm font-semibold text-amber-900">Bài bắt đầu ngay khi bấm “Khởi động/Giao bài”. Không cần chọn thời gian bắt đầu.</p>{editing.mode === 'live' && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="space-y-2"><span className="text-xs font-black uppercase text-amber-800">Đếm ngược</span><select className="w-full rounded-xl border border-amber-300 bg-white p-3 font-bold" value={[0, 10, 15, 30, 45].includes(editing.durationMinutes) ? String(editing.durationMinutes) : 'custom'} onChange={event => { const value = event.target.value; setEditing({ ...editing, durationMinutes: value === 'custom' ? 60 : Number(value) }); }}><option value="0">Không giới hạn</option><option value="10">10 phút</option><option value="15">15 phút</option><option value="30">30 phút</option><option value="45">45 phút</option><option value="custom">Tự nhập</option></select></label>{![0, 10, 15, 30, 45].includes(editing.durationMinutes) && <label className="space-y-2"><span className="text-xs font-black uppercase text-amber-800">Số phút tự nhập</span><input type="number" min="1" max="300" className="w-full rounded-xl border border-amber-300 bg-white p-3 font-bold" value={editing.durationMinutes} onChange={event => setEditing({ ...editing, durationMinutes: Math.max(1, Number(event.target.value) || 1) })} /></label>}<p className="text-xs font-semibold text-amber-700 sm:col-span-2">Không giới hạn nghĩa là không có đồng hồ đếm ngược.</p></div>}</div><label className="space-y-2"><span className="text-xs font-black uppercase text-amber-800">Thời gian kết thúc chung (không bắt buộc)</span><input type="datetime-local" className="w-full rounded-xl border border-amber-300 bg-white p-3 font-bold outline-none focus:border-amber-500" value={editing.endAt} onChange={e => setEditing({ ...editing, endAt: e.target.value })} /><span className="block text-xs font-semibold text-amber-700">Để trống nếu muốn bài tồn tại vĩnh viễn. Có thể sửa lại hạn và phát lại bài sau.</span></label></div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><p className="mb-3 text-xs font-black uppercase text-sky-800">Lớp được giao bài</p><div className="flex flex-wrap gap-2">{classesList.map(cls => <label key={cls.id} className={`cursor-pointer rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${editing.classIds.includes(cls.id) ? 'border-sky-500 bg-sky-600 text-white' : 'border-sky-200 bg-white text-slate-700 hover:border-sky-400'}`}><input type="checkbox" className="mr-2" checked={editing.classIds.includes(cls.id)} onChange={e => setEditing({ ...editing, classIds: e.target.checked ? [...editing.classIds, cls.id] : editing.classIds.filter(id => id !== cls.id) })} />{cls.name}</label>)}</div></div>
        <div className={`rounded-2xl border-2 p-4 ${editing.questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0) > 10 ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black">Tổng điểm bài kiểm tra</p><p className="text-xl font-black">{editing.questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0).toFixed(2).replace(/\.00$/, '')}/10</p></div><p className="mt-1 text-xs font-semibold">Giáo viên tự nhập điểm từng câu. Bài phải có ít nhất 1 câu và tổng điểm không vượt quá 10.</p></div>
        {editing.questions.map((q, index) => <div key={q.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3"><div className="flex flex-wrap items-end gap-2"><select className="rounded-xl border p-2" value={q.type} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, type: e.target.value as QuestionType } : item) })}>{Object.entries(questionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="space-y-1"><span className="block text-[10px] font-black uppercase text-slate-600">Điểm câu này</span><input type="number" min="0.25" max="10" step="0.25" className="w-24 rounded-xl border p-2 font-bold" value={q.points} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, points: Number(e.target.value) } : item) })} /></label>{q.type === 'matching' && <span className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-indigo-700">{q.matchingPairs?.length || 0} phần · {q.matchingPairs?.length ? (q.points / q.matchingPairs.length).toFixed(2).replace(/\.00$/, '') : 0} điểm/phần</span>}<button disabled={editing.questions.length === 1} onClick={() => setEditing({ ...editing, questions: editing.questions.filter(item => item.id !== q.id) })} className="ml-auto rounded-lg p-2 text-rose-600 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-30" title={editing.questions.length === 1 ? 'Bài kiểm tra phải có ít nhất 1 câu hỏi' : 'Xóa câu hỏi'}><Trash2 className="h-4 w-4" /></button></div>
          {q.type !== 'fill_blank' && <input className="w-full rounded-xl border p-3" placeholder={q.type === 'matching' ? 'Hướng dẫn matching (có thể để trống)' : `Nội dung câu ${index + 1}`} value={q.prompt} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, prompt: e.target.value } : item) })} />}
          {q.type === 'multiple_choice' && <><div className="grid gap-2 md:grid-cols-2">{q.options?.map((option, optionIndex) => <label key={optionIndex} className="flex items-center gap-2 rounded-xl border bg-white p-2"><b className="w-6 text-indigo-700">{optionLetter(optionIndex)}.</b><input className="min-w-0 flex-1 rounded-lg border p-2" placeholder={`Nội dung đáp án ${optionLetter(optionIndex)}`} value={option} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, options: item.options?.map((old, i) => i === optionIndex ? e.target.value : old) } : item) })} /></label>)}</div><div><p className="mb-2 text-xs font-black uppercase text-slate-600">Chọn đáp án đúng</p><div className="flex gap-2">{(q.options || []).map((_, optionIndex) => { const letter = optionLetter(optionIndex); return <label key={letter} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 font-bold"><input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === letter} onChange={() => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, correctAnswer: letter } : item) })} />{letter}</label>; })}</div></div></>}
          {q.type === 'fill_blank' && <div className="space-y-2"><div className="grid items-end gap-2 md:grid-cols-[1fr_1fr_1fr]"><label className="space-y-1"><span className="text-xs font-black uppercase text-slate-600">Phần đầu câu hỏi</span><input className="w-full rounded-xl border p-3" placeholder="Có thể để trống" value={q.prompt} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, prompt: e.target.value } : item) })} /></label><label className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-2"><span className="mb-1 block text-xs font-black uppercase text-emerald-800">Đáp án đúng</span><input className="w-full rounded-xl border border-emerald-300 bg-white p-3 font-bold" placeholder="Giáo viên nhập đáp án" value={q.correctAnswer || ''} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, correctAnswer: e.target.value } : item) })} /></label><label className="space-y-1"><span className="text-xs font-black uppercase text-slate-600">Phần cuối câu hỏi</span><input className="w-full rounded-xl border p-3" placeholder="Có thể để trống" value={q.promptAfter || ''} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, promptAfter: e.target.value } : item) })} /></label></div><span className="block text-xs font-semibold text-emerald-700">Đáp án đúng ở giữa chỉ giáo viên thấy; khi chấm bài không phân biệt chữ hoa/thường và bỏ khoảng trắng ở đầu, cuối.</span></div>}
          {q.type === 'matching' && <div className="space-y-4"><div className="space-y-2"><div className="grid grid-cols-[2rem_1fr_2rem_1fr] gap-2 px-2 text-xs font-black uppercase text-slate-500"><span></span><span>Cột chữ</span><span></span><span>Cột số</span></div>{(q.matchingPairs || []).map((pair, pairIndex) => <div key={pairIndex} className="grid grid-cols-[2rem_1fr_2rem_1fr] items-center gap-2"><b>{matchingLetter(pairIndex)}.</b><input className="min-w-0 rounded-xl border p-2" value={pair.left} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, matchingPairs: item.matchingPairs?.map((old, i) => i === pairIndex ? { ...old, left: e.target.value } : old) } : item) })} /><b>{pairIndex + 1}.</b><input className="min-w-0 rounded-xl border p-2" value={pair.right} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, matchingPairs: item.matchingPairs?.map((old, i) => i === pairIndex ? { ...old, right: e.target.value } : old) } : item) })} /></div>)}<button type="button" onClick={() => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, matchingPairs: [...(item.matchingPairs || []), { left: '', right: '', answer: '' }] } : item) })} className="rounded-xl border border-dashed border-indigo-300 px-4 py-2 font-bold text-indigo-700"><Plus className="mr-1 inline h-4 w-4" />Thêm cặp matching</button></div><div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4"><p className="mb-3 text-xs font-black uppercase text-emerald-800">Đáp án đúng</p><div className="flex flex-wrap gap-3">{(q.matchingPairs || []).map((pair, pairIndex) => <label key={pairIndex} className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 font-bold"><span>Câu {matchingLetter(pairIndex)} −</span><select className="rounded-lg border p-2" value={pair.answer || ''} onChange={e => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, matchingPairs: item.matchingPairs?.map((old, i) => i === pairIndex ? { ...old, answer: e.target.value } : old) } : item) })}><option value="">Chọn số</option>{(q.matchingPairs || []).map((_, numberIndex) => <option key={numberIndex} value={String(numberIndex + 1)}>{numberIndex + 1}</option>)}</select></label>)}</div></div></div>}
          {q.type === 'true_false' && <div><p className="mb-2 text-xs font-black uppercase text-slate-600">Đáp án đúng</p><div className="flex gap-2">{['Yes', 'No'].map(option => <label key={option} className="flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-4 py-2 font-bold"><input type="radio" name={`correct-${q.id}`} checked={q.correctAnswer === option} onChange={() => setEditing({ ...editing, questions: editing.questions.map(item => item.id === q.id ? { ...item, correctAnswer: option } : item) })} />{option}</label>)}</div></div>}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-bold"><FileAudio className="h-4 w-4" />{q.audioName || 'Đính kèm file nghe'}<input type="file" accept="audio/*" className="hidden" onChange={e => attachAudio(q.id, e.target.files?.[0])} /></label>
        </div>)}
        <button onClick={() => setEditing({ ...editing, questions: [...editing.questions, newQuestion()] })} className="rounded-xl border border-indigo-200 px-4 py-2 font-bold text-indigo-700"><Plus className="mr-1 inline h-4 w-4" />Thêm câu hỏi</button>
        <div className="flex justify-end gap-2"><button onClick={() => void saveTest(false)} className="rounded-xl bg-slate-200 px-5 py-3 font-bold"><Save className="mr-1 inline h-4 w-4" />Lưu nháp</button><button onClick={() => void saveTest(true)} className="rounded-xl bg-indigo-600 px-5 py-3 font-black text-white">Khởi động/Giao bài</button></div>
      </div>}

      {monitorTest && isStaff && <div className="rounded-3xl border bg-white p-4 sm:p-6 shadow-xl"><div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="min-w-0 break-words text-lg sm:text-xl font-black">Theo dõi: {monitorTest.title}</h2><button onClick={() => setMonitorTest(null)} className="w-full rounded-xl bg-rose-600 px-4 py-2 font-black text-white shadow-md transition hover:bg-rose-700 active:scale-95 sm:w-auto">✕ Đóng</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="bg-slate-100"><th className="p-3 text-left">Học sinh</th><th>Trạng thái</th><th>Điểm</th><th>Cảnh báo</th></tr></thead><tbody>{submissions.map(item => <React.Fragment key={item.id}><tr className="border-t"><td className="p-3 font-bold">{item.studentName}</td><td className="text-center">{item.status === 'submitted' ? 'Đã nộp' : 'Đang làm'}</td><td className="text-center">{item.score ?? '-'}/{item.maxScore ?? '-'}</td><td className="p-2 text-center">{item.integrityEvents.length ? <button onClick={() => setExpandedWarnings(current => current === item.id ? '' : item.id)} className="rounded-lg bg-rose-100 px-3 py-2 font-black text-rose-700 transition hover:bg-rose-200 active:scale-95">{expandedWarnings === item.id ? 'Ẩn chi tiết' : `Xem ${item.integrityEvents.length} cảnh báo`}</button> : <span className="font-bold text-emerald-600">Không có</span>}</td></tr>{expandedWarnings === item.id && <tr className="border-t bg-rose-50/60"><td colSpan={4} className="p-4"><p className="mb-3 font-black text-rose-800">Chi tiết sự kiện của {item.studentName}</p><div className="mb-4 flex flex-wrap gap-2">{summarizeIntegrityEvents(item.integrityEvents).map(([type, count]) => <span key={type} className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-bold text-rose-700">{type}: {count} lần</span>)}</div><div className="max-h-64 space-y-2 overflow-y-auto">{item.integrityEvents.slice().reverse().map((event, eventIndex) => <div key={`${event.at}-${eventIndex}`} className="grid gap-1 rounded-xl border bg-white p-3 sm:grid-cols-[10rem_1fr]"><span className="text-xs font-bold text-slate-500">{new Date(event.at).toLocaleString('vi-VN')}</span><span className="font-bold text-slate-800">{event.type}{event.detail ? <small className="ml-2 font-medium text-slate-500">({event.detail})</small> : null}</span></div>)}</div><p className="mt-3 text-xs text-slate-500">Đây là tín hiệu kỹ thuật do trình duyệt ghi nhận, giáo viên cần xem xét trước khi kết luận.</p></td></tr>}</React.Fragment>)}</tbody></table>{!submissions.length && <p className="p-6 text-center text-slate-500">Chưa có học sinh bắt đầu làm bài.</p>}</div></div>}

      <div className="grid gap-4 lg:grid-cols-2">{availableTests.map(test => {
        const deadline = getDeadlineInfo(test);
        const unavailable = test.status !== 'active' || deadline.expired;
        const displayStatus = test.mySubmission?.status === 'submitted' ? 'Đã nộp' : deadline.expired ? 'Hết hạn' : test.status === 'active' ? 'Đang mở' : test.status === 'closed' ? 'Đã kết thúc' : 'Bản nháp';
        return <div key={test.id} className={`rounded-2xl border bg-white p-5 shadow-sm transition ${deadline.expired || test.status === 'closed' ? 'border-slate-200' : 'border-indigo-100 hover:-translate-y-0.5 hover:shadow-md'}`}><div className="flex justify-between gap-3"><div><h3 className="text-lg font-black text-slate-900">{getTestDisplayTitle(test)} <span className={`text-sm ${deadline.expired ? 'text-rose-600' : 'text-indigo-600'}`}>– {deadline.label}</span></h3><p className="mt-1 text-xs font-semibold text-slate-500">{test.mode === 'live' ? 'Kiểm tra trực tiếp' : 'Giao về nhà'} • {test.questions.length} câu • tối đa {test.questions.reduce((sum, question) => sum + question.points, 0)} điểm</p></div><span className={`h-fit shrink-0 rounded-full px-3 py-1 text-xs font-black ${displayStatus === 'Đang mở' ? 'bg-emerald-100 text-emerald-700' : displayStatus === 'Đã nộp' ? 'bg-sky-100 text-sky-700' : displayStatus === 'Hết hạn' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>{displayStatus}</span></div><p className="my-4 text-sm text-slate-600">{test.description || 'Không có mô tả.'}</p>{isStaff ? <div className="flex flex-wrap gap-2"><button onClick={() => setEditing({ ...test, startAt: '' })} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-bold transition hover:bg-slate-200 active:scale-95">Sửa đề / thời hạn</button><button onClick={() => { setMonitorTest(test); setSubmissions([]); }} className="rounded-xl bg-indigo-100 px-3 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-200 active:scale-95"><Eye className="mr-1 inline h-4 w-4" />Theo dõi</button>{test.status === 'active' && <button disabled={updatingTestId === test.id} onClick={() => void finishTest(test)} className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-200 active:scale-95 disabled:opacity-50">{updatingTestId === test.id ? 'Đang kết thúc...' : 'Kết thúc bài'}</button>}<button disabled={deletingTestId === test.id} onClick={() => void deleteTest(test)} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-black text-white transition hover:bg-rose-700 active:scale-95 disabled:cursor-wait disabled:opacity-50"><Trash2 className="mr-1 inline h-4 w-4" />{deletingTestId === test.id ? 'Đang xóa...' : 'Xóa bài'}</button></div> : test.mySubmission?.status === 'submitted' ? <button onClick={() => setReviewing(test)} className="rounded-xl bg-emerald-600 px-4 py-2 font-black text-white shadow-md transition hover:bg-emerald-700 active:scale-95"><Eye className="mr-1 inline h-4 w-4" />Xem kết quả</button> : <button disabled={unavailable || Boolean(startingTestId)} onClick={() => void startTest(test)} className="rounded-xl bg-indigo-600 px-4 py-2 font-black text-white shadow-md transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"><ClipboardCheck className="mr-1 inline h-4 w-4" />{startingTestId === test.id ? 'Đang mở...' : deadline.expired ? 'Đã hết hạn' : test.status === 'closed' ? 'Bài đã kết thúc' : test.mySubmission?.status === 'in_progress' ? 'Tiếp tục làm bài' : 'Vào làm bài'}</button>}</div>;
      })}</div>
      {!availableTests.length && <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500"><CheckCircle2 className="mx-auto mb-2 h-8 w-8" />Chưa có bài kiểm tra nào.</div>}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><AlertTriangle className="mr-1 inline h-4 w-4" />Nhật ký chỉ ghi nhận tín hiệu do trình duyệt cung cấp; không thể xác nhận tuyệt đối thao tác chụp màn hình ở cấp hệ điều hành.</div>
    </div>
  );
};
