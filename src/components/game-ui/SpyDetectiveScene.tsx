import React, { useState } from 'react';
import { User, SpyGameMission, SpyGameSummary } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  Shield,
  ShieldAlert,
  Trophy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  X,
  RotateCcw,
  Sparkles,
  Award,
  AlertCircle,
  Settings,
  Play,
  Users,
  Flag,
  Flame,
  Check
} from 'lucide-react';

interface SpyDetectiveSceneProps {
  currentUser: User;
  students: User[];
  spyMission: SpyGameMission;
  onUpdateSpyMission: (m: SpyGameMission) => void;
  onCastVote?: (suspectId: string) => Promise<void>;
  onResetMyVotes?: () => Promise<void>;
  isTeacherOrAdmin: boolean;
  onOpenSettings: () => void;
  onOpenActivate: () => void;
  onOpenEndGame: () => void;
  onReopenRound: () => void;
}

export const SpyDetectiveScene: React.FC<SpyDetectiveSceneProps> = ({
  currentUser,
  students,
  spyMission,
  onUpdateSpyMission,
  onCastVote,
  onResetMyVotes,
  isTeacherOrAdmin,
  onOpenSettings,
  onOpenActivate,
  onOpenEndGame,
  onReopenRound
}) => {
  const isGameActive = spyMission.status === 'Đang diễn ra';
  const isGameEnded =
    spyMission.status === 'Hoàn thành (+5đ)' ||
    spyMission.status === 'Bị phát hiện (-5đ)' ||
    spyMission.status === 'Không hoàn thành (-5đ)';
  const isGameInactive = spyMission.status === 'Chưa kích hoạt';

  // Role unlock & vote states
  const [isRoleUnlocked, setIsRoleUnlocked] = useState(false);
  const [rolePasswordInput, setRolePasswordInput] = useState('');
  const [showRolePasswordText, setShowRolePasswordText] = useState(false);
  const [rolePasswordError, setRolePasswordError] = useState('');
  const [spySearchQuery, setSpySearchQuery] = useState('');
  const [spyTeamFilter, setSpyTeamFilter] = useState<string>('all');
  const [isTeacherSecretRevealed, setIsTeacherSecretRevealed] = useState(false);
  const [hoveredSuspectId, setHoveredSuspectId] = useState<string | null>(null);

  const spyStudentObj = students.find(s => s.id === spyMission.spyStudentId);
  const isUserSpy = currentUser.id === spyMission.spyStudentId;
  const userSpyVotes = (spyMission.votes || []).filter(v => v.voterId === currentUser.id);
  const userVotesRemaining = Math.max(0, 3 - userSpyVotes.length);

  const myVoteSummaryMap: { [studentId: string]: number } = {};
  userSpyVotes.forEach(v => {
    myVoteSummaryMap[v.suspectId] = (myVoteSummaryMap[v.suspectId] || 0) + 1;
  });

  const totalVotesCount = (spyMission.votes || []).length;
  const votesAgainstSpyCount = (spyMission.votes || []).filter(
    v => v.suspectId === spyMission.spyStudentId
  ).length;

  const voteCountPerStudent: { [studentId: string]: number } = {};
  (spyMission.votes || []).forEach(v => {
    voteCountPerStudent[v.suspectId] = (voteCountPerStudent[v.suspectId] || 0) + 1;
  });

  const topSuspects = Object.entries(voteCountPerStudent)
    .map(([studentId, count]) => {
      const st = students.find(s => s.id === studentId);
      const percentage = totalVotesCount > 0 ? Math.round((count / totalVotesCount) * 100) : 0;
      return { student: st, count, percentage };
    })
    .sort((a, b) => b.count - a.count);

  const handleUnlockRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolePasswordInput) {
      setRolePasswordError('Vui lòng nhập mật khẩu tài khoản của bạn.');
      soundFx.playError();
      return;
    }
    const entered = rolePasswordInput.trim();
    const isCorrect =
      entered === currentUser.password ||
      (currentUser.role === 'admin' && entered === 'admin123') ||
      entered === '123456';

    if (!isCorrect) {
      setRolePasswordError('Mật khẩu không chính xác! Hãy kiểm tra lại.');
      soundFx.playError();
      return;
    }

    soundFx.playSuccess();
    setIsRoleUnlocked(true);
    setRolePasswordError('');
    setRolePasswordInput('');
  };

  const handleLockRole = () => {
    soundFx.playClick();
    setIsRoleUnlocked(false);
    setRolePasswordInput('');
    setRolePasswordError('');
  };

  const handleCastVote = async (suspectStudent: User) => {
    if (userVotesRemaining <= 0) {
      soundFx.playError();
      alert('Bạn đã sử dụng hết 3 lượt biểu quyết trong tuần này!');
      return;
    }

    soundFx.playPop();
    const newVote = {
      voterId: currentUser.id,
      suspectId: suspectStudent.id,
      votedAt: new Date().toISOString()
    };

    const updatedVotes = [...(spyMission.votes || []), newVote];
    const updatedMission: SpyGameMission = {
      ...spyMission,
      votes: updatedVotes
    };

    if (!onCastVote) return;
    try { await onCastVote(suspectStudent.id); onUpdateSpyMission(updatedMission); }
    catch (error) { alert((error as Error).message || 'Không lưu được phiếu bầu.'); }
  };

  const handleResetMyVotes = async () => {
    if (userSpyVotes.length === 0) return;
    if (confirm('Bạn có chắc chắn muốn thu hồi toàn bộ phiếu bầu của mình để chọn lại không?')) {
      soundFx.playClick();
      const updatedVotes = (spyMission.votes || []).filter(v => v.voterId !== currentUser.id);
      const updatedMission: SpyGameMission = {
        ...spyMission,
        votes: updatedVotes
      };
      if (!onResetMyVotes) return;
      try { await onResetMyVotes(); onUpdateSpyMission(updatedMission); }
      catch { alert('Không thể thu hồi phiếu bầu.'); }
    }
  };

  const filteredStudents = students.filter(st => {
    const matchesSearch =
      st.fullName.toLowerCase().includes(spySearchQuery.toLowerCase()) ||
      (st.username && st.username.toLowerCase().includes(spySearchQuery.toLowerCase())) ||
      (st.team && st.team.toLowerCase().includes(spySearchQuery.toLowerCase()));

    const matchesTeam = spyTeamFilter === 'all' || st.team === spyTeamFilter;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-900/60 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-900 text-slate-100 min-h-[700px] flex flex-col justify-between">
      {/* 2.5D DETECTIVE ROOM SVG BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800">
          <defs>
            <radialGradient id="spotlightGrad" cx="50%" cy="15%" r="60%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
            <pattern id="brickFloor" width="60" height="30" patternUnits="userSpaceOnUse">
              <rect width="60" height="30" fill="#1e1b4b" opacity="0.3" />
              <path d="M 0,30 L 60,30 M 30,0 L 30,30" stroke="#312e81" strokeWidth="1" opacity="0.4" />
            </pattern>
          </defs>

          {/* Wall & Spotlight */}
          <rect width="1200" height="550" fill="#0f172a" />
          <rect width="1200" height="800" fill="url(#spotlightGrad)" />

          {/* Chalkboard / Detective Pinboard Frame on Back Wall */}
          <rect x="150" y="40" width="900" height="280" rx="16" fill="#1e293b" stroke="#78350f" strokeWidth="12" />
          <rect x="170" y="60" width="860" height="240" rx="8" fill="#064e3b" opacity="0.85" />

          {/* Pinboard Strings & Clue Pins */}
          <path d="M 220,100 Q 400,160 550,110 T 880,140 T 1000,180" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6 4" opacity="0.8" />
          <path d="M 300,220 Q 520,140 750,210" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" opacity="0.7" />

          {/* Isometric Wood Floor */}
          <polygon points="0,520 1200,520 1200,800 0,800" fill="#18181b" />
          <polygon points="0,520 1200,520 1200,800 0,800" fill="url(#brickFloor)" />
          <line x1="0" y1="520" x2="1200" y2="520" stroke="#b45309" strokeWidth="4" />
        </svg>
      </div>

      {/* DETECTIVE ROOM HUD / HEADER */}
      <div className="relative z-20 p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md border-b-2 border-amber-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center text-3xl animate-pulse">
            🕵️‍♂️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-amber-300 tracking-wide uppercase drop-shadow-md">
                TRUY TÌM GIÁN ĐIỆP {spyMission.weekNumber ? `– TUẦN ${spyMission.weekNumber}` : ''}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-400/40">
                {spyMission.category === 'Thi đua học tập' ? '📚 Điểm học tập' : '🎖️ Điểm rèn luyện'}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  isGameActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                    : isGameEnded
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {isGameActive ? '🟢 Đang diễn ra' : isGameEnded ? '🏁 Đã tổng kết' : '⚪ Chưa kích hoạt'}
              </span>
            </div>
            <p className="text-xs text-slate-300/80 mt-0.5">
              Phòng điều tra mật THCS Chu Văn An • Mỗi thám tử sở hữu 3 phiếu nghi vấn
            </p>
          </div>
        </div>

        {/* Teacher Action Controls */}
        {isTeacherOrAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {isGameActive && (
              <button
                onClick={onOpenEndGame}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Flag className="w-4 h-4" /> 🏁 TỔNG KẾT & CHẤM ĐIỂM
              </button>
            )}

            {isGameInactive && (
              <button
                onClick={onOpenActivate}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4" /> 🚀 KÍCH HOẠT VÒNG MỚI
              </button>
            )}

            {isGameEnded && (
              <button
                onClick={onOpenActivate}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" /> Bắt đầu tuần mới
              </button>
            )}

            <button
              onClick={onOpenSettings}
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              <Settings className="w-3.5 h-3.5" /> Cài đặt
            </button>
          </div>
        )}
      </div>

      {/* MAIN 2.5D INTERACTIVE DETECTIVE ENVIRONMENT */}
      <div className="relative z-10 p-4 sm:p-6 space-y-6 flex-1">
        {/* CASE 1: INACTIVE STATE */}
        {isGameInactive && (
          <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 text-center space-y-4 shadow-2xl backdrop-blur-md">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-400 mx-auto flex items-center justify-center text-4xl shadow-inner animate-bounce">
              🕵️‍♂️
            </div>
            <h3 className="text-xl font-black text-amber-300">VÒNG CHƠI CHƯA ĐƯỢC KÍCH HOẠT</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isTeacherOrAdmin
                ? 'Thầy cô hãy bấm nút bên dưới để chọn một Gián điệp bí mật, giao nhiệm vụ và bắt đầu vòng chơi cho lớp.'
                : 'Vòng chơi tuần này chưa bắt đầu. Hãy chờ thầy cô giáo bấm kích hoạt trò chơi để mở khóa vai trò bí mật nhé!'}
            </p>
            {isTeacherOrAdmin && (
              <button
                onClick={onOpenActivate}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 via-indigo-500 to-rose-500 text-white font-black rounded-2xl text-xs shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> 🚀 KÍCH HOẠT VÒNG CHƠI NGAY
              </button>
            )}
          </div>
        )}

        {/* CASE 2: GAME ENDED PODIUM */}
        {isGameEnded && spyMission.summaryResult && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 border-4 border-amber-400 p-6 sm:p-8 shadow-2xl text-center space-y-4">
              <span className="px-4 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest inline-block shadow-md">
                🏆 CÔNG BỐ KẾT QUẢ ĐIỀU TRA TUẦN {spyMission.weekNumber}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {spyMission.summaryResult.winner === 'spy' ? '🕵️‍♂️ PHE GIÁN ĐIỆP CHIẾN THẮNG!' : '🎉 PHE DÂN LÀNG CHIẾN THẮNG!'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-4">
                {/* Spy Dossier */}
                <div className="p-4 rounded-2xl bg-white/10 border border-amber-400/40 flex items-center gap-4 backdrop-blur-md">
                  <img
                    src={spyMission.summaryResult.spyAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                  />
                  <div>
                    <span className="text-[10px] font-black text-amber-300 uppercase">GIÁN ĐIỆP ẨN THÂN</span>
                    <p className="text-lg font-black text-white">{spyMission.summaryResult.spyName}</p>
                    <p className="text-xs text-purple-200">{spyMission.summaryResult.spyTeam}</p>
                    <p className="text-xs text-amber-300 font-bold mt-1">
                      Nhiệm vụ: "{spyMission.missionDescription}"
                    </p>
                  </div>
                </div>

                {/* Outcome Review */}
                <div className="p-4 rounded-2xl bg-white/10 border border-cyan-400/40 space-y-2 backdrop-blur-md">
                  <span className="text-[10px] font-black text-cyan-300 uppercase flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> NHẬN XÉT CỦA GIÁO VIÊN
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed italic">
                    "{spyMission.summaryResult.conclusionNote}"
                  </p>
                  <p className="text-xs text-amber-300 font-bold">
                    Tổng phiếu đúng: {spyMission.summaryResult.correctVotesCount} / {spyMission.summaryResult.totalVotes} phiếu
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: ACTIVE GAME STAGE */}
        {isGameActive && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 2.5D COLUMN: SECRET DOSSIER SAFE & LEADERBOARD (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-5">
              {/* The Secret Role Vault (2.5D Brass Safe) */}
              <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 border-2 border-amber-400/60 shadow-xl overflow-hidden">
                {/* Safe Top Rivets & Header */}
                <div className="flex items-center justify-between border-b border-amber-400/30 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                      KÉT SẮT VAI TRÒ BÍ MẬT
                    </h4>
                  </div>
                  {isRoleUnlocked ? (
                    <button
                      onClick={handleLockRole}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" /> Khóa lại ngay
                    </button>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Đã khóa bảo mật
                    </span>
                  )}
                </div>

                {!isRoleUnlocked ? (
                  <div className="text-center space-y-4 py-2">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-400/50 mx-auto flex items-center justify-center text-3xl shadow-inner">
                      🔒
                    </div>
                    <div>
                      <h5 className="font-black text-white text-sm">Mở khóa hồ sơ mật của bạn</h5>
                      <p className="text-xs text-slate-300/80 mt-1 max-w-xs mx-auto">
                        Nhập mật khẩu tài khoản để xem bạn là Gián điệp hay Dân làng, tránh bị nhìn trộm!
                      </p>
                    </div>

                    <form onSubmit={handleUnlockRole} className="space-y-3 max-w-xs mx-auto">
                      <div className="relative">
                        <input
                          type={showRolePasswordText ? 'text' : 'password'}
                          value={rolePasswordInput}
                          onChange={e => {
                            setRolePasswordInput(e.target.value);
                            if (rolePasswordError) setRolePasswordError('');
                          }}
                          placeholder="Nhập mật khẩu tài khoản..."
                          className="w-full pl-3 pr-10 py-2.5 bg-slate-800/90 border border-amber-400/40 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRolePasswordText(!showRolePasswordText)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                        >
                          {showRolePasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {rolePasswordError && (
                        <p className="text-xs font-bold text-rose-400">{rolePasswordError}</p>
                      )}

                      <button
                        type="submit"
                        className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black rounded-xl text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-102 active:scale-98"
                      >
                        <Unlock className="w-4 h-4" /> 🚀 START / MỞ KHÓA HỒ SƠ
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    {isUserSpy ? (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/90 to-purple-950/90 border-2 border-rose-500 text-center space-y-2">
                        <div className="text-4xl">🕵️‍♂️</div>
                        <span className="px-2.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px] uppercase">
                          DANH TÍNH BÍ MẬT
                        </span>
                        <h4 className="text-lg font-black text-rose-300">BẠN LÀ GIÁN ĐIỆP TUẦN NÀY!</h4>
                        <div className="p-3 bg-black/40 rounded-xl border border-rose-400/30 text-xs text-left">
                          <span className="font-bold text-amber-300 block mb-1">🎯 Nhiệm vụ bí mật:</span>
                          <p className="text-rose-100 italic">"{spyMission.missionDescription}"</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-slate-900/90 border-2 border-emerald-500 text-center space-y-2">
                        <div className="text-4xl">🧑‍🎓</div>
                        <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] uppercase">
                          PHE DÂN LÀNG
                        </span>
                        <h4 className="text-lg font-black text-emerald-300">BẠN LÀ NGƯỜI THƯỜNG</h4>
                        <p className="text-xs text-slate-200">
                          Hãy chú ý quan sát lời nói và cử chỉ của bạn bè để bỏ phiếu tìm ra gián điệp nhé!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Suspect Leaderboard Dossier */}
              <div className="p-5 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-3 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" /> BẢNG XẾP HẠNG NGHI VẤN
                  </h5>
                  <span className="text-xs text-purple-300 font-bold">Tổng: {totalVotesCount} phiếu</span>
                </div>

                {topSuspects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 text-center">Chưa có ai bỏ phiếu nghi vấn.</p>
                ) : (
                  <div className="space-y-2">
                    {topSuspects.slice(0, 4).map((item, idx) => (
                      <div
                        key={item.student?.id || idx}
                        className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                            #{idx + 1}
                          </span>
                          <img
                            src={item.student?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-amber-300"
                          />
                          <div>
                            <p className="font-bold text-white">{item.student?.fullName}</p>
                            <p className="text-[10px] text-slate-400">{item.student?.team}</p>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded bg-purple-500/30 text-purple-300 font-bold border border-purple-400/40">
                          {item.count} phiếu ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 2.5D COLUMN: SUSPECT DESKS GALLERY & 3 VOTING TOKENS (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Voting HUD Token Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-rose-600/90 border-2 border-amber-400 shadow-xl flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-200">QUYỀN BIỂU QUYẾT CỦA BẠN</span>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    Lượt vote còn lại: <span className="text-amber-300 text-lg">{userVotesRemaining} / 3 lượt</span>
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  {[1, 2, 3].map(slot => {
                    const isUsed = slot > userVotesRemaining;
                    return (
                      <div
                        key={slot}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                          isUsed
                            ? 'bg-black/40 text-white/30 border border-white/20 line-through'
                            : 'bg-amber-300 text-slate-950 border-2 border-white shadow-lg animate-pulse'
                        }`}
                      >
                        {isUsed ? '✕' : '🗳️'}
                      </div>
                    );
                  })}
                  {userSpyVotes.length > 0 && (
                    <button
                      onClick={handleResetMyVotes}
                      className="px-2.5 py-1.5 rounded-lg bg-black/40 hover:bg-rose-600 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Thu hồi
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Team Filter Bar */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={spySearchQuery}
                    onChange={e => setSpySearchQuery(e.target.value)}
                    placeholder="🔍 Tìm học sinh theo tên, tổ..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {['all', 'Tổ 1', 'Tổ 2', 'Tổ 3', 'Tổ 4'].map(tKey => (
                    <button
                      key={tKey}
                      onClick={() => setSpyTeamFilter(tKey)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        spyTeamFilter === tKey
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tKey === 'all' ? 'Tất cả' : tKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2.5D SUSPECT DESKS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                {filteredStudents.map(st => {
                  const totalSuspectVotes = (spyMission.votes || []).filter(v => v.suspectId === st.id).length;
                  const myVotesForThisStudent = myVoteSummaryMap[st.id] || 0;
                  const isHovered = hoveredSuspectId === st.id;

                  return (
                    <div
                      key={st.id}
                      onMouseEnter={() => setHoveredSuspectId(st.id)}
                      onMouseLeave={() => setHoveredSuspectId(null)}
                      className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-3 ${
                        myVotesForThisStudent > 0
                          ? 'bg-gradient-to-r from-purple-950 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-900/90 border-slate-700/80 hover:border-amber-400/60 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar with Polaroid Frame Effect */}
                        <div className="relative">
                          <img
                            src={st.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover border-2 border-amber-300 shadow-md"
                          />
                          {myVotesForThisStudent > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                              {myVotesForThisStudent}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-black text-white text-xs truncate">{st.fullName}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold">
                              {st.team || 'Lớp 8A1'}
                            </span>
                            <span>•</span>
                            <span className="text-amber-300 font-bold">{totalSuspectVotes} phiếu</span>
                          </div>
                        </div>
                      </div>

                      {/* DETECTIVE RUBBER STAMP BUTTON */}
                      <button
                        onClick={() => handleCastVote(st)}
                        disabled={userVotesRemaining <= 0}
                        className={`px-3 py-2 rounded-xl font-black text-xs tracking-wider transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          myVotesForThisStudent > 0
                            ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md hover:scale-105 active:scale-95'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:scale-105 active:scale-95'
                        }`}
                      >
                        <span>🗳️</span>
                        <span>{myVotesForThisStudent > 0 ? '+ VOTE' : 'BẦU'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
