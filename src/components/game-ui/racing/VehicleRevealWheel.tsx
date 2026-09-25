import React from 'react';
import { VehicleConfig, RacingTeam } from '../../../types';
import { RaceVehicleSvg } from './RaceVehicleSvg';
import { Game3DButton } from '../Game3DButton';
import { Dices, Sparkles, ArrowRight, Users } from 'lucide-react';

interface MultiTeamAward {
  team: RacingTeam;
  vehicle: VehicleConfig;
}

interface VehicleRevealWheelProps {
  activeTeam?: RacingTeam;
  // Multi-team support
  isMultiTeam?: boolean;
  winningTeams?: RacingTeam[];
  multiTeamAwards?: MultiTeamAward[];
  isSpinning: boolean;
  spinDisplayVehicle: VehicleConfig | null;
  awardedVehicle: VehicleConfig | null;
  onSpin: () => void;
  onContinue: () => void;
  language?: 'vi' | 'en';
}

export const VehicleRevealWheel: React.FC<VehicleRevealWheelProps> = ({
  activeTeam,
  isMultiTeam = false,
  winningTeams = [],
  multiTeamAwards = [],
  isSpinning,
  spinDisplayVehicle,
  awardedVehicle,
  onSpin,
  onContinue,
  language = 'vi'
}) => {
  const hasMultiAwards = isMultiTeam && multiTeamAwards.length > 0;

  const t = {
    vi: {
      title: isMultiTeam ? 'VÒNG QUAY RANDOM CHO CÁC ĐỘI XUẤT SẮC' : 'VÒNG QUAY RANDOM LOẠI XE',
      correctBadge: '✨ TRẢ LỜI CHÍNH XÁC!',
      subtitleSingle: `Đội ${activeTeam?.name} hãy quay để nhận phương tiện tăng tốc!`,
      subtitleMulti: `${winningTeams.length} đội trả lời đúng hãy quay để nhận ngẫu nhiên phương tiện tăng tốc!`,
      spinPrompt: 'Nhấn nút bên dưới để bắt đầu quay xe!',
      spinningText: 'ĐANG QUAY RANDOM XE...',
      spinBtn: isMultiTeam ? '🎰 BẮT ĐẦU QUAY XE CHO TẤT CẢ CÁC ĐỘI!' : '🎰 BẮT ĐẦU QUAY RANDOM XE!',
      congrats: 'Chúc mừng!',
      awardedMsgSingle: `Đội đã nhận được ${awardedVehicle?.name} và tiến thẳng thêm +${awardedVehicle?.distance}m trên đường đua!`,
      continueBtn: 'TIẾP TỤC CUỘC ĐUA ➡️'
    },
    en: {
      title: isMultiTeam ? 'MULTI-TEAM VEHICLE BOOST REEL' : 'MYSTERY VEHICLE BOOST REEL',
      correctBadge: '✨ CORRECT ANSWER!',
      subtitleSingle: `Team ${activeTeam?.name}, spin to get your speed booster!`,
      subtitleMulti: `${winningTeams.length} winning team(s), spin to unlock boost vehicles!`,
      spinPrompt: 'Click the button below to start spinning!',
      spinningText: 'SPINNING VEHICLE REELS...',
      spinBtn: isMultiTeam ? '🎰 START SPINNING FOR ALL WINNING TEAMS!' : '🎰 START MYSTERY SPIN!',
      congrats: 'Congratulations!',
      awardedMsgSingle: `Team unlocked ${awardedVehicle?.name} and gained +${awardedVehicle?.distance}m on the race track!`,
      continueBtn: 'CONTINUE RACE ➡️'
    }
  }[language];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#020617] rounded-[36px] max-w-2xl w-full p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-4 border-[#F59E0B] text-center space-y-5 animate-in fade-in zoom-in duration-300 select-none max-h-[92vh] overflow-y-auto">
        {/* Neon Light Header */}
        <div className="flex items-center justify-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <span className="w-3 h-3 rounded-full bg-yellow-400 animate-ping delay-75" />
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping delay-150" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.correctBadge}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-amber-400 mt-2 tracking-wide drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
            {t.title}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {isMultiTeam ? t.subtitleMulti : t.subtitleSingle}
          </p>
        </div>

        {/* ========================================================= */}
        {/* MULTI-TEAM DISPLAY AFTER SPIN                             */}
        {/* ========================================================= */}
        {hasMultiAwards ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {multiTeamAwards.map((item, idx) => (
                <div
                  key={item.team.id || idx}
                  className="p-3.5 bg-gradient-to-b from-[#0F172A] to-[#1E293B] rounded-2xl border-2 shadow-inner flex items-center justify-between gap-3 text-left"
                  style={{ borderColor: item.team.color }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-12 flex items-center justify-center bg-slate-900/60 rounded-xl p-1 shrink-0">
                      <RaceVehicleSvg
                        vehicleId={item.vehicle.id}
                        vehicleName={item.vehicle.name}
                        teamColor={item.team.color}
                        teamName={item.team.name}
                        size="sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.team.color }}
                        />
                        <span className="truncate">{item.team.name}</span>
                      </div>
                      <div className="text-[11px] font-bold text-amber-300">
                        {item.vehicle.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-500/40 shrink-0">
                    +{item.vehicle.distance}m
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* ARCADE SLOT MACHINE BOX (SPINNING OR SINGLE RESULT)       */
          /* ========================================================= */
          <div className="relative p-6 bg-gradient-to-b from-[#020617] to-[#0F172A] rounded-3xl border-4 border-amber-400 shadow-[inset_0_4px_20px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Neon side strips */}
            <div className="absolute left-2 top-2 bottom-2 w-1.5 rounded-full bg-amber-400/80 animate-pulse" />
            <div className="absolute right-2 top-2 bottom-2 w-1.5 rounded-full bg-amber-400/80 animate-pulse" />

            <div className="h-36 flex flex-col items-center justify-center">
              {spinDisplayVehicle ? (
                <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
                  <RaceVehicleSvg
                    vehicleId={spinDisplayVehicle.id}
                    vehicleName={spinDisplayVehicle.name}
                    teamColor={activeTeam?.color || '#f59e0b'}
                    teamName={activeTeam?.name || 'Đội chơi'}
                    isMoving={isSpinning}
                    reaction={awardedVehicle ? 'boost' : 'racing'}
                    size="lg"
                  />
                  <div className="mt-2 text-base font-black text-amber-300 tracking-wide">
                    {spinDisplayVehicle.name}
                  </div>
                  <div className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-3 py-0.5 rounded-full border border-emerald-500/50">
                    +{spinDisplayVehicle.distance} mét
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 space-y-2">
                  <div className="text-5xl animate-bounce">🎰</div>
                  <div className="text-xs font-bold text-slate-300">
                    {t.spinPrompt}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
        {!awardedVehicle && !hasMultiAwards ? (
          <button
            type="button"
            disabled={isSpinning}
            onClick={onSpin}
            className={`w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-600 hover:to-orange-600 text-white font-black rounded-2xl text-sm shadow-[0_8px_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 border-2 border-amber-300 ${
              isSpinning ? 'opacity-80 cursor-wait animate-pulse' : 'hover:scale-[1.02]'
            }`}
          >
            <Dices className="w-5 h-5 animate-spin" />
            <span>{isSpinning ? t.spinningText : t.spinBtn}</span>
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {!hasMultiAwards && awardedVehicle && (
              <div className="p-4 bg-emerald-950/60 rounded-2xl border-2 border-emerald-400 text-emerald-200 text-xs font-bold text-left shadow-inner">
                🎉 <strong>{t.congrats}</strong> {t.awardedMsgSingle}
              </div>
            )}

            <Game3DButton
              variant="green"
              size="lg"
              onClick={onContinue}
              className="w-full cursor-pointer"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {t.continueBtn}
            </Game3DButton>
          </div>
        )}
      </div>
    </div>
  );
};
