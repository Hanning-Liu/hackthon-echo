import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TarotCard, createShuffledFanOrder, getTarotCardForFanOrderSlot } from '../lib/tarotData';
import type { TapeReview } from '../lib/tapeData';
import SingleTarotDrawPage from './SingleTarotDrawPage';
import SingleTarotDetailPage from './SingleTarotDetailPage';
import { ArrowLeft, Bookmark } from 'lucide-react';

function buildTarotPlazaTape(
  keyword: string,
  drawn: { card: TarotCard; isReversed: boolean },
  fullInterpretation: string
): TapeReview {
  const { card, isReversed } = drawn;
  const meaning = isReversed ? card.reversed.meaning : card.upright.meaning;
  const pos = isReversed ? '逆位' : '正位';
  const snippet = `「${keyword}」·${card.name}·${pos}｜${meaning}`;

  return {
    id: `tarot_plaza_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: `塔罗启示 · 「${keyword}」`,
    movie: card.name,
    snippet,
    content: fullInterpretation.replace(/\n\n/g, '\n'),
    colorTheme: 'from-[#FFB6A3] to-[#FFD5A1]',
    tapeStyle: 'style1',
    audioCategory: card.audioCategory,
  };
}

export default function SingleTarotPage({
  keyword,
  onClose,
  onPublishToPlaza,
}: {
  key?: string;
  keyword: string;
  onClose: () => void;
  onPublishToPlaza: (tape: TapeReview) => void;
}) {
  const [stage, setStage] = useState<'draw' | 'reveal'>('draw');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [drawnData, setDrawnData] = useState<{ card: TarotCard; isReversed: boolean } | null>(null);
  const [removedSlotIndices, setRemovedSlotIndices] = useState<Set<number>>(() => new Set());
  /** Visual slot i → deck index 0..77 (shuffled so positions do not match file order). */
  const [fanOrder, setFanOrder] = useState<number[]>(() => createShuffledFanOrder());
  const [showSharePopup, setShowSharePopup] = useState(false);

  const handleSelect = (idx: number) => {
    if (stage !== 'draw') return;
    if (removedSlotIndices.has(idx)) return;
    setSelectedIdx(idx);
    const card = getTarotCardForFanOrderSlot(fanOrder, idx);
    const isReversed = Math.random() > 0.5;
    setDrawnData({ card, isReversed });
    setTimeout(() => {
      setStage('reveal');
    }, 600);
  };

  const getInterpretation = () => {
    if (!drawnData) return '';
    const name = drawnData.card.name;
    const meaning = drawnData.isReversed ? drawnData.card.reversed.meaning : drawnData.card.upright.meaning;

    if (keyword === '深夜食堂' && name.includes('星币 5')) {
      return `在脑海中浮现「${keyword}」的这刻，你抽到了【${name}】。\n\n这预示着在孤独的寒夜中寻找温暖的慰藉。或许你正经历着某种精神或物质的剥离感，但请记住，食堂的那盏黄晕小灯永远为你保留。你需要的是停下脚步，接纳目前暂时的风雪，温暖往往在你主动推开那扇门的瞬间降临。`;
    }

    return `当你带着对「${keyword}」的潜意识翻开底牌，世界将【${name}】指引给了你。\n\n这张牌象征着${meaning}的能量。它轻诉着：有些剧情注定是你关于${keyword}的课题。不必因为一时的阻滞而自我怀疑，接纳它作为你音乐之路与人生旋律里独特的一段和弦。聆听内心的声音，你会找到出路的。`;
  };

  const exitReveal = (removeSlotForHeartbreak: boolean) => {
    setShowSharePopup(false);
    if (removeSlotForHeartbreak && selectedIdx !== null) {
      setRemovedSlotIndices((prev) => new Set([...prev, selectedIdx]));
    }
    setStage('draw');
    setSelectedIdx(null);
    setDrawnData(null);
    setFanOrder(createShuffledFanOrder());
  };

  const handleBack = () => {
    if (stage === 'reveal') {
      exitReveal(false);
      return;
    }
    setShowSharePopup(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex min-h-0 flex-col overflow-hidden bg-gradient-to-b from-[#F9F7F2]/95 to-[#f0efe9]/95 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={handleBack}
        className="absolute left-6 top-[12%] z-50 p-2 rounded-full bg-white/60 text-[#8c8276] shadow-sm transition-all hover:bg-white pointer-events-auto"
      >
        <ArrowLeft size={20} />
      </button>

      {stage === 'draw' && (
        <SingleTarotDrawPage
          keyword={keyword}
          removedSlotIndices={removedSlotIndices}
          selectedIdx={selectedIdx}
          onSelectSlot={handleSelect}
        />
      )}

      {stage === 'reveal' && drawnData && selectedIdx !== null && (
        <SingleTarotDetailPage
          keyword={keyword}
          card={drawnData.card}
          isReversed={drawnData.isReversed}
          selectedIdx={selectedIdx}
          interpretation={getInterpretation()}
          onHeart={() => {}}
          onHeartCrack={() => exitReveal(true)}
          onShare={() => setShowSharePopup(true)}
        />
      )}

      <AnimatePresence>
        {showSharePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-[#F9F7F2]/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-[300px] rounded-[24px] border border-[#e8dfcf] bg-white p-8 text-center shadow-xl"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff0ed] text-[#FFB6A3]">
                <Bookmark size={24} fill="currentColor" />
              </div>
              <h3 className="mb-8 font-serif text-[15px] leading-loose tracking-widest text-[#5c5346]">
                确认分享至<br />「音乐盲盒广场」吗？
              </h3>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="flex-1 rounded-full border border-[#dcd6ce] py-3.5 text-sm font-medium tracking-widest text-[#8c8276] transition-all active:scale-95"
                  onClick={() => setShowSharePopup(false)}
                >
                  返回
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full bg-gradient-to-r from-[#FFB6A3] to-[#FFD5A1] py-3.5 text-sm font-medium tracking-widest text-white shadow-md transition-all active:scale-95"
                  onClick={() => {
                    if (!drawnData) return;
                    const tape = buildTarotPlazaTape(keyword, drawnData, getInterpretation());
                    setShowSharePopup(false);
                    onPublishToPlaza(tape);
                  }}
                >
                  确认发布
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
