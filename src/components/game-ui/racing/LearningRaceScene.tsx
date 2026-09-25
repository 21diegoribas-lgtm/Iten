import React, { useState, useEffect, useRef } from 'react';
import { User, RacingGameConfig, RacingTeam, VehicleConfig, RacingQuestion, RaceAnswerHistoryRecord, ActivityPointRecord } from '../../../types';
import { deleteRaceHistory, loadRaceHistory, saveRaceAnswers } from '../../../services/raceHistoryService';
import { saveRaceAnswerAndPoint } from '../../../services/activityPointService';
import { soundFx } from '../../../utils/sound';
import { Game3DButton } from '../Game3DButton';
import { RacingTrackArena } from './RacingTrackArena';
import { RaceQuestionOverlay } from './RaceQuestionOverlay';
import { VehicleRevealWheel } from './VehicleRevealWheel';
import { RaceCelebrationPodium } from './RaceCelebrationPodium';
import { RaceVehicleSvg } from './RaceVehicleSvg';
import {
  Trophy,
  Flag,
  Clock,
  Volume2,
  VolumeX,
  Languages,
  RotateCcw,
  Settings,
  Sparkles,
  Play,
  CheckCircle,
  HelpCircle,
  Users,
  UserCheck,
  Zap,
  Repeat,
  History,
  BookOpen,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface LearningRaceSceneProps {
  currentUser?: User | null;
  racingConfig: RacingGameConfig;
  onUpdateRacingConfig?: (newConfig: RacingGameConfig) => Promise<void>;
  onActivityPointSaved?: (point: ActivityPointRecord) => void;
  isTeacherOrAdmin?: boolean;
}

export const LearningRaceScene: React.FC<LearningRaceSceneProps> = ({
  currentUser,
  racingConfig,
  onUpdateRacingConfig,
  onActivityPointSaved,
  isTeacherOrAdmin = false
}) => {
  // Play mode: 'all_teams' (Tất cả các đội cùng chơi) or 'turn_based' (Chơi lần lượt)
  const currentPlayMode = racingConfig.playMode || 'all_teams';

  // Game session states
  const [racingStarted, setRacingStarted] = useState(false);
  const [racingTeams, setRacingTeams] = useState<RacingTeam[]>(() => {
    const count = racingConfig.trackCount || 4;
    return (racingConfig.teams || []).slice(0, count);
  });
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [fillText, setFillText] = useState('');
  const [timeLeft, setTimeLeft] = useState((racingConfig.timeMinutes || 5) * 60);
  const [timeIsUp, setTimeIsUp] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState<RacingTeam | null>(null);

  // All-teams mode state
  const [teamAnswers, setTeamAnswers] = useState<Record<string, string>>({});
  const [teamCorrectStates, setTeamCorrectStates] = useState<Record<string, boolean>>({});
  const [multiTeamAwards, setMultiTeamAwards] = useState<{ team: RacingTeam; vehicle: VehicleConfig }[]>([]);

  // Wheel spin state
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDisplayVehicle, setSpinDisplayVehicle] = useState<VehicleConfig | null>(null);
  const [awardedVehicle, setAwardedVehicle] = useState<VehicleConfig | null>(null);

  // Animation & Feedback states
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [reactionState, setReactionState] = useState<'idle' | 'racing' | 'correct' | 'wrong' | 'boost' | 'victory'>('idle');
  const [isMoving, setIsMoving] = useState(false);
  const [movingTeamIdx, setMovingTeamIdx] = useState<number | null>(null);

  // Global game preferences
  const [soundMuted, setSoundMuted] = useState(false);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Q&A History state for Racing Game
  const [raceHistory, setRaceHistory] = useState<RaceAnswerHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);
  const answerLock = useRef(false);
  const configLock = useRef(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const singleAttemptId = useRef<string | null>(null);
  const roundAttemptIds = useRef<Record<string, string>>({});
  const [showRaceHistoryModal, setShowRaceHistoryModal] = useState(false);
  const [raceHistorySearchTerm, setRaceHistorySearchTerm] = useState('');
  const [raceHistoryFilterType, setRaceHistoryFilterType] = useState<'all' | 'correct' | 'wrong'>('all');
  const [revealedRaceAnswers, setRevealedRaceAnswers] = useState<Record<string, boolean>>({});
  const [revealAllRaceAnswers, setRevealAllRaceAnswers] = useState(false);

  const persistConfig = async (config: RacingGameConfig): Promise<boolean> => {
    if (configLock.current || answerLock.current || !onUpdateRacingConfig) return false;
    if (racingStarted && !winnerTeam && !timeIsUp) {
      setHistoryError('Hãy kết thúc hoặc chơi lại cuộc đua trước khi sửa cài đặt.');
      return false;
    }
    configLock.current = true;
    setSavingConfig(true);
    try {
      await onUpdateRacingConfig(config);
      setHistoryError('');
      return true;
    } catch (error) {
      setHistoryError(`Không lưu được cấu hình: ${(error as Error).message || 'Vui lòng thử lại.'}`);
      return false;
    } finally {
      configLock.current = false;
      setSavingConfig(false);
    }
  };

  useEffect(() => {
    if (!currentUser?.id || !racingConfig.classId) { setHistoryLoading(false); return; }
    let cancelled = false;
    setHistoryLoading(true);
    loadRaceHistory(racingConfig.classId, currentUser.id)
      .then(entries => { if (!cancelled) { setRaceHistory(entries); setHistoryError(''); } })
      .catch(() => { if (!cancelled) setHistoryError('Không tải được lịch sử Đường đua từ Firestore.'); })
      .finally(() => { if (!cancelled) setHistoryLoading(false); });
    return () => { cancelled = true; };
  }, [currentUser?.id, racingConfig.classId]);

  const toggleRevealRaceAnswer = (id: string) => {
    setRevealedRaceAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleRevealAllRace = () => {
    const nextState = !revealAllRaceAnswers;
    setRevealAllRaceAnswers(nextState);
    const newMap: Record<string, boolean> = {};
    raceHistory.forEach(h => {
      newMap[h.id] = nextState;
    });
    setRevealedRaceAnswers(newMap);
  };

  // Teacher Settings Modal state
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'vehicles' | 'questions'>('general');
  const [tempTitle, setTempTitle] = useState(racingConfig.title || 'Đường đua học tập');
  const [tempCategory, setTempCategory] = useState(racingConfig.category || 'Thi đua học tập');
  const [tempPlayMode, setTempPlayMode] = useState<'turn_based' | 'all_teams'>(racingConfig.playMode || 'all_teams');
  const [tempTimeMinutes, setTempTimeMinutes] = useState(racingConfig.timeMinutes || 5);
  const [tempTrackLength, setTempTrackLength] = useState(racingConfig.trackLength || 1000);
  const [tempTrackCount, setTempTrackCount] = useState(racingConfig.trackCount || 4);

  // Sync teams when config changes
  useEffect(() => {
    if (!racingStarted) {
      const count = racingConfig.trackCount || 4;
      setRacingTeams((racingConfig.teams || []).slice(0, count));
      setTimeLeft((racingConfig.timeMinutes || 5) * 60);
      setTempPlayMode(racingConfig.playMode || 'all_teams');
    }
  }, [racingConfig, racingStarted]);

  // Countdown timer effect
  useEffect(() => {
    if (!racingStarted || winnerTeam || timeIsUp) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeIsUp(true);
          if (!soundMuted) soundFx.playBonus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [racingStarted, winnerTeam, timeIsUp, soundMuted]);

  // Handle Start / Restart Race
  const handleStartRacing = () => {
    if (answerLock.current || historyLoading) return;
    if (!racingConfig.questions.length) { setHistoryError('Giáo viên cần thêm ít nhất một câu hỏi trước khi bắt đầu.'); return; }
    if (!racingConfig.isActive && !isTeacherOrAdmin) {
      alert(
        language === 'vi'
          ? 'Đường đua chưa được giáo viên kích hoạt! Vui lòng chờ giáo viên mở đường đua.'
          : 'Race track is currently locked by the teacher. Please wait!'
      );
      return;
    }

    const count = racingConfig.trackCount || 4;
    const initialTeams = (racingConfig.teams || []).slice(0, count).map(t => ({
      ...t,
      currentDistance: 0,
      vehicleId: racingConfig.vehicles[0]?.id || 'v1'
    }));

    setRacingTeams(initialTeams);
    setActiveTeamIdx(0);
    setCurrentQuestionIdx(0);
    setSelectedOpt(null);
    setFillText('');
    setTeamAnswers({});
    setTeamCorrectStates({});
    setMultiTeamAwards([]);
    setTimeLeft((racingConfig.timeMinutes || 5) * 60);
    setTimeIsUp(false);
    setWinnerTeam(null);
    setShowSpinModal(false);
    setAwardedVehicle(null);
    setFeedbackState('idle');
    setReactionState('racing');
    setRacingStarted(true);
    singleAttemptId.current = null;
    roundAttemptIds.current = {};

    if (!soundMuted) soundFx.playSuccess();
  };

  // Quick toggle play mode for teacher
  const handleTogglePlayMode = async (newMode: 'all_teams' | 'turn_based') => {
    if (!await persistConfig({
      ...racingConfig,
      playMode: newMode
    })) return;
    setTempPlayMode(newMode);
    if (!soundMuted) soundFx.playClick();
  };

  // =========================================================================
  // MULTI-TEAM (ALL TEAMS SIMULTANEOUSLY) HANDLERS
  // =========================================================================
  const handleToggleTeamCorrect = (teamId: string) => {
    setTeamCorrectStates(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
    if (!soundMuted) soundFx.playClick();
  };

  const handleSetTeamAnswer = (teamId: string, answer: string) => {
    const q = racingConfig.questions[currentQuestionIdx] || racingConfig.questions[0];
    const isCorrect = q ? answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() : false;

    setTeamAnswers(prev => ({
      ...prev,
      [teamId]: answer
    }));

    setTeamCorrectStates(prev => ({
      ...prev,
      [teamId]: isCorrect
    }));

    if (!soundMuted) {
      if (isCorrect) soundFx.playSuccess();
      else soundFx.playClick();
    }
  };

  const handleSetAllTeamsCorrect = (correct: boolean) => {
    const newStates: Record<string, boolean> = {};
    racingTeams.forEach(t => {
      newStates[t.id] = correct;
    });
    setTeamCorrectStates(newStates);
    if (!soundMuted) {
      if (correct) soundFx.playSuccess();
      else soundFx.playClick();
    }
  };

  // Submit All Teams Round
  const handleSubmitAllTeamsRound = async () => {
    if (answerLock.current || historyLoading || !currentUser) return;
    const q = racingConfig.questions[currentQuestionIdx] || racingConfig.questions[0];
    if (!q) return;
    const qNum = currentQuestionIdx + 1;
    const timestampStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Always record Q&A history entries for ALL participating teams in this round
    const newHistoryEntries: RaceAnswerHistoryRecord[] = racingTeams.map(t => {
      const isCorr = !!teamCorrectStates[t.id];
      return {
        id: roundAttemptIds.current[t.id] || (roundAttemptIds.current[t.id] = crypto.randomUUID()),
        obstacleNumber: qNum,
        obstacleName: `Chướng ngại vật #${qNum}`,
        questionId: q.id,
        questionNumber: qNum,
        questionText: q.question,
        questionType: q.type,
        options: q.options || (q.type === 'bool' ? (language === 'en' ? ['True', 'False'] : ['Đúng', 'Sai']) : undefined),
        teamName: t.name,
        teamColor: t.color,
        submittedAnswer: teamAnswers[t.id] || (isCorr ? '✅ Đúng' : '❌ Chưa đúng'),
        correctAnswer: q.correctAnswer,
        isCorrect: isCorr,
        pointsChange: isCorr ? 1 : -1,
        timestamp: timestampStr
      };
    });
    answerLock.current = true;
    setSavingAnswer(true);
    try {
      await saveRaceAnswers(racingConfig.classId, currentUser.id, newHistoryEntries);
      setRaceHistory(prev => [...newHistoryEntries, ...prev.filter(old => !newHistoryEntries.some(entry => entry.id === old.id))].slice(0, 300));
      roundAttemptIds.current = {};
      setHistoryError('');
    } catch {
      setHistoryError('Chưa lưu được lượt đua. Hãy kiểm tra kết nối rồi bấm nộp lại.');
      return;
    } finally {
      answerLock.current = false;
      setSavingAnswer(false);
    }

    const correctTeams = racingTeams.filter(t => teamCorrectStates[t.id]);

    if (correctTeams.length === 0) {
      if (!soundMuted) soundFx.playError();
      alert(
        language === 'vi'
          ? 'Không có đội nào trả lời đúng ở câu này. Chuyển sang câu hỏi tiếp theo!'
          : 'No teams answered correctly this round. Moving to next question!'
      );
      // Advance to next question
      setTeamAnswers({});
      setTeamCorrectStates({});
      setCurrentQuestionIdx(prev => (prev + 1) % (racingConfig.questions.length || 1));
      return;
    }

    if (!soundMuted) soundFx.playSuccess();
    setMultiTeamAwards([]);
    setShowSpinModal(true);
    setAwardedVehicle(null);
    setSpinDisplayVehicle(null);
  };

  // Handle spin in all-teams mode
  const handleSpinMultiTeams = () => {
    if (isSpinning || !racingConfig.vehicles || racingConfig.vehicles.length === 0) return;

    const correctTeams = racingTeams.filter(t => teamCorrectStates[t.id]);
    setIsSpinning(true);
    if (!soundMuted) soundFx.playFlip();

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * racingConfig.vehicles.length);
      setSpinDisplayVehicle(racingConfig.vehicles[randomIdx]);
      counter++;

      if (counter > 14) {
        clearInterval(interval);

        // Generate random vehicles for all correct teams
        const awards = correctTeams.map(t => {
          const v = racingConfig.vehicles[Math.floor(Math.random() * racingConfig.vehicles.length)];
          return { team: t, vehicle: v };
        });

        setMultiTeamAwards(awards);
        setIsSpinning(false);
        if (!soundMuted) soundFx.playCoin();

        const q = racingConfig.questions[currentQuestionIdx] || racingConfig.questions[0];
        const qNum = currentQuestionIdx + 1;

        // Update existing history records with awarded vehicle & distance gained
        setRaceHistory(prev => {
          const updated = prev.map(rec => {
            if (rec.questionId === q.id && rec.obstacleNumber === qNum) {
              const award = awards.find(a => a.team.name.toLowerCase() === rec.teamName.toLowerCase());
              if (award) {
                return {
                  ...rec,
                  vehicleAwarded: award.vehicle.name,
                  distanceGained: award.vehicle.distance
                };
              }
            }
            return rec;
          });
          try {
            localStorage.setItem('iten_racing_game_history', JSON.stringify(updated.slice(0, 300)));
          } catch (e) {
            console.error(e);
          }
          return updated;
        });

        // Update all teams' positions and vehicles
        let localWinner: RacingTeam | null = null;
        let maxDist = 0;

        const updatedTeams = racingTeams.map(t => {
          const award = awards.find(a => a.team.id === t.id);
          if (award) {
            const newDist = (t.currentDistance || 0) + award.vehicle.distance;
            const finalDist = Math.min(newDist, racingConfig.trackLength || 1000);

            if (newDist >= (racingConfig.trackLength || 1000)) {
              if (newDist > maxDist) {
                maxDist = newDist;
                localWinner = { ...t, currentDistance: finalDist, vehicleId: award.vehicle.id };
              }
            }

            return {
              ...t,
              currentDistance: finalDist,
              vehicleId: award.vehicle.id
            };
          }
          return t;
        });

        setRacingTeams(updatedTeams);
        setIsMoving(true);

        if (localWinner) {
          setTimeout(() => {
            setWinnerTeam(localWinner);
            if (!soundMuted) soundFx.playBonus();
          }, 900);
        }
      }
    }, 90);
  };

  // Continue after all-teams spin
  const handleContinueAfterMultiSpin = () => {
    setShowSpinModal(false);
    setMultiTeamAwards([]);
    setSpinDisplayVehicle(null);
    setAwardedVehicle(null);
    setTeamAnswers({});
    setTeamCorrectStates({});
    setIsMoving(false);

    if (!winnerTeam) {
      setCurrentQuestionIdx(prev => (prev + 1) % (racingConfig.questions.length || 1));
    }
  };

  // =========================================================================
  // SINGLE TEAM (TURN-BASED) HANDLERS
  // =========================================================================
  const handleAnswerQuestionSingle = async () => {
    if (answerLock.current || historyLoading || !currentUser) return;
    const q = racingConfig.questions[currentQuestionIdx] || racingConfig.questions[0];
    if (!q) return;

    let isCorrect = false;
    if (q.type === 'fill') {
      if (!fillText.trim()) {
        alert(language === 'vi' ? 'Vui lòng nhập câu trả lời!' : 'Please enter your answer!');
        return;
      }
      isCorrect = fillText.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    } else {
      if (!selectedOpt) {
        alert(language === 'vi' ? 'Vui lòng chọn một đáp án!' : 'Please select an option!');
        return;
      }
      isCorrect = selectedOpt.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    }

    // Save to Race Answer History Record for single team
    const qNum = currentQuestionIdx + 1;
    const activeTeam = racingTeams[activeTeamIdx] || racingTeams[0];
    const singleHistoryRecord: RaceAnswerHistoryRecord = {
      id: singleAttemptId.current || (singleAttemptId.current = crypto.randomUUID()),
      obstacleNumber: qNum,
      obstacleName: `Chướng ngại vật #${qNum}`,
      questionId: q.id,
      questionNumber: qNum,
      questionText: q.question,
      questionType: q.type,
      options: q.options || (q.type === 'bool' ? (language === 'en' ? ['True', 'False'] : ['Đúng', 'Sai']) : undefined),
      teamName: activeTeam.name,
      teamColor: activeTeam.color,
      submittedAnswer: q.type === 'fill' ? fillText.trim() : (selectedOpt || ''),
      correctAnswer: q.correctAnswer,
      isCorrect: isCorrect,
      pointsChange: isCorrect ? 1 : -1,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    const isAcademic = ['Điểm HĐ học tập', 'Thi đua học tập', 'Điểm học tập'].includes(racingConfig.category);
    const pointEntry: ActivityPointRecord | null = currentUser.role === 'student' ? {
      id: singleHistoryRecord.id,
      attemptId: singleHistoryRecord.id,
      userId: currentUser.id,
      studentName: currentUser.fullName,
      classId: racingConfig.classId,
      activityId: racingConfig.id || 'racing_game',
      activityName: racingConfig.title || 'Đường đua học tập',
      source: 'racing',
      category: racingConfig.category,
      pointType: isAcademic ? 'academic_activity' : 'training_activity',
      points: singleHistoryRecord.pointsChange,
      isCorrect,
      participantName: activeTeam.name,
      questionId: q.id,
      date: new Date().toISOString().slice(0, 10),
      timestamp: singleHistoryRecord.timestamp,
    } : null;
    answerLock.current = true;
    setSavingAnswer(true);
    try {
      if (pointEntry) await saveRaceAnswerAndPoint(racingConfig.classId, currentUser.id, singleHistoryRecord, pointEntry);
      else await saveRaceAnswers(racingConfig.classId, currentUser.id, [singleHistoryRecord]);
      setRaceHistory(prev => [singleHistoryRecord, ...prev.filter(old => old.id !== singleHistoryRecord.id)].slice(0, 300));
      if (pointEntry) onActivityPointSaved?.(pointEntry);
      singleAttemptId.current = null;
      setHistoryError('');
    } catch {
      setHistoryError('Chưa lưu được câu trả lời và điểm. Hãy kiểm tra kết nối rồi nộp lại.');
      return;
    } finally {
      answerLock.current = false;
      setSavingAnswer(false);
    }

    if (isCorrect) {
      if (!soundMuted) soundFx.playSuccess();
      setFeedbackState('correct');
      setReactionState('correct');

      setTimeout(() => {
        setShowSpinModal(true);
        setAwardedVehicle(null);
        setSpinDisplayVehicle(null);
        setFeedbackState('idle');
      }, 600);
    } else {
      if (!soundMuted) soundFx.playError();
      setFeedbackState('wrong');
      setReactionState('wrong');

      setTimeout(() => {
        setFeedbackState('idle');
        setReactionState('idle');
        setSelectedOpt(null);
        setFillText('');
        // Next team's turn
        setActiveTeamIdx(prev => (prev + 1) % (racingTeams.length || 1));
        setCurrentQuestionIdx(prev => (prev + 1) % (racingConfig.questions.length || 1));
      }, 1000);
    }
  };

  const handleSpinSingleVehicle = () => {
    if (isSpinning || !racingConfig.vehicles || racingConfig.vehicles.length === 0) return;

    setIsSpinning(true);
    if (!soundMuted) soundFx.playFlip();

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * racingConfig.vehicles.length);
      setSpinDisplayVehicle(racingConfig.vehicles[randomIdx]);
      counter++;
      if (counter > 14) {
        clearInterval(interval);
        const finalChosen = racingConfig.vehicles[Math.floor(Math.random() * racingConfig.vehicles.length)];
        setSpinDisplayVehicle(finalChosen);
        setAwardedVehicle(finalChosen);
        setIsSpinning(false);
        if (!soundMuted) soundFx.playCoin();

        // Update active team position
        const activeTeam = racingTeams[activeTeamIdx];
        const newDist = (activeTeam.currentDistance || 0) + finalChosen.distance;

        // Update latest history entry for this active team with vehicle awarded
        setRaceHistory(prev => {
          const updated = prev.map((rec, i) => {
            if (i === 0 && rec.teamName.toLowerCase() === activeTeam.name.toLowerCase()) {
              return {
                ...rec,
                vehicleAwarded: finalChosen.name,
                distanceGained: finalChosen.distance
              };
            }
            return rec;
          });
          try {
            localStorage.setItem('iten_racing_game_history', JSON.stringify(updated.slice(0, 300)));
          } catch (e) {
            console.error(e);
          }
          return updated;
        });

        setIsMoving(true);
        setMovingTeamIdx(activeTeamIdx);

        const updatedTeams = racingTeams.map((t, idx) => {
          if (idx === activeTeamIdx) {
            return {
              ...t,
              currentDistance: Math.min(newDist, racingConfig.trackLength || 1000),
              vehicleId: finalChosen.id
            };
          }
          return t;
        });

        setRacingTeams(updatedTeams);

        // Check if finished
        if (newDist >= (racingConfig.trackLength || 1000)) {
          setTimeout(() => {
            setWinnerTeam(activeTeam);
            if (!soundMuted) soundFx.playBonus();
          }, 800);
        }
      }
    }, 90);
  };

  const handleContinueAfterSingleSpin = () => {
    setShowSpinModal(false);
    setAwardedVehicle(null);
    setSpinDisplayVehicle(null);
    setSelectedOpt(null);
    setFillText('');
    setIsMoving(false);
    setMovingTeamIdx(null);

    if (!winnerTeam) {
      setActiveTeamIdx(prev => (prev + 1) % (racingTeams.length || 1));
      setCurrentQuestionIdx(prev => (prev + 1) % (racingConfig.questions.length || 1));
    }
  };

  // =========================================================================
  // TEACHER SETTINGS SAVE
  // =========================================================================
  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRacingConfig) return;
    if (!Number.isInteger(tempTimeMinutes) || tempTimeMinutes < 1 || tempTimeMinutes > 60 ||
        !Number.isInteger(tempTrackLength) || tempTrackLength < 100 || tempTrackLength > 10000) {
      setHistoryError('Thời gian hoặc quãng đường đua không hợp lệ.'); return;
    }

    let newTeams = [...(racingConfig.teams || [])];
    if (tempTrackCount > newTeams.length) {
      const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      for (let i = newTeams.length; i < tempTrackCount; i++) {
        newTeams.push({
          id: `t${i + 1}`,
          name: `Tổ ${i + 1} (${['Rồng Lửa', 'Bão Xanh', 'Chiến Binh', 'Tia Chớp', 'Sấm Sét', 'Phượng Hoàng'][i] || 'Đội ' + (i + 1)})`,
          color: colors[i % colors.length],
          vehicleId: racingConfig.vehicles[0]?.id || 'v1',
          currentDistance: 0
        });
      }
    } else {
      newTeams = newTeams.slice(0, tempTrackCount);
    }

    if (!await persistConfig({
      ...racingConfig,
      title: tempTitle,
      category: tempCategory as any,
      playMode: tempPlayMode,
      timeMinutes: tempTimeMinutes,
      trackLength: tempTrackLength,
      trackCount: tempTrackCount,
      teams: newTeams
    })) return;

    if (!soundMuted) soundFx.playSuccess();
    alert('Đã cập nhật cấu hình Đường đua học tập thành công!');
    setIsTeacherModalOpen(false);
  };

  const currentQ = racingConfig.questions[currentQuestionIdx] || racingConfig.questions[0];
  const activeTeam = racingTeams[activeTeamIdx] || racingTeams[0];
  const isAllTeams = currentPlayMode === 'all_teams';

  const t = {
    vi: {
      gameTitle: racingConfig.title || 'ĐƯỜNG ĐUA TRI THỨC',
      learningCategory: '📚 Điểm học tập',
      disciplineCategory: '🎖️ Điểm rèn luyện',
      timeLeft: 'Thời gian còn lại:',
      startBtn: '🚀 START / XUẤT PHÁT ĐUA NGAY 🏁',
      restartBtn: 'Chơi lại',
      teacherLocked: '⏳ Đường đua đang tạm khóa. Vui lòng chờ Giáo viên / Quản trị viên kích hoạt!',
      teacherActive: '🚀 Đường đua ĐÃ ĐƯỢC KÍCH HOẠT! Bấm Start để tham gia xuất phát.',
      speedTable: 'Bảng quãng đường các loại xe',
      activateBtn: '⚡ KÍCH HOẠT ĐƯỜNG ĐUA',
      activeBtn: '🟢 ĐANG KÍCH HOẠT (Bấm để dừng)',
      settingsBtn: '⚙️ Cài đặt đường đua & Chế độ chơi',
      howToPlayBtn: '❓ Hướng dẫn',
      modeAllTeams: '⚡ Tất cả cùng chơi',
      modeTurnBased: '🔄 Chơi lần lượt',
      modeSwitchTip: 'Bấm để đổi chế độ chơi'
    },
    en: {
      gameTitle: racingConfig.title || 'KNOWLEDGE GRAND PRIX',
      learningCategory: '📚 Learning Points',
      disciplineCategory: '🎖️ Discipline Points',
      timeLeft: 'Time Remaining:',
      startBtn: '🚀 START / LAUNCH RACE NOW 🏁',
      restartBtn: 'Restart',
      teacherLocked: '⏳ Race track is locked. Please wait for the teacher to start!',
      teacherActive: '🚀 Race track is ACTIVE! Click Start to race.',
      speedTable: 'Vehicle Distance Reference',
      activateBtn: '⚡ ACTIVATE TRACK',
      activeBtn: '🟢 TRACK ACTIVE (Click to Pause)',
      settingsBtn: '⚙️ Track & Mode Settings',
      howToPlayBtn: '❓ How to Play',
      modeAllTeams: '⚡ All Teams Simultaneous',
      modeTurnBased: '🔄 Turn-based',
      modeSwitchTip: 'Click to toggle play mode'
    }
  }[language];

  return (
    <div className="relative w-full rounded-[36px] overflow-hidden border-4 border-[#F59E0B] shadow-[0_25px_60px_rgba(217,119,6,0.35)] bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] to-[#BAE6FD] p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {historyLoading && <div role="status" className="relative z-40 rounded-xl bg-sky-50 p-3 text-sm text-sky-800">Đang tải lịch sử Đường đua...</div>}
      {historyError && <div role="alert" className="fixed top-4 right-4 z-[200] max-w-md rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 shadow-lg">{historyError}<button className="ml-3 underline" onClick={() => setHistoryError('')}>Đóng</button></div>}
      {savingAnswer && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5 font-bold text-slate-800">Đang lưu lượt đua và điểm...</p></div>}
      {savingConfig && <div role="status" className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-900/30"><p className="rounded-xl bg-white p-5 font-bold text-slate-800">Đang lưu cấu hình đường đua...</p></div>}
      {/* 1. TOP CARTOON GAME HUD */}
      <div className="relative z-30 flex items-center justify-between flex-wrap gap-3 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-3xl border-3 border-amber-300 shadow-md">
        {/* Title, Category Badge & Mode Badge */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md border-2 border-white">
            🏎️
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-amber-900 tracking-wide flex items-center gap-2">
              <span>{t.gameTitle}</span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                {(racingConfig.category || 'Thi đua học tập') === 'Thi đua học tập'
                  ? t.learningCategory
                  : t.disciplineCategory}
              </span>

              {/* Mode indicator badge */}
              {isTeacherOrAdmin ? (
                <button
                  type="button"
                  onClick={() => handleTogglePlayMode(isAllTeams ? 'turn_based' : 'all_teams')}
                  className="px-2.5 py-0.5 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-[11px] font-black border border-indigo-300 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  title={t.modeSwitchTip}
                >
                  {isAllTeams ? <Zap className="w-3 h-3 text-indigo-600" /> : <Repeat className="w-3 h-3 text-indigo-600" />}
                  <span>{isAllTeams ? t.modeAllTeams : t.modeTurnBased}</span>
                </button>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 text-[11px] font-black border border-indigo-200 flex items-center gap-1">
                  {isAllTeams ? <Zap className="w-3 h-3 text-indigo-600" /> : <Repeat className="w-3 h-3 text-indigo-600" />}
                  <span>{isAllTeams ? t.modeAllTeams : t.modeTurnBased}</span>
                </span>
              )}

              <span className="text-xs text-slate-500 font-bold hidden md:inline">
                {racingConfig.trackLength}m • {racingConfig.trackCount || 4} Đội • {racingConfig.questions.length} Câu hỏi
              </span>
            </div>
          </div>
        </div>

        {/* Center Countdown Timer Display */}
        {racingStarted && !winnerTeam && !timeIsUp && (
          <div
            className={`px-4 py-2 rounded-2xl border-3 flex items-center gap-2 font-black transition-all shadow-md ${
              timeLeft <= 60
                ? 'bg-rose-50 text-rose-700 border-rose-500 animate-pulse ring-4 ring-rose-200'
                : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white border-white'
            }`}
          >
            <Clock className={`w-4 h-4 ${timeLeft <= 60 ? 'animate-spin' : ''}`} />
            <span className="text-xs uppercase">{t.timeLeft}</span>
            <span className="text-base font-black font-mono tracking-wider">
              {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:
              {(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Action Controls (Sound, Lang, Settings, Restart) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Answer History & Review Button */}
          <button
            type="button"
            onClick={() => {
              if (!soundMuted) soundFx.playClick();
              setShowRaceHistoryModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black shadow-2xs cursor-pointer flex items-center gap-1.5 border border-indigo-400"
            title="Xem lịch sử trả lời các chướng ngại vật & ôn tập câu hỏi"
          >
            <History className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Lịch sử ({raceHistory.length})</span>
            <span className="sm:hidden">({raceHistory.length})</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 shadow-2xs cursor-pointer"
            title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
          </button>

          {/* How to play modal */}
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200 cursor-pointer hidden sm:flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.howToPlayBtn}</span>
          </button>

          {/* Teacher Controls */}
          {isTeacherOrAdmin && (
            <>
              <button
                type="button"
                onClick={async () => {
                  const nextActive = !racingConfig.isActive;
                  if (!await persistConfig({ ...racingConfig, isActive: nextActive })) return;
                  if (nextActive) {
                    if (!soundMuted) soundFx.playSuccess();
                  } else {
                    if (!soundMuted) soundFx.playClick();
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs border transition-all ${
                  racingConfig.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-300'
                }`}
              >
                {racingConfig.isActive ? t.activeBtn : t.activateBtn}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (racingStarted && !winnerTeam && !timeIsUp) { setHistoryError('Hãy kết thúc hoặc chơi lại cuộc đua trước khi sửa cài đặt.'); return; }
                  setIsTeacherModalOpen(true);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">{t.settingsBtn}</span>
              </button>
            </>
          )}

          {racingStarted && (
            <Game3DButton variant="yellow" size="sm" onClick={handleStartRacing} icon={<RotateCcw className="w-3.5 h-3.5" />}>
              {t.restartBtn}
            </Game3DButton>
          )}
        </div>
      </div>

      {/* 2. RACING WORLD ARENA (FULL SCREEN 2D/2.5D CANVAS) */}
      <RacingTrackArena
        teams={racingTeams}
        vehicles={racingConfig.vehicles}
        trackLength={racingConfig.trackLength}
        activeTeamIdx={isAllTeams ? undefined : activeTeamIdx}
        isMoving={isMoving}
        movingTeamIdx={isAllTeams ? null : movingTeamIdx}
        winnerTeam={winnerTeam}
        reactionState={reactionState}
        onSelectTeamHistory={(teamName) => {
          setRaceHistorySearchTerm(teamName);
          setShowRaceHistoryModal(true);
        }}
      />

      {/* 3. IN-GAME CHECKPOINT QUESTION OVERLAY OR WELCOME SCREEN */}
      {!racingStarted ? (
        <div className="relative z-30 p-6 sm:p-10 bg-white/95 backdrop-blur-md rounded-3xl border-4 border-amber-400 shadow-2xl text-center space-y-6">
          <div className="text-6xl animate-bounce">🏎️💨🏍️🚲🚀</div>

          {!racingConfig.isActive && !isTeacherOrAdmin && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-900 border border-amber-300 rounded-2xl text-xs font-black shadow-xs">
              {t.teacherLocked}
            </div>
          )}

          {racingConfig.isActive && !isTeacherOrAdmin && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl text-xs font-black shadow-xs animate-bounce">
              {t.teacherActive}
            </div>
          )}

          <div className="max-w-xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">
              SẴN SÀNG BƯỚC VÀO ĐƯỜNG ĐUA TRI THỨC!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-bold">
              Cuộc so tài tốc độ giữa <strong>{racingConfig.trackCount || 4} đội chơi</strong> trên quãng đường{' '}
              <strong>{racingConfig.trackLength} mét</strong>. Chế độ hiện tại:{' '}
              <span className="text-indigo-600 font-black">
                {isAllTeams ? '⚡ Tất cả các đội cùng chơi đồng thời' : '🔄 Chơi lần lượt từng đội'}
              </span>.
            </p>
          </div>

          {/* Vehicle Distance Reference */}
          <div className="max-w-2xl mx-auto bg-amber-50/80 p-4 rounded-2xl border-2 border-amber-200 shadow-inner">
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-3 flex items-center justify-center gap-1.5">
              <span>🏎️</span> {t.speedTable}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {racingConfig.vehicles.map(v => (
                <div key={v.id} className="p-2.5 bg-white rounded-xl border border-amber-200 text-center shadow-xs">
                  <div className="h-12 flex items-center justify-center">
                    <RaceVehicleSvg vehicleId={v.id} vehicleName={v.name} teamColor="#f59e0b" size="sm" />
                  </div>
                  <div className="font-extrabold text-xs text-slate-800 truncate mt-1">{v.name}</div>
                  <div className="text-[11px] font-black text-orange-600">+{v.distance}m / lần</div>
                </div>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div>
            <button
              onClick={handleStartRacing}
              disabled={!racingConfig.isActive && !isTeacherOrAdmin}
              className={`px-8 sm:px-12 py-4 rounded-2xl text-sm sm:text-base font-black transition-all inline-flex items-center gap-3 ${
                !racingConfig.isActive && !isTeacherOrAdmin
                  ? 'bg-slate-300 text-slate-500 border border-slate-300 shadow-none cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white shadow-[0_12px_30px_rgba(225,29,72,0.5)] hover:scale-105 cursor-pointer ring-4 ring-red-200 animate-pulse border-2 border-white'
              }`}
            >
              <Play className="w-5 h-5" />
              <span>{t.startBtn}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-30">
          <RaceQuestionOverlay
            question={currentQ}
            questionIndex={currentQuestionIdx}
            totalQuestions={racingConfig.questions.length}
            activeTeam={activeTeam}
            teams={racingTeams}
            playMode={currentPlayMode}
            selectedOption={selectedOpt}
            fillText={fillText}
            onSelectOption={opt => setSelectedOpt(opt)}
            onChangeFillText={txt => setFillText(txt)}
            onSubmitAnswer={handleAnswerQuestionSingle}
            teamAnswers={teamAnswers}
            teamCorrectStates={teamCorrectStates}
            onToggleTeamCorrect={handleToggleTeamCorrect}
            onSetTeamAnswer={handleSetTeamAnswer}
            onSetAllTeamsCorrect={handleSetAllTeamsCorrect}
            onSubmitAllTeamsRound={handleSubmitAllTeamsRound}
            feedbackState={feedbackState}
            language={language}
          />
        </div>
      )}

      {/* 4. MYSTERY VEHICLE RANDOM SPIN MODAL */}
      {showSpinModal && (
        <VehicleRevealWheel
          activeTeam={activeTeam}
          isMultiTeam={isAllTeams}
          winningTeams={racingTeams.filter(t => teamCorrectStates[t.id])}
          multiTeamAwards={multiTeamAwards}
          isSpinning={isSpinning}
          spinDisplayVehicle={spinDisplayVehicle}
          awardedVehicle={awardedVehicle}
          onSpin={isAllTeams ? handleSpinMultiTeams : handleSpinSingleVehicle}
          onContinue={isAllTeams ? handleContinueAfterMultiSpin : handleContinueAfterSingleSpin}
          language={language}
        />
      )}

      {/* 5. VICTORY CELEBRATION PODIUM MODAL */}
      {(winnerTeam || (timeIsUp && !winnerTeam)) && (
        <RaceCelebrationPodium
          winner={winnerTeam}
          teams={racingTeams}
          config={racingConfig}
          onRestart={handleStartRacing}
          language={language}
          isTimeUp={timeIsUp && !winnerTeam}
          onViewTeamHistory={(teamName) => {
            setRaceHistorySearchTerm(teamName);
            setShowRaceHistoryModal(true);
          }}
        />
      )}

      {/* 6. HOW TO PLAY MODAL */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-400 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-amber-900 flex items-center gap-2">
                <span>📖</span> Hướng Dẫn Trò Chơi Đường Đua
              </h3>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
              <p>
                <strong>Chế độ chơi:</strong> Giáo viên có thể thiết lập:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li>
                  <strong>⚡ Tất cả các đội cùng chơi:</strong> Tất cả các đội cùng tham gia trả lời mỗi câu hỏi. Mọi đội trả lời đúng đều được quay ngẫu nhiên phương tiện để cùng tăng tốc!
                </li>
                <li>
                  <strong>🔄 Chơi lần lượt:</strong> Mỗi câu hỏi dành cho một đội theo lượt tuần tự. Trả lời đúng để quay xe, trả lời sai chuyển lượt cho đội tiếp theo.
                </li>
              </ul>
              <p>
                2. Khi trả lời đúng, đội chơi sẽ được kích hoạt <strong>Vòng quay xe bí ẩn</strong> để nhận ngẫu nhiên phương tiện (Xe đạp, Mô tô, Siêu xe F1, Tên lửa,...).
              </p>
              <p>
                3. Mỗi loại xe sẽ giúp đội của bạn tiến thêm quãng đường tương ứng trên đường đua.
              </p>
              <p>
                4. Đội đầu tiên cán đích quãng đường quy định ({racingConfig.trackLength}m) sẽ giành chiến thắng và nhận điểm thưởng!
              </p>
            </div>
            <Game3DButton variant="orange" size="md" onClick={() => setShowHowToPlay(false)} className="w-full">
              Đã hiểu, sẵn sàng đua xe!
            </Game3DButton>
          </div>
        </div>
      )}

      {/* 7. TEACHER SETTINGS MODAL */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-4 border-amber-400 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-800">
                  Thiết lập Đường đua học tập & Chế độ chơi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTeacherModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs in teacher settings */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setSettingsTab('general')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === 'general'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🏁 Đường đua & Chế độ chơi
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('vehicles')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === 'vehicles'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🏎️ Loại xe & Quãng đường ({racingConfig.vehicles.length})
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('questions')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === 'questions'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ❓ Câu hỏi đường đua ({racingConfig.questions.length})
              </button>
            </div>

            {/* Tab 1: General & Play Mode */}
            {settingsTab === 'general' && (
              <form onSubmit={handleSaveGeneral} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề trò chơi đua xe:
                  </label>
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={e => setTempTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    required
                  />
                </div>

                {/* PLAY MODE SELECTOR CARDS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    🎮 Chế độ thi đấu giữa các đội:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setTempPlayMode('all_teams')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        tempPlayMode === 'all_teams'
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl text-xs">⚡</span>
                        <h4 className="text-xs font-black text-slate-800">
                          Tất cả các đội cùng chơi (Đồng thời)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug font-medium">
                        Tất cả các đội cùng tham gia trả lời mỗi câu hỏi. Tất cả đội trả lời đúng đều được quay xe và tăng tốc cùng lúc!
                      </p>
                    </div>

                    <div
                      onClick={() => setTempPlayMode('turn_based')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        tempPlayMode === 'turn_based'
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="p-1.5 bg-amber-100 text-amber-700 rounded-xl text-xs">🔄</span>
                        <h4 className="text-xs font-black text-slate-800">
                          Chơi lần lượt (Từng đội theo lượt)
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug font-medium">
                        Mỗi câu hỏi dành cho một đội theo lượt tuần tự. Đúng thì quay xe tiến lên, sai chuyển lượt cho đội kế tiếp.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🏷️ Phân loại thi đua:
                    </label>
                    <select
                      value={tempCategory}
                      onChange={e => setTempCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="Thi đua học tập">📚 Điểm học tập</option>
                      <option value="Thi đua rèn luyện">🎖️ Điểm rèn luyện</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ⏱️ Thời gian cuộc đua (phút):
                    </label>
                    <input
                      type="number"
                      value={tempTimeMinutes}
                      min={1}
                      max={60}
                      onChange={e => setTempTimeMinutes(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      🏁 Tổng quãng đường đua (m):
                    </label>
                    <input
                      type="number"
                      value={tempTrackLength}
                      min={100}
                      max={10000}
                      step={100}
                      onChange={e => setTempTrackLength(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      👥 Số đường đua / Đội:
                    </label>
                    <select
                      value={tempTrackCount}
                      onChange={e => setTempTrackCount(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value={2}>2 Đường đua (2 Đội)</option>
                      <option value={3}>3 Đường đua (3 Đội)</option>
                      <option value={4}>4 Đường đua (4 Đội)</option>
                      <option value={5}>5 Đường đua (5 Đội)</option>
                      <option value={6}>6 Đường đua (6 Đội)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  Lưu cấu hình đường đua & chế độ chơi
                </button>
              </form>
            )}

            {/* Tab 2: Vehicles */}
            {settingsTab === 'vehicles' && (
              <div className="space-y-4">
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {racingConfig.vehicles.map(v => (
                    <div key={v.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-8">
                          <RaceVehicleSvg vehicleId={v.id} vehicleName={v.name} teamColor="#f59e0b" size="sm" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800">{v.name}</div>
                          <div className="text-[11px] font-bold text-orange-600">+{v.distance}m / lần quay</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Questions */}
            {settingsTab === 'questions' && (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {racingConfig.questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-800">Câu #{idx + 1} ({q.type})</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Đ/A: {q.correctAnswer}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700">{q.question}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RACE QA HISTORY & REVISION MODAL */}
      {/* ========================================================================= */}
      {showRaceHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-4 border-2 border-amber-300 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                  <History className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                    <span>LỊCH SỬ CÂU HỎI ĐƯỜNG ĐUA</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                      {raceHistory.length} lượt trả lời
                    </span>
                  </h3>
                  <p className="text-xs font-medium text-slate-500">
                    Tra cứu câu hỏi các chướng ngại vật, đáp án đã trả lời và quà thưởng đạt được.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRaceHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Controls: Search & Filter */}
            <div className="space-y-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={raceHistorySearchTerm}
                    onChange={e => setRaceHistorySearchTerm(e.target.value)}
                    placeholder="Tìm nội dung câu hỏi, chướng ngại vật #, tên đội..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRaceHistoryFilterType('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      raceHistoryFilterType === 'all'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Tất cả ({raceHistory.length})
                  </button>
                  <button
                    onClick={() => setRaceHistoryFilterType('correct')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      raceHistoryFilterType === 'correct'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    ✅ Đúng ({raceHistory.filter(h => h.isCorrect).length})
                  </button>
                  <button
                    onClick={() => setRaceHistoryFilterType('wrong')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      raceHistoryFilterType === 'wrong'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                    }`}
                  >
                    ❌ Chưa đúng ({raceHistory.filter(h => !h.isCorrect).length})
                  </button>
                </div>
              </div>

              {/* Quick Team Filter Bar & Reveal All Button */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 border-t border-slate-200/60 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-black text-slate-500 whitespace-nowrap">Lọc theo đội:</span>
                  <button
                    onClick={() => setRaceHistorySearchTerm('')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      !raceHistorySearchTerm
                        ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    Tất cả các đội
                  </button>
                  {racingTeams.map(t => {
                    const isSelected = raceHistorySearchTerm.toLowerCase() === t.name.toLowerCase();
                    const count = raceHistory.filter(h => h.teamName.toLowerCase() === t.name.toLowerCase()).length;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setRaceHistorySearchTerm(t.name)}
                        style={{
                          backgroundColor: isSelected ? t.color : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          borderColor: t.color
                        }}
                        className="px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap border shadow-2xs flex items-center gap-1 hover:brightness-105"
                      >
                        <span>{t.name}</span>
                        <span className="opacity-80 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleToggleRevealAllRace}
                  className="px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  {revealAllRaceAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{revealAllRaceAnswers ? 'Ẩn tất cả đáp án' : 'Hiện tất cả đáp án'}</span>
                </button>
              </div>
            </div>

            {/* History Items List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {raceHistory.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">Chưa có lịch sử câu hỏi chướng ngại vật.</p>
                  <p className="text-xs text-slate-400">Xuất phát đua ngay để vượt qua các rào chắn và lưu lịch sử ôn tập!</p>
                </div>
              ) : (
                raceHistory
                  .filter(h => {
                    if (raceHistoryFilterType === 'correct' && !h.isCorrect) return false;
                    if (raceHistoryFilterType === 'wrong' && h.isCorrect) return false;
                    if (raceHistorySearchTerm.trim()) {
                      const term = raceHistorySearchTerm.toLowerCase();
                      const matchQ = h.questionText.toLowerCase().includes(term);
                      const matchObstacle = `chướng ngại vật #${h.obstacleNumber}`.includes(term) || `#${h.obstacleNumber}`.includes(term);
                      const matchTeam = h.teamName.toLowerCase().includes(term);
                      return matchQ || matchObstacle || matchTeam;
                    }
                    return true;
                  })
                  .map((rec, idx) => {
                    const origQ = racingConfig.questions.find(q => q.id === rec.questionId || q.question === rec.questionText);
                    const qType = rec.questionType || origQ?.type;
                    const qOptions = rec.options || origQ?.options || (qType === 'bool' ? (language === 'en' ? ['True', 'False'] : ['Đúng', 'Sai']) : undefined);
                    const isRevealed = !!revealedRaceAnswers[rec.id];

                    return (
                      <div
                        key={rec.id || idx}
                        className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                          rec.isCorrect ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                        }`}
                      >
                        {/* Header row */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 text-xs font-black shadow-2xs">
                              🚧 {rec.obstacleName || `Chướng ngại vật #${rec.obstacleNumber}`}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              • Câu hỏi #{rec.questionNumber}
                            </span>
                            <span
                              style={{ backgroundColor: rec.teamColor }}
                              className="px-2 py-0.5 rounded-full text-white text-[10px] font-black"
                            >
                              {rec.teamName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400">{rec.timestamp}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                              rec.isCorrect ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                            }`}>
                              {rec.isCorrect ? (rec.vehicleAwarded ? `🏎️ ${rec.vehicleAwarded} (+${rec.distanceGained}m)` : '✅ Vượt qua') : '❌ Chưa qua'}
                            </span>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="p-3 bg-white/90 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                          <div className="text-[10px] font-black uppercase text-amber-700 tracking-wider">
                            ❓ Câu hỏi #{rec.questionNumber}:
                          </div>
                          <div className="text-sm font-black text-slate-800 leading-snug">
                            {rec.questionText}
                          </div>
                        </div>

                        {/* Question Options List */}
                        {qOptions && qOptions.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            <div className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                              📋 Các lựa chọn của câu hỏi:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {qOptions.map((opt, oIdx) => {
                                const optLetter = String.fromCharCode(65 + oIdx);
                                const normOpt = opt.trim().toLowerCase();
                                const normSub = rec.submittedAnswer?.trim().toLowerCase();
                                const normCorr = rec.correctAnswer?.trim().toLowerCase();
                                
                                const isChosen = normSub === normOpt ||
                                  (normSub && normSub.includes(normOpt) && normOpt.length > 2) ||
                                  (normOpt === 'đúng' && (normSub === 'true' || normSub === 'đúng')) ||
                                  (normOpt === 'sai' && (normSub === 'false' || normSub === 'sai'));

                                const isCorrectOpt = normCorr === normOpt ||
                                  (normOpt === 'đúng' && (normCorr === 'true' || normCorr === 'đúng')) ||
                                  (normOpt === 'sai' && (normCorr === 'false' || normCorr === 'sai'));

                                let bgStyle = "bg-white border-slate-200 text-slate-700";
                                if (isChosen) {
                                  bgStyle = rec.isCorrect
                                    ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold shadow-2xs"
                                    : "bg-rose-100 border-rose-400 text-rose-950 font-bold shadow-2xs";
                                } else if (isRevealed && isCorrectOpt) {
                                  bgStyle = "bg-emerald-200/90 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400/50";
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${bgStyle}`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                        isChosen ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {optLetter}
                                      </span>
                                      <span className="truncate font-semibold">{opt}</span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {isChosen && (
                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                                          rec.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                                        }`}>
                                          {rec.isCorrect ? 'Đã chọn ✓' : 'Đã chọn ✗'}
                                        </span>
                                      )}
                                      {!isChosen && isRevealed && isCorrectOpt && (
                                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-600 text-white animate-in fade-in">
                                          Đáp án đúng ★
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-slate-500 bg-white/60 p-2 rounded-xl border border-slate-200">
                            ✍️ Dạng bài: Điền từ vào chỗ trống
                          </div>
                        )}

                        {/* Submitted Answer & Toggle Correct Answer row */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-600">📌 Đội đã chọn:</span>
                            <span className={`font-black px-2.5 py-1 rounded-xl border ${
                              rec.isCorrect
                                ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                : 'bg-rose-100 text-rose-950 border-rose-300'
                            }`}>
                              {rec.submittedAnswer || '(Bỏ trống)'}
                            </span>
                            <span className={`font-extrabold text-[11px] ${rec.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {rec.isCorrect ? '✅ Chính xác' : '❌ Chưa chính xác'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            {isRevealed ? (
                              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                <div className="px-3 py-1 rounded-xl bg-emerald-100 border-2 border-emerald-400 text-emerald-950 font-black text-xs shadow-2xs flex items-center gap-1.5">
                                  <span>💡 Đáp án đúng:</span>
                                  <span className="underline decoration-emerald-600 font-extrabold">{rec.correctAnswer}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleRevealRaceAnswer(rec.id)}
                                  className="px-2.5 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-all"
                                  title="Ẩn đáp án đúng"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Ẩn</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleRevealRaceAnswer(rec.id)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Hiện đáp án đúng</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer controls */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {isTeacherOrAdmin && raceHistory.length > 0 && (
                <button
                  disabled={savingAnswer || historyLoading}
                  onClick={async () => {
                    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử câu hỏi đường đua?')) {
                      if (!currentUser) return;
                      try {
                        const entries = raceHistory;
                        await deleteRaceHistory(racingConfig.classId, currentUser.id, entries);
                        setRaceHistory([]);
                        setRevealedRaceAnswers({});
                        setRevealAllRaceAnswers(false);
                        setHistoryError('');
                      } catch {
                        setHistoryError('Không thể xóa lịch sử Đường đua. Vui lòng thử lại.');
                      }
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa lịch sử</span>
                </button>
              )}
              <button
                onClick={() => setShowRaceHistoryModal(false)}
                className="ml-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
