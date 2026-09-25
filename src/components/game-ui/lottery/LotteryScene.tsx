import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User } from '../../../types';
import { soundFx } from '../../../utils/sound';
import { Game3DButton } from '../Game3DButton';
import { LotteryCageSvg } from './LotteryCageSvg';
import { LotteryBallSvg, LOTTERY_BALL_PALETTES } from './LotteryBallSvg';
import { LotteryWinnerModal } from './LotteryWinnerModal';
import {
  Sparkles,
  Trophy,
  History,
  Users,
  Volume2,
  VolumeX,
  Languages,
  RotateCw,
  Filter,
  CheckCircle2,
  X,
  Crown,
  Play,
  RotateCcw,
  Plus,
  Minus,
  Settings2,
  Sliders,
  Hash,
  Shuffle
} from 'lucide-react';

interface LotterySceneProps {
  currentUser?: User;
  students: User[];
  onAwardPoints?: (student: User, points: number, reason: string) => void;
  onSelectStudent?: (student: User) => void;
  language?: 'vi' | 'en';
}

export interface LotteryBallItem {
  number: number;
  colorIndex: number;
  student?: User | null;
}

interface PhysicsBall {
  item: LotteryBallItem;
  x: number; // relative px from cage center
  y: number; // relative px from cage center
  z: number; // depth (-1 to 1) for 3D perspective & layer ordering
  vx: number;
  vy: number;
  vz: number;
  rot: number; // real-time angular rotation in degrees
  vRot: number; // rotation speed (deg/s)
  scale: number;
}

export const LotteryScene: React.FC<LotterySceneProps> = ({
  currentUser,
  students,
  onAwardPoints,
  onSelectStudent,
  language: initialLang = 'vi'
}) => {
  // Game states & Ball count configuration
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [excludeWinners, setExcludeWinners] = useState<boolean>(true);
  
  // Ball Mode: 'roster' (Theo danh sách lớp) | 'custom' (Số lượng banh do GV/Admin thiết lập)
  const [ballMode, setBallMode] = useState<'roster' | 'custom'>('roster');
  const [customBallCount, setCustomBallCount] = useState<number>(() => {
    return students.length > 0 ? Math.min(Math.max(students.length, 2), 100) : 30;
  });

  const [winnerHistory, setWinnerHistory] = useState<Array<{
    student: User | null;
    number: number;
    colorIndex: number;
    time: string;
  }>>([]);

  // Active spin animation state
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinPhase, setSpinPhase] = useState<'idle' | 'accel' | 'fast' | 'decel' | 'eject' | 'winner'>('idle');
  const [rotationAngle, setRotationAngle] = useState(0);
  const [hasBallInChute, setHasBallInChute] = useState(false);

  // Selected winner state
  const [winningStudent, setWinningStudent] = useState<User | null>(null);
  const [winningBallInfo, setWinningBallInfo] = useState<{ number: number; colorIndex: number } | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Drawers & Modals
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showStudentsDrawer, setShowStudentsDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [language, setLanguage] = useState<'vi' | 'en'>(initialLang);

  // Animation refs
  const requestRef = useRef<number | null>(null);
  const spinStartTimeRef = useRef<number>(0);
  const currentSpeedRef = useRef<number>(0);
  const lastSoundClackRef = useRef<number>(0);
  const chosenWinnerRef = useRef<{ student: User | null; number: number; colorIndex: number } | null>(null);

  // Extract unique classes & teams
  const availableClasses = Array.from(new Set(students.map(s => s.className).filter(Boolean))) as string[];
  const availableTeams = Array.from(new Set(students.map(s => s.team).filter(Boolean))) as string[];

  // Filtered pool of students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedClass !== 'all' && s.className !== selectedClass) return false;
      if (selectedTeam !== 'all' && s.team !== selectedTeam) return false;
      return true;
    });
  }, [students, selectedClass, selectedTeam]);

  // Compute total configured balls & ball list
  const allConfiguredBalls = useMemo<LotteryBallItem[]>(() => {
    if (ballMode === 'roster') {
      const count = Math.max(1, filteredStudents.length);
      return filteredStudents.map((st, idx) => ({
        number: idx + 1,
        colorIndex: idx % LOTTERY_BALL_PALETTES.length,
        student: st
      }));
    } else {
      const count = Math.min(Math.max(customBallCount, 2), 100);
      const items: LotteryBallItem[] = [];
      for (let i = 1; i <= count; i++) {
        const student = filteredStudents[i - 1] || null;
        items.push({
          number: i,
          colorIndex: (i - 1) % LOTTERY_BALL_PALETTES.length,
          student
        });
      }
      return items;
    }
  }, [ballMode, filteredStudents, customBallCount]);

  // Filter out previous winners if toggle active
  const eligibleBalls = useMemo<LotteryBallItem[]>(() => {
    if (!excludeWinners) return allConfiguredBalls;
    const wonNumbers = new Set(winnerHistory.map(w => w.number));
    return allConfiguredBalls.filter(b => !wonNumbers.has(b.number));
  }, [allConfiguredBalls, excludeWinners, winnerHistory]);

  // Physics simulation balls inside the cage
  const [physicsBalls, setPhysicsBalls] = useState<PhysicsBall[]>([]);

  // Initialize ball positions inside cage whenever eligibleBalls change
  useEffect(() => {
    const rLimit = 80; // radius limit inside cage
    // Visually display up to 45 balls in the cage for smooth physics while preserving all counts
    const visualPool = eligibleBalls.slice(0, Math.min(eligibleBalls.length, 45));

    const newBalls: PhysicsBall[] = visualPool.map((ballItem, idx) => {
      const angle = (idx / Math.max(1, visualPool.length)) * Math.PI * 0.9 + Math.PI * 0.05;
      const dist = 15 + Math.random() * (rLimit - 25);
      const z = (Math.random() - 0.5) * 1.6;
      return {
        item: ballItem,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.6 + 28, // settle naturally towards bottom
        z,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 0.5,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        scale: 0.88 + (z + 1) * 0.12
      };
    });
    setPhysicsBalls(newBalls);
  }, [eligibleBalls.length, ballMode, customBallCount, selectedClass, selectedTeam]);

  // Main 60fps Animation Loop for Cage Rotation and Ball Physics
  useEffect(() => {
    let lastTime = performance.now();
    const cageRadius = 92;
    const ballRadius = 14;
    const maxDist = cageRadius - ballRadius;

    const updatePhysics = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04); // cap delta time for smooth 60fps
      lastTime = time;

      if (isSpinning) {
        const elapsed = (time - spinStartTimeRef.current) / 1000;

        // 1. Acceleration (0 -> 0.8s)
        if (elapsed < 0.8) {
          setSpinPhase('accel');
          currentSpeedRef.current = (elapsed / 0.8) * 850; // deg/sec
        }
        // 2. High Speed Fast Spin (0.8s -> 2.6s)
        else if (elapsed < 2.6) {
          setSpinPhase('fast');
          currentSpeedRef.current = 850 + Math.sin(elapsed * 12) * 60;
        }
        // 3. Deceleration (2.6s -> 3.8s)
        else if (elapsed < 3.8) {
          setSpinPhase('decel');
          const decelRatio = (3.8 - elapsed) / 1.2;
          currentSpeedRef.current = decelRatio * 850;
        }
        // 4. Stop & Eject Ball (3.8s -> 4.3s)
        else {
          currentSpeedRef.current = 0;
          if (spinPhase !== 'eject' && spinPhase !== 'winner') {
            setSpinPhase('eject');
            setHasBallInChute(true);
            if (!soundMuted) soundFx.playBonus();

            // Finish spin & show reveal modal
            setTimeout(() => {
              if (chosenWinnerRef.current) {
                setWinningStudent(chosenWinnerRef.current.student);
                setWinningBallInfo({
                  number: chosenWinnerRef.current.number,
                  colorIndex: chosenWinnerRef.current.colorIndex
                });
                setShowWinnerModal(true);
                setSpinPhase('winner');
                setIsSpinning(false);
              }
            }, 600);
          }
        }

        // Update rotation angle of cage & crank handle
        setRotationAngle(prev => (prev + currentSpeedRef.current * dt) % 360);

        // Sound rattle clack while spinning
        if (!soundMuted && currentSpeedRef.current > 60) {
          const soundInterval = Math.max(65, 220 - (currentSpeedRef.current / 850) * 155);
          if (time - lastSoundClackRef.current > soundInterval) {
            lastSoundClackRef.current = time;
            soundFx.playBallClack();
          }
        }
      } else {
        // Idle gentle float (0.15 deg/frame)
        setRotationAngle(prev => (prev + 0.15) % 360);
      }

      // Update ball positions with spherical constraint, rotating cage friction, lifter paddles & ball-to-ball bouncing
      setPhysicsBalls(prevBalls => {
        const speed = currentSpeedRef.current; // deg/s
        const isSpinActive = speed > 20;
        const spinRad = (speed * Math.PI) / 180; // rad/s
        const gravity = isSpinActive ? 180 : 380;

        // Clone array for physics integration
        const balls = prevBalls.map(b => ({ ...b }));

        // 1. Force Integration & Kinematics
        for (let i = 0; i < balls.length; i++) {
          const ball = balls[i];

          // Gravity downwards
          ball.vy += gravity * dt;

          if (isSpinActive) {
            // Rotating cage boundary tangential velocity at ball location
            const distFromCenter = Math.hypot(ball.x, ball.y);
            const normX = distFromCenter > 0 ? ball.x / distFromCenter : 0;
            const normY = distFromCenter > 0 ? ball.y / distFromCenter : 0;

            // Tangential direction vector (-normY, normX)
            const tangVx = -normY * (spinRad * Math.max(distFromCenter, 25));
            const tangVy = normX * (spinRad * Math.max(distFromCenter, 25));

            // Friction / drag with rotating cage wall and internal fins
            const wallProximity = Math.max(0, (distFromCenter - 30) / (maxDist - 30));
            const dragFactor = wallProximity * 2.5 + 0.4;

            ball.vx += (tangVx - ball.vx) * dragFactor * dt;
            ball.vy += (tangVy - ball.vy) * dragFactor * dt;

            // Centrifugal force pushing outwards
            const centForce = distFromCenter * (spinRad * spinRad) * 0.00035;
            ball.vx += normX * centForce * dt;
            ball.vy += normY * centForce * dt;

            // Chaotic turbulence & tumble agitation
            const turbulence = speed * 0.25;
            ball.vx += (Math.random() - 0.5) * turbulence * dt;
            ball.vy += (Math.random() - 0.5) * turbulence * dt;
            ball.vz += (Math.random() - 0.5) * 2 * dt;

            // Number on ball rotation physics (roll along movement and with cage spin)
            const linearSpeed = Math.hypot(ball.vx, ball.vy);
            const rollDelta = (linearSpeed / ballRadius) * (180 / Math.PI) * dt * (ball.vx > 0 ? 1 : -1) + speed * 0.85 * dt;
            ball.rot = (ball.rot + rollDelta + (Math.random() - 0.5) * 6) % 360;
          } else {
            // Idle friction damping
            ball.vx *= 0.94;
            ball.vy *= 0.94;
            ball.vz *= 0.92;
            ball.vRot *= 0.95;
            ball.rot = (ball.rot + ball.vRot * dt) % 360;
          }

          // Move
          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;
          ball.z += ball.vz * dt;

          // Clamp Z depth between -1 and 1
          if (ball.z > 1) {
            ball.z = 1;
            ball.vz = -Math.abs(ball.vz) * 0.5;
          } else if (ball.z < -1) {
            ball.z = -1;
            ball.vz = Math.abs(ball.vz) * 0.5;
          }
          ball.scale = 0.88 + (ball.z + 1) * 0.12;

          // Spherical Cage Boundary Collision
          const dist = Math.hypot(ball.x, ball.y);
          if (dist > maxDist) {
            const nx = ball.x / dist;
            const ny = ball.y / dist;

            // Push back inside
            ball.x = nx * maxDist;
            ball.y = ny * maxDist;

            // Bounce with restitution & spin transfer
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot > 0) {
              ball.vx = (ball.vx - 1.7 * dot * nx) * 0.7;
              ball.vy = (ball.vy - 1.7 * dot * ny) * 0.7;
              ball.rot = (ball.rot + (ball.vx - ball.vy) * 2) % 360;
            }
          }
        }

        // 2. Ball-to-Ball Elastic Collisions (prevents bunching & adds lifelike clatter)
        const minDistance = ballRadius * 1.85;
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.hypot(dx, dy);

            if (dist < minDistance && dist > 0.01) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDistance - dist;

              // Positional separation
              b1.x -= nx * overlap * 0.5;
              b1.y -= ny * overlap * 0.5;
              b2.x += nx * overlap * 0.5;
              b2.y += ny * overlap * 0.5;

              // Elastic momentum exchange
              const kx = b1.vx - b2.vx;
              const ky = b1.vy - b2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2;

              if (p > 0) {
                b1.vx -= p * nx * 0.75;
                b1.vy -= p * ny * 0.75;
                b2.vx += p * nx * 0.75;
                b2.vy += p * ny * 0.75;

                // Spin exchange on collision
                b1.rot = (b1.rot + 15) % 360;
                b2.rot = (b2.rot - 15) % 360;
              }
            }
          }
        }

        return balls;
      });

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSpinning, spinPhase, soundMuted]);

  // Start Lottery Spin Action
  const startLotterySpin = () => {
    if (isSpinning || eligibleBalls.length === 0) return;

    if (!soundMuted) soundFx.playSpin();
    setIsSpinning(true);
    setSpinPhase('accel');
    setHasBallInChute(false);
    setShowWinnerModal(false);
    setWinningStudent(null);
    spinStartTimeRef.current = performance.now();

    // Pick random eligible ball from current pool
    const randomIndex = Math.floor(Math.random() * eligibleBalls.length);
    const chosenBall = eligibleBalls[randomIndex];

    chosenWinnerRef.current = {
      student: chosenBall.student || null,
      number: chosenBall.number,
      colorIndex: chosenBall.colorIndex
    };

    // Add to history
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setWinnerHistory(prev => [
      {
        student: chosenBall.student || null,
        number: chosenBall.number,
        colorIndex: chosenBall.colorIndex,
        time: nowTime
      },
      ...prev
    ]);
  };

  const handleSpinNextRound = () => {
    setShowWinnerModal(false);
    setWinningStudent(null);
    setHasBallInChute(false);
    setSpinPhase('idle');
    setTimeout(() => {
      startLotterySpin();
    }, 250);
  };

  const handleQuickAdjustBalls = (delta: number) => {
    setBallMode('custom');
    setCustomBallCount(prev => Math.min(Math.max(prev + delta, 2), 100));
    soundFx.playClick();
  };

  const t = {
    vi: {
      gameTitle: 'LỒNG QUAY XỔ SỐ TRI THỨC',
      subtitle: 'Xoay lồng kim loại chọn ra quả bóng may mắn chỉ hiện số!',
      eligibleCount: 'Bóng trong lồng:',
      totalStudents: 'Tổng số bóng:',
      allClasses: 'Tất cả lớp',
      allTeams: 'Tất cả tổ',
      excludeLabel: 'Loại trừ số đã trúng',
      spinBtn: '🎰 BẮT ĐẦU QUAY XỔ SỐ',
      spinningBtn: '🎡 ĐANG QUAY XỔ SỐ...',
      historyBtn: 'Lịch sử trúng',
      studentsBtn: 'Danh sách bóng',
      settingsBtn: 'Thiết lập số bóng',
      noStudentsMsg: 'Không còn quả bóng nào trong lồng! Hãy đặt lại lịch sử hoặc tăng số lượng bóng.',
      resetHistory: 'Làm mới lịch sử',
      crankTip: '👉 Bấm nút QUAY hoặc nhấp trực tiếp vào Tay quay để bắt đầu!',
      chibiCheerLeft: 'Hồi hộp quá!',
      chibiCheerRight: 'Chúc may mắn!',
      ballSettingsTitle: '⚙️ Thiết lập số lượng bóng xổ số (Giáo viên / Admin)',
      modeRoster: 'Theo danh sách học sinh',
      modeCustom: 'Tùy chỉnh số lượng bóng',
      customCountLabel: 'Số lượng bóng trong lồng:',
      saveSettings: 'Áp dụng thiết lập',
      ballCountInfo: 'Quả bóng chỉ hiển thị số thứ tự, gán tương ứng với học sinh theo danh sách.'
    },
    en: {
      gameTitle: 'MAGICAL LOTTERY CAGE',
      subtitle: 'Spin the golden sphere cage to draw the lucky numbered ball!',
      eligibleCount: 'Balls in Cage:',
      totalStudents: 'Total Balls:',
      allClasses: 'All Classes',
      allTeams: 'All Teams',
      excludeLabel: 'Exclude Previous Numbers',
      spinBtn: '🎰 START LOTTERY SPIN',
      spinningBtn: '🎡 SPINNING LOTTERY CAGE...',
      historyBtn: 'History',
      studentsBtn: 'Ball List',
      settingsBtn: 'Ball Settings',
      noStudentsMsg: 'No balls left in cage! Clear history or adjust ball count.',
      resetHistory: 'Clear History',
      crankTip: '👉 Click SPIN or tap the Crank Handle to spin!',
      chibiCheerLeft: 'So exciting!',
      chibiCheerRight: 'Good luck!',
      ballSettingsTitle: '⚙️ Lottery Ball Count Settings',
      modeRoster: 'By Student Roster',
      modeCustom: 'Custom Ball Count',
      customCountLabel: 'Number of balls in cage:',
      saveSettings: 'Apply Settings',
      ballCountInfo: 'Balls exclusively display numbers, mapped to students.'
    }
  }[language];

  return (
    <div className="relative w-full rounded-[36px] overflow-hidden border-4 border-[#F59E0B] shadow-[0_25px_60px_rgba(217,119,6,0.35)] bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] to-[#BAE6FD] p-3 sm:p-6 space-y-4 sm:space-y-6 select-none">
      {/* ============================================================ */}
      {/* 1. TOP CARTOON GAME HUD                                       */}
      {/* ============================================================ */}
      <div className="relative z-30 flex items-center justify-between flex-wrap gap-3 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-3xl border-3 border-amber-300 shadow-md">
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md border-2 border-white">
            🎰
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-amber-900 tracking-wide flex items-center gap-2">
              <span>{t.gameTitle}</span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {/* Ball Count & Quick Stepper */}
              <div className="flex items-center bg-amber-100/90 rounded-full border border-amber-300 shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleQuickAdjustBalls(-5)}
                  disabled={isSpinning}
                  className="px-2 py-0.5 hover:bg-amber-200 text-amber-800 text-xs font-black cursor-pointer disabled:opacity-50"
                  title="Giảm 5 bóng"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustBalls(-1)}
                  disabled={isSpinning}
                  className="px-1.5 py-0.5 hover:bg-amber-200 text-amber-800 text-xs font-black cursor-pointer disabled:opacity-50"
                  title="Giảm 1 bóng"
                >
                  -1
                </button>
                <span className="px-2.5 py-0.5 text-amber-900 text-[11px] font-black flex items-center gap-1 border-x border-amber-300/60">
                  <Hash className="w-3 h-3 text-amber-600" />
                  <span>{t.eligibleCount} {eligibleBalls.length} / {allConfiguredBalls.length} banh</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustBalls(1)}
                  disabled={isSpinning}
                  className="px-1.5 py-0.5 hover:bg-amber-200 text-amber-800 text-xs font-black cursor-pointer disabled:opacity-50"
                  title="Tăng 1 bóng"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustBalls(5)}
                  disabled={isSpinning}
                  className="px-2 py-0.5 hover:bg-amber-200 text-amber-800 text-xs font-black cursor-pointer disabled:opacity-50"
                  title="Tăng 5 bóng"
                >
                  +5
                </button>
              </div>

              {winnerHistory.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                  🏆 Đã quay: {winnerHistory.length} lượt
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Control Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Teacher/Admin Ball Count Settings Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black border border-amber-300 shadow-2xs cursor-pointer flex items-center gap-1.5 ring-2 ring-amber-200"
            title="Giáo viên / Quản trị viên thiết lập số lượng bóng"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{t.settingsBtn}</span>
          </button>

          {/* Class Filter */}
          {availableClasses.length > 1 && (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs focus:outline-none"
            >
              <option value="all">🏫 {t.allClasses}</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Team Filter */}
          {availableTeams.length > 1 && (
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs focus:outline-none"
            >
              <option value="all">👥 {t.allTeams}</option>
              {availableTeams.map(tm => (
                <option key={tm} value={tm}>{tm}</option>
              ))}
            </select>
          )}

          {/* Exclude previous winners toggle */}
          <button
            type="button"
            onClick={() => setExcludeWinners(!excludeWinners)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
              excludeWinners
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Loại trừ số đã trúng ở các lượt trước"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${excludeWinners ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{t.excludeLabel}</span>
          </button>

          {/* Ball List Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowStudentsDrawer(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">{t.studentsBtn}</span>
          </button>

          {/* Winner History Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowHistoryDrawer(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1"
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">{t.historyBtn} ({winnerHistory.length})</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 shadow-2xs cursor-pointer"
            title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black border border-slate-200 shadow-2xs cursor-pointer flex items-center gap-1"
          >
            <Languages className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'vi' ? '🇻🇳' : '🇬🇧'}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. THE MAGICAL 2D/2.5D GAME ENVIRONMENT WORLD                */}
      {/* ============================================================ */}
      <div className="relative w-full rounded-3xl overflow-hidden min-h-[500px] sm:min-h-[580px] bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] to-[#BAE6FD] border-4 border-amber-300 shadow-inner flex flex-col items-center justify-between p-4 sm:p-6">
        {/* Sky Background Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Glowing Sun */}
          <div className="absolute top-4 right-10 w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-400 shadow-[0_0_40px_#FDE047] animate-pulse" />

          {/* Floating Clouds */}
          <div className="absolute top-8 left-12 opacity-80 animate-pulse">
            <div className="w-24 h-8 bg-white rounded-full shadow-md relative">
              <div className="absolute -top-4 left-3 w-10 h-10 bg-white rounded-full" />
              <div className="absolute -top-6 left-9 w-12 h-12 bg-white rounded-full" />
            </div>
          </div>
          <div className="absolute top-16 right-36 opacity-75 hidden sm:block">
            <div className="w-32 h-10 bg-white rounded-full shadow-md relative">
              <div className="absolute -top-5 left-4 w-12 h-12 bg-white rounded-full" />
              <div className="absolute -top-7 left-12 w-14 h-14 bg-white rounded-full" />
            </div>
          </div>

          {/* Hot Air Balloon */}
          <div className="absolute top-10 left-1/4 animate-bounce hidden md:block" style={{ animationDuration: '4s' }}>
            <div className="text-3xl">🎈</div>
          </div>

          {/* Distant Mountains */}
          <div className="absolute bottom-32 left-0 right-0 h-40 flex items-end justify-between opacity-35">
            <div className="w-64 h-32 bg-sky-600 rounded-t-full -ml-12" />
            <div className="w-96 h-40 bg-sky-700 rounded-t-full" />
            <div className="w-72 h-36 bg-sky-600 rounded-t-full -mr-12" />
          </div>

          {/* Green Hills Midground */}
          <div className="absolute bottom-20 left-0 right-0 h-28 flex items-end justify-around opacity-90">
            <div className="w-1/2 h-24 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-[100px] -ml-16 shadow-lg" />
            <div className="w-2/3 h-28 bg-gradient-to-t from-green-500 to-emerald-400 rounded-t-[120px] -mr-16 shadow-lg" />
          </div>

          {/* Wooden Stage Floor (Foreground) */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#78350F] via-[#92400E] to-[#B45309] border-t-4 border-[#FDE047] shadow-2xl flex flex-col justify-between p-2">
            <div className="flex justify-between w-full h-full opacity-20 border-b border-amber-300" />
            <div className="flex justify-between w-full h-full opacity-20 border-b border-amber-300" />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. STAGE LIGHTS & SPOTLIGHT CONE                             */}
        {/* ============================================================ */}
        <div className="relative z-10 w-full flex items-center justify-between px-4 sm:px-12 pt-2 pointer-events-none">
          {/* Left Spotlight */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_20px_#FACC15] flex items-center justify-center text-xs">
              💡
            </div>
            <div className="w-32 h-64 bg-gradient-to-b from-yellow-300/25 to-transparent transform -rotate-12 blur-xs origin-top pointer-events-none" />
          </div>

          {/* Stage Banner Plaque */}
          <div className="px-5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-black text-xs sm:text-sm border-2 border-white shadow-lg inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>{t.subtitle}</span>
          </div>

          {/* Right Spotlight */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_20px_#FACC15] flex items-center justify-center text-xs">
              💡
            </div>
            <div className="w-32 h-64 bg-gradient-to-b from-yellow-300/25 to-transparent transform rotate-12 blur-xs origin-top pointer-events-none" />
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. MAIN GAME OBJECT: CENTRAL LOTTERY CAGE WITH NUMBER BALLS */}
        {/* ============================================================ */}
        <div className="relative z-20 my-auto flex flex-col items-center justify-center w-full max-w-lg">
          <div className="relative w-full flex items-center justify-center">
            {/* 1. Lottery Cage SVG with Embedded Physics Balls & Synchronized Rotation */}
            <LotteryCageSvg
              rotationAngle={rotationAngle}
              isSpinning={isSpinning}
              spinSpeed={currentSpeedRef.current}
              onManualCrankClick={startLotterySpin}
              hasBallInChute={hasBallInChute}
              className="w-full"
            >
              {/* Physics Balls inside Cage Sphere - ONLY NUMBERS */}
              <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
                {physicsBalls
                  .slice()
                  .sort((a, b) => a.z - b.z)
                  .map((ball) => (
                    <div
                      key={ball.item.number}
                      className="absolute pointer-events-none will-change-transform"
                      style={{
                        transform: `translate(${ball.x}px, ${ball.y}px) scale(${ball.scale})`,
                        zIndex: Math.round((ball.z + 1) * 20),
                        filter: ball.z < -0.3 ? 'brightness(0.9) saturate(0.92)' : 'brightness(1.05)',
                        opacity: ball.z < -0.75 ? 0.85 : 1
                      }}
                    >
                      <LotteryBallSvg
                        number={ball.item.number}
                        colorIndex={ball.item.colorIndex}
                        size="sm"
                        rotation={ball.rot}
                      />
                    </div>
                  ))}

                {/* Empty state alert when no balls in cage */}
                {eligibleBalls.length === 0 && (
                  <div className="bg-slate-900/85 backdrop-blur-xs p-3 rounded-2xl border border-amber-300 text-amber-200 text-xs font-black text-center shadow-lg pointer-events-auto">
                    {t.noStudentsMsg}
                  </div>
                )}
              </div>
            </LotteryCageSvg>

            {/* 2. Ball on Exit Chute (When selected and dropping out) - ONLY NUMBER */}
            {hasBallInChute && chosenWinnerRef.current && (
              <div className="absolute bottom-10 left-[50%] -translate-x-1/2 z-30 animate-bounce">
                <LotteryBallSvg
                  number={chosenWinnerRef.current.number}
                  colorIndex={chosenWinnerRef.current.colorIndex}
                  size="md"
                  isHighlighted
                />
              </div>
            )}
          </div>

          {/* Interactive Crank Helper Tip */}
          <div className="relative -mt-2 text-amber-950 font-black text-[11px] bg-amber-100/90 px-3 py-1 rounded-full border border-amber-300 shadow-xs hidden sm:inline-flex items-center gap-1.5">
            <span>🎡</span>
            <span>{t.crankTip}</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. CHEERING CHIBI CHARACTERS & ITEN ROBOT (STAGE WINGS)      */}
        {/* ============================================================ */}
        <div className="relative z-20 w-full flex items-end justify-between px-2 sm:px-6 pointer-events-none">
          {/* Left Chibi Student */}
          <div className="flex flex-col items-center">
            {isSpinning && (
              <div className="mb-1 px-3 py-1 bg-white rounded-2xl border-2 border-amber-300 text-[10px] font-black text-amber-900 shadow-md animate-bounce">
                {t.chibiCheerLeft} 👏
              </div>
            )}
            <div className={`text-4xl sm:text-5xl transition-transform ${isSpinning ? 'animate-bounce' : ''}`}>
              👧
            </div>
          </div>

          {/* Center Space for Big Button */}
          <div className="flex-1 max-w-xs mx-auto text-center pointer-events-auto">
            <button
              type="button"
              disabled={isSpinning || eligibleBalls.length === 0}
              onClick={startLotterySpin}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base transition-all cursor-pointer flex items-center justify-center gap-2.5 border-3 border-white ${
                isSpinning
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white opacity-90 shadow-none cursor-wait animate-pulse'
                  : eligibleBalls.length === 0
                  ? 'bg-slate-400 text-slate-200 border-slate-300 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-[0_8px_0_#9F1239,0_15px_30px_rgba(225,29,72,0.5)] active:translate-y-1.5 active:shadow-[0_2px_0_#9F1239] hover:scale-[1.02] ring-4 ring-amber-300'
              }`}
            >
              <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? t.spinningBtn : t.spinBtn}</span>
            </button>
          </div>

          {/* Right Mascot */}
          <div className="flex flex-col items-center">
            {isSpinning && (
              <div className="mb-1 px-3 py-1 bg-white rounded-2xl border-2 border-amber-300 text-[10px] font-black text-amber-900 shadow-md animate-bounce">
                {t.chibiCheerRight} 🎉
              </div>
            )}
            <div className={`text-4xl sm:text-5xl transition-transform ${isSpinning ? 'animate-bounce' : ''}`}>
              🤖
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. WINNER REVEAL CELEBRATION MODAL                           */}
      {/* ============================================================ */}
      {showWinnerModal && winningBallInfo && (
        <LotteryWinnerModal
          winner={winningStudent}
          ballNumber={winningBallInfo.number}
          colorIndex={winningBallInfo.colorIndex}
          onClose={() => setShowWinnerModal(false)}
          onSpinNext={handleSpinNextRound}
          onAwardPoints={onAwardPoints}
          onSelectStudent={onSelectStudent}
          language={language}
        />
      )}

      {/* ============================================================ */}
      {/* 7. MODAL: TEACHER / ADMIN BALL COUNT CONFIGURATION           */}
      {/* ============================================================ */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border-4 border-amber-400 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-6 h-6 text-amber-600" />
                <h3 className="text-lg font-black text-slate-800">
                  {t.ballSettingsTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setBallMode('roster');
                  soundFx.playClick();
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  ballMode === 'roster'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 {t.modeRoster} ({filteredStudents.length} học sinh)
              </button>
              <button
                type="button"
                onClick={() => {
                  setBallMode('custom');
                  soundFx.playClick();
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  ballMode === 'custom'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚙️ {t.modeCustom}
              </button>
            </div>

            {/* Custom ball count adjuster */}
            {ballMode === 'custom' && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950">
                    {t.customCountLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={2}
                      max={100}
                      value={customBallCount}
                      onChange={e => setCustomBallCount(Math.min(Math.max(Number(e.target.value) || 2, 2), 100))}
                      className="w-20 p-2 text-center bg-white border-2 border-amber-300 rounded-xl font-black text-amber-900 text-base focus:outline-none shadow-2xs"
                    />
                    <span className="text-xs font-bold text-amber-800">quả banh</span>
                  </div>
                </div>

                {/* Range slider */}
                <input
                  type="range"
                  min={2}
                  max={100}
                  value={customBallCount}
                  onChange={e => setCustomBallCount(Number(e.target.value))}
                  className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />

                {/* Quick preset buttons */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-800">Chọn nhanh số lượng banh:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 80, 100].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setCustomBallCount(cnt);
                          soundFx.playClick();
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                          customBallCount === cnt
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-200'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                    {students.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomBallCount(students.length);
                          soundFx.playClick();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-200 cursor-pointer"
                      >
                        Sĩ số ({students.length})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">ℹ️ Quy tắc hiển thị quả bóng:</p>
              <p>{t.ballCountInfo}</p>
            </div>

            <Game3DButton
              variant="yellow"
              size="md"
              onClick={() => {
                soundFx.playSuccess();
                setShowSettingsModal(false);
              }}
              className="w-full"
            >
              {t.saveSettings} ({allConfiguredBalls.length} bóng)
            </Game3DButton>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. DRAWER: PARTICIPATING BALLS / STUDENTS LIST               */}
      {/* ============================================================ */}
      {showStudentsDrawer && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border-4 border-amber-400 max-h-[85vh] flex flex-col space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-800">
                  {t.studentsBtn} ({eligibleBalls.length} / {allConfiguredBalls.length} quả bóng)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStudentsDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh] pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allConfiguredBalls.map(item => (
                <div
                  key={item.number}
                  className={`p-2.5 rounded-2xl border flex items-center gap-3 transition-colors shadow-2xs ${
                    excludeWinners && winnerHistory.some(w => w.number === item.number)
                      ? 'bg-slate-100/70 border-slate-200 opacity-60'
                      : 'bg-slate-50 hover:bg-amber-50 border-slate-200'
                  }`}
                >
                  <LotteryBallSvg
                    number={item.number}
                    colorIndex={item.colorIndex}
                    size="xs"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 truncate">
                      {item.student ? item.student.fullName : `Bóng may mắn số #${item.number}`}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {item.student ? `${item.student.className || 'Chung'} • ${item.student.team || 'Tổ 1'}` : 'Chưa gán học sinh'}
                    </p>
                  </div>
                  {excludeWinners && winnerHistory.some(w => w.number === item.number) && (
                    <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-md border border-rose-200">
                      Đã trúng
                    </span>
                  )}
                </div>
              ))}
            </div>

            <Game3DButton variant="orange" size="md" onClick={() => setShowStudentsDrawer(false)} className="w-full">
              Đóng danh sách
            </Game3DButton>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. DRAWER: WINNER HISTORY LIST                               */}
      {/* ============================================================ */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-amber-400 max-h-[85vh] flex flex-col space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-800">
                  {t.historyBtn} ({winnerHistory.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {winnerHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <div className="text-4xl">🎟️</div>
                <p className="text-xs font-bold">Chưa có lượt quay nào trong phiên này.</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[55vh] pr-1 space-y-2">
                {winnerHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <LotteryBallSvg
                        number={item.number}
                        colorIndex={item.colorIndex}
                        size="xs"
                      />
                      <div>
                        <p className="text-xs font-black text-slate-800">
                          {item.student ? item.student.fullName : `Bóng may mắn số #${item.number}`}
                        </p>
                        <p className="text-[10px] font-bold text-amber-800">
                          {item.student ? `${item.student.className} • ${item.student.team}` : `Số thứ tự ${item.number}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex gap-2">
              {winnerHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setWinnerHistory([]);
                    soundFx.playClick();
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 cursor-pointer"
                >
                  {t.resetHistory}
                </button>
              )}
              <Game3DButton variant="yellow" size="sm" onClick={() => setShowHistoryDrawer(false)} className="flex-1">
                Đóng
              </Game3DButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
