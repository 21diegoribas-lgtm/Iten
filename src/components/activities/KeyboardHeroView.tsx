import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  KeyboardHeroTask,
  KeyboardHeroSubmission,
  ActivityPointRecord
} from '../../types';
import { soundFx } from '../../utils/sound';
import { KeyboardHeroScene } from '../game-ui/KeyboardHeroScene';
import {
  Settings,
  X,
  Check,
  Award,
  BookOpen,
  Clock,
  FileText
} from 'lucide-react';

interface KeyboardHeroViewProps {
  currentUser: User;
  students: User[];
  keyboardTask: KeyboardHeroTask;
  onUpdateKeyboardTask: (task: KeyboardHeroTask) => void;
  onSaveTaskConfig?: (task: KeyboardHeroTask) => Promise<void>;
  onSaveSubmission?: (submission: KeyboardHeroSubmission) => Promise<void>;
  onSetLike?: (submissionId: string, liked: boolean) => Promise<void>;
  onAddComment?: (submissionId: string, comment: KeyboardHeroSubmission['comments'][number]) => Promise<void>;
  onGradeSubmission?: (submission: KeyboardHeroSubmission, point: ActivityPointRecord) => Promise<void>;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
}

export const countWords = (text: string): number => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
};

const SAMPLE_TOPIC_PRESETS = [
  {
    title: 'Bài viết cảm nhận: Mái trường & Thầy cô kính yêu',
    category: 'Thi đua rèn luyện' as const,
    prompt: 'Cảm nhận về mái trường THCS Chu Văn An và người thầy cô em yêu quý',
    instruction: 'Em hãy viết một đoạn văn ngắn chia sẻ những kỷ niệm hoặc tình cảm chân thành của mình về thầy cô, bạn bè và mái trường THCS Chu Văn An. Hãy chú ý mạch cảm xúc và cấu trúc câu rõ ràng.',
    minWords: 80,
    maxWords: 150,
    timeLimitMinutes: 20
  },
  {
    title: 'Bài viết cảm nhận: Lòng biết ơn & Tình cảm gia đình',
    category: 'Thi đua rèn luyện' as const,
    prompt: 'Người thân yêu nhất trong gia đình em',
    instruction: 'Viết đoạn văn kể về một kỷ niệm sâu sắc hoặc bày tỏ tình cảm biết ơn chân thành với bố mẹ, ông bà hoặc người thân trong gia đình em.',
    minWords: 80,
    maxWords: 150,
    timeLimitMinutes: 20
  },
  {
    title: 'Bài viết nghị luận: Ý thức bảo vệ môi trường học đường',
    category: 'Thi đua học tập' as const,
    prompt: 'Xây dựng trường học xanh - sạch - đẹp',
    instruction: 'Nêu suy nghĩ và đề xuất những hành động thiết thực của học sinh để giữ gìn vệ sinh lớp học, hạn chế rác thải nhựa và chăm sóc cây xanh sân trường.',
    minWords: 100,
    maxWords: 150,
    timeLimitMinutes: 25
  },
  {
    title: 'Bài viết chia sẻ: Ước mơ và mục tiêu tương lai',
    category: 'Thi đua học tập' as const,
    prompt: 'Ước mơ tuổi học trò và định hướng rèn luyện của em',
    instruction: 'Giới thiệu về nghề nghiệp hoặc ước mơ lớn nhất mà em khao khát đạt được trong tương lai, cùng kế hoạch rèn luyện bản thân từ hôm nay.',
    minWords: 100,
    maxWords: 150,
    timeLimitMinutes: 20
  },
  {
    title: 'Bài viết cảm nhận: Cuốn sách em yêu thích nhất',
    category: 'Thi đua học tập' as const,
    prompt: 'Cuốn sách gối đầu giường và bài học cuộc sống',
    instruction: 'Giới thiệu tên cuốn sách, tác giả và phân tích bài học ý nghĩa hoặc thông điệp giá trị nhất mà cuốn sách đã mang lại cho em.',
    minWords: 100,
    maxWords: 150,
    timeLimitMinutes: 25
  },
  {
    title: 'Bài viết truyền cảm hứng: Đạo lý Uống nước nhớ nguồn',
    category: 'Thi đua rèn luyện' as const,
    prompt: 'Truyền thống tri ân và lòng tự hào dân tộc',
    instruction: 'Viết đoạn văn thể hiện niềm tự hào dân tộc và sự biết ơn sâu sắc đối với các thế hệ cha anh đã hy sinh vì nền độc lập, tự do của Tổ quốc.',
    minWords: 100,
    maxWords: 150,
    timeLimitMinutes: 20
  }
];

export const KeyboardHeroView: React.FC<KeyboardHeroViewProps> = ({
  currentUser,
  students,
  keyboardTask,
  onUpdateKeyboardTask,
  onSaveTaskConfig,
  onSaveSubmission,
  onSetLike,
  onAddComment,
  onGradeSubmission,
  onActivityPointSaved
}) => {
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'practice' | 'submissions' | 'leaderboard'>('practice');

  // Student Writing Workspace state
  const mySubmission = (keyboardTask.submissions || []).find(s => s.studentId === currentUser.id);
  const [writingContent, setWritingContent] = useState(mySubmission?.content || '');
  const [isWritingStarted, setIsWritingStarted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(mySubmission?.timeSpentSeconds || 0);
  
  const timeLimitMins = keyboardTask.timeLimitMinutes || 20;
  const totalLimitSeconds = timeLimitMins * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(Math.max(0, totalLimitSeconds - elapsedSeconds));

  const timerIntervalRef = useRef<any>(null);

  // Comment input map
  const [commentInputMap, setCommentInputMap] = useState<{ [subId: string]: string }>({});

  // Teacher Modal states
  const [isTeacherTaskModalOpen, setIsTeacherTaskModalOpen] = useState(false);
  const [isTeacherGradingModalOpen, setIsTeacherGradingModalOpen] = useState(false);
  const [selectedSubForGrading, setSelectedSubForGrading] = useState<KeyboardHeroSubmission | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(9);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');
  const [gradingRewardPoints, setGradingRewardPoints] = useState<number>(keyboardTask.rewardPoints || 5);
  const actionLock = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Teacher Create/Edit Form State
  const [tempTitle, setTempTitle] = useState(keyboardTask.title);
  const [tempPrompt, setTempPrompt] = useState(keyboardTask.prompt);
  const [tempInstruction, setTempInstruction] = useState(keyboardTask.instruction || '');
  const [tempMinWords, setTempMinWords] = useState<number>(keyboardTask.minWords || 80);
  const [tempMaxWords, setTempMaxWords] = useState<number>(keyboardTask.maxWords || 150);
  const [tempTimeLimitMinutes, setTempTimeLimitMinutes] = useState<number>(keyboardTask.timeLimitMinutes || 20);
  const [tempCategory, setTempCategory] = useState<'Thi đua học tập' | 'Thi đua rèn luyện'>(keyboardTask.category);
  const [tempDeadlineDate, setTempDeadlineDate] = useState(
    keyboardTask.deadline ? keyboardTask.deadline.split(' ')[0] : '2026-08-30'
  );
  const [tempDeadlineTime, setTempDeadlineTime] = useState(
    keyboardTask.deadline ? keyboardTask.deadline.split(' ')[1] || '23:59' : '23:59'
  );
  const [tempRewardPoints, setTempRewardPoints] = useState<number>(keyboardTask.rewardPoints || 5);
  const [tempStatus, setTempStatus] = useState<'Đang diễn ra' | 'Đã hết hạn' | 'Đã đóng'>(
    keyboardTask.status || 'Đang diễn ra'
  );

  // Filters for teacher submissions list
  const [teacherFilterStatus, setTeacherFilterStatus] = useState<'all' | 'submitted' | 'not_submitted' | 'graded'>('all');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');

  // Check deadline expiration
  const deadlineDateObj = new Date((keyboardTask.deadline || `${tempDeadlineDate} ${tempDeadlineTime}`).replace(' ', 'T'));
  const now = new Date();
  const isExpired = deadlineDateObj.getTime() < now.getTime();

  // Word count calculation
  const currentWordCount = countWords(writingContent);

  useEffect(() => {
    if (!isWritingStarted) {
      setWritingContent(mySubmission?.content || '');
      setElapsedSeconds(mySubmission?.timeSpentSeconds || 0);
      setRemainingSeconds(Math.max(0, totalLimitSeconds - (mySubmission?.timeSpentSeconds || 0)));
    }
  }, [mySubmission?.id, mySubmission?.content, mySubmission?.timeSpentSeconds, totalLimitSeconds, isWritingStarted]);

  useEffect(() => {
    setTempTitle(keyboardTask.title);
    setTempPrompt(keyboardTask.prompt);
    setTempInstruction(keyboardTask.instruction || '');
    setTempMinWords(keyboardTask.minWords || 80);
    setTempMaxWords(keyboardTask.maxWords || 150);
    setTempTimeLimitMinutes(keyboardTask.timeLimitMinutes || 20);
    setTempCategory(keyboardTask.category === 'Thi đua rèn luyện' ? 'Thi đua rèn luyện' : 'Thi đua học tập');
    setTempRewardPoints(keyboardTask.rewardPoints || 5);
    if (keyboardTask.deadline) {
      const [date, time = '23:59'] = keyboardTask.deadline.split(' ');
      setTempDeadlineDate(date); setTempDeadlineTime(time);
    }
    setTempStatus(keyboardTask.status || 'Đang diễn ra');
  }, [keyboardTask.id, keyboardTask.title, keyboardTask.prompt, keyboardTask.deadline, keyboardTask.status]);

  // Timer Effect
  useEffect(() => {
    if (!isWritingStarted) return;

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const nextElapsed = prev + 1;
        const nextRem = Math.max(0, totalLimitSeconds - nextElapsed);
        setRemainingSeconds(nextRem);

        if (nextRem <= 0) {
          clearInterval(timerIntervalRef.current);
          soundFx.playError();
        }
        return nextElapsed;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [isWritingStarted, totalLimitSeconds]);

  // Handle typing change
  const handleWritingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (!isWritingStarted && val.length > 0) {
      setIsWritingStarted(true);
    }
    setWritingContent(val);
  };

  // Student Submit Essay
  const handleSubmitTask = async () => {
    if (actionLock.current || !onSaveSubmission) return;
    if (keyboardTask.status === 'Đã đóng') { setSaveError('Bài tập đã đóng và không nhận thêm bài nộp.'); return; }
    if (mySubmission?.isGraded) { setSaveError('Bài đã được chấm nên không thể nộp đè.'); return; }
    if (!writingContent.trim()) {
      soundFx.playError();
      alert('Vui lòng nhập nội dung bài viết trước khi nộp!');
      return;
    }

    const minW = keyboardTask.minWords || 80;
    if (currentWordCount < minW) {
      const confirmSubmit = window.confirm(
        `Bài viết của bạn hiện có ${currentWordCount} từ (ít hơn yêu cầu ${minW} từ).\nBạn có chắc chắn muốn nộp bài không?`
      );
      if (!confirmSubmit) return;
    }

    soundFx.playSuccess();
    const newSubmission: KeyboardHeroSubmission = {
      id: `submission_${currentUser.id}`,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      studentAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      team: currentUser.team || 'Tổ 1',
      content: writingContent.trim(),
      wordCount: currentWordCount,
      timeSpentSeconds: elapsedSeconds > 0 ? elapsedSeconds : 60,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      isLate: isExpired,
      likes: mySubmission?.likes || [],
      comments: mySubmission?.comments || []
    };

    const existingOtherSubs = (keyboardTask.submissions || []).filter(s => s.studentId !== currentUser.id);
    const updatedSubmissions = [newSubmission, ...existingOtherSubs];

    actionLock.current = true; setSaving(true);
    try {
      await onSaveSubmission(newSubmission);
      onUpdateKeyboardTask({ ...keyboardTask, submissions: updatedSubmissions });
      setSaveError('');
    } catch (error) {
      setSaveError(`Không nộp được bài: ${(error as Error).message || 'Vui lòng thử lại.'}`);
      return;
    } finally { actionLock.current = false; setSaving(false); }

    alert(
      `🎉 Chúc mừng bạn đã hoàn thành và nộp bài viết thành công!${
        isExpired ? ' (Ghi nhận nộp sau hạn chót)' : ''
      }\nThầy cô sẽ xem xét, nhận xét và chấm điểm thi đua cho bạn.`
    );
  };

  // Toggle Like
  const handleToggleLike = async (subId: string) => {
    soundFx.playClick();
    const updatedSubmissions = (keyboardTask.submissions || []).map(s => {
      if (s.id === subId) {
        const hasLiked = s.likes.includes(currentUser.id);
        const newLikes = hasLiked
          ? s.likes.filter(id => id !== currentUser.id)
          : [...s.likes, currentUser.id];
        return { ...s, likes: newLikes };
      }
      return s;
    });

    const target = (keyboardTask.submissions || []).find(s => s.id === subId);
    if (!target || !onSetLike) return;
    try {
      await onSetLike(subId, !target.likes.includes(currentUser.id));
      onUpdateKeyboardTask({ ...keyboardTask, submissions: updatedSubmissions });
    } catch { setSaveError('Không cập nhật được lượt thích.'); }
  };

  // Add Comment
  const handleAddComment = async (subId: string) => {
    const text = (commentInputMap[subId] || '').trim();
    if (!text) return;

    soundFx.playSuccess();
    const newComment = {
      id: 'cm_' + Date.now(),
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatar,
      content: text,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    const updatedSubmissions = (keyboardTask.submissions || []).map(s => {
      if (s.id === subId) {
        return {
          ...s,
          comments: [...(s.comments || []), newComment]
        };
      }
      return s;
    });

    if (!onAddComment) return;
    try {
      await onAddComment(subId, newComment);
      onUpdateKeyboardTask({ ...keyboardTask, submissions: updatedSubmissions });
    } catch { setSaveError('Không lưu được bình luận.'); return; }

    setCommentInputMap({ ...commentInputMap, [subId]: '' });
  };

  // Apply Preset
  const handleApplyPreset = (preset: typeof SAMPLE_TOPIC_PRESETS[0]) => {
    soundFx.playClick();
    setTempTitle(preset.title);
    setTempCategory(preset.category);
    setTempPrompt(preset.prompt);
    setTempInstruction(preset.instruction);
    setTempMinWords(preset.minWords);
    setTempMaxWords(preset.maxWords);
    setTempTimeLimitMinutes(preset.timeLimitMinutes);
  };

  // Save Teacher Task Settings
  const handleSaveTeacherTaskSettings = async () => {
    soundFx.playSuccess();
    const fullDeadline = `${tempDeadlineDate} ${tempDeadlineTime}`;

    const updatedTask: KeyboardHeroTask = {
      ...keyboardTask,
      title: tempTitle.trim() || 'Bài viết rèn luyện kỹ năng',
      prompt: tempPrompt.trim() || 'Cảm nhận về chủ đề bài học.',
      instruction: tempInstruction.trim(),
      minWords: tempMinWords,
      maxWords: tempMaxWords,
      timeLimitMinutes: tempTimeLimitMinutes,
      category: tempCategory,
      deadline: fullDeadline,
      rewardPoints: tempRewardPoints,
      status: tempStatus
    };

    if (!onSaveTaskConfig) return;
    actionLock.current = true; setSaving(true);
    try { await onSaveTaskConfig(updatedTask); onUpdateKeyboardTask(updatedTask); setSaveError(''); }
    catch (error) { setSaveError(`Không lưu được đề bài: ${(error as Error).message}`); return; }
    finally { actionLock.current = false; setSaving(false); }
    setIsTeacherTaskModalOpen(false);
    alert('Đã lưu và ban hành chủ đề luyện viết cho học sinh thành công!');
  };

  // Teacher Grade & Award Points
  const handleConfirmGradeAndAwardPoints = async () => {
    if (!selectedSubForGrading || !onGradeSubmission || actionLock.current) return;
    soundFx.playBonus();

    const pts = Number(gradingRewardPoints) || 5;
    const categoryType = keyboardTask.category;

    const updatedSubmissions = (keyboardTask.submissions || []).map(s => {
      if (s.id === selectedSubForGrading.id) {
        return {
          ...s,
          score: Number(gradingScore),
          feedback: gradingFeedback.trim() || 'Thầy/Cô đã đọc bài làm và tuyên dương tinh thần học tập của em!',
          rewardPointsAwarded: pts,
          isGraded: true
        };
      }
      return s;
    });

    const targetStudent = students.find(st => st.id === selectedSubForGrading.studentId);
    const studentName = targetStudent?.fullName || selectedSubForGrading.studentName;
    const classId = targetStudent?.classId || 'c1';

    const isAcademic = categoryType === 'Điểm HĐ học tập' || categoryType === 'Thi đua học tập' || categoryType === 'Điểm học tập';
    const actId = keyboardTask.id || 'keyboard_hero';
    const actName = keyboardTask.title || 'Anh hùng bàn phím';

    const gradedSubmission = updatedSubmissions.find(s => s.id === selectedSubForGrading.id)!;
    const point: ActivityPointRecord = {
      id: `keyboard_${selectedSubForGrading.id}`, attemptId: `keyboard_${selectedSubForGrading.id}`,
      userId: selectedSubForGrading.studentId, studentName, classId, activityId: actId,
      activityName: `Anh hùng bàn phím: ${actName} (${gradingScore}/10)`, source: 'keyboard', category: categoryType,
      pointType: isAcademic ? 'academic_activity' : 'training_activity', points: pts, isCorrect: true,
      participantName: studentName, questionId: selectedSubForGrading.id,
      date: new Date().toISOString().split('T')[0], timestamp: new Date().toLocaleString('vi-VN'),
    };
    actionLock.current = true; setSaving(true);
    try {
      await onGradeSubmission(gradedSubmission, point);
      onUpdateKeyboardTask({ ...keyboardTask, submissions: updatedSubmissions });
      onActivityPointSaved?.(point);
      setSaveError('');
    } catch (error) { setSaveError(`Không lưu được điểm: ${(error as Error).message}`); return; }
    finally { actionLock.current = false; setSaving(false); }

    setIsTeacherGradingModalOpen(false);
    setSelectedSubForGrading(null);
    alert(`🎉 Đã chấm điểm thành công và cộng +${pts} điểm thi đua vào bảng [${categoryType}] cho học sinh ${studentName}!`);
  };

  // Top score leaderboard (Featured Essays)
  const scoreLeaderboard = [...(keyboardTask.submissions || [])]
    .filter(s => s.score !== undefined)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="space-y-6">
      {saveError && <div role="alert" className="fixed top-4 right-4 z-[200] max-w-md rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 shadow-lg">{saveError}<button className="ml-3 underline" onClick={() => setSaveError('')}>Đóng</button></div>}
      {saving && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5 font-bold text-slate-800">Đang lưu dữ liệu Anh hùng bàn phím...</p></div>}
      <KeyboardHeroScene
        currentUser={currentUser}
        students={students}
        keyboardTask={keyboardTask}
        isTeacherOrAdmin={isTeacherOrAdmin}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        writingContent={writingContent}
        isWritingStarted={isWritingStarted}
        elapsedSeconds={elapsedSeconds}
        remainingSeconds={remainingSeconds}
        wordCount={currentWordCount}
        handleWritingChange={handleWritingChange}
        handleSubmitTask={handleSubmitTask}
        mySubmission={mySubmission}
        isExpired={isExpired}
        handleToggleLike={handleToggleLike}
        handleAddComment={handleAddComment}
        commentInputMap={commentInputMap}
        setCommentInputMap={setCommentInputMap}
        onOpenTeacherTaskModal={() => {
          setTempTitle(keyboardTask.title);
          setTempPrompt(keyboardTask.prompt);
          setTempInstruction(keyboardTask.instruction || '');
          setTempMinWords(keyboardTask.minWords || 80);
          setTempMaxWords(keyboardTask.maxWords || 150);
          setTempTimeLimitMinutes(keyboardTask.timeLimitMinutes || 20);
          setIsTeacherTaskModalOpen(true);
        }}
        onOpenGradingModal={(sub) => {
          setSelectedSubForGrading(sub);
          setGradingScore(sub.score || 9);
          setGradingFeedback(sub.feedback || '');
          setGradingRewardPoints(sub.rewardPointsAwarded || keyboardTask.rewardPoints || 5);
          setIsTeacherGradingModalOpen(true);
        }}
        teacherFilterStatus={teacherFilterStatus}
        setTeacherFilterStatus={setTeacherFilterStatus}
        teacherSearchQuery={teacherSearchQuery}
        setTeacherSearchQuery={setTeacherSearchQuery}
        scoreLeaderboard={scoreLeaderboard}
      />

      {/* TEACHER MODAL: TAO CHU DE & GIAO DEADLINE */}
      {isTeacherTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-indigo-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h4 className="text-base font-black text-slate-900">
                  Thiết Lập Bài Viết & Giao Đề Bài (Dành cho Giáo viên)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Gallery */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                💡 Chọn nhanh từ kho đề tài bài viết phong phú:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_TOPIC_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/60 text-left transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-indigo-950 truncate block max-w-[180px]">
                        {preset.title}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        {preset.minWords}-{preset.maxWords} từ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{preset.prompt}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Tên hoạt động / Chủ đề bài viết:
                </label>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={e => setTempTitle(e.target.value)}
                  placeholder="Nhập tên bài tập..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Đề tài chính (Prompt):
                </label>
                <input
                  type="text"
                  value={tempPrompt}
                  onChange={e => setTempPrompt(e.target.value)}
                  placeholder="Nhập đề tài..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Yêu cầu viết chi tiết (Instructions):
                </label>
                <textarea
                  rows={3}
                  value={tempInstruction}
                  onChange={e => setTempInstruction(e.target.value)}
                  placeholder="Nhập hướng dẫn bài làm cho học sinh..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Số từ tối thiểu:
                  </label>
                  <input
                    type="number"
                    value={tempMinWords}
                    onChange={e => setTempMinWords(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Số từ tối đa:
                  </label>
                  <input
                    type="number"
                    value={tempMaxWords}
                    onChange={e => setTempMaxWords(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Thời gian làm (Phút):
                  </label>
                  <input
                    type="number"
                    value={tempTimeLimitMinutes}
                    onChange={e => setTempTimeLimitMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Phân loại thi đua (Tự động cộng điểm):
                  </label>
                  <select
                    value={tempCategory}
                    onChange={e => setTempCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Thi đua học tập">📚 Điểm học tập (Cộng vào Học tập)</option>
                    <option value="Thi đua rèn luyện">🎖️ Điểm rèn luyện (Cộng vào Nền nếp/Rèn luyện)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Điểm thi đua thưởng (Do Giáo viên thiết lập):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={tempRewardPoints}
                      onChange={e => setTempRewardPoints(Math.max(1, Number(e.target.value)))}
                      className="w-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-900 text-sm"
                    />
                    <div className="flex items-center gap-1">
                      {[2, 5, 10, 15, 20].map(pt => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setTempRewardPoints(pt)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            tempRewardPoints === pt
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          +{pt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadline Setting */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <label className="block font-bold text-amber-950 uppercase">
                  ⏰ Hạn nót làm bài (Deadline):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-amber-800 font-medium block mb-1">Ngày hết hạn:</span>
                    <input
                      type="date"
                      value={tempDeadlineDate}
                      onChange={e => setTempDeadlineDate(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-800 font-medium block mb-1">Giờ hết hạn:</span>
                    <input
                      type="time"
                      value={tempDeadlineTime}
                      onChange={e => setTempDeadlineTime(e.target.value)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTeacherTaskModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveTeacherTaskSettings}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Lưu & Ban Hành Đề Bài</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER MODAL: CHAM DIEM BAI VIET */}
      {isTeacherGradingModalOpen && selectedSubForGrading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-indigo-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h4 className="text-base font-black text-slate-900">
                  Chấm Điểm Bài Viết & Duyệt Thưởng Thi Đua
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherGradingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info & Submission Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-900">{selectedSubForGrading.studentName} ({selectedSubForGrading.team || 'Lớp 8A1'})</span>
                <span className="text-indigo-700">Nộp: {selectedSubForGrading.submittedAt}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-100 text-slate-800 italic max-h-40 overflow-y-auto font-sans leading-relaxed">
                "{selectedSubForGrading.content}"
              </div>
              <div className="flex items-center gap-4 text-slate-600 pt-1">
                <span>📝 Số từ: <strong>{selectedSubForGrading.wordCount} từ</strong></span>
                <span>⏱ Thời gian làm: <strong>{Math.round((selectedSubForGrading.timeSpentSeconds || 60) / 60)} phút</strong></span>
              </div>
            </div>

            {/* Grading Form */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Điểm số (Thang 10):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.5}
                    value={gradingScore}
                    onChange={e => setGradingScore(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-base"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Thưởng điểm thi đua (GV thiết lập):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={gradingRewardPoints}
                      onChange={e => setGradingRewardPoints(Math.max(1, Number(e.target.value)))}
                      className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm"
                    />
                    <div className="flex items-center gap-1">
                      {[2, 5, 10, 15].map(pt => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setGradingRewardPoints(pt)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            gradingRewardPoints === pt
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          +{pt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nhận xét & Lời khuyên của Thầy/Cô:
                </label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={e => setGradingFeedback(e.target.value)}
                  placeholder="Ví dụ: Bài viết cảm xúc, câu văn trôi chảy và lập luận thuyết phục..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-medium leading-relaxed">
                ✨ Điểm thi đua +{gradingRewardPoints} sẽ tự động ghi nhận vào sổ theo dõi <strong>[{keyboardTask.category}]</strong> của học sinh.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTeacherGradingModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmGradeAndAwardPoints}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>Lưu Điểm & Thưởng Thi Đua</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
