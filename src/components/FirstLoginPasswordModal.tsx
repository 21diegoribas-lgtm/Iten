import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { User } from '../types';

interface FirstLoginPasswordModalProps {
  user: User;
  onComplete: () => void;
  onLogout: () => Promise<void>;
}

export const FirstLoginPasswordModal: React.FC<FirstLoginPasswordModalProps> = ({
  user,
  onComplete,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword === '123456') {
      setError('Vui lòng chọn mật khẩu khác mật khẩu mặc định 123456.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    if (!auth.currentUser || auth.currentUser.uid !== user.id) {
      setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    setIsSaving(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      const idToken = await auth.currentUser.getIdToken(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/users/complete-password-change`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || `Không thể cập nhật trạng thái tài khoản (HTTP ${response.status}).`);
      }
      onComplete();
    } catch (caughtError: unknown) {
      const code = typeof caughtError === 'object' && caughtError !== null && 'code' in caughtError
        ? String((caughtError as { code: unknown }).code)
        : '';

      if (code === 'auth/requires-recent-login') {
        setError('Phiên đăng nhập đã quá hạn. Hãy đăng xuất, đăng nhập lại rồi đổi mật khẩu.');
      } else if (code === 'auth/weak-password') {
        setError('Mật khẩu mới chưa đáp ứng yêu cầu bảo mật.');
      } else if (code === 'auth/network-request-failed') {
        setError('Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.');
      } else if (caughtError instanceof TypeError) {
        setError('Không kết nối được máy chủ. Vui lòng thử lại.');
      } else if (caughtError instanceof Error && caughtError.message) {
        setError(caughtError.message);
      } else {
        console.error('[First Login Password Change Error]', caughtError);
        setError('Không thể đổi mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-amber-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border-2 border-sky-200 bg-white p-5 sm:p-7 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-black text-slate-800">Đổi mật khẩu lần đầu</h1>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          Xin chào {user.fullName}. Hãy tạo mật khẩu riêng trước khi tiếp tục sử dụng hệ thống.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase text-slate-600">Mật khẩu mới</span>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                minLength={6}
                autoComplete="new-password"
                disabled={isSaving}
                required
                className="w-full rounded-2xl border-2 border-sky-200 bg-slate-50 py-3 pl-10 pr-12 text-sm font-bold outline-none transition focus:border-sky-500 focus:bg-white"
                placeholder="Ít nhất 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase text-slate-600">Nhập lại mật khẩu</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              minLength={6}
              autoComplete="new-password"
              disabled={isSaving}
              required
              className="w-full rounded-2xl border-2 border-sky-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-sky-500 focus:bg-white"
              placeholder="Nhập lại mật khẩu mới"
            />
          </label>

          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-2xl bg-sky-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu và tiếp tục'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => void onLogout()}
          disabled={isSaving}
          className="mx-auto mt-4 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" /> Đăng xuất
        </button>
      </div>
    </div>
  );
};
