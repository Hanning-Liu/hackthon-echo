import React, { Fragment, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { ChevronLeft, Bookmark, Heart, X, Music, Play, Pause, ArrowLeft, Trash2 } from 'lucide-react';
import type { TapeReview } from '../lib/tapeData';
import { getShuffledTapes, resolveTapeAudioUrl } from '../lib/tapeData';

// Local Storage Key
const STORAGE_KEY = 'healing_tape_collections';

function readStoredCollections(): TapeReview[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as TapeReview[]) : [];
  } catch {
    return [];
  }
}

export default function TapeDiaryPage({ 
  onBack, 
  defaultShowCollections = false, 
  defaultSharePrompt = false,
  initialLeadTape = null,
}: { 
  key?: string; 
  onBack: () => void; 
  defaultShowCollections?: boolean; 
  defaultSharePrompt?: boolean;
  /** 从塔罗页发布进入时插在队列最前的一张卡 */
  initialLeadTape?: TapeReview | null;
}) {
  const [tapes, setTapes] = useState<TapeReview[]>(() => {
    const base = getShuffledTapes();
    return initialLeadTape ? [initialLeadTape, ...base] : base;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [collections, setCollections] = useState<TapeReview[]>(readStoredCollections);
  const [showCollections, setShowCollections] = useState(defaultShowCollections);
  const [expandedTape, setExpandedTape] = useState<TapeReview | null>(null);
  const [showSharePopup, setShowSharePopup] = useState(defaultSharePrompt);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    if (!tapes[currentIndex] || expandedTape) {
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    const tape = tapes[currentIndex];
    const url = resolveTapeAudioUrl(tape);
    const trim = tape.playbackTrim;

    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = url;

    const TRIM_EPS = 0.08;
    const trimWindowRef = { current: null as { start: number; end: number } | null };

    const applyTrimOrLoop = () => {
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      const useWindow =
        trim &&
        trim.endSec - trim.startSec >= TRIM_EPS &&
        trim.endSec <= dur + 0.05 &&
        trim.endSec - trim.startSec < dur - 0.12;
      if (useWindow && trim) {
        audio.loop = false;
        const start = Math.max(0, Math.min(trim.startSec, dur - TRIM_EPS));
        const end = Math.max(start + TRIM_EPS, Math.min(trim.endSec, dur));
        audio.currentTime = start;
        trimWindowRef.current = { start, end };
      } else {
        audio.loop = true;
        trimWindowRef.current = null;
        audio.currentTime = 0;
      }
    };

    const onTimeUpdate = () => {
      const w = trimWindowRef.current;
      if (!w) return;
      if (audio.currentTime >= w.end - 0.02) {
        audio.currentTime = w.start;
      }
    };

    const onLoadedMeta = () => applyTrimOrLoop();

    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('durationchange', onLoadedMeta);
    audio.addEventListener('timeupdate', onTimeUpdate);

    applyTrimOrLoop();

    if (isPlayingRef.current) {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('durationchange', onLoadedMeta);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [currentIndex, tapes, expandedTape]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || expandedTape) {
      if (audio) audio.pause();
      return;
    }
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, expandedTape]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);

  // Sync collections
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  }, [collections]);

  const handleCollect = (tape: TapeReview) => {
    if (!collections.find(c => c.id === tape.id)) {
      setCollections(prev => [tape, ...prev]);
    }
  };

  const nextCard = () => {
    setCurrentIndex(prev => (prev + 1) % tapes.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 bg-[#FCFAEC] flex flex-col items-center overflow-hidden font-sans"
    >
      {/* Header */}
      <div className="w-full flex justify-between items-center px-6 pt-[calc(12%_+_1.25rem)] pb-4 shrink-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-white/60 text-[#8c8276] hover:bg-white shadow-sm transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center gap-0.5 leading-snug font-serif tracking-widest text-[#5c5346]">
          <span className="text-sm font-semibold uppercase">Mutrix</span>
          <span className="text-[11px] font-normal tracking-[0.2em] normal-case">音乐盲盒广场</span>
        </div>
        <button 
          onClick={() => setShowCollections(true)}
          className="p-2 rounded-full bg-white/60 text-[#8c8276] hover:bg-white shadow-sm transition-all relative"
        >
          <Bookmark size={20} />
          {collections.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFB6A3] rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {collections.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Tinder Cards Area */}
      <div className="flex-1 w-full max-w-md relative flex items-center justify-center perspective-1000">
        {tapes.length > 0 && (
           <AnimatePresence mode="popLayout">
             {tapes.map((tape, index) => {
               // Only render the current and next card for performance and stacking
               if (index < currentIndex || index > currentIndex + 1) return null;
               
               const isTop = index === currentIndex;
               
               return (
                 <SwipeableCard 
                    key={tape.id + index}
                    tape={tape}
                    isTop={isTop}
                    isPlaying={isTop && isPlaying}
                    onTogglePlay={isTop ? togglePlay : undefined}
                    onSwipeRight={() => {
                       handleCollect(tape);
                       nextCard();
                    }}
                    onSwipeLeft={nextCard}
                    onClick={() => setExpandedTape(tape)}
                 />
               );
             })}
           </AnimatePresence>
        )}

        {/* Empty state if wrapped around, though we loop continuously */}
      </div>

      {/* Footer Instructions */}
      <div className="pb-12 pt-6 shrink-0 z-20 text-center">
         <div className="flex justify-center gap-12 text-[#a1998f] text-sm font-medium tracking-widest mb-4">
             <div className="flex items-center gap-2"><ChevronLeft size={16} /> 向左划跳过</div>
             <div className="flex items-center gap-2">向右划收藏 <ChevronLeft size={16} className="rotate-180" /></div>
         </div>
         <div className="text-[11px] text-[#c8bfae]">点击磁带阅读完整内容</div>
      </div>

      {/* Expanded Review Modal */}
      <AnimatePresence>
        {expandedTape && (
           <ReviewModal 
             tape={expandedTape} 
             onClose={() => setExpandedTape(null)} 
             onCollect={() => {
                 handleCollect(expandedTape);
                 setExpandedTape(null);
                 nextCard();
             }}
           />
        )}
      </AnimatePresence>

      {/* Collections Sidebar / Modal */}
      <AnimatePresence>
        {showCollections && (
          <CollectionsView 
             collections={collections} 
             onClose={() => setShowCollections(false)}
             onRemove={(id) => setCollections(prev => prev.filter(c => c.id !== id))}
             onRead={(tape) => setExpandedTape(tape)}
          />
        )}
      </AnimatePresence>

      {/* Share Confirmation Popup */}
      <AnimatePresence>
        {showSharePopup && (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="absolute inset-0 bg-[#F9F7F2]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[24px] p-8 w-full max-w-[300px] text-center shadow-xl border border-[#e8dfcf]"
             >
                <div className="w-12 h-12 mx-auto bg-[#fff0ed] text-[#FFB6A3] rounded-full flex items-center justify-center mb-4">
                  <Bookmark size={24} fill="currentColor" />
                </div>
                <h3 className="text-[#5c5346] font-serif text-[15px] tracking-widest leading-loose mb-8">
                  确认分享至<br/>“磁带广场”吗？
                </h3>
                <div className="flex gap-4">
                   <button 
                     className="flex-1 py-3.5 rounded-full border border-[#dcd6ce] text-[#8c8276] text-sm tracking-widest font-medium active:scale-95 transition-all" 
                     onClick={() => setShowSharePopup(false)}
                   >
                     返回
                   </button>
                   <button 
                     className="flex-1 py-3.5 rounded-full bg-gradient-to-r from-[#FFB6A3] to-[#FFD5A1] text-white shadow-md text-sm tracking-widest font-medium active:scale-95 transition-all" 
                     onClick={() => setShowSharePopup(false)}
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

// -------------------------------------------------------------
// Swipeable Card Wrapper
// -------------------------------------------------------------
function SwipeableCard({ tape, isTop, isPlaying, onTogglePlay, onSwipeRight, onSwipeLeft, onClick }: any) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.x > 100 || info.velocity.x > 500) {
      onSwipeRight();
    } else if (info.offset.x < -100 || info.velocity.x < -500) {
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      className="absolute w-[85%] max-w-[320px] aspect-[0.7] cursor-grab active:cursor-grabbing origin-bottom"
      style={{ 
        x: isTop ? x : 0, 
        rotate: isTop ? rotate : 0, 
        zIndex: isTop ? 10 : 0 
      }}
      initial={isTop ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.92, y: 20, opacity: 0.7 }}
      animate={isTop ? { scale: 1, y: 0, opacity: 1 } : { scale: 0.92, y: 20, opacity: 0.7 }}
      exit={{ x: x.get() > 0 ? 300 : -300, opacity: 0, transition: { duration: 0.2 } }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      onClick={isTop ? onClick : undefined}
    >
       <div className="w-full h-full bg-white rounded-[24px] shadow-xl p-5 flex flex-col gap-6 relative border-[2px] border-white before:absolute before:inset-0 before:-z-10 before:rounded-[24px] before:shadow-[0_20px_50px_rgba(100,90,80,0.1)]">
          {/* Cassette Graphic */}
          <CassetteTape tape={tape} isPlaying={isPlaying} onTogglePlay={onTogglePlay} />

          {/* Snippet */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
             <div className="text-[#a1998f] mb-3"><Music size={24} strokeWidth={1.5} /></div>
             <p className="text-[#5c5346] font-serif leading-loose tracking-wide text-sm">{tape.snippet}</p>
          </div>
          
          <div className="absolute inset-x-0 bottom-6 flex justify-between px-8 z-10 pointer-events-none opacity-50">
              <div className="w-8 h-8 rounded-full border border-[#e8dfcf] flex items-center justify-center text-[#c8bfae] bg-[#fffaf2]">
                 <X size={14} />
              </div>
              <div className="w-8 h-8 rounded-full border border-[#FFB6A3] flex items-center justify-center text-[#FFB6A3] bg-[#fff0ed]">
                 <Heart size={14} fill="currentColor" />
              </div>
          </div>
       </div>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Cassette Tape Graphic
// -------------------------------------------------------------
function CassetteTape({
  tape,
  isPlaying,
  onTogglePlay,
  compact,
}: {
  tape: TapeReview;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  compact?: boolean;
}) {
  const c = !!compact;
  return (
    <div
      className={`w-full aspect-[1.5/1] bg-gradient-to-br ${tape.colorTheme} shadow-inner relative overflow-hidden border-white/60 flex flex-col justify-center items-center pointer-events-none ${
        c ? 'rounded-lg border-2 p-1.5' : 'rounded-xl border-[4px] p-3'
      }`}
    >
      <div
        className={`absolute inset-x-0 bottom-0 bg-white/20 backdrop-blur-md border-t border-white/40 flex justify-center items-end ${
          c ? 'h-[22%] pb-1' : 'h-[25%] pb-1.5'
        }`}
      >
        <div
          className={`rounded-t-md border border-white/20 shadow-inner flex justify-between items-center bg-[#5c5346]/10 ${
            c ? 'h-3 w-[38%] px-1' : 'h-5 w-1/3 px-2'
          }`}
        >
          <div className={`rounded-full bg-[#5c5346]/20 ${c ? 'h-0.5 w-0.5' : 'h-1.5 w-1.5'}`} />
          <div className={`rounded-full bg-[#5c5346]/20 ${c ? 'h-0.5 w-0.5' : 'h-1.5 w-1.5'}`} />
        </div>
      </div>

      {/* Tape label */}
      <div
        className={`relative flex shrink-0 flex-col bg-[#FCFAEC]/95 shadow-sm border border-white/80 ${
          c ? 'h-[66%] w-[92%] rounded px-1.5 py-1' : 'h-[68%] w-[90%] rounded-md px-3 py-2'
        }`}
      >
        <div className={`flex items-center justify-between gap-0.5 ${c ? 'mb-0' : 'mb-1'}`}>
          <div
            className={`text-[#a1998f] font-serif uppercase ${c ? 'max-w-[55%] truncate text-[6px] leading-none tracking-tight' : 'text-[9px] tracking-widest'}`}
          >
            Tape Diary
          </div>
          <div className={`shrink-0 text-[#a1998f] font-mono ${c ? 'text-[6px] leading-none' : 'text-[9px]'}`}>A-Side</div>
        </div>

        <div
          className={`truncate px-0.5 text-center font-bold text-[#5c5346] ${c ? 'text-[8px] leading-tight tracking-tight' : 'text-[13px] tracking-wide'}`}
        >
          {tape.movie}
        </div>

        {/* Wheels & Window */}
        <div
          className={`absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-between ${
            c ? 'mt-0.5 h-[40%] w-[92%] space-x-0.5' : 'mt-1 h-[40%] w-4/5 space-x-1'
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-full border-[#e8dfcf] bg-[#fffaf2] shadow-inner ${
              c ? 'h-5 w-5 border' : 'h-9 w-9 border-[2px]'
            }`}
          >
            <div
              className={`flex items-center justify-center rounded-full border border-[#e8dfcf] bg-[#FCFAEC] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] ${
                c ? 'h-2.5 w-2.5' : 'h-[18px] w-[18px]'
              } ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
            >
              <div className={`rounded-full bg-[#dcd6ce] ${c ? 'h-0.5 w-0.5' : 'h-1.5 w-1.5'}`} />
            </div>
          </div>

          {/* Center window: brown strip + play only when interactive */}
          <div
            className={`relative flex h-full flex-1 items-center justify-center overflow-hidden rounded bg-gradient-to-b from-[#8c8276]/10 to-transparent ${
              c ? 'px-0.5' : 'px-1'
            } ${onTogglePlay ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
            onClick={onTogglePlay ? (e) => { e.stopPropagation(); onTogglePlay(); } : undefined}
          >
            {onTogglePlay && (
              <div
                className={`absolute bottom-0 left-1/2 flex min-h-0 -translate-x-1/2 flex-col ${c ? 'top-[50%] w-5' : 'top-[52%] w-8'}`}
              >
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-[2px] bg-[#5c5346] opacity-90">
                  <button type="button" className="relative z-20 text-white opacity-80 hover:opacity-100 drop-shadow-md">
                    {isPlaying ? (
                      <Pause fill="currentColor" size={c ? 11 : 16} />
                    ) : (
                      <Play fill="currentColor" className={c ? '' : 'ml-0.5'} size={c ? 11 : 16} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className={`flex items-center justify-center rounded-full border-[#e8dfcf] bg-[#fffaf2] shadow-inner ${
              c ? 'h-5 w-5 border' : 'h-9 w-9 border-[2px]'
            }`}
          >
            <div
              className={`flex items-center justify-center rounded-full border border-[#e8dfcf] bg-[#FCFAEC] shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)] ${
                c ? 'h-2.5 w-2.5' : 'h-[18px] w-[18px]'
              } ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}
            >
              <div className={`rounded-full bg-[#dcd6ce] ${c ? 'h-0.5 w-0.5' : 'h-1.5 w-1.5'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Decorative lines */}
      <div
        className={`absolute rounded-full bg-white/40 ${c ? 'left-2 top-1 h-0.5 w-5' : 'left-3 top-2 h-1 w-8'}`}
      />
      <div
        className={`absolute rounded-full bg-white/40 ${c ? 'right-2 top-1 h-0.5 w-5' : 'right-3 top-2 h-1 w-8'}`}
      />
    </div>
  );
}

// -------------------------------------------------------------
// Expanded Review Modal
// -------------------------------------------------------------
function ReviewModal({ tape, onClose, onCollect }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-[#F9F7F2]/95 backdrop-blur-md"
    >
       <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white shadow-sm text-[#8c8276]"><X size={20} /></button>
       
       <div className="mx-auto flex w-full max-w-sm flex-1 min-h-0 flex-col px-6 py-12">
          <div className="pointer-events-none mx-auto mb-8 w-2/3 shrink-0 origin-bottom rotate-2 transition-transform hover:rotate-0">
            <CassetteTape tape={tape} />
          </div>

          <h2 className="mb-2 shrink-0 font-serif text-xl font-bold tracking-wide text-[#5c5346]">{tape.title}</h2>
          <div className="mb-6 flex shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-widest text-[#8c8276]">
            <FilmIcon /> {tape.movie}
          </div>

          <div className="scroll-warm-subtle relative mb-8 min-h-0 flex-1 overflow-y-auto overscroll-y-contain rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
             <div className="absolute left-4 top-4 text-[#e8dfcf] opacity-50"><QuoteIcon /></div>
             <p className="relative z-10 whitespace-pre-wrap pt-4 text-justify font-serif text-[14px] leading-loose tracking-wide text-[#5c5346]">
               {tape.content}
             </p>
          </div>

          <div className="shrink-0">
            <TapeAudioPlayer tape={tape} />
          </div>

          <button 
            type="button"
            onClick={onCollect}
            className="w-full shrink-0 rounded-full bg-gradient-to-r from-[#FFB6A3] to-[#FFD5A1] py-4 font-medium tracking-widest text-white shadow-lg shadow-[#FFB6A3]/30 flex justify-center items-center gap-2 transition-transform active:scale-95"
          >
            <Heart size={18} fill="currentColor" /> 收藏这盘磁带
          </button>
       </div>
    </motion.div>
  )
}

// -------------------------------------------------------------
// Collections View — swipe right to reveal delete
// -------------------------------------------------------------
const COLLECTION_DELETE_REVEAL_PX = 72;

function CollectionSwipeRow({
  tape,
  onRead,
  onRemove,
}: {
  tape: TapeReview;
  onRead: (t: TapeReview) => void;
  onRemove: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const w = COLLECTION_DELETE_REVEAL_PX;

  const snap = (_e: unknown, info: { velocity: { x: number } }) => {
    const pos = x.get();
    const vx = info.velocity.x;
    let target = 0;
    if (vx > 280) target = w;
    else if (vx < -280) target = 0;
    else target = pos > w / 2 ? w : 0;
    animate(x, target, { type: 'spring', stiffness: 460, damping: 38 });
  };

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      <button
        type="button"
        className="absolute inset-y-0 left-0 z-0 flex w-[72px] flex-col items-center justify-center gap-0.5 rounded-l-[20px] bg-[#dc2626] text-[10px] font-medium tracking-widest text-white shadow-inner"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(tape.id);
        }}
      >
        <Trash2 size={18} strokeWidth={2} />
        删除
      </button>

      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: w }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={snap}
        onTap={() => {
          if (x.get() > 12) {
            animate(x, 0, { type: 'spring', stiffness: 460, damping: 38 });
          } else {
            onRead(tape);
          }
        }}
        className="relative z-10 flex cursor-grab items-center gap-4 rounded-[20px] border border-[#f0efe9] bg-white p-4 shadow-sm active:cursor-grabbing"
      >
        <div className="w-24 shrink-0 overflow-hidden rounded-xl">
          <CassetteTape tape={tape} compact />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 truncate text-sm font-bold text-[#5c5346]">{tape.title}</div>
          <div className="text-[10px] tracking-widest text-[#a1998f]">{tape.movie}</div>
        </div>
      </motion.div>
    </div>
  );
}

function CollectionsView({
  collections,
  onClose,
  onRemove,
  onRead,
}: {
  collections: TapeReview[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onRead: (tape: TapeReview) => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-50 bg-[#F9F7F2] flex flex-col"
    >
       <div className="w-full flex justify-between items-center px-6 py-6 border-b border-[#e8dfcf]/50 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          <div className="font-serif text-[#5c5346] tracking-widest uppercase text-sm font-semibold">收藏夹</div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/60 text-[#8c8276] hover:bg-white shadow-sm transition-all"><X size={20} /></button>
       </div>

       <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {collections.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-[#c8bfae]">
               <Bookmark size={32} strokeWidth={1} className="mb-3 opacity-50" />
               <p className="font-serif text-sm tracking-widest">暂无收藏的磁带</p>
             </div>
          ) : (
            collections.map((tape: TapeReview) => (
              <Fragment key={tape.id}>
                <CollectionSwipeRow tape={tape} onRead={onRead} onRemove={onRemove} />
              </Fragment>
            ))
          )}
       </div>
    </motion.div>
  )
}

// -------------------------------------------------------------
// Icons
// -------------------------------------------------------------
const QuoteIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 11L8 15H11V19H5V15L7 11H5V7H10V11ZM19 11L17 15H20V19H14V15L16 11H14V7H19V11Z" />
  </svg>
);

const FilmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
    <line x1="7" y1="2" x2="7" y2="22"></line>
    <line x1="17" y1="2" x2="17" y2="22"></line>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <line x1="2" y1="7" x2="7" y2="7"></line>
    <line x1="2" y1="17" x2="7" y2="17"></line>
    <line x1="17" y1="17" x2="22" y2="17"></line>
    <line x1="17" y1="7" x2="22" y2="7"></line>
  </svg>
);

const MODAL_PREVIEW_CAP_SEC = 15;

function formatTapePlayerTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function TapeAudioPlayer({ tape }: { tape: TapeReview }) {
  const audioUrl = resolveTapeAudioUrl(tape);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [segmentLen, setSegmentLen] = useState(MODAL_PREVIEW_CAP_SEC);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const windowRef = useRef({ absStart: 0, absEnd: MODAL_PREVIEW_CAP_SEC });

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const applyWindow = () => {
      const dur =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : MODAL_PREVIEW_CAP_SEC;
      const tr = tape.playbackTrim;
      let absStart = 0;
      let absEnd = Math.min(MODAL_PREVIEW_CAP_SEC, dur);
      if (tr && tr.endSec - tr.startSec > 0.08) {
        absStart = Math.max(0, Math.min(tr.startSec, dur - 0.05));
        absEnd = Math.min(tr.endSec, absStart + MODAL_PREVIEW_CAP_SEC, dur);
        absEnd = Math.max(absEnd, absStart + 0.1);
      }
      windowRef.current = { absStart, absEnd };
      const len = absEnd - absStart;
      setSegmentLen(len > 0 ? len : MODAL_PREVIEW_CAP_SEC);
      setElapsed(0);
    };

    const onTimeUpdate = () => {
      if (!audioRef.current) return;
      const w = windowRef.current;
      const t = audioRef.current.currentTime;
      setElapsed(Math.max(0, t - w.absStart));
      if (t >= w.absEnd - 0.03) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };

    const onEnded = () => {
      setPlaying(false);
      setElapsed(0);
    };

    audio.addEventListener('loadedmetadata', applyWindow);
    audio.addEventListener('durationchange', applyWindow);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    applyWindow();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', applyWindow);
      audio.removeEventListener('durationchange', applyWindow);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [audioUrl, tape.playbackTrim?.startSec, tape.playbackTrim?.endSec]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    const w = windowRef.current;
    if (playing) {
      audioRef.current.pause();
    } else {
      const t = audioRef.current.currentTime;
      if (t < w.absStart || t >= w.absEnd - 0.05) {
        audioRef.current.currentTime = w.absStart;
        setElapsed(0);
      }
      void audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const pct = segmentLen > 0 ? Math.min((elapsed / segmentLen) * 100, 100) : 0;

  return (
    <div className="w-full flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm border border-white/60 mb-8 backdrop-blur-md">
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 shrink-0 bg-[#FFB6A3] text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 shadow-sm"
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      <div className="flex-1">
        <div className="flex justify-between text-[11px] font-mono text-[#a1998f] mb-1.5 tracking-widest">
          <span>{formatTapePlayerTime(elapsed)}</span>
          <span>{formatTapePlayerTime(segmentLen)}</span>
        </div>
        <div className="w-full h-1.5 bg-[#e8dfcf]/60 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FFB6A3] rounded-full"
            style={{ width: `${pct}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
      <div className="shrink-0 text-[#c8bfae]">
        <Music size={16} />
      </div>
    </div>
  );
}
