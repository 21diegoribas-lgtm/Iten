import React from 'react';

interface LotteryCageSvgProps {
  rotationAngle: number;
  isSpinning: boolean;
  spinSpeed?: number; // deg per sec
  onManualCrankClick?: () => void;
  className?: string;
  hasBallInChute?: boolean;
  children?: React.ReactNode;
}

export const LotteryCageSvg: React.FC<LotteryCageSvgProps> = ({
  rotationAngle,
  isSpinning,
  spinSpeed = 0,
  onManualCrankClick,
  className = '',
  hasBallInChute = false,
  children
}) => {
  // SVG ViewBox 540 x 480
  // Center of the cage sphere at (250, 210), radius R = 145
  const cx = 250;
  const cy = 210;
  const r = 145;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 540 480"
        className="w-full h-auto max-w-[480px] sm:max-w-[560px] drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic Gold Gradients */}
          <linearGradient id="gold-metal-h" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#78350F" />
            <stop offset="18%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="88%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="gold-metal-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="25%" stopColor="#F59E0B" />
            <stop offset="65%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="chrome-pillar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="20%" stopColor="#64748B" />
            <stop offset="45%" stopColor="#F8FAFC" />
            <stop offset="75%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Heavy Base Stand Gradient */}
          <linearGradient id="heavy-base-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="15%" stopColor="#D97706" />
            <stop offset="40%" stopColor="#78350F" />
            <stop offset="85%" stopColor="#451A03" />
            <stop offset="100%" stopColor="#1C0A00" />
          </linearGradient>

          {/* Glass Sphere Specular Gloss */}
          <radialGradient id="sphere-back-glass" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.08" />
            <stop offset="90%" stopColor="#D97706" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0.4" />
          </radialGradient>

          <linearGradient id="glass-specular-arc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Glow filter for active spinning lights */}
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ============================================================ */}
        {/* STATIC GROUP 1: BASE STAND SHADOW & REAR LEGS                */}
        {/* ============================================================ */}
        {/* Base Shadow */}
        <ellipse
          cx={cx}
          cy="450"
          rx="210"
          ry="22"
          fill="#020617"
          opacity="0.5"
          filter="blur(8px)"
        />

        {/* Left Back Leg */}
        <path
          d="M 120 420 L 225 210 L 240 210 L 145 420 Z"
          fill="#334155"
          stroke="#1E293B"
          strokeWidth="2"
        />
        {/* Right Back Leg */}
        <path
          d="M 380 420 L 275 210 L 260 210 L 355 420 Z"
          fill="#334155"
          stroke="#1E293B"
          strokeWidth="2"
        />

        {/* Back Crossbar */}
        <rect
          x="140"
          y="310"
          width="220"
          height="12"
          rx="6"
          fill="#475569"
          stroke="#1E293B"
          strokeWidth="1.5"
        />

        {/* ============================================================ */}
        {/* ROTATING GROUP: CAGE BACK HALF (ROTATES AROUND CX, CY)       */}
        {/* ============================================================ */}
        <g id="cage-back-half">
          {/* Back Glass Tint Sphere */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="url(#sphere-back-glass)"
            stroke="#D97706"
            strokeWidth="3"
          />

          {/* Rotating Back Latitudinal & Longitudinal Wire Arcs */}
          <g transform={`rotate(${rotationAngle} ${cx} ${cy})`}>
            {/* Back Latitudes */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.96}
              ry={r * 0.35}
              fill="none"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeDasharray="8 4"
              opacity="0.6"
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.96}
              ry={r * 0.7}
              fill="none"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeDasharray="8 4"
              opacity="0.6"
            />

            {/* Back Longitudes */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.35}
              ry={r * 0.96}
              fill="none"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeDasharray="8 4"
              opacity="0.6"
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.7}
              ry={r * 0.96}
              fill="none"
              stroke="#D97706"
              strokeWidth="2.5"
              strokeDasharray="8 4"
              opacity="0.6"
            />

            {/* Internal Lifter Paddle (Back View) */}
            <path
              d={`M ${cx - r * 0.75} ${cy + 10} Q ${cx - r * 0.35} ${cy - 20} ${cx} ${cy - 15}`}
              stroke="#B45309"
              strokeWidth="4"
              fill="none"
              opacity="0.7"
            />
            <path
              d={`M ${cx + r * 0.75} ${cy - 10} Q ${cx + r * 0.35} ${cy + 20} ${cx} ${cy + 15}`}
              stroke="#B45309"
              strokeWidth="4"
              fill="none"
              opacity="0.7"
            />
          </g>
        </g>

        {/* ============================================================ */}
        {/* LAYER 3: BALLS CONTAINER (EMBEDDED INSIDE THE CAGE SPHERE)   */}
        {/* ============================================================ */}
        {children && (
          <foreignObject
            x={cx - 135}
            y={cy - 135}
            width="270"
            height="270"
            className="overflow-visible pointer-events-none"
          >
            <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
              {children}
            </div>
          </foreignObject>
        )}

        {/* ============================================================ */}
        {/* ROTATING GROUP: CAGE FRONT HALF (ROTATES AROUND CX, CY)      */}
        {/* ============================================================ */}
        <g id="cage-front-half">
          {/* Entire front rotating cage assembly */}
          <g transform={`rotate(${rotationAngle} ${cx} ${cy})`}>
            {/* 1. Internal Rotating Axle Bar */}
            <rect
              x={cx - r - 10}
              y={cy - 6}
              width={(r + 10) * 2}
              height="12"
              rx="6"
              fill="url(#chrome-pillar)"
              stroke="#334155"
              strokeWidth="1.5"
              opacity="0.9"
            />

            {/* 2. Diagonal Structural Cross Spokes */}
            <line
              x1={cx - r * 0.7}
              y1={cy - r * 0.7}
              x2={cx + r * 0.7}
              y2={cy + r * 0.7}
              stroke="url(#gold-metal-h)"
              strokeWidth="3.5"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
            />
            <line
              x1={cx - r * 0.7}
              y1={cy + r * 0.7}
              x2={cx + r * 0.7}
              y2={cy - r * 0.7}
              stroke="url(#gold-metal-h)"
              strokeWidth="3.5"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.3))"
            />

            {/* 3. Front Longitudinal Wire Arcs (Nan dọc uốn cong 3D) */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.98}
              ry={r * 0.38}
              fill="none"
              stroke="url(#gold-metal-h)"
              strokeWidth="3.5"
              filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.98}
              ry={r * 0.75}
              fill="none"
              stroke="url(#gold-metal-h)"
              strokeWidth="3.5"
              filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
            />

            {/* 4. Front Latitudinal Wire Arcs (Nan ngang uốn cong 3D) */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.38}
              ry={r * 0.98}
              fill="none"
              stroke="url(#gold-metal-v)"
              strokeWidth="3.5"
              filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
            />
            <ellipse
              cx={cx}
              cy={cy}
              rx={r * 0.75}
              ry={r * 0.98}
              fill="none"
              stroke="url(#gold-metal-v)"
              strokeWidth="3.5"
              filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"
            />

            {/* 5. Internal Lifter Paddle Blades (Cánh móc/nâng bóng xoay theo lồng) */}
            <g id="internal-lifters">
              {/* Paddle 1 (Top/Left scoop) */}
              <path
                d={`M ${cx - r * 0.85} ${cy} Q ${cx - r * 0.5} ${cy - 35} ${cx - 15} ${cy - 12}`}
                fill="none"
                stroke="url(#gold-metal-v)"
                strokeWidth="5.5"
                strokeLinecap="round"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
              />
              <path
                d={`M ${cx - r * 0.85} ${cy} L ${cx - r * 0.7} ${cy - 18} L ${cx - r * 0.45} ${cy - 26} L ${cx - 20} ${cy - 10}`}
                fill="none"
                stroke="#FEF08A"
                strokeWidth="2"
              />

              {/* Paddle 2 (Bottom/Right scoop) */}
              <path
                d={`M ${cx + r * 0.85} ${cy} Q ${cx + r * 0.5} ${cy + 35} ${cx + 15} ${cy + 12}`}
                fill="none"
                stroke="url(#gold-metal-v)"
                strokeWidth="5.5"
                strokeLinecap="round"
                filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
              />
              <path
                d={`M ${cx + r * 0.85} ${cy} L ${cx + r * 0.7} ${cy + 18} L ${cx + r * 0.45} ${cy + 26} L ${cx + 20} ${cy + 10}`}
                fill="none"
                stroke="#FEF08A"
                strokeWidth="2"
              />
            </g>

            {/* 6. Rotating Access Door Hatch on Rim */}
            <g id="cage-access-hatch" transform={`translate(${cx}, ${cy - r})`}>
              <rect
                x="-26"
                y="-7"
                width="52"
                height="14"
                rx="6"
                fill="url(#gold-metal-h)"
                stroke="#78350F"
                strokeWidth="2"
                filter="drop-shadow(0 2px 3px rgba(0,0,0,0.5))"
              />
              <circle cx="-16" cy="0" r="3" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
              <circle cx="16" cy="0" r="3" fill="#FEF08A" stroke="#78350F" strokeWidth="1" />
              <rect x="-7" y="-4" width="14" height="8" rx="3" fill="#451A03" />
            </g>

            {/* 7. Outer Heavy Rim Hoop Ring (Vòng khung lồng ngoài bằng vàng kim loại) */}
            <circle
              cx={cx}
              cy={cy}
              r={r + 3}
              fill="none"
              stroke="url(#gold-metal-h)"
              strokeWidth="8"
              filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))"
            />
            <circle
              cx={cx}
              cy={cy}
              r={r + 3}
              fill="none"
              stroke="#FEF08A"
              strokeWidth="1.5"
              opacity="0.75"
            />

            {/* 8. Outer Rim Studs / Golden Rivets on Circumference (12 chốt đinh tán vàng) */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg, idx) => {
                const rad = (deg * Math.PI) / 180;
                const studX = cx + (r + 3) * Math.cos(rad);
                const studY = cy + (r + 3) * Math.sin(rad);
                return (
                  <g key={idx}>
                    <circle
                      cx={studX}
                      cy={studY}
                      r="4.5"
                      fill="#FEF08A"
                      stroke="#78350F"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={studX - 1}
                      cy={studY - 1}
                      r="1.5"
                      fill="#FFFFFF"
                    />
                  </g>
                );
              }
            )}

            {/* 9. Central Golden Hub (Trục trung tâm xoay) */}
            <circle
              cx={cx}
              cy={cy}
              r="22"
              fill="url(#gold-metal-v)"
              stroke="#78350F"
              strokeWidth="2.5"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
            />
            <circle cx={cx} cy={cy} r="10" fill="#FEF08A" stroke="#B45309" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="4" fill="#78350F" />
          </g>

          {/* High speed motion streaks when spinning fast */}
          {isSpinning && (
            <circle
              cx={cx}
              cy={cy}
              r={r - 6}
              fill="none"
              stroke="#FEF08A"
              strokeWidth="2.5"
              strokeDasharray="45 55"
              opacity="0.65"
              className="animate-spin"
              style={{ animationDuration: '0.45s' }}
            />
          )}

          {/* Glass Specular Reflection Highlight (Top Left Arch) */}
          <path
            d={`M ${cx - r * 0.8} ${cy - r * 0.35} A ${r * 0.9} ${r * 0.9} 0 0 1 ${cx + r * 0.35} ${cy - r * 0.8} A ${r * 0.75} ${r * 0.75} 0 0 0 ${cx - r * 0.8} ${cy - r * 0.35} Z`}
            fill="url(#glass-specular-arc)"
            opacity="0.8"
            pointerEvents="none"
          />

          {/* Bottom Right Subtle Glass Arch */}
          <path
            d={`M ${cx + r * 0.75} ${cy + r * 0.35} A ${r * 0.85} ${r * 0.85} 0 0 1 ${cx - r * 0.35} ${cy + r * 0.75} A ${r * 0.7} ${r * 0.7} 0 0 0 ${cx + r * 0.75} ${cy + r * 0.35} Z`}
            fill="#FFFFFF"
            opacity="0.12"
            pointerEvents="none"
          />
        </g>

        {/* ============================================================ */}
        {/* STATIC GROUP 2: EXIT CHUTE, PILLARS & HEAVY STAND BASE       */}
        {/* ============================================================ */}
        {/* Ball Exit Chute & Catching Tray */}
        <g id="ball-chute">
          {/* Outlet Funnel under cage */}
          <path
            d={`M ${cx - 38} ${cy + r - 8} L ${cx + 38} ${cy + r - 8} L ${cx + 26} ${cy + r + 24} L ${cx - 26} ${cy + r + 24} Z`}
            fill="url(#gold-metal-v)"
            stroke="#78350F"
            strokeWidth="2"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
          />

          {/* Funnel Hatch Door */}
          <rect
            x={cx - 22}
            y={cy + r + 20}
            width="44"
            height="8"
            rx="4"
            fill="#FEF08A"
            stroke="#B45309"
            strokeWidth="1.5"
          />

          {/* Spiral Metallic Chute ramp curving to bottom-center */}
          <path
            d={`M ${cx - 24} ${cy + r + 26} Q ${cx - 35} ${cy + r + 55} ${cx} ${cy + r + 68} Q ${cx + 35} ${cy + r + 55} ${cx + 24} ${cy + r + 26}`}
            fill="none"
            stroke="url(#chrome-pillar)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="drop-shadow(0 3px 5px rgba(0,0,0,0.3))"
          />
          <path
            d={`M ${cx - 20} ${cy + r + 26} Q ${cx - 30} ${cy + r + 52} ${cx} ${cy + r + 64} Q ${cx + 30} ${cy + r + 52} ${cx + 20} ${cy + r + 26}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Catching Cup / Tray at Chute End */}
          <ellipse
            cx={cx}
            cy={cy + r + 68}
            rx="28"
            ry="12"
            fill="url(#gold-metal-h)"
            stroke="#78350F"
            strokeWidth="2"
            filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))"
          />
          <ellipse
            cx={cx}
            cy={cy + r + 66}
            rx="22"
            ry="8"
            fill="#451A03"
          />

          {/* Chute Glow when ball arrives */}
          {hasBallInChute && (
            <ellipse
              cx={cx}
              cy={cy + r + 66}
              rx="26"
              ry="10"
              fill="#FACC15"
              opacity="0.6"
              filter="url(#gold-glow)"
              className="animate-ping"
            />
          )}
        </g>

        {/* Left Front Heavy Pillar (A-Frame) */}
        <g id="left-pillar">
          <path
            d={`M ${cx - r - 22} ${cy - 12} L ${cx - r - 6} ${cy - 12} L 95 425 L 65 425 Z`}
            fill="url(#chrome-pillar)"
            stroke="#0F172A"
            strokeWidth="2"
            filter="drop-shadow(-3px 4px 6px rgba(0,0,0,0.4))"
          />
          {/* Chrome highlight streak */}
          <path
            d={`M ${cx - r - 16} ${cy - 10} L ${cx - r - 12} ${cy - 10} L 85 423 L 75 423 Z`}
            fill="#FFFFFF"
            opacity="0.6"
          />
          {/* Axle bearing mount left */}
          <circle
            cx={cx - r - 14}
            cy={cy}
            r="16"
            fill="url(#gold-metal-v)"
            stroke="#78350F"
            strokeWidth="2"
          />
          <circle cx={cx - r - 14} cy={cy} r="7" fill="#FEF08A" />
        </g>

        {/* Right Front Heavy Pillar */}
        <g id="right-pillar">
          <path
            d={`M ${cx + r + 6} ${cy - 12} L ${cx + r + 22} ${cy - 12} L 475 425 L 445 425 Z`}
            fill="url(#chrome-pillar)"
            stroke="#0F172A"
            strokeWidth="2"
            filter="drop-shadow(3px 4px 6px rgba(0,0,0,0.4))"
          />
          {/* Chrome highlight streak */}
          <path
            d={`M ${cx + r + 12} ${cy - 10} L ${cx + r + 16} ${cy - 10} L 465 423 L 455 423 Z`}
            fill="#FFFFFF"
            opacity="0.6"
          />
          {/* Axle bearing mount right */}
          <circle
            cx={cx + r + 14}
            cy={cy}
            r="16"
            fill="url(#gold-metal-v)"
            stroke="#78350F"
            strokeWidth="2"
          />
          <circle cx={cx + r + 14} cy={cy} r="7" fill="#FEF08A" />
        </g>

        {/* Heavy Podium Base Stand */}
        <g id="podium-base">
          {/* Base Lower Tier */}
          <path
            d="M 40 440 L 500 440 L 485 465 L 55 465 Z"
            fill="#1E1B4B"
            stroke="#0F172A"
            strokeWidth="2"
          />
          {/* Base Main Tier */}
          <rect
            x="50"
            y="415"
            width="440"
            height="30"
            rx="8"
            fill="url(#heavy-base-grad)"
            stroke="#FDE047"
            strokeWidth="2.5"
            filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))"
          />

          {/* Gold Inlay Trim Stripe */}
          <rect
            x="60"
            y="422"
            width="420"
            height="5"
            rx="2.5"
            fill="#FEF08A"
            opacity="0.8"
          />

          {/* LED Arcade Indicator Lights along Base */}
          {[90, 130, 170, 210, 250, 290, 330, 370, 410, 450].map((lampX, idx) => {
            const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899'];
            const activeColor = colors[(idx + Math.floor(rotationAngle / 30)) % colors.length];
            return (
              <circle
                key={idx}
                cx={lampX}
                cy="435"
                r="4.5"
                fill={isSpinning ? activeColor : colors[idx % colors.length]}
                stroke="#FFFFFF"
                strokeWidth="1"
                filter={isSpinning ? 'url(#gold-glow)' : undefined}
              />
            );
          })}

          {/* ITEN Center Metallic Nameplate */}
          <rect
            x="205"
            y="418"
            width="90"
            height="22"
            rx="6"
            fill="url(#gold-metal-h)"
            stroke="#451A03"
            strokeWidth="1.5"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.4))"
          />
          <text
            x="250"
            y="433"
            textAnchor="middle"
            fill="#78350F"
            fontWeight="900"
            fontSize="11"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="1.5"
          >
            ★ ITEN ★
          </text>
        </g>

        {/* ============================================================ */}
        {/* ROTATING GROUP: SYNCHRONIZED CRANK HANDLE                    */}
        {/* ============================================================ */}
        <g
          id="crank-handle"
          className="cursor-pointer group"
          onClick={onManualCrankClick}
        >
          {/* Crank Arm Axle Attachment Hub */}
          <circle
            cx={cx + r + 14}
            cy={cy}
            r="12"
            fill="#0F172A"
            stroke="#F59E0B"
            strokeWidth="2"
          />

          {/* Rotating Crank Arm */}
          {(() => {
            const rad = (rotationAngle * Math.PI) / 180;
            const armLen = 48;
            const endX = cx + r + 14 + armLen * Math.cos(rad);
            const endY = cy + armLen * Math.sin(rad);

            return (
              <g>
                {/* Crank Arm Bar */}
                <line
                  x1={cx + r + 14}
                  y1={cy}
                  x2={endX}
                  y2={endY}
                  stroke="url(#chrome-pillar)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  filter="drop-shadow(2px 3px 4px rgba(0,0,0,0.5))"
                />
                <line
                  x1={cx + r + 14}
                  y1={cy}
                  x2={endX}
                  y2={endY}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />

                {/* Crank Knob / Handle Grip at end of arm */}
                <circle
                  cx={endX}
                  cy={endY}
                  r="14"
                  fill="url(#gold-metal-v)"
                  stroke="#78350F"
                  strokeWidth="2.5"
                  filter="drop-shadow(0 3px 6px rgba(0,0,0,0.6))"
                  className={isSpinning ? '' : 'group-hover:scale-110 transition-transform'}
                />
                <circle cx={endX} cy={endY} r="6" fill="#FEF08A" />

                {/* Wooden Grip Knob projecting out */}
                <rect
                  x={endX + 4}
                  y={endY - 6}
                  width="16"
                  height="12"
                  rx="4"
                  fill="#B45309"
                  stroke="#FEF08A"
                  strokeWidth="1"
                  filter="drop-shadow(1px 2px 3px rgba(0,0,0,0.4))"
                />
              </g>
            );
          })()}
        </g>
      </svg>
    </div>
  );
};
