import React from 'react';
import { FlowerGameConfig, FlowerGameQuestion } from '../../types';
import { soundFx } from '../../utils/sound';
import { WoodenSign } from './WoodenSign';
import { Game3DButton } from './Game3DButton';
import { Volume2, VolumeX, HelpCircle, Sparkles, Check, Star, RefreshCw } from 'lucide-react';

interface FlowerTreeSceneProps {
  config: FlowerGameConfig;
  score: number;
  pickedItems: number[];
  onPickItem: (index: number) => void;
  onResetGame: () => void;
  onOpenSettings?: () => void;
  isTeacherOrAdmin?: boolean;
}

export const FlowerTreeScene: React.FC<FlowerTreeSceneProps> = ({
  config,
  score,
  pickedItems,
  onPickItem,
  onResetGame,
  onOpenSettings,
  isTeacherOrAdmin
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [showGuideModal, setShowGuideModal] = React.useState(false);

  // 10 items positioned organically across the lush cartoon tree crown
  // (matching tree branches in Image 1)
  const treeItems = [
    { id: 0, type: 'flower', x: 28, y: 38, isLucky: false },
    { id: 1, type: 'fruit', x: 22, y: 55, isLucky: false },
    { id: 2, type: 'fruit', x: 38, y: 30, isLucky: false },
    { id: 3, type: 'flower', x: 44, y: 48, isLucky: true },
    { id: 4, type: 'fruit', x: 50, y: 22, isLucky: false },
    { id: 5, type: 'fruit', x: 54, y: 40, isLucky: false },
    { id: 6, type: 'flower', x: 62, y: 26, isLucky: false },
    { id: 7, type: 'flower', x: 70, y: 45, isLucky: true },
    { id: 8, type: 'fruit', x: 78, y: 34, isLucky: false },
    { id: 9, type: 'fruit', x: 68, y: 62, isLucky: false },
    { id: 10, type: 'fruit', x: 34, y: 70, isLucky: false },
  ];

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden border-4 border-[#7DD3FC] shadow-[0_16px_36px_rgba(14,165,233,0.22)] bg-gradient-to-b from-[#60A5FA] via-[#93C5FD] to-[#BAE6FD] select-none">
      {/* Top Header Bar inside Learning Garden (like Image 1) */}
      <div className="relative z-30 flex items-center justify-between p-4 sm:p-6 pb-2">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-4xl font-black text-[#FB923C] drop-shadow-[0_3px_0_#FFF7ED] tracking-wide stroke-white">
                HÁI HOA
              </h1>
              <span className="text-2xl sm:text-3xl animate-bounce">🌸</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#FB923C] drop-shadow-[0_3px_0_#FFF7ED] tracking-wide -mt-1.5">
              HỌC TẬP
            </h1>
          </div>
        </div>

        {/* Top Right Controls: Music, Sound, Hướng dẫn */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              soundFx.playClick();
            }}
            className="w-10 h-10 rounded-full bg-white/90 text-[#0284C7] shadow-[0_4px_0_#BAE6FD] border-2 border-white flex items-center justify-center cursor-pointer hover:scale-105 active:translate-y-0.5"
            title="Âm thanh"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => {
              soundFx.playClick();
              setShowGuideModal(true);
            }}
            className="px-4 py-2 rounded-full bg-gradient-to-b from-[#FBBF24] to-[#F59E0B] text-[#5D4037] font-black text-xs sm:text-sm shadow-[0_4px_0_#D97706] border-2 border-[#FEF3C7] cursor-pointer hover:brightness-105 active:translate-y-0.5"
          >
            Hướng dẫn
          </button>

          {isTeacherOrAdmin && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-3 py-2 rounded-full bg-white/90 text-slate-700 font-bold text-xs shadow-[0_3px_0_#CBD5E1] border border-slate-200 cursor-pointer hover:bg-white"
            >
              ⚙️ Cài đặt
            </button>
          )}
        </div>
      </div>

      {/* Main Illustration Canvas Scene */}
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] overflow-hidden">
        {/* Soft Background Hills & Distant Trees */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="60%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </linearGradient>
            <linearGradient id="hillBackGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="100%" stopColor="#4ADE80" />
            </linearGradient>
            <linearGradient id="hillForeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
            <linearGradient id="treeTrunkGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#78350F" />
              <stop offset="50%" stopColor="#92400E" />
              <stop offset="100%" stopColor="#5B21B6" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#86EFAC" />
              <stop offset="30%" stopColor="#4ADE80" />
              <stop offset="80%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#16A34A" />
            </linearGradient>
          </defs>

          {/* Distant Hills Layer */}
          <path d="M0 340 Q250 250 500 320 T1000 300 L1000 500 L0 500 Z" fill="url(#hillBackGrad)" opacity="0.8" />
          
          {/* Foreground Lush Grass Hill Layer */}
          <path d="M0 380 Q300 310 650 360 T1000 350 L1000 500 L0 500 Z" fill="url(#hillForeGrad)" />

          {/* Wooden Fence on the Left */}
          <g transform="translate(110, 310)">
            {/* Horizontal Rails */}
            <rect x="0" y="30" width="160" height="8" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
            <rect x="0" y="55" width="160" height="8" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
            {/* Vertical Posts with pointy tops */}
            <polygon points="10,80 20,80 20,20 15,10 10,20" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
            <polygon points="45,80 55,80 55,20 50,10 45,20" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
            <polygon points="80,80 90,80 90,20 85,10 80,20" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
            <polygon points="115,80 125,80 125,20 120,10 115,20" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
            <polygon points="150,80 160,80 160,20 155,10 150,20" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
          </g>

          {/* Large Center Learning Tree Trunk & Crown (2.5D styled matching image 1) */}
          <g transform="translate(500, 260)">
            {/* Trunk */}
            <path
              d="M-50 160 C-40 100 -60 40 -30 -40 C-10 -70 10 -70 30 -40 C60 40 40 100 50 160 C20 165 -20 165 -50 160 Z"
              fill="#92400E"
              stroke="#78350F"
              strokeWidth="4"
            />
            {/* Root details */}
            <path d="M-50 160 Q-80 170 -110 175 Q-60 155 -35 150" fill="#78350F" opacity="0.6" />
            <path d="M50 160 Q80 170 110 175 Q60 155 35 150" fill="#78350F" opacity="0.6" />

            {/* Tree Crown Cloud Foliage (Lush & Layered) */}
            {/* Outer Dark Leaves Shadow */}
            <ellipse cx="0" cy="-110" rx="240" ry="170" fill="#15803D" />
            <ellipse cx="-130" cy="-70" rx="140" ry="110" fill="#16A34A" />
            <ellipse cx="130" cy="-70" rx="140" ry="110" fill="#16A34A" />
            <ellipse cx="0" cy="-180" rx="160" ry="120" fill="#16A34A" />

            {/* Main Bright Green Leaves Foliage */}
            <ellipse cx="0" cy="-110" rx="220" ry="150" fill="url(#crownGrad)" />
            <ellipse cx="-110" cy="-70" rx="120" ry="90" fill="url(#crownGrad)" />
            <ellipse cx="110" cy="-70" rx="120" ry="90" fill="url(#crownGrad)" />
            <ellipse cx="0" cy="-170" rx="140" ry="100" fill="url(#crownGrad)" />
            <ellipse cx="-60" cy="-140" rx="100" ry="80" fill="#86EFAC" opacity="0.4" />
            <ellipse cx="60" cy="-140" rx="100" ry="80" fill="#86EFAC" opacity="0.4" />
          </g>

          {/* Grass & flower patches in foreground */}
          <g>
            <circle cx="100" cy="420" r="5" fill="#FFFFFF" />
            <circle cx="120" cy="430" r="6" fill="#FDE047" />
            <circle cx="320" cy="440" r="7" fill="#F472B6" />
            <circle cx="700" cy="420" r="6" fill="#FFFFFF" />
            <circle cx="920" cy="410" r="8" fill="#FDE047" />
          </g>
        </svg>

        {/* Floating Clouds */}
        <div className="absolute top-4 left-10 w-28 h-8 bg-white/70 rounded-full blur-xs pointer-events-none" />
        <div className="absolute top-10 right-20 w-36 h-10 bg-white/80 rounded-full blur-xs pointer-events-none" />

        {/* LEFT OVERLAY: Speech Prompt & Score Card (Matching Image 1) */}
        <div className="absolute top-4 left-4 sm:left-8 z-20 space-y-3 max-w-[240px] sm:max-w-[280px]">
          {/* Cute Speech Bubble */}
          <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border-2 border-[#FBCFE8] shadow-[0_6px_0_#F9A8D4] text-xs sm:text-sm font-extrabold text-[#831843] flex items-center gap-2">
            <span className="text-base shrink-0">🌸</span>
            <span>Chọn một bông hoa để trả lời câu hỏi và nhận điểm nhé!</span>
          </div>

          {/* Score Display Card */}
          <div className="bg-white px-5 py-3 rounded-3xl border-2 border-[#FDE68A] shadow-[0_8px_0_#FCD34D,0_12px_24px_rgba(0,0,0,0.08)] flex items-center gap-3.5">
            <span className="text-2xl animate-spin-slow">🌸</span>
            <div>
              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                Điểm của bạn
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#EA580C] drop-shadow-xs flex items-center gap-1.5">
                {score}
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT OVERLAY: Wooden Signpost & Mascot Astro Robot (Matching Image 1) */}
        <div className="absolute bottom-6 right-4 sm:right-10 z-20 flex items-end gap-3 sm:gap-5">
          {/* Wooden Signpost for Question Stats */}
          <WoodenSign
            variant="signpost"
            lines={[
              `Câu hỏi: ${config.questions.length}`,
              `Điểm: +${config.questions.reduce((acc, q) => acc + (q.points || 1), 0)} max`
            ]}
          />

          {/* Mascot Robot waving */}
          <div className="relative flex flex-col items-center select-none group cursor-pointer">
            <div className="w-20 h-20 sm:w-24 sm:h-24 relative transform hover:scale-110 transition-transform">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.25)]">
                {/* Robot Body */}
                <rect x="30" y="60" width="40" height="28" rx="8" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" />
                <polygon points="50,66 53,74 50,80 47,74" fill="#F59E0B" />
                <circle cx="50" cy="65" r="2.5" fill="#EF4444" />
                {/* Robot Helmet */}
                <ellipse cx="50" cy="38" rx="30" ry="26" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="3" />
                {/* Star on Helmet */}
                <polygon points="50,14 52,19 57,19 53,22 55,27 50,24 45,27 47,22 43,19 48,19" fill="#F59E0B" />
                {/* Visor */}
                <rect x="27" y="26" width="46" height="24" rx="10" fill="#0284C7" stroke="#1D4ED8" strokeWidth="1.5" />
                <circle cx="39" cy="37" r="4.5" fill="#FFFFFF" />
                <circle cx="61" cy="37" r="4.5" fill="#FFFFFF" />
                <circle cx="41" cy="36" r="2" fill="#0284C7" />
                <circle cx="63" cy="36" r="2" fill="#0284C7" />
                <path d="M46 42 Q50 46 54 42" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
                {/* Waving Hand */}
                <path d="M72 65 Q86 50 88 38 Q82 36 78 48" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2.5" className="animate-bounce" />
              </svg>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1D4ED8] text-white text-[10px] font-black -mt-2 shadow-sm uppercase tracking-wider">
              Mascot
            </span>
          </div>
        </div>

        {/* CENTER-LEFT: Chibi Schoolboy & Fruit Basket under Tree (Matching Image 1) */}
        <div className="absolute bottom-6 left-1/4 sm:left-1/3 -translate-x-12 sm:-translate-x-16 z-20 flex items-end gap-3 pointer-events-none">
          {/* Chibi Boy in Blue Uniform with Backpack */}
          <div className="w-20 h-28 sm:w-24 sm:h-32 relative animate-bounce-subtle">
            <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_8px_12px_rgba(0,0,0,0.2)]">
              {/* Blue Backpack */}
              <rect x="22" y="48" width="16" height="34" rx="6" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
              {/* School Uniform Body */}
              <path d="M30 92 L30 52 L70 52 L70 92 Z" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
              {/* Blue Tie */}
              <polygon points="50,56 53,64 50,74 47,64" fill="#0284C7" />
              {/* Blue Shorts */}
              <rect x="32" y="86" width="36" height="20" rx="3" fill="#1D4ED8" />
              {/* Legs & Shoes */}
              <rect x="36" y="104" width="10" height="12" fill="#FFE5D4" />
              <rect x="54" y="104" width="10" height="12" fill="#FFE5D4" />
              <ellipse cx="40" cy="116" rx="8" ry="4" fill="#1E293B" />
              <ellipse cx="60" cy="116" rx="8" ry="4" fill="#1E293B" />
              {/* Head */}
              <ellipse cx="50" cy="30" rx="26" ry="24" fill="#FFE5D4" />
              {/* Hair */}
              <path d="M24 26 C20 10 32 4 50 4 C68 4 80 10 76 26 C70 14 60 12 50 12 C40 12 30 14 24 26 Z" fill="#3D2314" />
              <path d="M22 28 C26 38 28 42 30 44" stroke="#3D2314" strokeWidth="3" fill="none" />
              {/* Cheeks */}
              <circle cx="34" cy="36" r="4" fill="#FB7185" opacity="0.6" />
              <circle cx="66" cy="36" r="4" fill="#FB7185" opacity="0.6" />
              {/* Eyes */}
              <ellipse cx="38" cy="28" rx="4.5" ry="5.5" fill="#1E293B" />
              <circle cx="37" cy="26" r="1.5" fill="#FFFFFF" />
              <ellipse cx="62" cy="28" rx="4.5" ry="5.5" fill="#1E293B" />
              <circle cx="61" cy="26" r="1.5" fill="#FFFFFF" />
              {/* Big Smile */}
              <path d="M44 36 Q50 42 56 36" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" fill="#F43F5E" />
              {/* Waving Arm */}
              <path d="M68 56 Q82 46 86 36" stroke="#FFE5D4" strokeWidth="6" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Wicker Harvest Basket on the grass */}
          <div className="w-12 h-10 sm:w-14 sm:h-12 relative mb-1">
            <svg viewBox="0 0 60 50" className="w-full h-full drop-shadow-md">
              {/* Basket Handle */}
              <path d="M12 25 C12 5 48 5 48 25" stroke="#92400E" strokeWidth="3" fill="none" />
              {/* Basket Body */}
              <path d="M8 20 L14 46 L46 46 L52 20 Z" fill="#B45309" stroke="#78350F" strokeWidth="2" />
              {/* Weave pattern */}
              <line x1="16" y1="22" x2="19" y2="44" stroke="#D97706" strokeWidth="2" />
              <line x1="30" y1="20" x2="30" y2="46" stroke="#D97706" strokeWidth="2" />
              <line x1="44" y1="22" x2="41" y2="44" stroke="#D97706" strokeWidth="2" />
              {/* Picked flowers inside basket */}
              <circle cx="24" cy="20" r="5" fill="#F472B6" />
              <circle cx="34" cy="18" r="5" fill="#FB923C" />
              <circle cx="28" cy="16" r="4" fill="#FDE047" />
            </svg>
          </div>
        </div>

        {/* INTERACTIVE FLOWER & FRUIT OBJECTS ON THE TREE (Positioned organically) */}
        <div className="absolute inset-0 z-20 pointer-events-auto">
          {treeItems.map((item, idx) => {
            const isPicked = pickedItems.includes(idx);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isPicked) {
                    soundFx.playPop();
                    onPickItem(idx);
                  }
                }}
                disabled={isPicked}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transform transition-all duration-300 cursor-pointer ${
                  isPicked
                    ? 'opacity-25 scale-75 cursor-not-allowed pointer-events-none'
                    : 'hover:scale-130 active:scale-95 animate-bounce-subtle hover:z-30'
                }`}
                title={
                  isPicked
                    ? 'Đã hái'
                    : item.type === 'flower'
                    ? item.isLucky
                      ? '🌸 Hoa May Mắn (Điểm nhân đôi!)'
                      : '🌸 Bông hoa học tập (+1 điểm)'
                    : '🍎 Quả ngọt tri thức (+2 điểm)'
                }
              >
                {item.type === 'flower' ? (
                  /* 3D Cherry Blossom / Pink Flower */
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="24" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
                      <circle cx="75" cy="42" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
                      <circle cx="65" cy="72" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
                      <circle cx="35" cy="72" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
                      <circle cx="25" cy="42" r="18" fill="#F472B6" stroke="#DB2777" strokeWidth="2" />
                      {/* Flower Center */}
                      <circle cx="50" cy="50" r="15" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2.5" />
                      <circle cx="48" cy="48" r="4" fill="#FFFFFF" />
                      {item.isLucky && (
                        <circle cx="50" cy="50" r="17" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="3,3" className="animate-spin" />
                      )}
                    </svg>
                    {item.isLucky && (
                      <span className="absolute -top-2 -right-2 text-xs animate-ping">✨</span>
                    )}
                  </div>
                ) : (
                  /* 3D Golden Orange / Apple Fruit */
                  <div className="relative w-11 h-11 sm:w-13 sm:h-13 flex items-center justify-center filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* Leaf & Stem */}
                      <path d="M50 20 Q52 10 50 6" stroke="#78350F" strokeWidth="4" strokeLinecap="round" fill="none" />
                      <path d="M50 14 Q65 10 68 20 Q55 22 50 14 Z" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
                      {/* Fruit Body */}
                      <circle cx="50" cy="55" r="38" fill="#FB923C" stroke="#EA580C" strokeWidth="3" />
                      {/* Glossy Highlight */}
                      <ellipse cx="38" cy="42" rx="10" ry="14" fill="#FDBA74" opacity="0.8" transform="rotate(-25 38 42)" />
                      <circle cx="34" cy="38" r="4" fill="#FFFFFF" opacity="0.9" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border-4 border-[#7DD3FC] shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-[#0284C7] flex items-center gap-2">
                <span>🌸</span> Hướng dẫn chơi Hái Hoa
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700">
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-start gap-2.5">
                <span className="text-xl">🌸</span>
                <div>
                  <div className="font-extrabold text-[#166534]">Bông hoa học tập</div>
                  <div className="text-xs text-slate-600">Trả lời đúng nhận +1 điểm thi đua.</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-start gap-2.5">
                <span className="text-xl">🍎</span>
                <div>
                  <div className="font-extrabold text-[#9A3412]">Quả ngọt tri thức</div>
                  <div className="text-xs text-slate-600">Câu hỏi thử thách hơn, nhận +2 điểm thi đua!</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <div className="font-extrabold text-[#991B1B]">Hoa may mắn (Lucky Bonus)</div>
                  <div className="text-xs text-slate-600">Điểm thưởng được nhân 2 hoặc nhân 3 tức thì!</div>
                </div>
              </div>
            </div>

            <Game3DButton
              variant="orange"
              size="lg"
              className="w-full"
              onClick={() => setShowGuideModal(false)}
            >
              ĐÃ HIỂU, CHƠI NGAY! 🚀
            </Game3DButton>
          </div>
        </div>
      )}
    </div>
  );
};
