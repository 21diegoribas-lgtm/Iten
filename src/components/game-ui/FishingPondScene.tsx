import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { soundFx } from '../../utils/sound';
import { getAvatarUrl } from '../../utils/avatarHelper';
import { Game3DButton } from './Game3DButton';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Star,
  Flame,
  CheckCircle2,
  Zap,
  Compass,
  History,
  X,
  Pointer
} from 'lucide-react';

interface FishingPondSceneProps {
  currentUser?: User;
  students: User[];
  onSelectStudent?: (student: User) => void;
  onAwardPoints?: (student: User, points: number, reason: string) => void;
}

type FishingState = 'idle' | 'casting' | 'splash' | 'racing' | 'biting' | 'reeling' | 'caught';

interface ActiveFish {
  id: string;
  student: User;
  color: string;
  secondaryColor: string;
  size: number;
  initialX: number; // in percentage 0-100
  initialY: number; // in percentage 40-90
  currentX: number;
  currentY: number;
  direction: 1 | -1; // 1: swimming right, -1: swimming left
  speed: number;
  wobblePhase: number;
  chatBubble?: string;
  isWinner?: boolean;
}

interface TouchSparkle {
  id: number;
  x: number;
  y: number;
  color: string;
  opacity: number;
}

interface WaterRipple {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export const FishingPondScene: React.FC<FishingPondSceneProps> = ({
  currentUser,
  students,
  onSelectStudent,
  onAwardPoints
}) => {
  const [fishingState, setFishingState] = useState<FishingState>('idle');
  const [hookedStudent, setHookedStudent] = useState<User | null>(null);
  const [caughtFishHistory, setCaughtFishHistory] = useState<{ student: User; caughtAt: string; pointsAwarded?: number }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [excludeCaught, setExcludeCaught] = useState<boolean>(true);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [awardedFeedback, setAwardedFeedback] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState<string>('Phát biểu trả lời câu hỏi Ao Cá May Mắn');

  // Interactive Bait position & facing direction
  const [baitPos, setBaitPos] = useState<{ x: number; y: number }>({ x: 55, y: 65 });
  const [characterFacing, setCharacterFacing] = useState<'left' | 'center' | 'right'>('right');
  const [reelProgress, setReelProgress] = useState<number>(0);

  // Visual effects
  const [waterRipples, setWaterRipples] = useState<WaterRipple[]>([]);
  const [touchSparkles, setTouchSparkles] = useState<TouchSparkle[]>([]);
  const [splashes, setSplashes] = useState<{ id: number; x: number; y: number; vx: number; vy: number }[]>([]);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number; speed: number }[]>([]);
  const [fishList, setFishList] = useState<ActiveFish[]>([]);
  const [winningFishId, setWinningFishId] = useState<string | null>(null);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const pondContainerRef = useRef<HTMLDivElement>(null);

  // Palette for fishes
  const fishPalettes = [
    { main: '#FB923C', sec: '#EA580C' }, // Orange Goldfish
    { main: '#38BDF8', sec: '#0284C7' }, // Blue Tang
    { main: '#C084FC', sec: '#9333EA' }, // Purple Glow
    { main: '#4ADE80', sec: '#16A34A' }, // Emerald Koi
    { main: '#FACC15', sec: '#CA8A04' }, // Golden Angelfish
    { main: '#F472B6', sec: '#DB2777' }, // Pink Guppy
    { main: '#F87171', sec: '#DC2626' }, // Ruby Red
    { main: '#2DD4BF', sec: '#0D9488' }, // Teal Betta
    { main: '#A78BFA', sec: '#7C3AED' }  // Violet Swimmer
  ];

  const chatExcitedMessages = [
    'Mồi kìa! 🐛',
    'Của tớ nha! 💨',
    'Đua nào! 🚀',
    'Nhanh lên! ⚡',
    'Đói bụng quá! 😋',
    'Đớp mồi nào! 🎯',
    'Tớ tới trước! 🏃',
    'Cố lên! ✨'
  ];

  // Filter students based on selection & exclusion
  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClass === 'all' || s.className === selectedClass || s.classId === selectedClass;
    const isAlreadyCaught = excludeCaught && caughtFishHistory.some((c) => c.student.id === s.id);
    return matchClass && (!excludeCaught || !isAlreadyCaught);
  });

  const availableStudentsForPool = filteredStudents.length > 0 ? filteredStudents : students;
  const classes = Array.from(new Set(students.map((s) => s.className || 'Lớp 8A1')));

  // Initialize Fish School
  useEffect(() => {
    const pool = availableStudentsForPool.length > 0 ? availableStudentsForPool : students;
    const maxFish = Math.min(16, Math.max(6, pool.length));
    const initialFishList: ActiveFish[] = [];

    for (let i = 0; i < maxFish; i++) {
      const student = pool[i % pool.length];
      const palette = fishPalettes[i % fishPalettes.length];
      const startX = 12 + (i * 18) % 76;
      const startY = 48 + (i * 11) % 40;
      const dir = i % 2 === 0 ? 1 : -1;

      initialFishList.push({
        id: `fish_${student.id}_${i}`,
        student,
        color: palette.main,
        secondaryColor: palette.sec,
        size: 0.85 + (i % 3) * 0.12,
        initialX: startX,
        initialY: startY,
        currentX: startX,
        currentY: startY,
        direction: dir,
        speed: 0.08 + (i % 4) * 0.03,
        wobblePhase: Math.random() * Math.PI * 2
      });
    }

    setFishList(initialFishList);
  }, [students, selectedClass, excludeCaught]);

  // Ambient floating bubbles generator
  useEffect(() => {
    const bubbleInterval = setInterval(() => {
      setBubbles((prev) => {
        const newBubble = {
          id: Date.now() + Math.random(),
          x: 10 + Math.random() * 80,
          y: 95,
          size: 4 + Math.random() * 8,
          speed: 0.3 + Math.random() * 0.4
        };
        return [...prev.slice(-15), newBubble];
      });
    }, 450);

    return () => clearInterval(bubbleInterval);
  }, []);

  // Main Animation Physics Loop
  useEffect(() => {
    const updatePhysics = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // 1. Update bubbles
      setBubbles((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - b.speed * 60 * delta }))
          .filter((b) => b.y > 38)
      );

      // 2. Update splashes
      setSplashes((prev) =>
        prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx * delta * 20,
            y: s.y + s.vy * delta * 20 + 40 * delta * delta,
            vy: s.vy + 80 * delta
          }))
          .filter((s) => s.y < 95)
      );

      // 3. Update water ripples & touch sparkles
      setWaterRipples((prev) =>
        prev
          .map((r) => ({
            ...r,
            size: r.size + 42 * delta,
            opacity: r.opacity - 0.75 * delta
          }))
          .filter((r) => r.opacity > 0)
      );

      setTouchSparkles((prev) =>
        prev
          .map((s) => ({
            ...s,
            opacity: s.opacity - 1.2 * delta
          }))
          .filter((s) => s.opacity > 0)
      );

      // 4. Update fish positions based on current state
      setFishList((prevFishList) => {
        return prevFishList.map((fish) => {
          let nextX = fish.currentX;
          let nextY = fish.currentY;
          let nextDir = fish.direction;
          let nextChat = fish.chatBubble;

          if (fishingState === 'idle') {
            // Peaceful swimming back and forth
            nextX += fish.direction * fish.speed * 60 * delta;
            nextY = fish.initialY + Math.sin(time * 0.002 + fish.wobblePhase) * 2.5;

            if (nextX > 90 && nextDir === 1) {
              nextDir = -1;
            } else if (nextX < 10 && nextDir === -1) {
              nextDir = 1;
            }
            nextChat = undefined;
          } else if (fishingState === 'racing') {
            // ALL FISH RACE ENERGETICALLY TOWARD THE TOUCHED BAIT POSITION!
            const dx = baitPos.x - fish.currentX;
            const dy = baitPos.y - fish.currentY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            nextDir = dx >= 0 ? 1 : -1;

            if (dist > 4) {
              const raceSpeed = fish.speed * 280 * delta;
              nextX += (dx / dist) * raceSpeed;
              nextY += (dy / dist) * raceSpeed;
            } else {
              const angle = time * 0.006 + fish.wobblePhase;
              nextX = baitPos.x + Math.cos(angle) * (3 + (parseInt(fish.id.slice(-1)) || 0) * 1.5);
              nextY = baitPos.y + Math.sin(angle) * (2 + (parseInt(fish.id.slice(-1)) || 0) * 0.8);
            }

            if (!nextChat && Math.random() < 0.3) {
              const msgIndex = Math.floor(Math.random() * chatExcitedMessages.length);
              nextChat = chatExcitedMessages[msgIndex];
            }
          } else if (fishingState === 'biting') {
            if (fish.id === winningFishId) {
              nextX = baitPos.x;
              nextY = baitPos.y;
              nextDir = 1;
              nextChat = '🎯 CỦA TỚ RỒI!';
            } else {
              const dx = fish.currentX - baitPos.x;
              const dy = fish.currentY - baitPos.y;
              const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              nextX += (dx / dist) * 45 * delta;
              nextY += (dy / dist) * 20 * delta;
              nextDir = dx >= 0 ? 1 : -1;
              nextChat = 'Hụt rồi! 😲';
            }
          } else if (fishingState === 'reeling') {
            if (fish.id === winningFishId) {
              nextX = baitPos.x - reelProgress * 15;
              nextY = baitPos.y - reelProgress * 38;
              nextChat = '🌟 WOOHOO! 🌟';
            } else {
              nextY = fish.initialY + Math.sin(time * 0.003 + fish.wobblePhase) * 3;
              nextChat = 'Chúc mừng bạn! 👏';
            }
          }

          return {
            ...fish,
            currentX: Math.max(6, Math.min(94, nextX)),
            currentY: Math.max(35, Math.min(94, nextY)),
            direction: nextDir,
            chatBubble: nextChat,
            isWinner: fish.id === winningFishId
          };
        });
      });

      requestRef.current = requestAnimationFrame(updatePhysics);
    };

    requestRef.current = requestAnimationFrame(updatePhysics);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [fishingState, baitPos, winningFishId, reelProgress]);

  // Main Action: START FISHING AT TARGET (customTargetX, customTargetY)
  const startFishing = (customTargetX?: number, customTargetY?: number) => {
    if (availableStudentsForPool.length === 0 || fishingState !== 'idle') return;

    // Pick lucky winning student
    const luckyStudent = availableStudentsForPool[Math.floor(Math.random() * availableStudentsForPool.length)];
    setHookedStudent(luckyStudent);
    setAwardedFeedback(null);

    // Determine target location (default to center-right if not specified)
    let targetX = customTargetX;
    let targetY = customTargetY;
    if (targetX === undefined || targetY === undefined) {
      targetX = 45 + Math.floor(Math.random() * 30);
      targetY = 55 + Math.floor(Math.random() * 25);
    }

    setBaitPos({ x: targetX, y: targetY });

    // Character direction towards target point
    if (targetX < 35) {
      setCharacterFacing('left');
    } else if (targetX > 68) {
      setCharacterFacing('right');
    } else {
      setCharacterFacing('center');
    }

    // Pick or create winning fish
    const matchingFish = fishList.find((f) => f.student.id === luckyStudent.id) || fishList[0];
    const winId = matchingFish ? matchingFish.id : fishList[0]?.id;
    setWinningFishId(winId);

    // STEP 1: CASTING (0 - 900ms)
    setFishingState('casting');
    if (!soundMuted) soundFx.playCast();

    // STEP 2: BAIT LANDING & WATER SPLASH (900ms)
    setTimeout(() => {
      setFishingState('splash');
      if (!soundMuted) soundFx.playSplash();

      // Spawn splash particles
      const splashParticles = [];
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14;
        const speed = 2.5 + Math.random() * 4;
        splashParticles.push({
          id: Date.now() + i,
          x: targetX!,
          y: targetY!,
          vx: Math.cos(angle) * speed,
          vy: -Math.abs(Math.sin(angle) * speed * 2)
        });
      }
      setSplashes(splashParticles);

      // Water ripple ring at target location
      setWaterRipples((prev) => [
        ...prev,
        { id: Date.now(), x: targetX!, y: targetY!, size: 10, opacity: 1 }
      ]);
    }, 900);

    // STEP 3: FISH RACING / SWARMING (1200ms - 4000ms)
    setTimeout(() => {
      setFishingState('racing');
      if (!soundMuted) soundFx.playBubbles();
    }, 1200);

    // STEP 4: LUCKY FISH BITE (3800ms)
    setTimeout(() => {
      setFishingState('biting');
      if (!soundMuted) soundFx.playFishBite();
    }, 3800);

    // STEP 5: REELING IN (4800ms - 6000ms)
    setTimeout(() => {
      setFishingState('reeling');
      if (!soundMuted) soundFx.playReelIn();

      let progress = 0;
      const reelInterval = setInterval(() => {
        progress += 0.08;
        if (progress >= 1) {
          progress = 1;
          clearInterval(reelInterval);

          // STEP 6: CAUGHT & CELEBRATION!
          setFishingState('caught');
          setShowCelebrationModal(true);
          if (!soundMuted) soundFx.playWin();

          setCaughtFishHistory((prev) => [
            {
              student: luckyStudent,
              caughtAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            },
            ...prev
          ]);

          if (onSelectStudent) {
            onSelectStudent(luckyStudent);
          }
        }
        setReelProgress(progress);
      }, 50);
    }, 4800);
  };

  // POINTER / TOUCH HANDLER ON POND WATER SURFACE
  const handlePondPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore clicks on UI elements with no-pond-click or form controls
    const target = e.target as HTMLElement;
    if (
      target.closest('.no-pond-click') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'A'
    ) {
      return;
    }

    if (fishingState !== 'idle' || availableStudentsForPool.length === 0) return;

    if (!pondContainerRef.current) return;
    const rect = pondContainerRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp coordinates to valid water area (X: 12% - 88%, Y: 40% - 88%)
    const clampedX = Math.max(12, Math.min(88, rawX));
    const clampedY = Math.max(40, Math.min(88, rawY));

    // Instant touch feedback ripples & sparkles at EXACT (rawX, rawY)
    setWaterRipples((prev) => [
      ...prev,
      { id: Date.now(), x: rawX, y: rawY, size: 8, opacity: 1 }
    ]);

    const sparkCols = ['#FACC15', '#38BDF8', '#4ADE80', '#FFFFFF'];
    const newSpks: TouchSparkle[] = [];
    for (let i = 0; i < 6; i++) {
      newSpks.push({
        id: Date.now() + i,
        x: rawX + (Math.random() - 0.5) * 5,
        y: rawY + (Math.random() - 0.5) * 5,
        color: sparkCols[i % sparkCols.length],
        opacity: 1
      });
    }
    setTouchSparkles((prev) => [...prev.slice(-15), ...newSpks]);

    // Trigger cast towards clicked point
    startFishing(clampedX, clampedY);
  };

  const handleAwardPoints = (points: number) => {
    if (!hookedStudent) return;
    if (!soundMuted) soundFx.playBonus();

    if (onAwardPoints) {
      onAwardPoints(hookedStudent, points, customReason);
    }

    setCaughtFishHistory((prev) =>
      prev.map((item) =>
        item.student.id === hookedStudent.id ? { ...item, pointsAwarded: points } : item
      )
    );

    setAwardedFeedback(`Đã cộng +${points} điểm thi đua/học tập cho bạn ${hookedStudent.fullName}! 🎉`);
  };

  const resetFishing = () => {
    setFishingState('idle');
    setReelProgress(0);
    setWinningFishId(null);
    setShowCelebrationModal(false);
    setAwardedFeedback(null);
  };

  // Calculate dynamic fishing rod tip & hook coordinates
  const radAngle = Math.atan2(baitPos.y - 25, baitPos.x - 21);
  const rodLenPct = 13;
  const rodTipX = 21 + Math.cos(radAngle) * rodLenPct;
  const rodTipY = 25 + Math.sin(radAngle) * rodLenPct;

  const currentHookX =
    fishingState === 'idle'
      ? 28
      : fishingState === 'reeling'
      ? baitPos.x - reelProgress * 15
      : baitPos.x;

  const currentHookY =
    fishingState === 'idle'
      ? 35
      : fishingState === 'reeling'
      ? baitPos.y - reelProgress * 38
      : baitPos.y;

  const studentAvatarUrl = currentUser
    ? getAvatarUrl(currentUser)
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120';

  return (
    <div className="relative w-full rounded-[36px] overflow-hidden border-4 border-[#0284C7] shadow-[0_20px_48px_rgba(2,132,199,0.3)] bg-gradient-to-b from-[#38BDF8] via-[#0284C7] to-[#075985] select-none">
      {/* 1. TOP HEADER & CONTROL TRAY */}
      <div className="relative z-30 flex items-center justify-between flex-wrap gap-3 p-4 sm:p-6 pb-3 bg-gradient-to-b from-sky-900/50 via-sky-800/20 to-transparent no-pond-click">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-400 text-amber-950 shadow-md text-xl animate-bounce">
              🎣
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#FEF08A] drop-shadow-[0_3px_0_#854D0E] tracking-wide flex items-center gap-2">
                AO CÁ MAY MẮN
              </h1>
              <p className="text-xs sm:text-sm font-black text-[#E0F2FE] drop-shadow-sm">
                Chạm bất kỳ đâu trên mặt hồ để thả câu • Gọi tên ngẫu nhiên học sinh phát biểu
              </p>
            </div>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center flex-wrap gap-2 no-pond-click">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-white shadow-xs">
            <Compass className="w-3.5 h-3.5 text-sky-700" />
            <select
              value={selectedClass}
              disabled={fishingState !== 'idle'}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent text-slate-800 font-black text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả lớp ({students.length} HS)</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Exclude already caught toggle */}
          <button
            type="button"
            disabled={fishingState !== 'idle'}
            onClick={() => {
              soundFx.playClick();
              setExcludeCaught(!excludeCaught);
            }}
            className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 border-2 cursor-pointer ${
              excludeCaught
                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-xs'
                : 'bg-white/80 text-slate-700 border-white hover:bg-white'
            }`}
            title="Tránh gọi trùng các bạn đã được câu trong buổi này"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Không trùng lặp ({availableStudentsForPool.length})</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundMuted(!soundMuted);
              soundFx.playClick();
            }}
            className="p-2 rounded-2xl bg-white/85 text-slate-700 hover:bg-white border-2 border-white shadow-xs cursor-pointer"
            title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-sky-700" />}
          </button>
        </div>
      </div>

      {/* 2. GAME STATUS ANNOUNCEMENT BANNER */}
      <div className="relative z-20 px-4 sm:px-6 no-pond-click">
        {fishingState === 'racing' && (
          <div className="py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg border-2 border-amber-200 animate-pulse">
            <Flame className="w-4 h-4 text-orange-600 animate-bounce" />
            <span>ĐÃ THẢ MỒI TẠI VỊ TRÍ BẠN CHỌN! CÁC CHÚ CÁ ĐANG LAO TỚI TRANH MỒI...</span>
            <Flame className="w-4 h-4 text-orange-600 animate-bounce" />
          </div>
        )}
        {fishingState === 'biting' && (
          <div className="py-2 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-emerald-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg border-2 border-emerald-200 animate-bounce">
            <Sparkles className="w-4 h-4 text-yellow-600" />
            <span>🎯 CẮN CÂU RỒI! CON CÁ MAY MẮN ĐÃ ĐỚP MỒI!</span>
            <Sparkles className="w-4 h-4 text-yellow-600" />
          </div>
        )}
        {fishingState === 'reeling' && (
          <div className="py-2 px-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg border-2 border-purple-300">
            <Zap className="w-4 h-4 text-amber-300 animate-spin" />
            <span>ĐANG KÉO CẦN LÊN... CON CÁ MAY MẮN ĐANG NỔI LÊN MẶT NƯỚC! 🌊</span>
          </div>
        )}
      </div>

      {/* 3. MAIN POND ARENA CANVAS (ENTIRE WATER SURFACE IS FULLY INTERACTIVE ON POINTER/TOUCH) */}
      <div
        ref={pondContainerRef}
        onPointerDown={handlePondPointerDown}
        className={`relative w-full h-[400px] sm:h-[460px] overflow-hidden select-none touch-none ${
          fishingState === 'idle' ? 'cursor-pointer' : 'cursor-wait'
        }`}
      >
        {/* PROMPT BANNER WHEN IDLE */}
        {fishingState === 'idle' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pulse">
            <div className="px-4 py-2 rounded-full bg-sky-950/80 backdrop-blur-md border-2 border-amber-300 text-amber-200 text-xs sm:text-sm font-black shadow-xl flex items-center gap-2">
              <Pointer className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>CHẠM HOẶC CLICK VÀO BẤT KỲ ĐÂU TRÊN MẶT NƯỚC ĐỂ CÂU CÁ 🎣</span>
            </div>
          </div>
        )}

        {/* Background Environment SVG: Sky, Hills, Water Depth, Lotus Pads */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 480"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="deepWaterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="35%" stopColor="#0369A1" />
              <stop offset="100%" stopColor="#082F49" />
            </linearGradient>
            <linearGradient id="lushGrassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="60%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="sunRayGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Sky & Distant Green Hills */}
          <rect width="1000" height="200" fill="url(#skyGrad)" />
          <path d="M0 130 Q250 80 500 120 T1000 100 L1000 220 L0 220 Z" fill="#4ADE80" opacity="0.6" />
          <path d="M0 150 Q350 110 750 145 T1000 135 L1000 240 L0 240 Z" fill="#16A34A" opacity="0.5" />

          {/* Sun Rays filtering into water */}
          <polygon points="120,0 260,0 480,480 320,480" fill="url(#sunRayGrad)" />
          <polygon points="400,0 520,0 780,480 640,480" fill="url(#sunRayGrad)" />

          {/* Grass Bank */}
          <path d="M0 160 Q300 130 650 170 Q850 190 1000 170 L1000 480 L0 480 Z" fill="url(#lushGrassGrad)" />

          {/* Deep Sparkling Pond Water */}
          <path
            d="M0 200 Q250 175 520 195 Q820 215 1000 185 L1000 480 L0 480 Z"
            fill="url(#deepWaterGrad)"
          />

          {/* Underwater Seaweeds & Reeds */}
          <g opacity="0.7">
            <path d="M90 480 Q60 360 110 270" stroke="#166534" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M115 480 Q150 350 100 260" stroke="#22C55E" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M880 480 Q840 370 900 280" stroke="#166534" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M910 480 Q950 360 890 270" stroke="#22C55E" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M480 480 Q510 400 470 340" stroke="#15803D" strokeWidth="5" strokeLinecap="round" fill="none" />
          </g>

          {/* Cute Floating Lily Pads (Lá sen) & Lotus Flowers (Hoa sen) */}
          <g opacity="0.95">
            {/* Lily pad 1 */}
            <path d="M 320 280 A 25 25 0 1 1 350 285 L 335 282 Z" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
            {/* Lotus flower 1 */}
            <circle cx="335" cy="275" r="7" fill="#F472B6" />
            <circle cx="335" cy="275" r="3" fill="#FACC15" />

            {/* Lily pad 2 */}
            <path d="M 720 340 A 32 32 0 1 1 755 348 L 738 344 Z" fill="#16A34A" stroke="#15803D" strokeWidth="2" />
            {/* Lotus flower 2 */}
            <circle cx="740" cy="335" r="9" fill="#FB7185" />
            <circle cx="740" cy="335" r="4" fill="#FACC15" />

            {/* Lily pad 3 */}
            <path d="M 180 380 A 28 28 0 1 1 210 385 L 195 382 Z" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
          </g>

          {/* Shimmer water lines */}
          <ellipse cx="420" cy="260" rx="80" ry="8" fill="none" stroke="#7DD3FC" strokeWidth="2" opacity="0.35" />
          <ellipse cx="680" cy="310" rx="110" ry="12" fill="none" stroke="#7DD3FC" strokeWidth="2" opacity="0.3" />

          {/* Wooden Dock on Left */}
          <g transform="translate(25, 135)">
            <rect x="0" y="45" width="230" height="26" rx="5" fill="#B45309" stroke="#78350F" strokeWidth="3.5" />
            <rect x="0" y="45" width="230" height="5" fill="#F59E0B" />
            <rect x="35" y="70" width="18" height="120" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
            <rect x="115" y="70" width="18" height="140" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
            <rect x="195" y="70" width="18" height="170" rx="3" fill="#78350F" stroke="#451A03" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Dynamic Water Ripples on Pointer Touch */}
        {waterRipples.map((r) => (
          <div
            key={r.id}
            style={{
              left: `${r.x}%`,
              top: `${r.y}%`,
              width: `${r.size * 2}px`,
              height: `${r.size}px`,
              opacity: r.opacity
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-100 pointer-events-none filter drop-shadow-sm"
          />
        ))}

        {/* Touch Sparkles at Click Point */}
        {touchSparkles.map((s) => (
          <div
            key={s.id}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              backgroundColor: s.color,
              opacity: s.opacity
            }}
            className="absolute w-2.5 h-2.5 rounded-full pointer-events-none animate-ping shadow-md"
          />
        ))}

        {/* Ambient Rising Water Bubbles */}
        {bubbles.map((b) => (
          <div
            key={b.id}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`
            }}
            className="absolute rounded-full bg-white/40 border border-white/60 pointer-events-none filter drop-shadow-xs"
          />
        ))}

        {/* Splash Droplets */}
        {splashes.map((s) => (
          <div
            key={s.id}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`
            }}
            className="absolute w-2.5 h-2.5 rounded-full bg-sky-200 border border-white pointer-events-none shadow-sm animate-ping"
          />
        ))}

        {/* Water Ring at Bait Target Location */}
        {fishingState !== 'idle' && (
          <div
            style={{ left: `${baitPos.x}%`, top: `${baitPos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
          >
            <div className="w-16 h-8 rounded-full border-2 border-white/70 animate-ping" />
            <div className="w-24 h-12 rounded-full border border-sky-200/50 animate-pulse" />
          </div>
        )}

        {/* DYNAMIC SVG FISHING LINE */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
          <path
            d={`M ${rodTipX * 10} ${rodTipY * 4.6} Q ${(rodTipX + currentHookX) * 5} ${
              fishingState === 'casting'
                ? 35
                : (rodTipY + currentHookY) * 2.2 + (fishingState === 'racing' ? Math.sin(Date.now() * 0.01) * 6 : 0)
            } ${currentHookX * 10} ${currentHookY * 4.6}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={fishingState === 'reeling' ? 2.8 : 1.8}
            strokeDasharray={fishingState === 'casting' ? '6,3' : 'none'}
            className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
          />
        </svg>

        {/* CHIBI FISHERMAN CHARACTER ON DOCK (USES STUDENT'S AVATAR) */}
        <div className="absolute top-20 sm:top-24 left-16 sm:left-24 z-25 pointer-events-none">
          <div
            style={{
              transform: characterFacing === 'left' ? 'scaleX(-1)' : 'none',
              transition: 'transform 0.3s ease-out'
            }}
            className="relative w-36 h-44"
          >
            {/* Fishing Rod SVG */}
            <svg viewBox="0 0 140 160" className="w-full h-full filter drop-shadow-[0_10px_16px_rgba(0,0,0,0.35)]">
              <g
                transform={
                  fishingState === 'casting'
                    ? 'rotate(-28 65 75)'
                    : fishingState === 'reeling'
                    ? 'rotate(-12 65 75)'
                    : 'rotate(0 65 75)'
                }
                className="transition-transform duration-300"
              >
                {/* Rod Shaft */}
                <line x1="60" y1="80" x2="165" y2="15" stroke="#78350F" strokeWidth="6" strokeLinecap="round" />
                <line x1="60" y1="80" x2="165" y2="15" stroke="#F59E0B" strokeWidth="2.8" strokeLinecap="round" />
                {/* Reel Mechanism */}
                <circle cx="72" cy="70" r="7.5" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
                <line x1="72" y1="70" x2="78" y2="64" stroke="#0F172A" strokeWidth="2" />
              </g>
            </svg>

            {/* Student's Chibi Avatar Body & Head */}
            <div className="absolute top-8 left-4 w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 bg-amber-50 shadow-md">
              <img
                src={studentAvatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>

            {/* Fisherman Straw Hat */}
            <div className="absolute top-1 left-0 w-24 h-10 pointer-events-none">
              <svg viewBox="0 0 100 40" className="w-full h-full filter drop-shadow-sm">
                <ellipse cx="50" cy="25" rx="45" ry="12" fill="#F59E0B" stroke="#B45309" strokeWidth="2.5" />
                <ellipse cx="50" cy="16" rx="24" ry="12" fill="#D97706" />
                <path d="M 20 22 Q 50 28 80 22" stroke="#B45309" strokeWidth="2" fill="none" />
              </svg>
            </div>

            {/* Fisherman Body Vest */}
            <div className="absolute top-22 left-6 w-12 h-10 bg-sky-600 rounded-xl border-2 border-sky-800 shadow-xs flex items-center justify-center">
              <span className="text-[10px] text-white font-black">ITEN</span>
            </div>

            {/* Bucket beside student */}
            <div className="absolute top-24 -left-9 w-11 h-11">
              <svg viewBox="0 0 50 50" className="w-full h-full">
                <polygon points="10,12 40,12 34,44 16,44" fill="#64748B" stroke="#334155" strokeWidth="2.5" />
                <ellipse cx="25" cy="12" rx="15" ry="4.5" fill="#94A3B8" stroke="#334155" strokeWidth="2" />
                <path d="M12 12 Q25 -2 38 12" stroke="#334155" strokeWidth="2.5" fill="none" />
                {caughtFishHistory.length > 0 && (
                  <polygon points="26,10 33,1 23,3" fill="#FB923C" stroke="#EA580C" strokeWidth="1" />
                )}
              </svg>
              {caughtFishHistory.length > 0 && (
                <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[9px] font-black border border-white">
                  {caughtFishHistory.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FLOATING BOBBER & TASTY BAIT */}
        {fishingState !== 'idle' && (
          <div
            style={{
              left: `${currentHookX}%`,
              top: `${currentHookY}%`
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-22 pointer-events-none transition-all duration-75"
          >
            <div className="relative">
              {/* Floating Bobber */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-b from-red-500 via-red-500 to-white border-2 border-white shadow-md animate-bounce" />
              <div className="absolute -inset-2 rounded-full bg-yellow-300/40 animate-ping pointer-events-none" />
              {/* Bait */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-0.5 h-3 bg-white/80" />
                <div className="px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[9px] font-black shadow-xs border border-white whitespace-nowrap animate-pulse">
                  🐛 Mồi ngon
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SCHOOL OF FISH SWIMMING IN THE POND */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {fishList.map((fish) => {
            const isWinner = fish.isWinner && (fishingState === 'biting' || fishingState === 'reeling');

            return (
              <div
                key={fish.id}
                style={{
                  left: `${fish.currentX}%`,
                  top: `${fish.currentY}%`,
                  transform: `translate(-50%, -50%) scale(${fish.size * (isWinner ? 1.35 : 1)}) scaleX(${
                    fish.direction
                  })`,
                  transition:
                    fishingState === 'idle'
                      ? 'none'
                      : fishingState === 'racing'
                      ? 'transform 0.15s ease-out'
                      : 'transform 0.1s ease-out'
                }}
                className={`absolute flex items-center justify-center transition-all ${
                  isWinner ? 'z-40' : 'z-20'
                }`}
              >
                {/* 2.5D CUTE CARTOON FISH COMPONENT */}
                <div className="relative flex flex-col items-center">
                  {/* Floating Chat / Emotion Bubble */}
                  {fish.chatBubble && (
                    <div
                      style={{
                        transform: `scaleX(${fish.direction})`
                      }}
                      className="absolute -top-7 px-2 py-0.5 rounded-xl bg-white/95 text-slate-900 text-[10px] sm:text-xs font-black shadow-md border-2 border-amber-300 whitespace-nowrap animate-bounce z-50"
                    >
                      {fish.chatBubble}
                    </div>
                  )}

                  {/* Golden Aura for Winner */}
                  {isWinner && (
                    <>
                      <div className="absolute -inset-4 rounded-full bg-amber-300/50 animate-ping" />
                      <div className="absolute -top-5 text-lg animate-bounce">👑</div>
                    </>
                  )}

                  {/* SVG FISH BODY */}
                  <div className="relative w-14 h-8 sm:w-16 sm:h-9 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">
                    <svg viewBox="0 0 90 50" className="w-full h-full">
                      <path
                        d="M68 25 C56 8 28 8 10 25 C28 42 56 42 68 25 Z"
                        fill={isWinner ? '#FACC15' : fish.color}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <polygon
                        points="68,25 86,10 78,25 86,40"
                        fill={isWinner ? '#EAB308' : fish.secondaryColor}
                        stroke="#FFFFFF"
                        strokeWidth="1.8"
                        className={fishingState === 'racing' ? 'animate-pulse' : ''}
                      />
                      <path
                        d="M32 10 Q45 2 58 10"
                        stroke={isWinner ? '#EAB308' : fish.secondaryColor}
                        strokeWidth="3.5"
                        fill={isWinner ? '#EAB308' : fish.secondaryColor}
                      />
                      <ellipse
                        cx="38"
                        cy="28"
                        rx="8"
                        ry="4"
                        fill={fish.secondaryColor}
                        opacity="0.85"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                      />
                      <circle cx="22" cy="20" r="5.5" fill="#FFFFFF" />
                      <circle cx="20.5" cy="20" r="3.2" fill="#0F172A" />
                      <circle cx="19.5" cy="18.5" r="1.3" fill="#FFFFFF" />

                      <path
                        d="M40 18 Q44 25 40 32"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        opacity="0.6"
                        fill="none"
                      />
                      <path
                        d="M50 18 Q54 25 50 32"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        opacity="0.6"
                        fill="none"
                      />
                    </svg>
                  </div>

                  {/* Student Name Tag under Fish */}
                  <div
                    style={{
                      transform: `scaleX(${fish.direction})`
                    }}
                    className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black shadow-md border whitespace-nowrap flex items-center gap-1 ${
                      isWinner
                        ? 'bg-amber-400 text-amber-950 border-amber-200 ring-2 ring-yellow-300'
                        : 'bg-white/95 text-slate-800 border-white/90'
                    }`}
                  >
                    {isWinner && <Star className="w-3 h-3 fill-amber-950" />}
                    <span>{fish.student.fullName.split(' ').slice(-2).join(' ')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 5. BOTTOM STATUS CARD & QUICK CAST BUTTON */}
        <div className="absolute bottom-4 right-4 sm:right-6 z-30 flex flex-col items-end gap-2 no-pond-click">
          <Game3DButton
            variant="orange"
            size="lg"
            disabled={fishingState !== 'idle' || availableStudentsForPool.length === 0}
            onClick={() => startFishing()}
            className={`shadow-[0_6px_0_#9A3412] font-black text-xs sm:text-sm no-pond-click ${
              fishingState === 'idle' ? 'hover:scale-105' : ''
            }`}
          >
            {fishingState === 'idle'
              ? '🎣 CÂU NGẪU NHIÊN'
              : fishingState === 'casting'
              ? '🌊 ĐANG QUĂNG CẦU...'
              : fishingState === 'racing'
              ? '💨 CÁ ĐANG TRANH MỒI...'
              : fishingState === 'biting'
              ? '🎯 ĐÃ CẮN CÂU!'
              : '🌟 ĐANG KÉO CÁ LÊN...'}
          </Game3DButton>
          <span className="text-[11px] font-bold text-white/90 bg-sky-900/70 backdrop-blur-sm px-3 py-1 rounded-xl shadow-xs border border-white/20">
            {availableStudentsForPool.length} học sinh sẵn sàng trong hồ
          </span>
        </div>
      </div>

      {/* 6. CAUGHT FISH HISTORY TRAY */}
      {caughtFishHistory.length > 0 && (
        <div className="p-4 sm:p-5 bg-sky-950/70 border-t-2 border-sky-400/30 backdrop-blur-md no-pond-click">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-amber-300">
              <History className="w-4 h-4 text-amber-400" />
              <span>DANH SÁCH HỌC SINH MAY MẮN ĐÃ ĐƯỢC CÂU ({caughtFishHistory.length})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Em có chắc muốn xóa lịch sử các lần câu vừa rồi?')) {
                  setCaughtFishHistory([]);
                  soundFx.playClick();
                }
              }}
              className="text-[11px] font-bold text-sky-200 hover:text-white underline cursor-pointer"
            >
              Làm mới danh sách
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {caughtFishHistory.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white/90 border border-amber-200 shadow-sm shrink-0 min-w-[200px]"
              >
                <div className="relative">
                  <img
                    src={
                      getAvatarUrl(item.student)
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border-2 border-amber-400 bg-sky-50"
                  />
                  <span className="absolute -top-1 -right-1 text-xs">🎣</span>
                </div>
                <div className="min-w-0">
                  <div className="font-black text-slate-800 text-xs truncate">
                    {item.student.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <span>{item.student.className || 'Lớp 8A1'}</span>
                    <span>• {item.caughtAt}</span>
                  </div>
                  {item.pointsAwarded && (
                    <span className="text-[10px] font-black text-emerald-700">
                      +{item.pointsAwarded}đ thưởng ⭐
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. CELEBRATION MODAL: CON CÁ MAY MẮN */}
      {showCelebrationModal && hookedStudent && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-pond-click">
          <div className="bg-gradient-to-b from-sky-50 via-white to-amber-50 rounded-[36px] p-6 sm:p-8 max-w-lg w-full border-4 border-amber-400 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 text-9xl opacity-10 select-none pointer-events-none">
              🎣
            </div>

            <button
              type="button"
              onClick={resetFishing}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Avatar with Golden Crown */}
            <div className="relative inline-block mt-2">
              <div className="w-32 h-32 mx-auto rounded-full p-2 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border-4 border-amber-300 shadow-xl bg-white">
                <img
                  src={
                    getAvatarUrl(hookedStudent)
                  }
                  alt={hookedStudent.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                👑
              </span>
              <span className="absolute bottom-0 -right-2 text-3xl animate-spin">⭐</span>
            </div>

            {/* Congratulation Titles */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider mb-2 border border-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>CHÚC MỪNG CON CÁ MAY MẮN!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {hookedStudent.fullName}
              </h2>
              <div className="text-sm font-black text-sky-700 mt-1">
                {hookedStudent.className || 'Lớp 8A1'} {hookedStudent.team ? `• ${hookedStudent.team}` : ''}
              </div>
            </div>

            {/* Question prompt guidance */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs sm:text-sm font-bold text-amber-900 space-y-1">
              <p>🎯 Mời bạn <strong>{hookedStudent.fullName}</strong> phát biểu trả lời câu hỏi của thầy/cô!</p>
              <p className="text-[11px] text-amber-700 font-medium">
                Thầy/cô có thể chọn mức điểm thưởng thi đua trực tiếp bên dưới sau khi bạn hoàn thành câu trả lời.
              </p>
            </div>

            {/* Custom point reason input */}
            <div className="text-left space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Lý do khen thưởng / ghi nhận:</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="VD: Trả lời đúng câu hỏi may mắn, phát biểu xuất sắc..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Award Points Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleAwardPoints(1)}
                className="py-2.5 px-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-md border-b-4 border-emerald-700 hover:border-b-2 active:translate-y-1 transition-all cursor-pointer"
              >
                ⭐ +1 ĐIỂM
              </button>
              <button
                type="button"
                onClick={() => handleAwardPoints(2)}
                className="py-2.5 px-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md border-b-4 border-amber-700 hover:border-b-2 active:translate-y-1 transition-all cursor-pointer"
              >
                ⭐⭐ +2 ĐIỂM
              </button>
              <button
                type="button"
                onClick={() => handleAwardPoints(5)}
                className="py-2.5 px-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md border-b-4 border-purple-800 hover:border-b-2 active:translate-y-1 transition-all cursor-pointer"
              >
                🏆 +5 ĐIỂM
              </button>
            </div>

            {awardedFeedback && (
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 animate-in fade-in">
                {awardedFeedback}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Game3DButton
                variant="orange"
                size="lg"
                className="flex-1"
                onClick={() => {
                  resetFishing();
                  setTimeout(() => {
                    startFishing();
                  }, 300);
                }}
              >
                🎣 CÂU TIẾP THEO
              </Game3DButton>

              <Game3DButton
                variant="wood"
                size="lg"
                onClick={resetFishing}
              >
                ĐÓNG
              </Game3DButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
