import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Instrument } from '../types';

export type SelectPageProps = {
  onNext: () => void;
  onBack: () => void;
  instrument: Instrument;
  setInstrument: (i: Instrument) => void;
};

// Select Page: Instrument ("深夜食堂" Vibe)
export function SelectPage({ onNext, onBack, instrument, setInstrument }: SelectPageProps) {
  const instruments: { id: Instrument; name: string; icon: string }[] = [
    { id: 'piano', name: '钢琴', icon: '🎹' },
    { id: 'guitar', name: '吉他', icon: '🎸' },
    { id: 'bass', name: '贝斯', icon: '🎶' },
    { id: 'drums', name: '架子鼓', icon: '🥁' },
    { id: 'other', name: '其他乐器', icon: '🎺' },
    { id: 'vocals', name: '人声', icon: '🎤' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col overflow-hidden bg-[#292421]"
      style={{
        backgroundImage: 'radial-gradient(circle at center top, #484039 0%, #292421 100%)',
      }}
    >
      {/* 极淡纹理 / 谱线 / 音符（与首页气质接近，不抢主体） */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ebdcc6]/30 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ebdcc6]/12 to-transparent blur-[0.5px]" />
        <div className="absolute inset-0 opacity-[0.08] mix-blend-soft-light bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 26px,
              rgba(235, 220, 198, 0.12) 26px,
              rgba(235, 220, 198, 0.12) 27px
            )`,
          }}
        />
        <div className="absolute left-[10%] top-[16%] rotate-[-14deg] font-serif text-2xl text-[#ebdcc6]/[0.14]">
          ♪
        </div>
        <div className="absolute right-[12%] top-[22%] rotate-[10deg] font-serif text-3xl text-[#ebdcc6]/[0.11]">
          ♫
        </div>
        <div className="absolute bottom-[30%] left-[14%] rotate-[12deg] font-serif text-xl text-[#ebdcc6]/[0.12]">
          ♩
        </div>
        <div className="absolute bottom-[24%] right-[10%] -rotate-6 font-serif text-2xl text-[#ebdcc6]/[0.1]">
          ♪
        </div>
      </div>

      {/* 主内容：标题 + 乐器区占满上方并可滚动；底部固定说明 + 主按钮 */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center px-4 pb-1 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-0.5 rounded-lg py-2 pl-1 pr-2 text-sm text-[#ebdcc6]/85 transition-colors hover:text-[#ebdcc6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ebdcc6]/40"
          >
            <ChevronLeft className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} />
            更换歌曲
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-8 pb-6 pt-4">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
            <h2 className="text-center font-serif text-3xl font-light tracking-widest text-[#ebdcc6]">
              Pick 你最爱的乐器
            </h2>

            <div className="grid w-full max-w-md grid-cols-3 gap-3 px-2 sm:gap-4 sm:px-4">
              {instruments.map((inst) => (
                <div
                  key={inst.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setInstrument(inst.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setInstrument(inst.id);
                    }
                  }}
                  className={cn(
                    'relative z-[1] flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border px-1 py-2 transition-all sm:rounded-3xl',
                    instrument === inst.id
                      ? 'scale-105 border-transparent bg-[#ebdcc6] text-[#292421] shadow-[0_0_40px_rgba(235,220,198,0.15)]'
                      : 'border-white/12 bg-[#34302b] text-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-white/20 hover:bg-[#3d3832] hover:text-white/65'
                  )}
                >
                  <span className="mb-1.5 text-3xl opacity-90 filter grayscale sm:mb-3 sm:text-4xl" aria-hidden>
                    {inst.icon}
                  </span>
                  <span className="text-center text-[11px] leading-tight tracking-wider sm:text-sm">{inst.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-shrink-0 flex-col items-center gap-3 border-t border-white/[0.06] px-8 pb-10 pt-5">
          <p className="max-w-sm text-center text-xs leading-relaxed tracking-wide text-[#a89c90]/95">
            下一步将开启练习界面
          </p>
          <button
            type="button"
            onClick={onNext}
            className="flex w-full max-w-sm items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#ebdcc6] to-[#d6c5af] px-12 py-5 text-lg font-medium text-[#484039] shadow-[0_8px_30px_rgba(235,220,198,0.2)] transition-all hover:brightness-105"
          >
            <Play fill="currentColor" size={18} />
            进入乐谱时空
          </button>
        </div>
      </div>
    </motion.div>
  );
}
