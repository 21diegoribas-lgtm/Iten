import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Inbox, Send, Trash2, UserRound } from 'lucide-react';
import { AccountRequest, User } from '../../types';
import { soundFx } from '../../utils/sound';

interface RequestsTabProps {
  currentUser: User;
  requests: AccountRequest[];
  onAdd: (request: AccountRequest) => Promise<void>;
  onSetHandled: (id: string, handled: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const isHandled = (status: AccountRequest['status']) =>
  status === 'Đã xử lý' || status === 'Đã duyệt' || status === 'Từ chối';

const requestLabel = (type: AccountRequest['type']) =>
  type === 'reset_password' ? 'Cấp lại mật khẩu' : 'Thay đổi hồ sơ cá nhân';

export const RequestsTab: React.FC<RequestsTabProps> = ({
  currentUser,
  requests,
  onAdd,
  onSetHandled,
  onDelete,
}) => {
  const isStaff = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const [type, setType] = useState<AccountRequest['type']>('reset_password');
  const [details, setDetails] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'handled'>('all');
  const [busyId, setBusyId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const visibleRequests = useMemo(() => {
    return [...requests]
      .filter(item => filter === 'all' || (filter === 'handled' ? isHandled(item.status) : !isHandled(item.status)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [requests, filter]);

  const pendingCount = requests.filter(item => !isHandled(item.status)).length;
  const handledCount = requests.length - pendingCount;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanDetails = details.trim();
    if (!cleanDetails || isSending) return;

    setIsSending(true);
    setMessage(null);
    try {
      await onAdd({
        id: `ar_${Date.now()}_${currentUser.id}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        role: currentUser.role,
        type,
        details: cleanDetails,
        status: 'Chưa xử lý',
        createdAt: new Date().toISOString(),
        ...(currentUser.classId ? { classId: currentUser.classId } : {}),
        ...(currentUser.className ? { className: currentUser.className } : {}),
      });
      setDetails('');
      setMessage({ kind: 'success', text: 'Yêu cầu đã được gửi thành công.' });
      soundFx.playSuccess();
    } catch (error) {
      console.error('[Send Account Request Error]', error);
      setMessage({ kind: 'error', text: 'Không thể gửi yêu cầu. Vui lòng thử lại.' });
      soundFx.playError();
    } finally {
      setIsSending(false);
    }
  };

  const toggleHandled = async (request: AccountRequest) => {
    if (!isStaff || busyId) return;
    setBusyId(request.id);
    setMessage(null);
    try {
      await onSetHandled(request.id, !isHandled(request.status));
      soundFx.playSuccess();
    } catch (error) {
      console.error('[Update Account Request Error]', error);
      setMessage({ kind: 'error', text: 'Không thể cập nhật trạng thái yêu cầu.' });
      soundFx.playError();
    } finally {
      setBusyId('');
    }
  };

  const remove = async (request: AccountRequest) => {
    if (currentUser.role !== 'admin' || busyId) return;
    if (!window.confirm(`Xóa vĩnh viễn yêu cầu của ${request.userName}?`)) return;
    setBusyId(request.id);
    setMessage(null);
    try {
      await onDelete(request.id);
      soundFx.playSuccess();
    } catch (error) {
      console.error('[Delete Account Request Error]', error);
      setMessage({ kind: 'error', text: 'Không thể xóa yêu cầu.' });
      soundFx.playError();
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      <section className="rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 p-5 sm:p-7 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/80">Trung tâm hỗ trợ</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-black flex items-center gap-2"><Inbox className="w-7 h-7" /> Yêu cầu</h1>
            <p className="mt-2 text-sm font-semibold text-white/90">
              {isStaff ? 'Tiếp nhận và theo dõi tình trạng xử lý yêu cầu.' : 'Gửi yêu cầu và theo dõi kết quả của chính bạn.'}
            </p>
          </div>
          <div className="hidden sm:block text-6xl opacity-30">📨</div>
        </div>
      </section>

      {message && (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${message.kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {message.text}
        </div>
      )}

      {currentUser.role === 'student' && (
        <section className="rounded-3xl border border-pink-100 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><Send className="w-5 h-5 text-pink-500" /> Gửi yêu cầu mới</h2>
          <form onSubmit={submit} className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">Loại yêu cầu</label>
              <select value={type} onChange={event => setType(event.target.value as AccountRequest['type'])} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
                <option value="reset_password">Cấp lại mật khẩu</option>
                <option value="update_profile">Thay đổi hồ sơ cá nhân</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1.5">Nội dung</label>
              <textarea value={details} onChange={event => setDetails(event.target.value)} rows={4} maxLength={1000} required placeholder="Mô tả rõ nội dung bạn cần hỗ trợ..." className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              <div className="mt-1 text-right text-[11px] font-bold text-slate-400">{details.length}/1000</div>
            </div>
            <button type="submit" disabled={isSending || !details.trim()} className="w-full sm:w-fit rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 text-sm font-black text-white shadow-md transition active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
              {isSending ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-800">{isStaff ? 'Danh sách tiếp nhận' : 'Yêu cầu đã gửi'}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">{pendingCount} chưa xử lý • {handledCount} đã xử lý</p>
          </div>
          <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1 text-xs font-black">
            {([['all', 'Tất cả'], ['pending', 'Chưa xử lý'], ['handled', 'Đã xử lý']] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-xl px-3 py-2 transition ${filter === value ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {visibleRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm font-semibold text-slate-400">Chưa có yêu cầu phù hợp.</div>
          ) : visibleRequests.map(request => {
            const handled = isHandled(request.status);
            const busy = busyId === request.id;
            return (
              <article key={request.id} className={`rounded-2xl border p-4 ${handled ? 'border-emerald-100 bg-emerald-50/40' : 'border-amber-200 bg-amber-50/50'}`}>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${handled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {handled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}
                        {handled ? 'Đã xử lý' : 'Chưa xử lý'}
                      </span>
                      <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[11px] font-black text-pink-700">{requestLabel(request.type)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm font-black text-slate-800"><UserRound className="w-4 h-4 text-slate-400" /> {request.userName}</div>
                    {isStaff && <p className="mt-1 text-xs font-semibold text-slate-500">{request.role === 'student' ? `Học sinh${request.className ? ` • ${request.className}` : ''}` : request.role === 'teacher' ? 'Giáo viên' : 'Quản trị viên'}</p>}
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700">{request.details}</p>
                    <p className="mt-3 text-[11px] font-semibold text-slate-400">Gửi lúc {new Date(request.createdAt.replace(' ', 'T')).toLocaleString('vi-VN')}</p>
                    {handled && request.handledBy && <p className="mt-1 text-[11px] font-bold text-emerald-600">Xử lý bởi {request.handledBy}{request.handledAt ? ` • ${new Date(request.handledAt).toLocaleString('vi-VN')}` : ''}</p>}
                  </div>
                  {isStaff && (
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button type="button" disabled={busy} onClick={() => toggleHandled(request)} className={`flex-1 sm:flex-none rounded-xl px-3.5 py-2 text-xs font-black text-white transition active:translate-y-0.5 disabled:opacity-50 ${handled ? 'bg-slate-500 hover:bg-slate-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                        {handled ? 'Đánh dấu chưa xử lý' : 'Đánh dấu đã xử lý'}
                      </button>
                      {currentUser.role === 'admin' && (
                        <button type="button" disabled={busy} onClick={() => remove(request)} className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-rose-600 transition hover:bg-rose-50 active:translate-y-0.5 disabled:opacity-50" title="Xóa yêu cầu"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
