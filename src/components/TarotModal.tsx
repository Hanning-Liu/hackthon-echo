import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX, Copy, RefreshCcw, Home } from 'lucide-react';
import { TarotCard, drawSingleCard, AUDIO_TRACKS, AudioCategory, getCardImageUrl, TAROT_FAN_SLOT_COUNT } from '../lib/tarotData';
import TarotCardBack from './TarotCardBack';

const MOOD_TEXTS: Record<AudioCategory, string> = {
  healing: "在这段旋律里，你选中的三束光，终会汇聚成抚平所有疲惫的治愈力量。",
  energetic: "三张卡牌的共振，为你带来了元气满满的活力，勇敢去追寻吧。",
  meditation: "此刻星空寂静，牌阵正引领你在内心深处找到那片绝对安宁的湖水。",
  melancholic: "即使感受到了一丝微凉也别怕，这首温柔的乐章会陪伴你接纳所有的不完美与重新开始。"
};

export default function TarotModal({ onClose }: { onClose: () => void }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [flippedData, setFlippedData] = useState<Record<number, { card: TarotCard; isReversed: boolean }>>({});
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const usedCardsSet = useRef<Set<string>>(new Set());

  // Determine prevailing mood when all 3 are flipped
  const isComplete = Object.keys(flippedData).length === 3;
  
  const prevalentMood = useMemo<AudioCategory>(() => {
    if (!isComplete) return 'meditation';
    const counts = (Object.values(flippedData) as { card: TarotCard; isReversed: boolean }[]).reduce(
      (acc, current) => {
        acc[current.card.audioCategory] = (acc[current.card.audioCategory] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b)) as AudioCategory;
  }, [flippedData, isComplete]);

  // Audio linking
  useEffect(() => {
    if (isComplete && audioRef.current) {
      audioRef.current.src = AUDIO_TRACKS[prevalentMood];
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(console.warn);
    }
  }, [isComplete, prevalentMood]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleSelect = (idx: number) => {
    if (selectedIds.length < 3 && !selectedIds.includes(idx)) {
      setSelectedIds(prev => [...prev, idx]);
    }
  };

  const handleFlip = (id: number) => {
    if (flippedData[id]) return;
    try {
      const result = drawSingleCard(usedCardsSet.current);
      usedCardsSet.current.add(result.card.id);
      setFlippedData(prev => ({ ...prev, [id]: result }));
    } catch(e) {
      alert("哎呀，猫咪去调音了，请重启试试吧~");
    }
  };

  const copyResult = () => {
    const rows = Object.values(flippedData) as { card: TarotCard; isReversed: boolean }[];
    const text = rows
      .map(
        (d) =>
          `✦ ${d.card.name} (${d.isReversed ? '逆位' : '正位'}): ${d.isReversed ? d.card.reversed.meaning : d.card.upright.meaning}`
      )
      .join('\n');
    const fullText = `【我的今日乐章谱签】\n${text}\n\n✨ 指引：${MOOD_TEXTS[prevalentMood]}`;
    navigator.clipboard.writeText(fullText).then(() => alert("已复制解读内容，快去分享吧~"));
  };

  const handleReset = () => {
    setSelectedIds([]);
    setFlippedData({});
    usedCardsSet.current.clear();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      className="absolute inset-0 z-50 flex flex-col bg-gradient-to-b from-[#F9F7F2]/95 to-[#f0efe9]/95 backdrop-blur-md overflow-hidden font-sans border-t border-white/40"
    >
      <audio ref={audioRef} loop className="hidden" />

      {/* Header */}
      <div className="flex justify-between items-center p-6 mt-10 z-40">
        <div className="text-[#8c857d] text-sm tracking-widest font-serif flex items-center gap-2">
           {isComplete && (
             <button onClick={() => setIsMuted(!isMuted)} className="p-2 -ml-2 rounded-full hover:bg-white/50 transition border border-transparent hover:border-[#e0ddd5]">
               {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
             </button>
           )}
           <span>TAROT ORACLE</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full text-[#8c857d] hover:bg-white/50 transition">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 w-full h-full relative flex flex-col items-center">
         
         {/* 顶部三卡槽 Top 3 Slots */}
         <div className="flex justify-center gap-4 mt-4 z-30 perspective-1000">
           {[0, 1, 2].map(slotIdx => {
             const cardId = selectedIds[slotIdx];
             const isFilled = cardId !== undefined;
             const isFlipped = isFilled && !!flippedData[cardId];
             const fData = flippedData[cardId];

             return (
               <div key={slotIdx} className="w-[85px] h-[130px] rounded-[5px] border-[2px] border-dashed border-[#dcd6ce] flex items-center justify-center relative">
                 <AnimatePresence>
                   {!isFilled && (
                     <motion.div initial={{opacity:0}} animate={{opacity:0.3}} className="text-[#a8a195] text-xs font-serif italic absolute">Slot {slotIdx+1}</motion.div>
                   )}
                 </AnimatePresence>

                 {isFilled && (
                   <motion.div 
                     layoutId={`card-${cardId}`}
                     className="absolute inset-0 z-10 cursor-pointer drop-shadow-[0_15px_25px_rgba(100,90,80,0.15)]"
                     onClick={() => handleFlip(cardId)}
                   >
                     {/* Flip wrapper */}
                     <motion.div 
                       className="w-full h-full relative preserve-3d"
                       animate={{ rotateY: isFlipped ? 180 : 0 }}
                       transition={{ type: "spring", stiffness: 80, damping: 20 }}
                     >
                       {/* BACK OF CARD (Faces User initially) */}
                       <div className="absolute inset-0 overflow-hidden rounded-md backface-hidden shadow-sm">
                         <TarotCardBack />
                       </div>
                       
                 {/* FRONT OF CARD (Tarot image) */}
                 <div 
                   className="absolute inset-0 backface-hidden rotate-y-180 bg-[#fdfbf6] rounded-md border-2 border-[#e8dfcf] overflow-hidden shadow-sm"
                   style={{ transform: 'rotateY(180deg)' }}
                 >
                    {fData && (
                      <div className={`h-full w-full overflow-hidden rounded-[5px] ${fData.isReversed ? 'rotate-180' : ''}`}>
                        <img
                          src={getCardImageUrl(fData.card.id)}
                          alt={fData.card.name}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>
                    )}
                 </div>
                     </motion.div>

                     {/* Reversed/Upright Label (Pops in after flip) */}
                     <AnimatePresence>
                       {isFlipped && (
                          <motion.div 
                            initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:-6 }}
                            className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#fffaf2] border border-[#e8dfcf] text-[#8c8276] text-[9px] px-2 py-0.5 rounded-full shadow-sm tracking-widest font-serif font-medium whitespace-nowrap z-20"
                          >
                            {fData.isReversed ? "逆位" : "正位"}
                          </motion.div>
                       )}
                     </AnimatePresence>
                   </motion.div>
                 )}
               </div>
             );
           })}
         </div>

         {/* 状态引导提示 Status Helper Text */}
         <div className="mt-8 h-10 flex flex-col items-center justify-center z-30">
           <AnimatePresence mode="wait">
             {selectedIds.length < 3 ? (
               <motion.span key="picking" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-[#8c8276] font-light text-sm tracking-widest text-center leading-relaxed">
                 闭上眼睛，从牌阵中选定三张牌<br/>
                 <span className="text-[10px] opacity-60">← 左右滑动展开更多星辰 →</span>
               </motion.span>
             ) : !isComplete ? (
               <motion.span key="flipping" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-[#c39b6e] font-light text-sm tracking-widest animate-pulse">
                 轻触卡背，慢慢揭晓你的指引
               </motion.span>
             ) : null}
           </AnimatePresence>
         </div>

         {/* 下方牌面解释结果区 Interpretations Panel */}
         <AnimatePresence>
           {isComplete && (
             <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
               className="flex-1 w-full max-w-sm mt-4 pb-10 px-6 flex flex-col relative z-30 overflow-y-auto overflow-x-hidden"
             >
               {/* Global Mood Text */}
               <div className="mb-6 bg-white/60 backdrop-blur-md rounded-2xl p-5 shadow-[0_8px_30px_rgba(100,90,80,0.06)] border border-white/50 text-center">
                  <span className="text-xl inline-block mb-2">{prevalentMood === 'healing' ? '🌱' : prevalentMood === 'energetic' ? '☀️' : prevalentMood === 'meditation' ? '🌊' : '🌧️'}</span>
                  <p className="text-[#7c7264] text-sm leading-relaxed font-light tracking-wide">
                    "{MOOD_TEXTS[prevalentMood]}"
                  </p>
               </div>

               {/* Cards Detail List */}
               <div className="flex flex-col gap-4 mb-8">
                 {selectedIds.map((id, index) => {
                   const c = flippedData[id];
                   if (!c) return null;
                   return (
                     <div key={id} className="bg-white/40 p-4 rounded-md border border-white/60 shadow-sm relative overflow-hidden flex gap-3 items-center sm:gap-4">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#e3dac8] to-[#cec5b3]" />
                       <div className="relative h-[78px] w-[52px] shrink-0 overflow-hidden rounded-[5px] border-2 border-[#e8dfcf] bg-[#fdfbf6] shadow-sm">
                         <div className={`h-full w-full ${c.isReversed ? 'rotate-180' : ''}`}>
                           <img
                             src={getCardImageUrl(c.card.id)}
                             alt={c.card.name}
                             className="h-full w-full object-cover"
                             draggable={false}
                           />
                         </div>
                       </div>
                       <div className="flex flex-col items-center justify-center min-w-[50px] border-r border-[#e8dfcf] pr-3 py-1">
                          <span className="text-[10px] text-[#a1998f] font-serif uppercase tracking-wider mb-1">C {index+1}</span>
                          <span className="text-[#5c5346] font-medium text-[11px] leading-tight text-center">{c.card.name.replace(/ \(/, '\n(')}</span>
                       </div>
                       <div className="flex-1 py-1 min-w-0">
                          <div className="text-[#6c6152] font-medium text-xs mb-1 tracking-wider">
                            {c.isReversed ? c.card.reversed.meaning : c.card.upright.meaning}
                          </div>
                          <div className="text-[#8c8276] text-[11px] leading-relaxed font-light">
                            {c.isReversed ? c.card.reversed.guidance : c.card.upright.guidance}
                          </div>
                       </div>
                     </div>
                   )
                 })}
               </div>

               {/* Action Actions */}
               <button onClick={copyResult} className="w-full bg-[#5c5346] hover:bg-[#6c6152] text-[#F9F7F2] py-4 rounded-full font-medium tracking-widest shadow-md transition-colors flex items-center justify-center gap-2 mb-4 shrink-0">
                 <Copy size={16} /> 保存今日指引
               </button>
               <div className="flex w-full gap-3 shrink-0">
                 <button
                   type="button"
                   onClick={handleReset}
                   className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#dcd6ce] bg-transparent py-3.5 text-sm font-medium tracking-widest text-[#8c8276] transition-colors hover:bg-white/50"
                 >
                   <RefreshCcw size={16} /> 再抽一次
                 </button>
                 <button
                   type="button"
                   onClick={onClose}
                   className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#dcd6ce] bg-transparent py-3.5 text-sm font-medium tracking-widest text-[#8c8276] transition-colors hover:bg-white/50"
                 >
                   <Home size={16} /> 回到首页
                 </button>
               </div>
             </motion.div>
           )}
         </AnimatePresence>

         {/* 底部扇形大弧度牌背阵列 Background Arc Spread Fan */}
         <AnimatePresence>
           {selectedIds.length < 3 && (
             <motion.div 
               exit={{ y: 200, opacity: 0, transition: { duration: 0.6 } }}
               className="absolute bottom-4 inset-x-0 h-[220px] pointer-events-none z-10 flex items-center justify-center overflow-visible"
             >
               <motion.div 
                  drag="x"
                  dragConstraints={{ left: -850, right: 850 }}
                  className="relative pointer-events-auto cursor-grab active:cursor-grabbing shrink-0"
                  style={{ width: 1800, height: 220 }}
               >
                 {Array.from({ length: TAROT_FAN_SLOT_COUNT }).map((_, i) => {
                   if (selectedIds.includes(i)) return null;
                   
                   const diff = i - 38.5; // -38.5 to 38.5
                   const x = 900 + diff * 22; // Center is 900px
                   const y = diff * diff * 0.05; // Max ~74px drop
                   const rotate = diff * 1.2; // Max 46 degrees tilt
                   
                   return (
                     <div 
                       key={i} 
                       className="absolute top-[30px]"
                       style={{ 
                         left: x,
                         transform: `translateY(${y}px) rotate(${rotate}deg)`,
                         marginLeft: -32,
                         width: 65, 
                         height: 95,
                         zIndex: 100 - Math.abs(Math.floor(diff)) // Center cards on top
                       }}
                     >
                       <motion.div 
                         layoutId={`card-${i}`}
                         whileHover={{ y: -20, scale: 1.15, zIndex: 1000 }}
                         className="w-full h-full cursor-pointer pointer-events-auto transition-transform will-change-transform"
                         onClick={() => handleSelect(i)}
                       >
                         <TarotCardBack />
                       </motion.div>
                     </div>
                   );
                 })}
               </motion.div>
             </motion.div>
           )}
         </AnimatePresence>
         
      </div>
    </motion.div>
  );
}
