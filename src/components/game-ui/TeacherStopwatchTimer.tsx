import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { soundFx } from '../../utils/sound';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Bell,
  Clock,
  Timer as TimerIcon,
  Maximize2,
  Minimize2,
  Plus,
  Flame,
  CheckCircle2,
  Sparkles,
  Award,
  Settings,
  Flag,
  Trash2,
  Radio,
  Sliders
} from 'lucide-react';

interface TeacherStopwatchTimerProps {
  currentUser: User;
  students?: User[];
}

type TimerMode = 'countdown' | 'stopwatch';
type RunningSoundType = 'tick' | 'heartbeat' | 'urgent_tick' | 'silent';
type AlarmSoundType = 'school_bell' | 'fanfare' | 'whistle' | 'siren' | 'none';

interface LapRecord {
  id: string;
  lapNumber: number;
  timeMs: number;
  splitMs: number;
  label: string;
  timestamp: string;
}

export const TeacherStopwatchTimer: React.FC<TeacherStopwatchTimerProps> = ({
  currentUser,
  students = []
}) => {
  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'admin';

  // Mode: Countdown (Đếm ngược) vs Stopwatch (Bấm giờ tiến)
  const [mode, setMode] = useState<TimerMode>('countdown');

  // Activity Label
  const [activityTitle, setActivityTitle] = useState('Thảo luận nhóm & Làm bài tập');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Countdown State
  const [initialHours, setInitialHours] = useState(0);
  const [initialMinutes, setInitialMinutes] = useState(3);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [countdownRemainingMs, setCountdownRemainingMs] = useState(3 * 60 * 1000);
  const [totalCountdownMs, setTotalCountdownMs] = useState(3 * 60 * 1000);

  // Stopwatch State
  const [stopwatchElapsedMs, setStopwatchElapsedMs] = useState(0);
  const [laps, setLaps] = useState<LapRecord[]>([]);
  const [lapLabelInput, setLapLabelInput] = useState('');

  // Running State
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Sound Settings (Teacher / Admin Config)
  const [runningSoundEnabled, setRunningSoundEnabled] = useState(true);
  const [runningSoundType, setRunningSoundType] = useState<RunningSoundType>('tick');
  const [urgentWarningEnabled, setUrgentWarningEnabled] = useState(true);
  const [alarmSoundType, setAlarmSoundType] = useState<AlarmSoundType>('school_bell');
  const [soundVolumeLevel, setSoundVolumeLevel] = useState<'normal' | 'loud'>('normal');

  // Display Settings
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // End of Time Notification Modal
  const [showTimesUpModal, setShowTimesUpModal] = useState(false);
  const [timesUpMessage, setTimesUpMessage] = useState('HẾT GIỜ LÀM BÀI / HOẠT ĐỘNG KẾT THÚC!');

  // Confetti particles on time's up
  const [confettiActive, setConfettiActive] = useState(false);

  // Timing references
  const lastTickSecondRef = useRef<number>(-1);
  const intervalRef = useRef<any>(null);
  const alarmIntervalRef = useRef<any>(null);

  // Format Helper: milliseconds to HH:MM:SS or MM:SS.ms
  const formatTime = (ms: number, includeMs = false) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (includeMs) {
      if (hours > 0) {
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;
      }
      return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds)}`;
    }

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Sound triggering during running clock
  const playCurrentRunningSound = (secondsRemaining: number) => {
    if (!runningSoundEnabled || runningSoundType === 'silent') return;

    if (mode === 'countdown' && secondsRemaining <= 10 && secondsRemaining > 0 && urgentWarningEnabled) {
      soundFx.playTimerUrgent();
      return;
    }

    if (runningSoundType === 'tick') {
      soundFx.playTimerTick(secondsRemaining % 2 === 0);
    } else if (runningSoundType === 'heartbeat') {
      soundFx.playHeartbeat();
    } else if (runningSoundType === 'urgent_tick') {
      soundFx.playTimerUrgent();
    }
  };

  // Play End Alarm
  const triggerTimesUpAlarm = () => {
    if (alarmSoundType === 'school_bell') {
      soundFx.playAlarmBell();
      let count = 0;
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = setInterval(() => {
        count++;
        soundFx.playAlarmBell();
        if (count >= 2) clearInterval(alarmIntervalRef.current);
      }, 1200);
    } else if (alarmSoundType === 'fanfare') {
      soundFx.playFanfare();
    } else if (alarmSoundType === 'whistle') {
      soundFx.playWhistle();
      setTimeout(() => soundFx.playWhistle(), 600);
    } else if (alarmSoundType === 'siren') {
      soundFx.playAlarmBell();
    }
  };

  // Timer Tick Loop
  useEffect(() => {
    if (isRunning && !isPaused) {
      const startTime = Date.now();
      const initialMs = mode === 'countdown' ? countdownRemainingMs : stopwatchElapsedMs;

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = now - startTime;

        if (mode === 'countdown') {
          const newRemaining = Math.max(0, initialMs - delta);
          setCountdownRemainingMs(newRemaining);

          const currentSecond = Math.ceil(newRemaining / 1000);
          if (currentSecond !== lastTickSecondRef.current) {
            lastTickSecondRef.current = currentSecond;
            playCurrentRunningSound(currentSecond);
          }

          // Trigger Time's up!
          if (newRemaining <= 0) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsPaused(false);
            triggerTimesUpAlarm();
            setShowTimesUpModal(true);
            setConfettiActive(true);
            setTimeout(() => setConfettiActive(false), 5000);
          }
        } else {
          // Stopwatch
          const newElapsed = initialMs + delta;
          setStopwatchElapsedMs(newElapsed);

          const currentSecond = Math.floor(newElapsed / 1000);
          if (currentSecond !== lastTickSecondRef.current) {
            lastTickSecondRef.current = currentSecond;
            if (runningSoundEnabled && runningSoundType !== 'silent') {
              playCurrentRunningSound(currentSecond);
            }
          }
        }
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, mode, runningSoundEnabled, runningSoundType, urgentWarningEnabled, alarmSoundType]);

  // Cleanup alarm interval on unmount
  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, []);

  // Handlers
  const handleStart = () => {
    soundFx.playClick();
    if (mode === 'countdown' && countdownRemainingMs <= 0) {
      handleReset();
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    soundFx.playClick();
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleResume = () => {
    soundFx.playClick();
    setIsPaused(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    soundFx.playClick();
    setIsRunning(false);
    setIsPaused(false);
    if (mode === 'countdown') {
      const total = (initialHours * 3600 + initialMinutes * 60 + initialSeconds) * 1000;
      setCountdownRemainingMs(total > 0 ? total : 60000);
      setTotalCountdownMs(total > 0 ? total : 60000);
    } else {
      setStopwatchElapsedMs(0);
      setLaps([]);
    }
    lastTickSecondRef.current = -1;
    if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
  };

  // Add Quick Time (+seconds / +minutes)
  const handleAddQuickTime = (seconds: number) => {
    soundFx.playBonus();
    const addMs = seconds * 1000;
    setCountdownRemainingMs(prev => prev + addMs);
    setTotalCountdownMs(prev => prev + addMs);
  };

  // Apply Preset Countdown
  const handleApplyPreset = (minutes: number, seconds: number = 0, title?: string) => {
    soundFx.playClick();
    setIsRunning(false);
    setIsPaused(false);
    setInitialHours(0);
    setInitialMinutes(minutes);
    setInitialSeconds(seconds);
    const ms = (minutes * 60 + seconds) * 1000;
    setCountdownRemainingMs(ms);
    setTotalCountdownMs(ms);
    if (title) setActivityTitle(title);
  };

  // Apply Custom Setting from Inputs
  const handleApplyCustomTime = (h: number, m: number, s: number) => {
    const validH = Math.max(0, h);
    const validM = Math.max(0, Math.min(59, m));
    const validS = Math.max(0, Math.min(59, s));
    setInitialHours(validH);
    setInitialMinutes(validM);
    setInitialSeconds(validS);
    const total = (validH * 3600 + validM * 60 + validS) * 1000;
    const finalMs = total > 0 ? total : 60000;
    setCountdownRemainingMs(finalMs);
    setTotalCountdownMs(finalMs);
    setIsRunning(false);
    setIsPaused(false);
  };

  // Record Lap in Stopwatch
  const handleRecordLap = () => {
    soundFx.playCoin();
    const lastLapTime = laps.length > 0 ? laps[0].timeMs : 0;
    const splitMs = stopwatchElapsedMs - lastLapTime;
    const newLap: LapRecord = {
      id: 'lap_' + Date.now(),
      lapNumber: laps.length + 1,
      timeMs: stopwatchElapsedMs,
      splitMs,
      label: lapLabelInput.trim() || `Lượt ${laps.length + 1}`,
      timestamp: new Date().toLocaleTimeString()
    };
    setLaps([newLap, ...laps]);
    setLapLabelInput('');
  };

  // Calculate Progress Percentage for Countdown Ring
  const progressRatio =
    mode === 'countdown'
      ? totalCountdownMs > 0
        ? Math.max(0, Math.min(1, countdownRemainingMs / totalCountdownMs))
        : 0
      : 1;

  // Determine current theme color based on time remaining
  const getProgressColor = () => {
    if (mode === 'stopwatch') return { stroke: '#3B82F6', bg: 'from-blue-600 to-indigo-700', text: 'text-blue-600' };
    if (countdownRemainingMs <= 10000 && countdownRemainingMs > 0) {
      return { stroke: '#EF4444', bg: 'from-rose-600 to-red-700', text: 'text-red-500 animate-pulse' };
    }
    if (progressRatio < 0.25) {
      return { stroke: '#F59E0B', bg: 'from-amber-500 to-orange-600', text: 'text-amber-500' };
    }
    return { stroke: '#10B981', bg: 'from-emerald-600 to-teal-700', text: 'text-emerald-500' };
  };

  const themeColors = getProgressColor();

  return (
    <div
      className={`transition-all duration-300 ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-slate-950 text-white p-6 sm:p-10 flex flex-col justify-between overflow-y-auto'
          : 'space-y-6'
      }`}
    >
      {/* Confetti Celebration FX */}
      {confettiActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-xs animate-bounce"
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'][i % 6],
                transform: `rotate(${Math.random() * 360}deg)`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-3xl border-2 border-amber-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
            {mode === 'countdown' ? <TimerIcon className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                {isTeacherOrAdmin ? 'Giáo viên & Quản trị viên' : 'Tiện ích lớp học'}
              </span>
              {isRunning && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Đang chạy
                </span>
              )}
            </div>

            {isEditingTitle ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={activityTitle}
                  onChange={e => setActivityTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="px-2 py-1 text-sm font-bold bg-amber-50 border border-amber-300 rounded-lg text-slate-800"
                  autoFocus
                />
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg"
                >
                  Lưu
                </button>
              </div>
            ) : (
              <h3
                onClick={() => isTeacherOrAdmin && setIsEditingTitle(true)}
                className={`text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 ${
                  isTeacherOrAdmin ? 'cursor-pointer hover:text-amber-600' : ''
                }`}
                title="Nhấn để đổi tên hoạt động"
              >
                {activityTitle}
                {isTeacherOrAdmin && <span className="text-xs text-amber-500 font-normal underline">✏️</span>}
              </h3>
            )}
          </div>
        </div>

        {/* Action Buttons: Mode Switch & Sound Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switch */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                if (isRunning) handlePause();
                setMode('countdown');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'countdown'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
              }`}
            >
              <TimerIcon className="w-3.5 h-3.5" /> Đếm ngược
            </button>
            <button
              onClick={() => {
                if (isRunning) handlePause();
                setMode('stopwatch');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'stopwatch'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Bấm giờ
            </button>
          </div>

          {/* Quick Sound Toggle (Mute/Unmute while running) */}
          <button
            onClick={() => {
              soundFx.playClick();
              setRunningSoundEnabled(!runningSoundEnabled);
            }}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              runningSoundEnabled
                ? 'bg-amber-50 dark:bg-slate-800 border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-500 hover:bg-slate-200'
            }`}
            title={runningSoundEnabled ? 'Âm thanh khi chạy: BẬT' : 'Âm thanh khi chạy: TẮT'}
          >
            {runningSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {runningSoundEnabled ? (runningSoundType === 'tick' ? 'Tích tắc' : 'Nhịp tim') : 'Tắt tiếng'}
            </span>
          </button>

          {/* Settings Modal Button */}
          {isTeacherOrAdmin && (
            <button
              onClick={() => {
                soundFx.playClick();
                setShowSettingsModal(true);
              }}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Cài đặt thời gian & âm thanh nâng cao"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden md:inline">Cài đặt</span>
            </button>
          )}

          {/* Full Screen Toggle */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsFullScreen(!isFullScreen);
            }}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-md flex items-center gap-1 text-xs font-bold"
            title={isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình máy chiếu'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullScreen ? 'Thu nhỏ' : 'Chiếu lớn'}</span>
          </button>
        </div>
      </div>

      {/* Main Clock Stage & 3D Interactive Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Clock Visualization */}
        <div
          className={`${
            isFullScreen ? 'lg:col-span-12' : 'lg:col-span-8'
          } bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-10 border-4 border-amber-300 dark:border-amber-400 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center`}
        >
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 opacity-20 blur-3xl pointer-events-none"
            style={{
              background:
                mode === 'countdown'
                  ? countdownRemainingMs <= 10000
                    ? 'radial-gradient(circle, #EF4444 0%, transparent 70%)'
                    : 'radial-gradient(circle, #10B981 0%, transparent 70%)'
                  : 'radial-gradient(circle, #3B82F6 0%, transparent 70%)'
            }}
          />

          {/* Activity Banner */}
          <div className="relative z-10 mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <span>🎯</span> {activityTitle}
          </div>

          {/* Big Circular Progress + Digital Clock */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center my-4">
            {/* SVG Circular Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-800"
                strokeWidth="6"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              {mode === 'countdown' && (
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  stroke={themeColors.stroke}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 * (1 - progressRatio)}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                />
              )}
            </svg>

            {/* Center Digital Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white select-none">
              {/* Main Digital Time Number */}
              <div
                className={`font-mono font-black tracking-tight text-shadow-lg ${
                  isFullScreen
                    ? 'text-6xl sm:text-8xl md:text-9xl'
                    : 'text-5xl sm:text-6xl md:text-7xl'
                } ${
                  mode === 'countdown' && countdownRemainingMs <= 10000 && countdownRemainingMs > 0
                    ? 'text-red-400 animate-pulse'
                    : 'text-amber-400'
                }`}
              >
                {mode === 'countdown'
                  ? formatTime(countdownRemainingMs)
                  : formatTime(stopwatchElapsedMs, true)}
              </div>

              {/* Status Label */}
              <div className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-300">
                {mode === 'countdown' ? (
                  countdownRemainingMs <= 0 ? (
                    <span className="text-red-400 font-black animate-bounce flex items-center gap-1">
                      <Bell className="w-4 h-4" /> HẾT THỜI GIAN!
                    </span>
                  ) : (
                    <span>
                      Tổng: {formatTime(totalCountdownMs)} • Còn {Math.ceil(countdownRemainingMs / 1000)}s
                    </span>
                  )
                ) : (
                  <span>Đã bấm: {laps.length} lượt ghi nhận</span>
                )}
              </div>

              {/* Sound Mode Indicator Pill */}
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                    runningSoundEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {runningSoundEnabled ? '🔊 Âm thanh chạy: BẬT' : '🔇 Âm thanh chạy: TẮT'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Chuông: {alarmSoundType !== 'none' ? 'Bật' : 'Tắt'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Add Time Buttons (when in countdown mode) */}
          {mode === 'countdown' && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 relative z-10">
              <span className="text-xs font-bold text-slate-400 mr-1">Thêm nhanh:</span>
              <button
                onClick={() => handleAddQuickTime(15)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition-all hover:scale-105"
              >
                +15s
              </button>
              <button
                onClick={() => handleAddQuickTime(30)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition-all hover:scale-105"
              >
                +30s
              </button>
              <button
                onClick={() => handleAddQuickTime(60)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition-all hover:scale-105"
              >
                +1 Phút
              </button>
              <button
                onClick={() => handleAddQuickTime(300)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold cursor-pointer transition-all hover:scale-105"
              >
                +5 Phút
              </button>
            </div>
          )}

          {/* Big Control Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 relative z-10 w-full max-w-md">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex-1 min-w-[140px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-base sm:text-lg shadow-[0_4px_0_#065F46] hover:shadow-[0_2px_0_#065F46] hover:translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-5 h-5 fill-current" /> BẮT ĐẦU
              </button>
            ) : isPaused ? (
              <button
                onClick={handleResume}
                className="flex-1 min-w-[140px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-base sm:text-lg shadow-[0_4px_0_#065F46] cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" /> TIẾP TỤC
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 min-w-[140px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-base sm:text-lg shadow-[0_4px_0_#9A3412] cursor-pointer flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5 fill-current" /> TẠM DỪNG
              </button>
            )}

            {/* Stopwatch Lap button */}
            {mode === 'stopwatch' && isRunning && (
              <button
                onClick={handleRecordLap}
                className="py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-[0_4px_0_#1E40AF] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Flag className="w-5 h-5" /> Ghi Lượt (Lap)
              </button>
            )}

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-base border-2 border-slate-700 cursor-pointer flex items-center justify-center gap-2 transition-all hover:text-white"
            >
              <RotateCcw className="w-5 h-5" /> ĐẶT LẠI
            </button>
          </div>
        </div>

        {/* Right Column: Presets & Controls (Only shown when not full screen) */}
        {!isFullScreen && (
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Presets Box */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-amber-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <span>⚡</span> Mốc thời gian lớp học
                </h4>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Chọn nhanh
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleApplyPreset(0, 15, '⚡ Trả lời nhanh (15 giây)')}
                  className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-amber-900 text-sm group-hover:text-amber-700">15 Giây</div>
                  <div className="text-[11px] text-slate-600 font-medium">Khởi động nhanh</div>
                </button>

                <button
                  onClick={() => handleApplyPreset(0, 30, '⏱️ Suy nghĩ câu hỏi (30 giây)')}
                  className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-amber-900 text-sm group-hover:text-amber-700">30 Giây</div>
                  <div className="text-[11px] text-slate-600 font-medium">Hái hoa / Đố vui</div>
                </button>

                <button
                  onClick={() => handleApplyPreset(1, 0, '🎯 Thử thách 1 phút')}
                  className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-emerald-900 text-sm group-hover:text-emerald-700">1 Phút</div>
                  <div className="text-[11px] text-slate-600 font-medium">Thuyết trình ngắn</div>
                </button>

                <button
                  onClick={() => handleApplyPreset(2, 0, '👥 Thảo luận cặp đôi (2 phút)')}
                  className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-emerald-900 text-sm group-hover:text-emerald-700">2 Phút</div>
                  <div className="text-[11px] text-slate-600 font-medium">Thảo luận cặp đôi</div>
                </button>

                <button
                  onClick={() => handleApplyPreset(3, 0, '🤝 Thảo luận nhóm 4 (3 phút)')}
                  className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-sky-900 text-sm group-hover:text-sky-700">3 Phút</div>
                  <div className="text-[11px] text-slate-600 font-medium">Thảo luận nhóm</div>
                </button>

                <button
                  onClick={() => handleApplyPreset(5, 0, '📚 Hoạt động nhóm / Trò chơi (5 phút)')}
                  className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-sky-900 text-sm group-hover:text-sky-700">5 Phút</div>
                  <div className="text-[11px] text-slate-600 font-medium">Giải bài tập nhóm</div>
                </button>

                <button
                  onClick={() => handleApplyPreset(10, 0, '📝 Kiểm tra nhanh (10 phút)')}
                  className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-purple-900 text-sm group-hover:text-purple-700">10 Phút</div>
                  <div className="text-[11px] text-slate-600 font-medium">Làm bài cá nhân</div>
                </button>

                <button
                  onClick={() => handleApplyPreset(15, 0, '📊 Kiểm tra 15 phút')}
                  className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition-all cursor-pointer group"
                >
                  <div className="font-black text-rose-900 text-sm group-hover:text-rose-700">15 Phút</div>
                  <div className="text-[11px] text-slate-600 font-medium">Kiểm tra định kỳ</div>
                </button>
              </div>
            </div>

            {/* Custom Input Setup for Teachers */}
            {isTeacherOrAdmin && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-amber-200 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <span>⚙️</span> Tự thiết lập thời gian
                </h4>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Giờ</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={initialHours}
                      onChange={e => handleApplyCustomTime(Number(e.target.value), initialMinutes, initialSeconds)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phút</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={initialMinutes}
                      onChange={e => handleApplyCustomTime(initialHours, Number(e.target.value), initialSeconds)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Giây</label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={initialSeconds}
                      onChange={e => handleApplyCustomTime(initialHours, initialMinutes, Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-center"
                    />
                  </div>
                </div>

                {/* Sound Settings Quick Options */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-amber-500" /> Phát âm thanh khi đồng hồ chạy
                    </span>
                    <input
                      type="checkbox"
                      checked={runningSoundEnabled}
                      onChange={e => setRunningSoundEnabled(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 cursor-pointer"
                    />
                  </label>

                  {runningSoundEnabled && (
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => { soundFx.playClick(); setRunningSoundType('tick'); }}
                        className={`flex-1 py-1 px-2 rounded-lg font-bold cursor-pointer ${
                          runningSoundType === 'tick'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        ⏰ Tích tắc
                      </button>
                      <button
                        onClick={() => { soundFx.playClick(); setRunningSoundType('heartbeat'); }}
                        className={`flex-1 py-1 px-2 rounded-lg font-bold cursor-pointer ${
                          runningSoundType === 'heartbeat'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        💓 Nhịp tim
                      </button>
                    </div>
                  )}

                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between cursor-pointer pt-1">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-rose-500" /> Chuông báo khi hết giờ
                    </span>
                    <select
                      value={alarmSoundType}
                      onChange={e => setAlarmSoundType(e.target.value as AlarmSoundType)}
                      className="p-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="school_bell">🔔 Chuông trường học</option>
                      <option value="fanfare">🎺 Kèn khải hoàn</option>
                      <option value="whistle">📢 Tiếng còi kết thúc</option>
                      <option value="none">🔇 Tắt chuông</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* Stopwatch Laps Table */}
            {mode === 'stopwatch' && laps.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-blue-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                    <Flag className="w-4 h-4 text-blue-600" /> Bảng ghi nhận lượt ({laps.length})
                  </h4>
                  <button
                    onClick={() => setLaps([])}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa tất cả
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {laps.map(lap => (
                    <div
                      key={lap.id}
                      className="p-2.5 rounded-2xl bg-blue-50/60 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-[10px]">
                          #{lap.lapNumber}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{lap.label}</div>
                          <div className="text-[10px] text-slate-500">{lap.timestamp}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-blue-600 dark:text-blue-400">
                          {formatTime(lap.timeMs, true)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          +{formatTime(lap.splitMs, true)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TIME'S UP NOTIFICATION MODAL (BÁO HẾT GIỜ KHI ĐẾM NGƯỢC XONG) */}
      {/* ========================================================================= */}
      {showTimesUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-amber-400 shadow-2xl text-center space-y-5 animate-scaleUp">
            {/* Animated Alarm Icon */}
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-red-500 flex items-center justify-center text-white shadow-xl animate-bounce">
              <Bell className="w-10 h-10 animate-wiggle" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider">
                ⏰ THÔNG BÁO TỪ ĐỒNG HỒ
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                HẾT THỜI GIAN!
              </h3>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">
                {activityTitle}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Thời gian làm bài và hoạt động đã kết thúc. Mời các nhóm / học sinh dừng bút và tổng kết kết quả!
              </p>
            </div>

            {/* Modal Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                onClick={() => {
                  soundFx.playClick();
                  if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
                  setShowTimesUpModal(false);
                }}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Đã rõ (Đóng)
              </button>

              <button
                onClick={() => {
                  setShowTimesUpModal(false);
                  handleAddQuickTime(60);
                  handleStart();
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Thêm 1 phút
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADVANCED SETTINGS MODAL FOR TEACHER / ADMIN */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border-2 border-amber-300 dark:border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" /> Cài đặt đồng hồ giảng dạy
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* 1. Activity Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tên hoạt động hiển thị
              </label>
              <input
                type="text"
                value={activityTitle}
                onChange={e => setActivityTitle(e.target.value)}
                placeholder="Ví dụ: Thảo luận nhóm 4, Kiểm tra 15 phút..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            {/* 2. Sound While Running */}
            <div className="space-y-2 p-4 bg-amber-50/50 dark:bg-slate-800/50 rounded-2xl border border-amber-100 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-600" /> Âm thanh khi đồng hồ đang chạy
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Phát tiếng tích tắc hoặc nhịp tim để tạo nhịp điệu tập trung
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={runningSoundEnabled}
                  onChange={e => setRunningSoundEnabled(e.target.checked)}
                  className="w-5 h-5 rounded text-amber-600 cursor-pointer"
                />
              </div>

              {runningSoundEnabled && (
                <div className="pt-2 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => { soundFx.playTimerTick(); setRunningSoundType('tick'); }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      runningSoundType === 'tick'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                    }`}
                  >
                    ⏰ Tích tắc đồng hồ
                  </button>
                  <button
                    onClick={() => { soundFx.playHeartbeat(); setRunningSoundType('heartbeat'); }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      runningSoundType === 'heartbeat'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                    }`}
                  >
                    💓 Nhịp tim hồi hộp
                  </button>
                  <button
                    onClick={() => { soundFx.playTimerUrgent(); setRunningSoundType('urgent_tick'); }}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      runningSoundType === 'urgent_tick'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                    }`}
                  >
                    ⚡ Kỹ thuật số
                  </button>
                </div>
              )}
            </div>

            {/* 3. Urgent 10-second Warning */}
            <div className="flex items-center justify-between p-4 bg-rose-50/50 dark:bg-slate-800/50 rounded-2xl border border-rose-100 dark:border-slate-700">
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" /> Cảnh báo 10 giây cuối cùng
                </div>
                <div className="text-[11px] text-slate-500">
                  Nhấp nháy đỏ và phát âm thanh dồn dập khi sắp hết giờ
                </div>
              </div>
              <input
                type="checkbox"
                checked={urgentWarningEnabled}
                onChange={e => setUrgentWarningEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-rose-600 cursor-pointer"
              />
            </div>

            {/* 4. Alarm Sound on Completion */}
            <div className="space-y-2 p-4 bg-emerald-50/50 dark:bg-slate-800/50 rounded-2xl border border-emerald-100 dark:border-slate-700">
              <div className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-600" /> Kiểu chuông báo khi hết giờ
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { soundFx.playAlarmBell(); setAlarmSoundType('school_bell'); }}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 cursor-pointer ${
                    alarmSoundType === 'school_bell'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>🔔</span> Chuông trường học
                </button>
                <button
                  onClick={() => { soundFx.playFanfare(); setAlarmSoundType('fanfare'); }}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 cursor-pointer ${
                    alarmSoundType === 'fanfare'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>🎺</span> Kèn Fanfare
                </button>
                <button
                  onClick={() => { soundFx.playWhistle(); setAlarmSoundType('whistle'); }}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 cursor-pointer ${
                    alarmSoundType === 'whistle'
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>📢</span> Tiếng còi trọng tài
                </button>
                <button
                  onClick={() => setAlarmSoundType('none')}
                  className={`p-2.5 rounded-xl text-xs font-bold border text-left flex items-center gap-2 cursor-pointer ${
                    alarmSoundType === 'none'
                      ? 'bg-slate-800 text-white border-slate-900'
                      : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>🔇</span> Tắt chuông báo
                </button>
              </div>
            </div>

            {/* Save / Apply Button */}
            <button
              onClick={() => {
                soundFx.playSuccess();
                setShowSettingsModal(false);
              }}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md cursor-pointer"
            >
              Hoàn tất & Lưu cài đặt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
