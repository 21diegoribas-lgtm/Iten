import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { User, UserRole } from '../types';
import { auth } from '../lib/firebase';
import { getUserById } from '../services/userService';
import { soundFx } from '../utils/sound';
import {
  GraduationCap,
  UserCheck,
  ShieldCheck,
  KeyRound,
  User as UserIcon,
  LogIn,
} from 'lucide-react';

interface LoginModalProps {
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();

    const email = username.trim().toLowerCase();
    const cleanPass = password;

    setError('');
    setIsLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        cleanPass
      );

      const user = await getUserById(credential.user.uid);

      if (!user) {
        await auth.signOut();
        throw new Error('USER_PROFILE_NOT_FOUND');
      }

      if (user.role !== selectedRole) {
        await auth.signOut();
        throw new Error('ROLE_MISMATCH');
      }

      soundFx.playSuccess();
      onLogin(user);
    } catch (err: unknown) {
  console.error('[Login Firebase Error]', err);
  soundFx.playError();

      const code =
        typeof err === 'object' &&
        err !== null &&
        'code' in err
          ? String((err as { code: unknown }).code)
          : '';

      if (code === 'auth/invalid-credential') {
        setError('Email hoặc mật khẩu không đúng!');
      } else if (code === 'auth/user-disabled') {
        setError('Tài khoản này đã bị vô hiệu hóa!');
      } else if (code === 'auth/too-many-requests') {
        setError('Có quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau!');
      } else if (code === 'auth/network-request-failed') {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!');
      } else if (err instanceof Error && err.message === 'USER_PROFILE_NOT_FOUND') {
        setError('Tài khoản chưa có hồ sơ người dùng trong hệ thống!');
      } else if (err instanceof Error && err.message === 'ROLE_MISMATCH') {
        setError('Vai trò tài khoản không phù hợp với lựa chọn hiện tại!');
      } else {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7DD3FC] via-[#BAE6FD] to-[#FED7AA] flex items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute top-10 left-12 w-36 h-36 rounded-full bg-white/40 blur-xl animate-float" />
      <div className="absolute bottom-12 right-12 w-56 h-56 rounded-full bg-amber-200/50 blur-2xl animate-float" />

      <div className="absolute top-1/4 right-1/4 text-6xl opacity-30 select-none animate-bounce-subtle">
        ⭐
      </div>

      <div className="absolute bottom-1/4 left-1/5 text-6xl opacity-30 select-none animate-bounce-subtle">
        🌟
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_16px_40px_rgba(2,132,199,0.25)] border-4 border-[#BAE6FD] p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-7">
          <div className="w-20 h-20 bg-gradient-to-b from-[#38BDF8] via-[#0284C7] to-[#0369A1] rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-[0_6px_0_#075985] border-2 border-white transform -rotate-3 hover:rotate-0 transition-transform mb-3">
            💙
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#0284C7] drop-shadow-[0_1px_0_#FFFFFF] tracking-tight">
            ITEN{' '}
            <span className="text-[#EA580C]">
              - A friendly home for teachers and students
            </span>
          </h1>

          <p className="text-xs font-black text-slate-500 mt-1">
            ✨ Khám phá thế giới học tập & thi đua sôi động
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#E0F2FE]/70 rounded-2xl mb-6 border-2 border-[#BAE6FD]">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setSelectedRole('student');
              setError('');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
              selectedRole === 'student'
                ? 'bg-gradient-to-b from-[#38BDF8] to-[#0284C7] text-white border-2 border-white shadow-[0_3px_0_#0369A1]'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Học sinh
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setSelectedRole('teacher');
              setError('');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
              selectedRole === 'teacher'
                ? 'bg-gradient-to-b from-[#4ADE80] to-[#16A34A] text-white border-2 border-white shadow-[0_3px_0_#14532D]'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Giáo viên
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setSelectedRole('admin');
              setError('');
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
              selectedRole === 'admin'
                ? 'bg-gradient-to-b from-[#FBBF24] to-[#D97706] text-white border-2 border-white shadow-[0_3px_0_#92400E]'
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Quản trị viên
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-1">
              Email
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </span>

              <input
                type="email"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-[#BAE6FD] rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all shadow-inner"
                placeholder="Nhập email..."
                autoComplete="email"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase mb-1">
              Mật khẩu
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>

              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-[#BAE6FD] rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all shadow-inner"
                placeholder="Nhập mật khẩu..."
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-black text-rose-500 text-center animate-shake">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-b from-[#FB923C] to-[#EA580C] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-[0_5px_0_#9A3412] border-2 border-[#FFEDD5] flex items-center justify-center gap-2 transition-all transform active:translate-y-1 cursor-pointer text-sm"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'ĐANG ĐĂNG NHẬP...' : 'VÀO THẾ GIỚI ITEN'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t-2 border-slate-100 text-center">
          <p className="text-xs font-black text-slate-500">
            Đăng nhập bằng tài khoản ITEN đã được cấp.
          </p>
        </div>
      </div>
    </div>
  );
};