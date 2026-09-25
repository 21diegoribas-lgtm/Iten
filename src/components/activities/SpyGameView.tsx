import React, { useState } from 'react';
import { User, SpyGameMission, SpyGameSummary, ActivityPointRecord } from '../../types';
import { soundFx } from '../../utils/sound';
import { SpyDetectiveScene } from '../game-ui/SpyDetectiveScene';
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
  CheckCircle2,
  AlertCircle,
  Settings,
  Dice5,
  Play,
  UserCheck,
  UserX,
  Users,
  Flag,
  Flame,
  Check
} from 'lucide-react';

interface SpyGameViewProps {
  currentUser: User;
  students: User[];
  spyMission: SpyGameMission;
  onUpdateSpyMission: (m: SpyGameMission) => void;
  onSaveSpyMission?: (m: SpyGameMission) => Promise<void>;
  onCastVote?: (suspectId: string) => Promise<void>;
  onResetMyVotes?: () => Promise<void>;
  onClearAllVotes?: () => Promise<void>;
  onFinishMission?: (mission: SpyGameMission, points: ActivityPointRecord[]) => Promise<void>;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
}

const SPY_MISSION_PRESETS = [
  'Nhắc lại một từ khóa đặc biệt (ví dụ: "tuyệt vời") ít nhất 3 lần trong giờ học mà không để ai nghi ngờ.',
  'Hỏi giáo viên hoặc bạn cùng bàn một câu hỏi thú vị ngoài lề về bài học trong giờ thảo luận nhóm.',
  'Vẽ một biểu tượng ngôi sao hoặc mặt cười nhỏ ở góc phiếu bài tập nhóm.',
  'Khen ngợi bài thuyết trình hoặc câu trả lời của một bạn khác tổ trong giờ chữa bài.',
  'Đổi một chiếc bút hoặc đồ dùng học tập với bạn bàn bên cạnh trong giờ thảo luận.',
  'Phát biểu một ý kiến phản biện sáng tạo trong giờ sinh hoạt lớp hoặc thảo luận.'
];

export const SpyGameView: React.FC<SpyGameViewProps> = ({
  currentUser,
  students,
  spyMission,
  onUpdateSpyMission,
  onSaveSpyMission,
  onCastVote,
  onResetMyVotes,
  onClearAllVotes,
  onFinishMission,
  onActivityPointSaved
}) => {
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';
  const isGameActive = spyMission.status === 'Đang diễn ra';
  const isGameEnded =
    spyMission.status === 'Hoàn thành (+5đ)' ||
    spyMission.status === 'Bị phát hiện (-5đ)' ||
    spyMission.status === 'Không hoàn thành (-5đ)';
  const isGameInactive = spyMission.status === 'Chưa kích hoạt';

  // Student voting and role unlock states
  const [isRoleUnlocked, setIsRoleUnlocked] = useState(false);
  const [rolePasswordInput, setRolePasswordInput] = useState('');
  const [showRolePasswordText, setShowRolePasswordText] = useState(false);
  const [rolePasswordError, setRolePasswordError] = useState('');
  const [spySearchQuery, setSpySearchQuery] = useState('');
  const [spyTeamFilter, setSpyTeamFilter] = useState<string>('all');

  // Teacher states
  const [isTeacherSecretRevealed, setIsTeacherSecretRevealed] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [teacherAuditFilter, setTeacherAuditFilter] = useState<'all' | 'voted' | 'not_voted' | 'correct'>('all');

  // Activate / Settings temp form states
  const [tempWeek, setTempWeek] = useState(spyMission.weekNumber || 4);
  const [tempCategory, setTempCategory] = useState<'Thi đua rèn luyện' | 'Thi đua học tập'>(spyMission.category || 'Thi đua rèn luyện');
  const [tempSpyId, setTempSpyId] = useState(spyMission.spyStudentId || students[0]?.id || '');
  const [tempMissionDesc, setTempMissionDesc] = useState(spyMission.missionDescription || SPY_MISSION_PRESETS[0]);
  const [tempRewardSpy, setTempRewardSpy] = useState(spyMission.rewardSpy || 5);
  const [tempPenaltySpy, setTempPenaltySpy] = useState(spyMission.penaltySpy || 5);
  const [tempRewardCitizen, setTempRewardCitizen] = useState(spyMission.rewardCitizenPerVote || 2);

  // End Game Tally form states
  const [endOutcome, setEndOutcome] = useState<'spy' | 'citizens' | 'spy_failed'>('citizens');
  const [endConclusionNote, setEndConclusionNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Calculations
  const spyStudentObj = students.find(s => s.id === spyMission.spyStudentId);
  const isUserSpy = currentUser.id === spyMission.spyStudentId;
  const userSpyVotes = (spyMission.votes || []).filter(v => v.voterId === currentUser.id);
  const userVotesRemaining = Math.max(0, 3 - userSpyVotes.length);

  // Group user votes
  const myVoteSummaryMap: { [studentId: string]: number } = {};
  userSpyVotes.forEach(v => {
    myVoteSummaryMap[v.suspectId] = (myVoteSummaryMap[v.suspectId] || 0) + 1;
  });

  // Calculate vote totals and suspect counts
  const suspectCounts: { [studentId: string]: number } = {};
  (spyMission.votes || []).forEach(v => {
    suspectCounts[v.suspectId] = (suspectCounts[v.suspectId] || 0) + 1;
  });

  const totalVotesCount = (spyMission.votes || []).length;
  const uniqueVotersSet = new Set((spyMission.votes || []).map(v => v.voterId));
  const participationRate = students.length > 0 ? Math.round((uniqueVotersSet.size / students.length) * 100) : 0;
  const votesAgainstSpyCount = (spyMission.votes || []).filter(v => v.suspectId === spyMission.spyStudentId).length;
  const spyTargetRate = totalVotesCount > 0 ? Math.round((votesAgainstSpyCount / totalVotesCount) * 100) : 0;

  // Sorted list of suspects
  const topSuspects = Object.entries(suspectCounts)
    .map(([studentId, count]) => ({
      student: students.find(s => s.id === studentId),
      count,
      percentage: totalVotesCount > 0 ? Math.round((count / totalVotesCount) * 100) : 0
    }))
    .filter(item => item.student !== undefined)
    .sort((a, b) => b.count - a.count);

  // Filtered student list for student voting view
  const filteredStudents = students.filter(st => {
    const query = spySearchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      st.fullName.toLowerCase().includes(query) ||
      st.username.toLowerCase().includes(query) ||
      (st.team && st.team.toLowerCase().includes(query)) ||
      (st.position && st.position.toLowerCase().includes(query));
    const matchesTeam = spyTeamFilter === 'all' || st.team === spyTeamFilter;
    return matchesQuery && matchesTeam;
  });

  // Handlers for Student
  const handleUnlockRole = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = currentUser.password || '123456';
    if (rolePasswordInput.trim() === correctPassword) {
      soundFx.playSuccess();
      setIsRoleUnlocked(true);
      setRolePasswordError('');
    } else {
      soundFx.playError();
      setRolePasswordError('Mật khẩu không chính xác! Vui lòng nhập đúng mật khẩu tài khoản của bạn.');
    }
  };

  const handleLockRole = () => {
    soundFx.playClick();
    setIsRoleUnlocked(false);
    setRolePasswordInput('');
    setRolePasswordError('');
  };

  const handleCastVote = async (suspect: User) => {
    if (userVotesRemaining <= 0) {
      soundFx.playError();
      alert('Bạn đã dùng hết 3/3 lượt bình chọn gián điệp tuần này!');
      return;
    }
    soundFx.playSuccess();
    const newVote = { voterId: currentUser.id, suspectId: suspect.id };
    const updatedVotes = [...(spyMission.votes || []), newVote];
    const updatedMission: SpyGameMission = {
      ...spyMission,
      votes: updatedVotes
    };
    if (!onCastVote) return;
    setSaving(true);
    try { await onCastVote(suspect.id); onUpdateSpyMission(updatedMission); setSaveError(''); }
    catch (error) { setSaveError((error as Error).message || 'Không lưu được phiếu bầu.'); return; }
    finally { setSaving(false); }
    const updatedCount = (myVoteSummaryMap[suspect.id] || 0) + 1;
    alert(`Đã bình chọn nghi vấn cho ${suspect.fullName}! (Đã vote bạn này ${updatedCount} lần. Còn lại: ${userVotesRemaining - 1}/3 lượt)`);
  };

  const handleResetMyVotes = async () => {
    if (userSpyVotes.length === 0) return;
    if (confirm('Bạn có chắc chắn muốn thu hồi toàn bộ các phiếu đã vote của mình để chọn lại không?')) {
      soundFx.playClick();
      const updatedVotes = (spyMission.votes || []).filter(v => v.voterId !== currentUser.id);
      const updatedMission: SpyGameMission = {
        ...spyMission,
        votes: updatedVotes
      };
      if (!onResetMyVotes) return;
      setSaving(true);
      try { await onResetMyVotes(); onUpdateSpyMission(updatedMission); setSaveError(''); }
      catch { setSaveError('Không thể thu hồi phiếu bầu.'); return; }
      finally { setSaving(false); }
      alert('Đã hoàn lại 3 lượt bình chọn của bạn thành công!');
    }
  };

  // Handlers for Teacher
  const handleRandomSpy = () => {
    soundFx.playClick();
    if (students.length === 0) return;
    const randIdx = Math.floor(Math.random() * students.length);
    setTempSpyId(students[randIdx].id);
  };

  const handleStartNewRound = async () => {
    if (!tempSpyId) {
      alert('Vui lòng chỉ định một học sinh làm Gián điệp!');
      return;
    }
    if (!tempMissionDesc.trim()) {
      alert('Vui lòng nhập nội dung nhiệm vụ bí mật!');
      return;
    }

    soundFx.playSuccess();
    const updatedMission: SpyGameMission = {
      id: `sp_${Date.now()}`,
      classId: currentUser.classId || spyMission.classId,
      weekNumber: tempWeek,
      category: tempCategory,
      spyStudentId: tempSpyId,
      missionDescription: tempMissionDesc.trim(),
      status: 'Đang diễn ra',
      votes: [],
      rewardSpy: tempRewardSpy,
      penaltySpy: tempPenaltySpy,
      rewardCitizenPerVote: tempRewardCitizen,
      startedAt: new Date().toISOString(),
      summaryResult: undefined
    };

    if (!onSaveSpyMission) return;
    setSaving(true);
    try { await onSaveSpyMission(updatedMission); onUpdateSpyMission(updatedMission); setSaveError(''); }
    catch (error) { setSaveError(`Không kích hoạt được vòng chơi: ${(error as Error).message}`); return; }
    finally { setSaving(false); }
    setIsActivateModalOpen(false);
    setIsSettingsModalOpen(false);
    alert(`🚀 Đã kích hoạt thành công Trò chơi Truy tìm Gián điệp Tuần ${tempWeek}! Học sinh trong lớp có thể bắt đầu mở khóa vai trò và biểu quyết.`);
  };

  const handleConfirmEndGameAndTally = async () => {
    soundFx.playBonus();

    const spyUser = students.find(s => s.id === spyMission.spyStudentId);
    const rewardSpyVal = spyMission.rewardSpy || 5;
    const penaltySpyVal = spyMission.penaltySpy || 5;
    const rewardCitizenVal = spyMission.rewardCitizenPerVote || 2;

    // Calculate correct voters
    const voterCountMap: { [voterId: string]: number } = {};
    (spyMission.votes || []).forEach(v => {
      if (v.suspectId === spyMission.spyStudentId) {
        voterCountMap[v.voterId] = (voterCountMap[v.voterId] || 0) + 1;
      }
    });

    const correctVoters = Object.entries(voterCountMap).map(([voterId, votesCast]) => {
      const voterStudent = students.find(s => s.id === voterId);
      const pointsEarned = endOutcome === 'citizens' ? votesCast * rewardCitizenVal : 0;
      return {
        studentId: voterId,
        studentName: voterStudent?.fullName || 'Học sinh',
        avatar: voterStudent?.avatar,
        team: voterStudent?.team,
        votesCast,
        pointsEarned
      };
    });

    const spyPointsChange = endOutcome === 'spy' ? rewardSpyVal : -penaltySpyVal;

    const currentDate = new Date().toISOString().split('T')[0];
    const weekNum = spyMission.weekNumber || 4;
    const categoryType = spyMission.category || 'Thi đua rèn luyện';
    const isAcademic = categoryType === 'Điểm HĐ học tập' || categoryType === 'Thi đua học tập' || categoryType === 'Điểm học tập';
    const actId = spyMission.id || 'spy_game';
    const actName = 'Truy tìm gián điệp';

    const summary: SpyGameSummary = {
      winner: endOutcome,
      spyName: spyUser?.fullName || 'Học sinh ẩn danh',
      spyAvatar: spyUser?.avatar,
      spyTeam: spyUser?.team,
      spyPointsChanged: spyPointsChange,
      citizenRewardPointsPerVote: rewardCitizenVal,
      totalVotes: totalVotesCount,
      correctVotesCount: votesAgainstSpyCount,
      correctVoters,
      conclusionNote: endConclusionNote.trim() || (endOutcome === 'citizens' ? 'Cả lớp đã xuất sắc lật tẩy được gián điệp ẩn thân!' : 'Gián điệp đã hoàn thành xuất sắc nhiệm vụ bí mật mà không bị lật tẩy.'),
      endedAt: new Date().toISOString()
    };

    const finalStatus = endOutcome === 'spy'
      ? 'Hoàn thành (+5đ)'
      : endOutcome === 'citizens'
        ? 'Bị phát hiện (-5đ)'
        : 'Không hoàn thành (-5đ)';

    const updatedMission: SpyGameMission = {
      ...spyMission,
      status: finalStatus,
      summaryResult: summary,
      endedAt: new Date().toISOString()
    };

    if (!onFinishMission || !spyUser) return;
    const makePoint = (studentId: string, studentName: string, points: number, role: string): ActivityPointRecord => ({
      id: `spy_${actId}_${studentId}`, attemptId: `spy_${actId}_${studentId}`, userId: studentId, studentName,
      classId: spyMission.classId, activityId: actId, activityName: `${actName} tuần ${weekNum}`,
      source: 'spy', category: categoryType, pointType: isAcademic ? 'academic_activity' : 'training_activity',
      points, isCorrect: points > 0, participantName: role, questionId: actId,
      date: currentDate, timestamp: new Date().toLocaleString('vi-VN'),
    });
    const points = [makePoint(spyUser.id, spyUser.fullName, spyPointsChange, 'Gián điệp')];
    if (endOutcome === 'citizens') correctVoters.filter(voter => voter.pointsEarned > 0).forEach(voter =>
      points.push(makePoint(voter.studentId, voter.studentName, voter.pointsEarned, `${voter.votesCast} phiếu đúng`)));
    setSaving(true);
    try {
      await onFinishMission(updatedMission, points);
      onUpdateSpyMission(updatedMission);
      points.forEach(point => onActivityPointSaved?.(point));
      setSaveError('');
    } catch (error) { setSaveError(`Không tổng kết được vòng chơi: ${(error as Error).message}`); return; }
    finally { setSaving(false); }
    setIsEndModalOpen(false);
    alert('🏁 Đã kết thúc vòng chơi và tự động cộng/trừ điểm thi đua vào sổ điểm của cả lớp thành công!');
  };

  const handleReopenRound = async () => {
    if (confirm('Bạn có muốn mở lại vòng bình chọn này để tiếp tục không?')) {
      soundFx.playClick();
      const updatedMission: SpyGameMission = {
        ...spyMission,
        status: 'Đang diễn ra',
        summaryResult: undefined
      };
      if (!onSaveSpyMission) return;
      try { await onSaveSpyMission(updatedMission); onUpdateSpyMission(updatedMission); }
      catch { setSaveError('Không thể mở lại vòng chơi.'); }
    }
  };

  return (
    <div className="space-y-6">
      {saveError && <div role="alert" className="fixed top-4 right-4 z-[200] max-w-md rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 shadow-lg">{saveError}<button className="ml-3 underline" onClick={() => setSaveError('')}>Đóng</button></div>}
      {saving && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5 font-bold text-slate-800">Đang lưu trò chơi Gián điệp...</p></div>}
      {/* 2.5D DETECTIVE ROOM SCENE */}
      <SpyDetectiveScene
        currentUser={currentUser}
        students={students}
        spyMission={spyMission}
        onUpdateSpyMission={onUpdateSpyMission}
        onCastVote={onCastVote}
        onResetMyVotes={onResetMyVotes}
        isTeacherOrAdmin={isTeacherOrAdmin}
        onOpenActivate={() => {
          setTempWeek(spyMission.weekNumber || 4);
          setTempSpyId(spyMission.spyStudentId || students[0]?.id || '');
          setTempMissionDesc(spyMission.missionDescription || SPY_MISSION_PRESETS[0]);
          setIsActivateModalOpen(true);
        }}
        onOpenEndGame={() => {
          setEndOutcome(votesAgainstSpyCount > 0 ? 'citizens' : 'spy');
          setEndConclusionNote(
            votesAgainstSpyCount > 0
              ? `Gián điệp ${spyStudentObj?.fullName || ''} đã bị ${votesAgainstSpyCount} phiếu vạch trần. Khen ngợi tinh thần quan sát của các bạn!`
              : `Gián điệp ${spyStudentObj?.fullName || ''} đã hoàn thành xuất sắc nhiệm vụ mà không bị lớp phát hiện.`
          );
          setIsEndModalOpen(true);
        }}
        onOpenSettings={() => {
          setTempWeek(spyMission.weekNumber || 4);
          setTempSpyId(spyMission.spyStudentId);
          setTempMissionDesc(spyMission.missionDescription);
          setTempRewardSpy(spyMission.rewardSpy || 5);
          setTempPenaltySpy(spyMission.penaltySpy || 5);
          setTempRewardCitizen(spyMission.rewardCitizenPerVote || 2);
          setIsSettingsModalOpen(true);
        }}
        onReopenRound={handleReopenRound}
      />

      {/* ========================================================================= */}
      {/* 5. MODALS: ACTIVATE ROUND, END GAME & TALLY, SETTINGS */}
      {/* ========================================================================= */}

      {/* MODAL 1: ACTIVATE NEW ROUND MODAL */}
      {isActivateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-purple-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-600" />
                <h4 className="text-base font-black text-slate-800">
                  Kích hoạt Trò chơi Truy tìm Gián điệp (Tuần {tempWeek})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsActivateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tuần diễn ra:
                  </label>
                  <input
                    type="number"
                    value={tempWeek}
                    onChange={e => setTempWeek(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Phân loại thi đua (Vườn thành tích):
                  </label>
                  <select
                    value={tempCategory}
                    onChange={e => setTempCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Thi đua rèn luyện">🎖️ Điểm rèn luyện</option>
                    <option value="Thi đua học tập">📚 Điểm học tập</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 uppercase">
                    Chỉ định học sinh làm Gián điệp:
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomSpy}
                    className="text-[11px] text-purple-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Dice5 className="w-3.5 h-3.5" /> Random ngẫu nhiên
                  </button>
                </div>
                <select
                  value={tempSpyId}
                  onChange={e => setTempSpyId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                >
                  {students.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.team || 'Lớp 8A1'}) - Tài khoản: {st.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nhiệm vụ bí mật của gián điệp:
                </label>
                <textarea
                  rows={3}
                  value={tempMissionDesc}
                  onChange={e => setTempMissionDesc(e.target.value)}
                  placeholder="Nhập nội dung nhiệm vụ bí mật của gián điệp..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                />

                {/* Preset Suggestions */}
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Gợi ý nhiệm vụ nhanh:</span>
                  <div className="flex flex-wrap gap-1">
                    {SPY_MISSION_PRESETS.slice(0, 3).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTempMissionDesc(p)}
                        className="text-[10px] px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-left truncate max-w-xs transition-all"
                        title={p}
                      >
                        💡 {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Point Rules */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-purple-50/70 rounded-2xl border border-purple-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Thưởng Gián điệp</span>
                  <input
                    type="number"
                    value={tempRewardSpy}
                    onChange={e => setTempRewardSpy(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white border border-purple-200 rounded-lg font-black text-emerald-700 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Phạt Gián điệp</span>
                  <input
                    type="number"
                    value={tempPenaltySpy}
                    onChange={e => setTempPenaltySpy(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white border border-purple-200 rounded-lg font-black text-rose-700 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block">Thưởng Dân làng/vote</span>
                  <input
                    type="number"
                    value={tempRewardCitizen}
                    onChange={e => setTempRewardCitizen(Number(e.target.value))}
                    className="w-full mt-1 p-1.5 bg-white border border-purple-200 rounded-lg font-black text-purple-700 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsActivateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleStartNewRound}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-4 h-4" /> BẮT ĐẦU VÒNG CHƠI NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: END GAME & TALLY POINTS MODAL */}
      {isEndModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-purple-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-rose-600" />
                <h4 className="text-base font-black text-slate-800">
                  Kết thúc Vòng chơi & Tổng kết Điểm Thi đua
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEndModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Quick Live Stats Review */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase block">Gián điệp tuần này:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {spyStudentObj?.fullName} ({spyStudentObj?.team || 'Lớp 8A1'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Số phiếu bị phát hiện:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {votesAgainstSpyCount} / {totalVotesCount} phiếu
                  </span>
                </div>
              </div>

              {/* Outcome Selection */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-2">
                  1. Chọn kết quả thẩm định chung cuộc:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEndOutcome('citizens')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      endOutcome === 'citizens'
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl block mb-1">🕵️‍♂️🔍</span>
                    <span className="font-black text-emerald-900 block">Dân làng Thắng</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Gián điệp bị lộ (-{spyMission.penaltySpy || 5}đ). Thưởng +{spyMission.rewardCitizenPerVote || 2}đ/phiếu đúng.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEndOutcome('spy')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      endOutcome === 'spy'
                        ? 'bg-purple-50 border-purple-500 shadow-xs ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl block mb-1">🏆🥷</span>
                    <span className="font-black text-purple-900 block">Gián điệp Thắng</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Ẩn thân thành công (+{spyMission.rewardSpy || 5}đ cho gián điệp). Dân làng 0đ.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEndOutcome('spy_failed')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      endOutcome === 'spy_failed'
                        ? 'bg-rose-50 border-rose-500 shadow-xs ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl block mb-1">❌⚠️</span>
                    <span className="font-black text-rose-900 block">Không hoàn thành</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Gián điệp không làm nhiệm vụ (-{spyMission.penaltySpy || 5}đ).
                    </span>
                  </button>
                </div>
              </div>

              {/* Conclusion Note */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  2. Lời nhận xét / Tổng kết của Giáo viên:
                </label>
                <textarea
                  rows={2}
                  value={endConclusionNote}
                  onChange={e => setEndConclusionNote(e.target.value)}
                  placeholder="Nhập lời nhận xét gửi đến cả lớp và gián điệp..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Point Adjustment Preview */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-1.5">
                <span className="font-bold text-amber-900 block">
                  ⚡ Tự động cộng/trừ điểm thi đua:
                </span>
                <ul className="text-[11px] text-slate-700 space-y-1 list-disc pl-4">
                  <li>
                    Gián điệp <strong>{spyStudentObj?.fullName}</strong>: {endOutcome === 'spy' ? <span className="text-emerald-600 font-bold">+{spyMission.rewardSpy || 5} điểm</span> : <span className="text-rose-600 font-bold">-{spyMission.penaltySpy || 5} điểm</span>}
                  </li>
                  {endOutcome === 'citizens' && (
                    <li>
                      <strong>{new Set((spyMission.votes || []).filter(v => v.suspectId === spyMission.spyStudentId).map(v => v.voterId)).size} học sinh</strong> đoán đúng gián điệp sẽ được cộng <strong>+{spyMission.rewardCitizenPerVote || 2} điểm/phiếu trúng</strong>.
                    </li>
                  )}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEndModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEndGameAndTally}
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> XÁC NHẬN & TỔNG KẾT ĐIỂM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SETTINGS MODAL */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-purple-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                <h4 className="text-base font-black text-slate-800">
                  Cài đặt & Quản trị Trò chơi Gián điệp
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Tuần diễn ra:
                  </label>
                  <input
                    type="number"
                    value={tempWeek}
                    onChange={e => setTempWeek(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Phân loại thi đua:
                  </label>
                  <select
                    value={tempCategory}
                    onChange={e => setTempCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  >
                    <option value="Thi đua rèn luyện">🎖️ Điểm rèn luyện</option>
                    <option value="Thi đua học tập">📚 Điểm học tập</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Chỉ định Gián điệp:
                </label>
                <select
                  value={tempSpyId}
                  onChange={e => setTempSpyId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {students.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.team || 'Lớp 8A1'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Nhiệm vụ bí mật:
                </label>
                <textarea
                  rows={2}
                  value={tempMissionDesc}
                  onChange={e => setTempMissionDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Bạn có chắc muốn đặt lại toàn bộ phiếu bầu của lớp không?')) {
                      if (!onClearAllVotes) return;
                      setSaving(true);
                      try { await onClearAllVotes(); onUpdateSpyMission({ ...spyMission, votes: [] }); }
                      catch { setSaveError('Không thể xóa toàn bộ phiếu bầu.'); return; }
                      finally { setSaving(false); }
                      setIsSettingsModalOpen(false);
                      alert('Đã xóa toàn bộ phiếu bầu của vòng chơi!');
                    }
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 cursor-pointer"
                >
                  🗑️ Xóa toàn bộ phiếu bầu
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      soundFx.playSuccess();
                      const updated = {
                        ...spyMission,
                        weekNumber: tempWeek,
                        category: tempCategory,
                        spyStudentId: tempSpyId,
                        missionDescription: tempMissionDesc,
                        rewardSpy: tempRewardSpy,
                        penaltySpy: tempPenaltySpy,
                        rewardCitizenPerVote: tempRewardCitizen
                      };
                      if (!onSaveSpyMission) return;
                      setSaving(true);
                      try { await onSaveSpyMission(updated); onUpdateSpyMission(updated); }
                      catch (error) { setSaveError(`Không lưu được cài đặt: ${(error as Error).message}`); return; }
                      finally { setSaving(false); }
                      setIsSettingsModalOpen(false);
                      alert('Đã lưu thay đổi cài đặt thành công!');
                    }}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
