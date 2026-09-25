import React, { useState } from 'react';
import { soundFx } from '../../utils/sound';
import { Game3DButton } from './Game3DButton';
import { Dices, RotateCcw, Volume2, VolumeX, Sparkles, Award } from 'lucide-react';

interface DiceTableSceneProps {
  onRollComplete?: (values: number[], sum: number) => void;
}

export const DiceTableScene: React.FC<DiceTableSceneProps> = ({ onRollComplete }) => {
  const [diceCount, setDiceCount] = useState<number>(2);
  const [diceValues, setDiceValues] = useState<number[]>([4, 6]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollHistory, setRollHistory] = useState<Array<{ values: number[]; sum: number; time: string }>>([
    { values: [4, 6], sum: 10, time: 'Vừa xong' }
  ]);
  const [modifier, setModifier] = useState<number>(0);

  const rollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    soundFx.playSpin();

    // Generate random values after rolling duration
    setTimeout(() => {
      const newValues = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceValues(newValues);
      setIsRolling(false);
      soundFx.playSuccess();

      const sum = newValues.reduce((a, b) => a + b, 0) + modifier;
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setRollHistory(prev => [{ values: newValues, sum, time: now }, ...prev.slice(0, 7)]);

      if (onRollComplete) {
        onRollComplete(newValues, sum);
      }
    }, 900);
  };

  const renderDieFace = (val: number) => {
    const pips: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8]
    };
    const active = pips[val] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-2 items-center justify-items-center">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-full h-full flex items-center justify-center">
            {active.includes(i) && (
              <div
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-inner ${
                  val === 1
                    ? 'bg-rose-600 ring-2 ring-rose-300'
                    : 'bg-slate-900 shadow-slate-900/60'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const currentSum = diceValues.reduce((a, b) => a + b, 0) + modifier;

  return (
    <div className="relative w-full rounded-[32px] overflow-hidden border-4 border-[#FBBF24] shadow-[0_16px_36px_rgba(217,119,6,0.25)] bg-gradient-to-b from-[#FEF3C7] via-[#FDE68A] to-[#F59E0B] select-none p-4 sm:p-6">
      {/* Top Scene HUD */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b-2 border-[#F59E0B]/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#F59E0B] to-[#D97706] text-white flex items-center justify-center text-2xl shadow-[0_4px_0_#92400E] border-2 border-white">
            🎲
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#92400E] drop-shadow-xs">
              BÀN XÚC XẮC TRI THỨC
            </h2>
            <p className="text-xs font-bold text-[#B45309]">
              Công cụ gieo xúc xắc 2.5D tương tác cho giáo viên & các trò chơi lớp học
            </p>
          </div>
        </div>

        {/* Dice Selector Chips */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border-2 border-[#FDE68A] shadow-xs">
          <span className="text-xs font-black text-[#92400E] px-2">Số lượng:</span>
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => {
                soundFx.playClick();
                setDiceCount(num);
                setDiceValues(Array.from({ length: num }, () => Math.floor(Math.random() * 6) + 1));
              }}
              className={`w-8 h-8 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center ${
                diceCount === num
                  ? 'bg-[#EA580C] text-white shadow-[0_3px_0_#9A3412] border border-white'
                  : 'bg-amber-50 text-slate-700 hover:bg-amber-100'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2.5D Wooden Game Table Surface */}
      <div className="relative my-6 rounded-3xl bg-gradient-to-b from-[#78350F] via-[#92400E] to-[#451A03] p-4 sm:p-8 border-4 border-[#B45309] shadow-[inset_0_8px_20px_rgba(0,0,0,0.6),0_12px_24px_rgba(0,0,0,0.2)] min-h-[320px] flex flex-col items-center justify-center overflow-hidden">
        {/* Felt Table Center Mat */}
        <div className="absolute inset-4 sm:inset-6 rounded-2xl bg-gradient-to-b from-[#065F46] to-[#064E3B] border-4 border-[#047857] shadow-[inset_0_4px_16px_rgba(0,0,0,0.5)] pointer-events-none" />

        {/* Gold Table Inlay Patterns */}
        <div className="absolute top-8 left-8 text-3xl opacity-20 text-yellow-300">⚜️</div>
        <div className="absolute top-8 right-8 text-3xl opacity-20 text-yellow-300">⚜️</div>
        <div className="absolute bottom-8 left-8 text-3xl opacity-20 text-yellow-300">⚜️</div>
        <div className="absolute bottom-8 right-8 text-3xl opacity-20 text-yellow-300">⚜️</div>

        {/* Floating Mascot ITEN Fox cheering */}
        <div className="absolute top-4 left-6 z-10 hidden sm:flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-yellow-400/40 text-xs font-black text-amber-200">
          <span>🦊</span>
          <span>Bấm GIEO XÚC XẮC để bắt đầu!</span>
        </div>

        {/* Dice Rolling Stage Area */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 py-6">
          {diceValues.map((val, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col items-center transition-all duration-300 ${
                isRolling ? 'animate-spin scale-110' : 'hover:scale-105 active:scale-95'
              }`}
            >
              {/* 3D Dice Object */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-white via-[#F8FAFC] to-[#E2E8F0] border-4 border-slate-300 shadow-[0_12px_0_#94A3B8,0_16px_24px_rgba(0,0,0,0.4)] flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                {renderDieFace(val)}
              </div>

              {/* Cast Shadow below die */}
              <div className="w-16 h-3 rounded-full bg-black/40 blur-xs mt-3" />
            </div>
          ))}
        </div>

        {/* Result Podium Banner */}
        <div className="relative z-10 mt-4 bg-white/95 backdrop-blur-md px-6 py-2.5 rounded-2xl border-2 border-amber-300 shadow-[0_6px_0_#D97706] flex items-center gap-3 animate-in fade-in">
          <span className="text-xl">🏆</span>
          <div className="text-center">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              TỔNG ĐIỂM:
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#EA580C] ml-2">
              {currentSum}
            </span>
          </div>
          {modifier !== 0 && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              ({modifier > 0 ? `+${modifier}` : modifier})
            </span>
          )}
        </div>
      </div>

      {/* Controls & Actions Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {/* Modifier Chips */}
        <div className="flex items-center gap-2 bg-white/80 p-2 rounded-2xl border border-amber-200">
          <span className="text-xs font-bold text-slate-700">Điểm cộng/trừ:</span>
          {[-2, -1, 0, 1, 2, 5].map(mod => (
            <button
              key={mod}
              onClick={() => {
                soundFx.playClick();
                setModifier(mod);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                modifier === mod
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {mod > 0 ? `+${mod}` : mod}
            </button>
          ))}
        </div>

        {/* Roll Action Button */}
        <div className="flex items-center gap-3">
          <Game3DButton
            variant="orange"
            size="lg"
            onClick={rollDice}
            disabled={isRolling}
            icon={<Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />}
          >
            {isRolling ? 'ĐANG GIEO...' : '🎲 GIEO XÚC XẮC NGAY'}
          </Game3DButton>
        </div>
      </div>

      {/* Roll History Roll Logs */}
      {rollHistory.length > 0 && (
        <div className="mt-6 pt-4 border-t-2 border-[#F59E0B]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-[#92400E] uppercase tracking-wider flex items-center gap-1.5">
              📜 Lịch sử gieo gần nhất:
            </span>
            <button
              onClick={() => setRollHistory([])}
              className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {rollHistory.map((h, i) => (
              <div
                key={i}
                className="px-3 py-1.5 bg-white/90 rounded-xl border border-amber-300 shadow-2xs text-xs font-bold text-slate-800 flex items-center gap-2"
              >
                <span className="text-amber-600 font-mono">[{h.values.join(', ')}]</span>
                <span className="font-black text-[#EA580C]">= {h.sum}</span>
                <span className="text-[10px] text-slate-400 font-normal">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
