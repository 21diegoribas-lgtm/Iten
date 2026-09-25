import React from 'react';
import {
  User,
  KeyboardHeroTask,
  KeyboardHeroSubmission
} from '../../types';
import { soundFx } from '../../utils/sound';
import {
  Clock,
  Award,
  Sparkles,
  Trophy,
  Timer,
  Settings,
  Send,
  Heart,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BookOpen,
  Edit3,
  UserCheck
} from 'lucide-react';

interface KeyboardHeroSceneProps {
  currentUser: User;
  students: User[];
  keyboardTask: KeyboardHeroTask;
  isTeacherOrAdmin: boolean;
  activeTab: 'practice' | 'submissions' | 'leaderboard';
  setActiveTab: (tab: 'practice' | 'submissions' | 'leaderboard') => void;
  writingContent: string;
  isWritingStarted: boolean;
  elapsedSeconds: number;
  remainingSeconds: number;
  wordCount: number;
  handleWritingChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmitTask: () => void;
  mySubmission?: KeyboardHeroSubmission;
  isExpired: boolean;
  handleToggleLike: (subId: string) => void;
  handleAddComment: (subId: string) => void;
  commentInputMap: { [subId: string]: string };
  setCommentInputMap: React.Dispatch<React.SetStateAction<{ [subId: string]: string }>>;
  onOpenTeacherTaskModal: () => void;
  onOpenGradingModal: (sub: KeyboardHeroSubmission) => void;
  teacherFilterStatus: 'all' | 'submitted' | 'not_submitted' | 'graded';
  setTeacherFilterStatus: (status: 'all' | 'submitted' | 'not_submitted' | 'graded') => void;
  teacherSearchQuery: string;
  setTeacherSearchQuery: (q: string) => void;
  scoreLeaderboard: KeyboardHeroSubmission[];
}

export const KeyboardHeroScene: React.FC<KeyboardHeroSceneProps> = ({
  currentUser,
  students,
  keyboardTask,
  isTeacherOrAdmin,
  activeTab,
  setActiveTab,
  writingContent,
  isWritingStarted,
  elapsedSeconds,
  remainingSeconds,
  wordCount,
  handleWritingChange,
  handleSubmitTask,
  mySubmission,
  isExpired,
  handleToggleLike,
  handleAddComment,
  commentInputMap,
  setCommentInputMap,
  onOpenTeacherTaskModal,
  onOpenGradingModal,
  teacherFilterStatus,
  setTeacherFilterStatus,
  teacherSearchQuery,
  setTeacherSearchQuery,
  scoreLeaderboard
}) => {
  const minWords = keyboardTask.minWords || 80;
  const maxWords = keyboardTask.maxWords || 150;

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter submissions for teacher
  const filteredSubmissions = (keyboardTask.submissions || []).filter(sub => {
    const studentObj = students.find(s => s.id === sub.studentId);
    const sName = (studentObj?.fullName || sub.studentName || '').toLowerCase();
    const query = teacherSearchQuery.toLowerCase();
    const matchName = sName.includes(query);

    if (teacherFilterStatus === 'graded') return matchName && sub.isGraded;
    if (teacherFilterStatus === 'submitted') return matchName;
    return matchName;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 2.5D ITEN WRITING STUDIO CONTAINER */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 border-4 border-indigo-500/50 shadow-2xl p-4 sm:p-7 text-white select-none">
        
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
        
        {/* Ambient Warm Glows */}
        <div className="absolute -top-12 left-1/4 w-80 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* ------------------------------------------------------------- */}
        {/* 1. TOP GAME HUD HEADER */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4 border-b border-indigo-500/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl">
                ✍️
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-indigo-200 to-purple-200">
                  {keyboardTask.title || 'Anh Hùng Bàn Phím: Luyện Viết Sáng Tạo'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 uppercase">
                  {keyboardTask.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1 ${
                  isExpired
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                }`}>
                  {isExpired ? '⚠️ Hết hạn nộp' : '🟢 Đang mở bài làm'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Hoạt động luyện viết giúp học sinh rèn luyện tư duy, diễn đạt cảm xúc và chia sẻ bài viết hay cùng bạn bè.
              </p>
            </div>
          </div>

          {/* Teacher Action Button */}
          {isTeacherOrAdmin && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenTeacherTaskModal}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <Settings className="w-4 h-4 text-slate-950" />
                <span>⚙️ Cài Đặt Bài Viết & Hạn Chót</span>
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 2. GAME HUD NAVIGATION TABS */}
        {/* ------------------------------------------------------------- */}
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 my-5">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-indigo-500/30 backdrop-blur-md">
            <button
              type="button"
              onClick={() => { soundFx.playClick(); setActiveTab('practice'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-102'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>✍️ Góc Luyện Viết</span>
            </button>

            <button
              type="button"
              onClick={() => { soundFx.playClick(); setActiveTab('submissions'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'submissions'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 scale-102'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📋 Triển Lãm Bài Viết ({(keyboardTask.submissions || []).length})</span>
            </button>

            <button
              type="button"
              onClick={() => { soundFx.playClick(); setActiveTab('leaderboard'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30 scale-102'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 Bảng Tuyên Dương</span>
            </button>
          </div>

          {/* Reward & Deadline Info Pill */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Thưởng: +{keyboardTask.rewardPoints || 5} điểm (GV thiết lập)</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-300" />
              <span>Hạn: {keyboardTask.deadline || 'Chưa đặt'}</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TAB 1: WRITING WORKSPACE */}
        {/* ========================================================================= */}
        {activeTab === 'practice' && (
          <div className="relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Prominent Topic & Instruction Card */}
            <div className="bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-500/20 pb-2.5">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Đề Bài & Yêu Cầu Viết:</span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-200 text-xs font-black border border-indigo-400/30">
                  🎯 Yêu cầu: {minWords} – {maxWords} từ
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl font-bold text-amber-200">
                  {keyboardTask.prompt}
                </h4>
                {keyboardTask.instruction && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic bg-slate-950/60 p-3 rounded-2xl border border-indigo-500/20">
                    💡 <strong>Hướng dẫn làm bài:</strong> {keyboardTask.instruction}
                  </p>
                )}
              </div>
            </div>

            {/* Real-time HUD Gauges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Countdown Timer Gauge */}
              <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Timer className={`w-3.5 h-3.5 text-purple-400 ${remainingSeconds < 120 ? 'animate-pulse text-rose-400' : ''}`} />
                  Thời gian làm bài
                </span>
                <div className={`text-2xl sm:text-3xl font-black mt-1 tracking-tight ${
                  remainingSeconds < 120 ? 'text-rose-400 animate-pulse' : 'text-purple-300'
                }`}>
                  ⏱ {formatTime(remainingSeconds)}
                </div>
                <span className="text-[10px] text-slate-400">Hạn định: {keyboardTask.timeLimitMinutes || 20} phút</span>
              </div>

              {/* Real-time Word Counter Gauge */}
              <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Số từ đã viết
                </span>
                <div className={`text-2xl sm:text-3xl font-black mt-1 tracking-tight ${
                  wordCount >= minWords ? 'text-emerald-400' : 'text-indigo-200'
                }`}>
                  {wordCount} <span className="text-xs text-slate-400 font-normal">/ {minWords} từ</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {wordCount >= minWords ? '✅ Đã đạt chỉ tiêu' : `Cần viết thêm ${Math.max(0, minWords - wordCount)} từ`}
                </span>
              </div>

              {/* Elapsed Time Gauge */}
              <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Thời gian đã dùng
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1 tracking-tight">
                  {formatTime(elapsedSeconds)}
                </div>
                <span className="text-[10px] text-slate-400">Tự động đếm khi gõ</span>
              </div>
            </div>

            {/* Chibi Student Writing Desk Visual Area */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={currentUser.fullName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-md"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{currentUser.fullName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/40">
                      {currentUser.team || 'Tổ 1'}
                    </span>
                  </div>
                  <span className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {mySubmission
                        ? '🎉 Đã nộp bài làm'
                        : isWritingStarted
                        ? '✍️ Đang say sưa miệt mài sáng tác...'
                        : '📖 Sẵn sàng viết bài'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-400 italic">
                {remainingSeconds <= 0 ? (
                  <span className="text-rose-400 font-bold">⏱ Đã hết thời gian làm bài!</span>
                ) : (
                  <span>💡 Hãy chăm chút câu chữ và chia sẻ cảm nhận chân thật nhất của em.</span>
                )}
              </div>
            </div>

            {/* Central Writing Textarea */}
            <div className="space-y-2">
              <textarea
                rows={9}
                value={writingContent}
                onChange={handleWritingChange}
                disabled={remainingSeconds <= 0 && !mySubmission}
                placeholder="✍️ Đặt con trỏ chuột vào đây và bắt đầu viết bài... Thể hiện diễn đạt cảm xúc chân thành, mạch lạc và chú ý cấu trúc đoạn văn nhé!"
                className="w-full p-4.5 bg-slate-900/90 border-2 border-indigo-500/50 focus:border-indigo-300 rounded-2xl text-white placeholder-slate-500 text-sm sm:text-base font-sans leading-relaxed focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none shadow-xl"
              />
            </div>

            {/* Action Bar & Submit Task Button */}
            <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-indigo-500/30">
              <div className="text-xs text-slate-300">
                {mySubmission ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Bạn đã nộp bài viết lúc {mySubmission.submittedAt} ({mySubmission.wordCount} từ)
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Bạn chưa nộp bài viết cho đề tài này.
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmitTask}
                className="px-7 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl text-xs shadow-xl shadow-emerald-500/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>🚀 NỘP BÀI VIẾT NGAY</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. TAB 2: SUBMISSIONS GALLERY & COMMUNITY FEED */}
        {/* ========================================================================= */}
        {activeTab === 'submissions' && (
          <div className="relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Filter and search bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-indigo-500/30">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={e => setTeacherSearchQuery(e.target.value)}
                    placeholder="🔍 Tìm bài viết của học sinh..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-indigo-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeacherFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    teacherFilterStatus === 'all' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Tất cả ({keyboardTask.submissions?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherFilterStatus('graded')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    teacherFilterStatus === 'graded' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Đã chấm điểm ({keyboardTask.submissions?.filter(s => s.isGraded).length || 0})
                </button>
              </div>
            </div>

            {/* Submissions List Grid */}
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-dashed border-indigo-500/30 space-y-2">
                <p className="text-sm font-bold text-slate-400">Chưa có bài viết nào phù hợp.</p>
                <p className="text-xs text-slate-500">Hãy là người đầu tiên viết và nộp bài nhé!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSubmissions.map(sub => {
                  const hasLiked = (sub.likes || []).includes(currentUser.id);
                  return (
                    <div
                      key={sub.id}
                      className="bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-400 rounded-2xl p-4.5 space-y-3.5 shadow-md flex flex-col justify-between transition-all"
                    >
                      {/* Sub Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={sub.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400 shadow-sm"
                          />
                          <div>
                            <h5 className="font-bold text-white text-sm">{sub.studentName}</h5>
                            <span className="text-[11px] text-indigo-300">{sub.team} • {sub.submittedAt}</span>
                          </div>
                        </div>

                        {/* Word count & Score Badges */}
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400 text-indigo-300 text-xs font-black">
                            📝 {sub.wordCount} từ
                          </span>
                          {sub.score !== undefined ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black">
                              ⭐ {sub.score}/10
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-400 text-xs">
                              Chờ chấm
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Preview */}
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-500/20 text-xs text-slate-200 leading-relaxed font-sans">
                        "{sub.content}"
                      </div>

                      {/* Feedback from teacher if graded */}
                      {sub.feedback && (
                        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-1">
                          <span className="font-bold">📝 Nhận xét của Thầy/Cô:</span>
                          <p className="italic">{sub.feedback}</p>
                        </div>
                      )}

                      {/* Footer Actions: Like, Comment, Grade */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(sub.id)}
                            className={`flex items-center gap-1 font-bold cursor-pointer transition-all ${
                              hasLiked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-300'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-400' : ''}`} />
                            <span>{(sub.likes || []).length} Thích</span>
                          </button>

                          <span className="text-slate-400 flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{(sub.comments || []).length} Bình luận</span>
                          </span>
                        </div>

                        {/* Teacher Grade Button */}
                        {isTeacherOrAdmin && (
                          <button
                            type="button"
                            onClick={() => onOpenGradingModal(sub)}
                            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <span>⭐ Chấm điểm bài viết</span>
                          </button>
                        )}
                      </div>

                      {/* Comment Input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputMap[sub.id] || ''}
                          onChange={e => setCommentInputMap({ ...commentInputMap, [sub.id]: e.target.value })}
                          placeholder="Viết lời động viên..."
                          className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(sub.id)}
                          className="px-3 py-1.5 bg-indigo-500 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-indigo-400"
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. TAB 3: FEATURED ESSAYS LEADERBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <h4 className="text-lg font-black text-amber-300 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>BẢNG TUYÊN DƯƠNG BÀI VIẾT XUẤT SẮC</span>
              </h4>
              <p className="text-xs text-slate-400">
                Tuyên dương các bài viết xuất sắc đạt điểm số cao từ Thầy/Cô giáo
              </p>
            </div>

            {/* Leaderboard List */}
            <div className="bg-slate-900/90 rounded-3xl p-5 border border-indigo-500/30 space-y-4">
              {scoreLeaderboard.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-400 italic">
                  Chưa có bài viết nào được chấm điểm để hiển thị trên Bảng Tuyên Dương.
                </p>
              ) : (
                <div className="space-y-3">
                  {scoreLeaderboard.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs transition-all ${
                        idx === 0
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/10'
                          : idx === 1
                          ? 'bg-slate-300/20 border-slate-300 text-slate-200'
                          : idx === 2
                          ? 'bg-orange-400/20 border-orange-400 text-orange-200'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{idx + 1}
                        </span>
                        <img
                          src={item.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400"
                        />
                        <div>
                          <div className="font-bold text-white text-sm">{item.studentName}</div>
                          <div className="text-[11px] text-slate-400">{item.team} • {item.wordCount} từ</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-400">{item.score} / 10 Điểm</span>
                        <span className="block text-[10px] text-slate-400">+{item.rewardPointsAwarded || 5} điểm thi đua</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
