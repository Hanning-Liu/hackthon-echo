import React from 'react';
import { motion } from 'motion/react';
import { TAROT_FAN_SLOT_COUNT } from '../lib/tarotData';
import TarotCardBack from './TarotCardBack';

export default function SingleTarotDrawPage({
  keyword,
  removedSlotIndices,
  selectedIdx,
  onSelectSlot,
}: {
  keyword: string;
  removedSlotIndices: Set<number>;
  selectedIdx: number | null;
  onSelectSlot: (idx: number) => void;
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden pt-[calc(12%_+_2.75rem)]">
      <div className="shrink-0 px-4 pb-6 pt-2 text-center font-serif text-lg leading-relaxed tracking-widest text-[#5c5346]">
        抽取一张卡牌，<br />
        它将开启「{keyword}」的启示
      </div>

      <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-end justify-center">
          <motion.div
            drag="x"
            dragConstraints={{ left: -850, right: 850 }}
            className="relative h-[220px] w-[1800px] shrink-0 cursor-grab pointer-events-auto active:cursor-grabbing"
          >
            {Array.from({ length: TAROT_FAN_SLOT_COUNT }).map((_, i) => {
              if (removedSlotIndices.has(i)) return null;

              const isSelected = selectedIdx === i;
              const diff = i - 38.5;
              const x = 900 + diff * 22;
              const y = diff * diff * 0.05;
              const rotate = diff * 1.2;

              if (selectedIdx !== null && !isSelected) return null;

              return (
                <div
                  key={i}
                  className="absolute top-[30px] transition-all duration-500"
                  style={{
                    left: isSelected ? '50%' : x,
                    transform: isSelected ? 'translate(-50%, -150px) scale(1.3)' : `translateY(${y}px) rotate(${rotate}deg)`,
                    marginLeft: -32,
                    width: 65,
                    height: 95,
                    zIndex: isSelected ? 2000 : 100 - Math.abs(Math.floor(diff)),
                  }}
                >
                  <motion.div
                    layoutId={`single-card-${i}`}
                    whileHover={isSelected ? {} : { y: -20, scale: 1.15, zIndex: 1000 }}
                    onClick={() => onSelectSlot(i)}
                    className="h-full w-full cursor-pointer pointer-events-auto"
                  >
                    <TarotCardBack />
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
