import React from 'react';

interface RaceVehicleSvgProps {
  vehicleId?: string;
  vehicleName?: string;
  teamColor?: string;
  teamName?: string;
  isMoving?: boolean;
  isCurrentTurn?: boolean;
  isWinner?: boolean;
  reaction?: 'idle' | 'racing' | 'correct' | 'wrong' | 'boost' | 'victory';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const RaceVehicleSvg: React.FC<RaceVehicleSvgProps> = ({
  vehicleId = 'v3',
  vehicleName = 'Xe đạp thể thao',
  teamColor = '#3b82f6',
  teamName = 'Đội đua',
  isMoving = false,
  isCurrentTurn = false,
  isWinner = false,
  reaction = 'idle',
  size = 'md'
}) => {
  const normName = (vehicleName || '').toLowerCase();
  const vId = (vehicleId || '').toLowerCase();

  const isWalk = vId === 'v1' || normName.includes('bộ') || normName.includes('walk');
  const isBull = vId === 'v2' || normName.includes('bò') || normName.includes('bull');
  const isBike = vId === 'v3' || normName.includes('đạp') || normName.includes('bicycle') || normName.includes('bike');
  const isVespa = vId === 'v4' || normName.includes('vespa') || normName.includes('scooter') || normName.includes('máy');
  const isMotor = vId === 'v5' || normName.includes('mô tô') || normName.includes('moto') || normName.includes('khối lớn');
  const isCar = vId === 'v6' || normName.includes('hơi') || normName.includes('siêu xe') || normName.includes('f1') || normName.includes('car');
  const isRocket = vId === 'v7' || normName.includes('tên lửa') || normName.includes('rocket');

  // Scale mappings
  const sizeDims = {
    sm: { w: 90, h: 60 },
    md: { w: 120, h: 80 },
    lg: { w: 150, h: 100 },
    xl: { w: 180, h: 120 }
  }[size];

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-end select-none transition-transform duration-300 ${
        isMoving ? 'animate-bounce-subtle' : ''
      } ${reaction === 'boost' ? 'scale-110' : ''} ${reaction === 'wrong' ? 'animate-shake' : ''}`}
      style={{ width: `${sizeDims.w}px`, height: `${sizeDims.h}px` }}
    >
      {/* Dynamic Ground Shadow */}
      <div
        className="absolute bottom-1 w-3/4 h-2.5 bg-slate-950/40 rounded-full blur-[2px] transition-all"
        style={{
          transform: isMoving ? 'scaleX(1.1) scaleY(0.8)' : 'scaleX(1)',
          opacity: reaction === 'boost' ? 0.6 : 0.4
        }}
      />

      {/* Speed & Boost Exhaust Particles */}
      {(isMoving || reaction === 'boost') && (
        <div className="absolute -left-5 bottom-2 flex items-center gap-1 pointer-events-none z-0">
          <div className="w-3 h-3 rounded-full bg-amber-400/80 animate-ping" />
          <div className="w-2 h-2 rounded-full bg-orange-500/70 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          {reaction === 'boost' && (
            <div className="text-sm font-black text-amber-300 animate-bounce tracking-tighter drop-shadow-md">
              ⚡NITRO!
            </div>
          )}
        </div>
      )}

      {/* Vehicle SVG Illustrations */}
      <svg
        viewBox="0 0 140 90"
        className="w-full h-full drop-shadow-lg overflow-visible z-10"
      >
        <defs>
          <linearGradient id={`gradBody-${teamColor}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={teamColor} />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="metallicGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
        </defs>

        {/* 1. WALKING / CHIBI RUNNER */}
        {isWalk && (
          <g transform="translate(10, 5)">
            {/* Chibi Runner Body & Shoes */}
            {/* Running dust */}
            {isMoving && (
              <circle cx="20" cy="72" r="6" fill="#FDE68A" opacity="0.6" className="animate-ping" />
            )}
            {/* Legs */}
            <path
              d={isMoving ? "M45 55 L30 75 L22 75 M55 55 L70 75 L80 75" : "M45 55 L40 75 L32 75 M55 55 L60 75 L68 75"}
              stroke="#1E293B"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Shoes */}
            <ellipse cx={isMoving ? 24 : 34} cy="75" rx="8" ry="4" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
            <ellipse cx={isMoving ? 78 : 66} cy="75" rx="8" ry="4" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
            {/* Torso with School Jersey */}
            <path d="M38 35 L62 35 L68 58 L32 58 Z" fill={teamColor} stroke="#0F172A" strokeWidth="2.5" />
            <rect x="42" y="40" width="16" height="12" rx="3" fill="#FFFFFF" opacity="0.9" />
            <text x="50" y="49" textAnchor="middle" fontSize="9" fontWeight="900" fill="#1E293B">#1</text>
            {/* Arms swinging */}
            <path
              d={isMoving ? "M36 38 L20 48 L22 36 M64 38 L80 48 L86 42" : "M36 38 L28 50 M64 38 L72 50"}
              stroke="#FDBA74"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Chibi Head */}
            <circle cx="50" cy="22" r="16" fill="#FDBA74" stroke="#EA580C" strokeWidth="2" />
            {/* Hair */}
            <path d="M35 18 Q50 6 65 18 Q62 8 50 8 Q38 8 35 18 Z" fill="#451A03" />
            {/* Sporty Headband */}
            <rect x="34" y="14" width="32" height="6" rx="3" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
            {/* Face */}
            <circle cx="45" cy="22" r="2.5" fill="#1E293B" />
            <circle cx="55" cy="22" r="2.5" fill="#1E293B" />
            {/* Expression */}
            {reaction === 'wrong' ? (
              <path d="M46 28 Q50 25 54 28" stroke="#1E293B" strokeWidth="1.5" fill="none" />
            ) : (
              <path d="M46 26 Q50 30 54 26" stroke="#EA580C" strokeWidth="2" fill="#F87171" />
            )}
            {/* Cheeks */}
            <circle cx="41" cy="25" r="2" fill="#FB7185" opacity="0.8" />
            <circle cx="59" cy="25" r="2" fill="#FB7185" opacity="0.8" />
          </g>
        )}

        {/* 2. BULL CART / XE BÒ SIÊU TỐC */}
        {isBull && (
          <g transform="translate(5, 5)">
            {/* Wooden Cart Box */}
            <rect x="15" y="32" width="45" height="28" rx="6" fill="#B45309" stroke="#78350F" strokeWidth="2.5" />
            <line x1="20" y1="42" x2="55" y2="42" stroke="#78350F" strokeWidth="2" />
            <line x1="20" y1="50" x2="55" y2="50" stroke="#78350F" strokeWidth="2" />
            {/* Team Flag on Cart */}
            <line x1="18" y1="12" x2="18" y2="35" stroke="#475569" strokeWidth="2" />
            <polygon points="18,12 36,18 18,24" fill={teamColor} stroke="#0F172A" strokeWidth="1.5" />
            {/* Chibi Rider inside cart */}
            <circle cx="36" cy="26" r="10" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.5" />
            <circle cx="33" cy="26" r="1.5" fill="#1E293B" />
            <circle cx="39" cy="26" r="1.5" fill="#1E293B" />
            <path d="M33 30 Q36 33 39 30" stroke="#EA580C" strokeWidth="1.5" fill="none" />
            {/* Cart Wheels */}
            <g className={isMoving ? 'animate-spin-slow origin-[38px_65px]' : ''}>
              <circle cx="38" cy="65" r="14" fill="#78350F" stroke="#451A03" strokeWidth="2.5" />
              <circle cx="38" cy="65" r="5" fill="#D97706" />
              <line x1="24" y1="65" x2="52" y2="65" stroke="#D97706" strokeWidth="2" />
              <line x1="38" y1="51" x2="38" y2="79" stroke="#D97706" strokeWidth="2" />
            </g>
            {/* Cart Shaft to Bull */}
            <line x1="58" y1="48" x2="82" y2="48" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            {/* Cute Cartoon Bull */}
            <ellipse cx="96" cy="46" rx="22" ry="16" fill="#92400E" stroke="#451A03" strokeWidth="2" />
            {/* Bull Legs */}
            <rect x="84" y="58" width="6" height="18" rx="3" fill="#78350F" />
            <rect x="104" y="58" width="6" height="18" rx="3" fill="#78350F" />
            {/* Bull Head */}
            <circle cx="116" cy="38" r="12" fill="#92400E" stroke="#451A03" strokeWidth="2" />
            <ellipse cx="122" cy="42" rx="7" ry="5" fill="#FDBA74" />
            <circle cx="118" cy="36" r="2" fill="#1E293B" />
            <circle cx="123" cy="42" r="1.5" fill="#451A03" />
            {/* Golden Horns */}
            <path d="M112 30 Q106 18 116 16 Q118 24 116 28" fill="url(#goldGradient)" stroke="#854D0E" strokeWidth="1.5" />
            <path d="M120 30 Q126 18 122 16 Q118 24 120 28" fill="url(#goldGradient)" stroke="#854D0E" strokeWidth="1.5" />
            {/* Bell on Neck */}
            <circle cx="108" cy="48" r="4" fill="#FACC15" stroke="#854D0E" strokeWidth="1" />
          </g>
        )}

        {/* 3. SPORT BICYCLE / XE ĐẠP THỂ THAO */}
        {isBike && (
          <g transform="translate(10, 5)">
            {/* Wheels */}
            <g className={isMoving ? 'animate-spin origin-[30px_62px]' : ''}>
              <circle cx="30" cy="62" r="16" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
              <circle cx="30" cy="62" r="13" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="30" cy="62" r="4" fill="#94A3B8" />
            </g>
            <g className={isMoving ? 'animate-spin origin-[95px_62px]' : ''}>
              <circle cx="95" cy="62" r="16" fill="#1E293B" stroke="#64748B" strokeWidth="3" />
              <circle cx="95" cy="62" r="13" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="95" cy="62" r="4" fill="#94A3B8" />
            </g>
            {/* Bike Frame */}
            <path
              d="M30 62 L55 62 L78 40 L45 40 Z M55 62 L48 34 M78 40 L95 62 M78 40 L85 30 L95 30"
              stroke={teamColor}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Seat */}
            <path d="M42 34 L54 34" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
            {/* Chibi Rider */}
            {/* Legs pedaling */}
            <path d="M50 36 L56 50 L55 62" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Torso */}
            <path d="M50 34 L66 26" stroke={teamColor} strokeWidth="7" strokeLinecap="round" />
            {/* Arms to handlebar */}
            <path d="M64 26 L85 30" stroke="#FDBA74" strokeWidth="4" strokeLinecap="round" />
            {/* Helmet & Head */}
            <circle cx="68" cy="16" r="11" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M58 14 Q68 4 80 12 L78 17 Q68 12 60 17 Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
            {/* Face */}
            <circle cx="73" cy="17" r="1.5" fill="#1E293B" />
            <path d="M72 21 Q75 23 77 21" stroke="#EA580C" strokeWidth="1.5" fill="none" />
          </g>
        )}

        {/* 4. VESPA SCOOTER / XE MÁY VESPA */}
        {isVespa && (
          <g transform="translate(10, 5)">
            {/* Wheels */}
            <g className={isMoving ? 'animate-spin origin-[32px_65px]' : ''}>
              <circle cx="32" cy="65" r="14" fill="#334155" stroke="#94A3B8" strokeWidth="3" />
              <circle cx="32" cy="65" r="5" fill="#F8FAFC" />
            </g>
            <g className={isMoving ? 'animate-spin origin-[92px_65px]' : ''}>
              <circle cx="92" cy="65" r="14" fill="#334155" stroke="#94A3B8" strokeWidth="3" />
              <circle cx="92" cy="65" r="5" fill="#F8FAFC" />
            </g>
            {/* Vespa Body Chassis */}
            <path
              d="M24 62 Q20 48 38 45 L58 45 L72 60 L85 60 Q94 54 94 40 L88 30 L82 30"
              fill={teamColor}
              stroke="#0F172A"
              strokeWidth="2.5"
            />
            {/* Floorboard */}
            <rect x="52" y="58" width="24" height="5" rx="2" fill="#1E293B" />
            {/* Classic Seat */}
            <path d="M35 44 Q50 38 60 44" stroke="#7C2D12" strokeWidth="6" strokeLinecap="round" />
            {/* Front Legshield & Chrome Headlight */}
            <path d="M84 45 Q88 32 86 24" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            <circle cx="88" cy="24" r="5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
            {/* Windshield */}
            <path d="M88 22 Q90 10 94 12" stroke="#38BDF8" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
            {/* Chibi Rider on Vespa */}
            <circle cx="54" cy="24" r="10" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.5" />
            <path d="M46 20 Q54 10 64 20" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1.5" />
            <circle cx="58" cy="24" r="1.5" fill="#1E293B" />
            <path d="M57 28 Q60 30 62 28" stroke="#EA580C" strokeWidth="1.5" fill="none" />
            {/* Torso */}
            <path d="M52 34 L56 46" stroke="#F43F5E" strokeWidth="8" strokeLinecap="round" />
            <path d="M56 38 L84 32" stroke="#FDBA74" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {/* 5. SUPERBIKE / MÔ TÔ PHÂN KHỐI LỚN */}
        {isMotor && (
          <g transform="translate(10, 5)">
            {/* Rear & Front Fat Racing Tires */}
            <g className={isMoving ? 'animate-spin origin-[28px_62px]' : ''}>
              <circle cx="28" cy="62" r="17" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
              <circle cx="28" cy="62" r="7" fill="#64748B" />
            </g>
            <g className={isMoving ? 'animate-spin origin-[98px_62px]' : ''}>
              <circle cx="98" cy="62" r="17" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
              <circle cx="98" cy="62" r="7" fill="#64748B" />
            </g>
            {/* Exhaust Pipe & Nitro Fume */}
            <path d="M40 60 L18 56" stroke="#94A3B8" strokeWidth="5" strokeLinecap="round" />
            {isMoving && (
              <path d="M16 56 L4 55" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
            )}
            {/* Superbike Fairing & Chassis */}
            <path
              d="M26 50 L48 38 L82 34 L102 46 L86 60 L50 60 Z"
              fill={teamColor}
              stroke="#020617"
              strokeWidth="2.5"
            />
            {/* Metallic Decal */}
            <polygon points="50,42 75,38 72,48 48,50" fill="#FFFFFF" opacity="0.8" />
            {/* Twin Angular Headlights */}
            <polygon points="98,42 105,46 96,48" fill="#38BDF8" stroke="#0284C7" strokeWidth="1" />
            {/* Aggressive Chibi Racer leaning forward */}
            <path d="M46 36 L75 30" stroke="#020617" strokeWidth="10" strokeLinecap="round" />
            {/* Racing Helmet with Visor */}
            <circle cx="78" cy="20" r="13" fill={teamColor} stroke="#020617" strokeWidth="2" />
            <path d="M74 18 Q86 16 88 24 L82 25 Z" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
            {/* Arms clutching clip-ons */}
            <path d="M68 28 L90 38" stroke="#FDBA74" strokeWidth="4" strokeLinecap="round" />
          </g>
        )}

        {/* 6. FORMULA 1 SUPERCARS / SIÊU XE F1 */}
        {isCar && (
          <g transform="translate(5, 8)">
            {/* Huge Rear Wing / Spoiler */}
            <rect x="10" y="24" width="8" height="24" rx="2" fill="#0F172A" />
            <rect x="6" y="20" width="22" height="6" rx="2" fill={teamColor} stroke="#020617" strokeWidth="1.5" />
            {/* Rear & Front Slick Racing Tires */}
            <g className={isMoving ? 'animate-spin origin-[32px_58px]' : ''}>
              <rect x="22" y="44" width="20" height="28" rx="5" fill="#020617" stroke="#EF4444" strokeWidth="2" />
              <circle cx="32" cy="58" r="5" fill="#E2E8F0" />
            </g>
            <g className={isMoving ? 'animate-spin origin-[105px_58px]' : ''}>
              <rect x="95" y="44" width="20" height="28" rx="5" fill="#020617" stroke="#EF4444" strokeWidth="2" />
              <circle cx="105" cy="58" r="5" fill="#E2E8F0" />
            </g>
            {/* Main Aerodynamic Monocoque Body */}
            <path
              d="M16 48 L40 44 L60 36 L88 38 L122 54 L128 58 L16 58 Z"
              fill={teamColor}
              stroke="#020617"
              strokeWidth="2.5"
            />
            <path
              d="M40 44 L60 36 L88 38 L115 52 L35 52 Z"
              fill="url(#metallicGloss)"
            />
            {/* Front Nose Cone & Splitter Wing */}
            <polygon points="120,54 135,56 135,62 118,60" fill="#0F172A" stroke="#020617" strokeWidth="1" />
            {/* Driver Cockpit & Chibi Racer Helmet */}
            <ellipse cx="68" cy="38" rx="12" ry="6" fill="#020617" />
            <circle cx="68" cy="28" r="10" fill="#F59E0B" stroke="#78350F" strokeWidth="2" />
            {/* Tinted Visor */}
            <path d="M65 26 Q74 24 76 30 L70 31 Z" fill="#020617" />
            {/* Air Intake Scoop above Helmet */}
            <path d="M52 24 L60 22 L60 34 L50 36 Z" fill="#0F172A" stroke="#020617" strokeWidth="1.5" />
            {/* Racing Number Pill */}
            <circle cx="92" cy="46" r="7" fill="#FFFFFF" stroke="#020617" strokeWidth="1.5" />
            <text x="92" y="49" textAnchor="middle" fontSize="8" fontWeight="900" fill="#020617">#7</text>
          </g>
        )}

        {/* 7. SUPERSONIC ROCKET / TÊN LỬA SIÊU THANH */}
        {isRocket && (
          <g transform="translate(5, 5)">
            {/* Plasma Thruster Fire Trails */}
            {isMoving && (
              <g className="animate-pulse">
                <polygon points="20,44 2,36 15,48" fill="#38BDF8" opacity="0.9" />
                <polygon points="20,48 -8,48 18,52" fill="#F59E0B" opacity="0.95" />
                <polygon points="20,52 2,60 15,48" fill="#EF4444" opacity="0.9" />
              </g>
            )}
            {/* Rocket Stabilizer Fins */}
            <polygon points="24,24 44,40 24,44" fill="#E11D48" stroke="#881337" strokeWidth="2" />
            <polygon points="24,72 44,56 24,52" fill="#E11D48" stroke="#881337" strokeWidth="2" />
            {/* Rocket Engine Nozzle */}
            <rect x="18" y="40" width="10" height="16" rx="2" fill="#334155" stroke="#0F172A" strokeWidth="2" />
            {/* Streamlined Fuselage */}
            <path
              d="M26 40 L85 36 Q115 42 128 48 Q115 54 85 60 L26 56 Z"
              fill={teamColor}
              stroke="#0F172A"
              strokeWidth="2.5"
            />
            {/* Glossy highlight stripe */}
            <path
              d="M30 42 L85 39 Q110 44 122 48 L85 45 L30 46 Z"
              fill="url(#metallicGloss)"
            />
            {/* Glass Cockpit Dome */}
            <ellipse cx="78" cy="46" rx="14" ry="7" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" opacity="0.85" />
            {/* Cute Astronaut / Pilot Chibi */}
            <circle cx="78" cy="46" r="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
            <circle cx="80" cy="45" r="1.5" fill="#0F172A" />
            {/* Star Decals */}
            <circle cx="50" cy="48" r="4" fill="#FACC15" />
            <circle cx="40" cy="48" r="2.5" fill="#FFFFFF" />
          </g>
        )}
      </svg>

      {/* Team Badge Pill under vehicle */}
      <div
        className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-md border border-white/40 truncate max-w-[110px] text-center z-20 flex items-center gap-1 justify-center"
        style={{ backgroundColor: teamColor }}
      >
        <span className="truncate">{teamName}</span>
        {isCurrentTurn && (
          <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping inline-block" />
        )}
      </div>
    </div>
  );
};
