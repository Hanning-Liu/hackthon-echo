import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { loadMidiTimeline } from '../lib/midiTimeline';
import { motion } from 'motion/react';
import { Music, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Instrument, SelectedTrack } from '../types';
import { resolvePracticeAudioSrc } from '../lib/practiceAudio';
import { ScoreViewer } from './ScoreViewer';

const INSTRUMENT_LABELS: Record<Instrument, string> = {
  piano: '钢琴',
  guitar: '吉他',
  bass: '贝斯',
  drums: '架子鼓',
  other: '其他乐器',
  vocals: '人声',
};

export type PracticePageProps = {
  instrument: Instrument;
  selectedTrack: SelectedTrack | null;
  onNext: () => void;
  onBack: () => void;
};

type SessionMode = 'idle' | 'playback' | 'practice';

function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PracticePage({ instrument, selectedTrack, onNext, onBack }: PracticePageProps) {
  const [sessionMode, setSessionMode] = useState<SessionMode>('idle');
  const [audioClock, setAudioClock] = useState({ current: 0, duration: 0 });
  /** 有乐谱同步时用于在音频 metadata 未就绪时显示总时长与进度 */
  const [timelineDurationSec, setTimelineDurationSec] = useState(0);
  /** 结束练习后保留小猫与分享/清除，直至清除或再次进入练习 */
  const [practiceReviewOpen, setPracticeReviewOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasScoreSync = Boolean(
    selectedTrack?.scoreUrl && selectedTrack?.midiUrl && instrument === 'piano'
  );
  const scoreUrl = selectedTrack?.scoreUrl;
  const midiUrl = selectedTrack?.midiUrl;

  const instrumentLabel = INSTRUMENT_LABELS[instrument];
  const titleLine =
    selectedTrack !== null && selectedTrack.title.length > 0 ? selectedTrack.title : '自定义练习';
  const subtitleLine =
    selectedTrack !== null
      ? selectedTrack.artist.length > 0
        ? `${selectedTrack.artist} · ${instrumentLabel}`
        : instrumentLabel
      : `来自链接 · ${instrumentLabel}`;

  const audioSrc = useMemo(
    () => resolvePracticeAudioSrc(selectedTrack, instrument),
    [selectedTrack, instrument]
  );

  const pauseAndResetAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setAudioClock((c) => ({ ...c, current: 0 }));
  }, []);

  const startOrResumeAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    void el.play().catch(() => {
      /* autoplay 受限时忽略 */
    });
  }, []);

  const handlePlaybackToggle = () => {
    if (sessionMode === 'playback') {
      setSessionMode('idle');
      pauseAndResetAudio();
      return;
    }
    setSessionMode('playback');
    startOrResumeAudio();
  };

  const handlePracticeToggle = () => {
    if (sessionMode === 'practice') {
      setSessionMode('idle');
      pauseAndResetAudio();
      setPracticeReviewOpen(true);
      return;
    }
    setPracticeReviewOpen(false);
    setSessionMode('practice');
    startOrResumeAudio();
  };

  const handleShareFromPractice = () => {
    onNext();
  };

  const handleClearPractice = () => {
    setPracticeReviewOpen(false);
    setSessionMode('idle');
    pauseAndResetAudio();
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (hasScoreSync) return;
    if (sessionMode !== 'practice') return;
    const timer = setTimeout(() => {
      onNext();
    }, 6000);
    return () => clearTimeout(timer);
  }, [hasScoreSync, sessionMode, onNext]);

  useEffect(() => {
    if (!hasScoreSync || !midiUrl) {
      setTimelineDurationSec(0);
      return;
    }
    let cancelled = false;
    loadMidiTimeline(midiUrl)
      .then((t) => {
        if (!cancelled) setTimelineDurationSec(t.midiDurationSec);
      })
      .catch(() => {
        if (!cancelled) setTimelineDurationSec(0);
      });
    return () => {
      cancelled = true;
    };
  }, [hasScoreSync, midiUrl]);

  const displayDuration = useMemo(() => {
    if (!hasScoreSync) return audioClock.duration;
    return audioClock.duration > 0 ? audioClock.duration : timelineDurationSec;
  }, [hasScoreSync, audioClock.duration, timelineDurationSec]);

  const scoreSyncProgressRatio = useMemo(() => {
    if (!hasScoreSync || sessionMode === 'idle' || displayDuration <= 0) return 0;
    return Math.min(1, Math.max(0, audioClock.current / displayDuration));
  }, [hasScoreSync, sessionMode, displayDuration, audioClock.current]);

  const syncAudioClockAndProgress = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
    const cur = Number.isFinite(el.currentTime) ? el.currentTime : 0;
    setAudioClock({ current: cur, duration: dur });
  }, [hasScoreSync]);

  // Background camera mocks based on instrument
  const cameraMocks: Record<Instrument, string> = {
    piano:
      'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=2000&auto=format&fit=crop',
    guitar:
      'https://images.unsplash.com/photo-1542208998-f6db1267b14d?q=80&w=2000&auto=format&fit=crop',
    bass: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?q=80&w=2000&auto=format&fit=crop',
    drums:
      'https://images.unsplash.com/photo-1571330735066-03abc126087d?q=80&w=2000&auto=format&fit=crop',
    other:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2000&auto=format&fit=crop',
    vocals:
      'https://images.unsplash.com/photo-1511671782779-c79d0205e0f3?q=80&w=2000&auto=format&fit=crop',
  };

  const tabLineCount =
    instrument === 'guitar' ? 6 : instrument === 'bass' || instrument === 'drums' ? 5 : 4;

  const scoreAnimating = sessionMode === 'playback' && !hasScoreSync;
  const showPracticeCompanion = sessionMode === 'practice' || practiceReviewOpen;
  const backLocked = sessionMode === 'practice';
  const headerPadClass =
    'pt-[max(1rem,env(safe-area-inset-top))] sm:pt-[3.75rem]';
  const loopAudio = !hasScoreSync && sessionMode !== 'idle';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 1 }}
      className="absolute inset-0 overflow-hidden bg-[#fdfdf9] font-sans text-[#5c5549]"
    >
      <audio
        key={audioSrc}
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        loop={loopAudio}
        onTimeUpdate={syncAudioClockAndProgress}
        onLoadedMetadata={syncAudioClockAndProgress}
        onDurationChange={syncAudioClockAndProgress}
      />

      {/* Simulated Camera Background blending with warm paper texture */}
      <div className="absolute inset-0 z-0">
        <motion.img
          src={cameraMocks[instrument]}
          alt="Camera Viewfinder"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-80 grayscale-[30%] blur-[2px] transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-[#fefdfa] mix-blend-overlay opacity-80 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fdfdf9]/90 via-[#fdfdf9]/30 to-[#fdfdf9]/95 pointer-events-none" />
      </div>

      {/* Falling Flower Petals Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, x: Math.random() * window.innerWidth, rotate: 0, opacity: 0 }}
            animate={{
              y: window.innerHeight + 50,
              x: `calc(${Math.random() * 100}vw + ${Math.random() * 100 - 50}px)`,
              rotate: 360,
              opacity: [0, 0.6, 0.6, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: 'linear',
            }}
            className="absolute opacity-60 text-[#e6d0c3] drop-shadow-sm"
          >
            <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0C10 0 16 4 16 10C16 16 10 20 10 20C10 20 4 16 4 10C4 4 10 0 10 0Z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* 全宽绝对层居中标题；控件行在其上，避免侧栏宽度挤压歌名 */}
      <div className="absolute left-0 right-0 top-0 z-40">
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 z-0 flex flex-col items-center px-4 text-center sm:px-5',
            headerPadClass
          )}
        >
          <h2
            className={cn(
              'w-full truncate font-serif text-lg font-semibold leading-snug tracking-tight text-[#4a3f36] sm:text-xl',
              practiceReviewOpen && sessionMode !== 'practice'
                ? 'max-w-[min(17rem,calc(100%-9.5rem))]'
                : 'max-w-[min(20rem,calc(100%-7rem))]'
            )}
          >
            {titleLine}
          </h2>
          <p
            className={cn(
              'mt-1 w-full truncate text-xs font-semibold leading-snug text-[#6b6258] sm:text-sm',
              practiceReviewOpen && sessionMode !== 'practice'
                ? 'max-w-[min(17rem,calc(100%-9.5rem))]'
                : 'max-w-[min(20rem,calc(100%-7rem))]'
            )}
          >
            {subtitleLine}
          </p>
        </div>
        <div
          className={cn(
            'relative z-10 flex items-start justify-between gap-1 px-4 sm:gap-2 sm:px-5',
            headerPadClass
          )}
        >
          <div className="flex shrink-0 justify-start">
            <button
              type="button"
              onClick={onBack}
              disabled={backLocked}
              aria-disabled={backLocked}
              className={cn(
                'mt-0.5 flex shrink-0 items-center gap-0.5 rounded-lg py-2 pl-1 pr-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8fa492]/50',
                backLocked
                  ? 'cursor-not-allowed text-[#a39e94]/50'
                  : 'text-[#7a6f65]/90 hover:text-[#5c5549]'
              )}
            >
              <ChevronLeft className="h-5 w-5 shrink-0" strokeWidth={2} />
              上一步
            </button>
          </div>
          <div
            className="flex shrink-0 flex-col items-end justify-start pt-0.5"
            aria-hidden={!showPracticeCompanion}
          >
            {showPracticeCompanion ? (
              <div
                className={cn(
                  'flex flex-row items-start justify-end gap-1',
                  sessionMode === 'practice' ? 'pointer-events-none' : 'pointer-events-auto'
                )}
              >
              <div
                className={cn(
                  'shrink rounded-md rounded-br-sm border border-white bg-white/70 text-center shadow-sm backdrop-blur-md',
                  sessionMode === 'practice'
                    ? 'max-w-[min(100%,5.25rem)] px-1.5 py-1'
                    : 'w-[3.25rem] px-1 py-1.5 sm:w-14'
                )}
              >
                {sessionMode === 'practice' ? (
                  <>
                    <div className="flex items-center justify-center gap-0.5">
                      <div className="h-1 w-1 shrink-0 animate-pulse rounded-full bg-red-500" />
                      <span className="font-bold text-[8px] tracking-widest text-[#857b6f]">REC</span>
                    </div>
                    <p className="mt-0.5 text-[8px] leading-tight tracking-wide text-[#756a5c]">我在听</p>
                  </>
                ) : (
                  <div className="flex w-full flex-col items-stretch gap-1">
                    <button
                      type="button"
                      onClick={handleShareFromPractice}
                      className="w-full rounded-md bg-[#8fa492]/90 py-1 text-[10px] font-medium leading-tight text-white shadow-sm transition-colors hover:bg-[#7a9180]"
                    >
                      分享
                    </button>
                    <button
                      type="button"
                      onClick={handleClearPractice}
                      className="w-full rounded-md border border-[#c4bdb2] bg-white/80 py-1 text-[10px] font-medium leading-tight text-[#6b6258] transition-colors hover:bg-white"
                    >
                      清除
                    </button>
                  </div>
                )}
              </div>
              <svg
                width="36"
                height="36"
                viewBox="0 0 100 100"
                fill="none"
                className="shrink-0 drop-shadow-sm"
                aria-hidden
              >
                <path d="M20 60 C 20 20, 80 20, 80 60 C 80 90, 20 90, 20 60 Z" fill="#b0aba1" />
                <path d="M25 40 L 15 15 L 40 30 Z" fill="#b0aba1" />
                <path d="M75 40 L 85 15 L 60 30 Z" fill="#b0aba1" />
                <circle cx="35" cy="55" r="4" fill="#4a4238" />
                <circle cx="65" cy="55" r="4" fill="#4a4238" />
                <path
                  d="M 10 50 Q 50 -10 90 50"
                  stroke="#d58f7e"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                />
                <rect x="5" y="45" width="10" height="20" rx="5" fill="#d58f7e" />
                <rect x="85" y="45" width="10" height="20" rx="5" fill="#d58f7e" />
                <path d="M80 65 Q 100 70 90 90" stroke="#a19c92" strokeWidth="8" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Top UI: Vine Progress Bar — 有乐谱时跟音频；否则练习模式 6s 演示。
          勿用 md:inset-x-32：md 按视口宽度触发，外层手机框仍约 375px 时会把轨道压成窄条 */}
      <div className="absolute top-[5.75rem] left-8 right-8 z-20 sm:top-[7.75rem]">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2 px-0.5 font-[family-name:var(--font-noto-ui-sans)] text-[11px] tabular-nums text-[#8a8177] sm:text-xs">
            <span title="当前播放位置">{formatPlaybackTime(audioClock.current)}</span>
            <span title="整首时长" className="text-[#a39e94]">
              {displayDuration > 0 ? formatPlaybackTime(displayDuration) : '—:—'}
            </span>
          </div>
          <div className="relative h-1 min-h-[4px] rounded-full bg-[#e4dfd0]">
            {hasScoreSync ? (
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#8fa492] shadow-[0_0_8px_rgba(143,164,146,0.6)] transition-[width] duration-150 ease-linear"
                style={{
                  width:
                    sessionMode === 'idle'
                      ? '0%'
                      : `${Math.min(100, Math.max(0, scoreSyncProgressRatio * 100))}%`,
                }}
              />
            ) : (
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-[#8fa492] shadow-[0_0_8px_rgba(143,164,146,0.6)]"
                initial={{ width: '0%' }}
                animate={{ width: sessionMode === 'practice' ? '100%' : '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-between px-2 opacity-70">
              {[...Array(6)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#a3b1a5] sm:h-4 sm:w-4">
                  <path
                    d="M12 2C8 6 6 10 6 14C6 18 10 20 12 22C14 20 18 18 18 14C18 10 16 6 12 2Z"
                    fill="currentColor"
                    transform={`rotate(${i % 2 === 0 ? 15 : -15} 12 12)`}
                  />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center Dynamic Smart Score — 标题/进度条与底栏之间撑满 */}
      <div
        className={cn(
          'absolute inset-x-0 top-[9.25rem] sm:top-[11.5rem] bottom-[6rem] z-20 flex flex-col px-4 pointer-events-none min-h-0',
          !hasScoreSync && 'justify-center items-center'
        )}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className={cn(
            'w-full max-w-3xl mx-auto bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_60px_rgba(110,105,95,0.08)] relative overflow-hidden flex flex-col',
            hasScoreSync ? 'flex-1 min-h-0 p-0 sm:p-0' : 'px-6 py-5 sm:p-8 shrink-0'
          )}
        >
          <div className="absolute inset-0 opacity-10 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />

          <div
            className={cn(
              'relative z-10 w-full flex flex-col mx-auto',
              hasScoreSync
                ? 'flex-1 min-h-0 max-w-full justify-start pointer-events-auto'
                : 'h-40 max-w-md shrink-0 justify-center'
            )}
          >
            {hasScoreSync && scoreUrl && midiUrl ? (
              <ScoreViewer
                scoreUrl={scoreUrl}
                midiUrl={midiUrl}
                audioRef={audioRef}
                followPlayback={sessionMode === 'playback' || sessionMode === 'practice'}
                className="flex w-full flex-1 min-h-0 flex-col"
              />
            ) : instrument === 'piano' ? (
              <div className="flex flex-col gap-[14px] relative">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full h-[1px] bg-[#7c756a]/40" />
                ))}
                <motion.div
                  animate={scoreAnimating ? { x: [-20, 200, 400], y: [0, -10, 0] } : {}}
                  transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
                  className="absolute top-8 left-1/4 text-[#a38c71]"
                >
                  <Music size={28} />
                </motion.div>
                <motion.div
                  animate={scoreAnimating ? { x: [0, 150, 300], y: [0, 15, 0] } : {}}
                  transition={{ duration: 3, ease: 'linear', repeat: Infinity, delay: 1 }}
                  className="absolute bottom-8 left-1/3 text-[#8ba290]"
                >
                  <Music size={24} />
                </motion.div>
              </div>
            ) : (
              <div className="flex flex-col gap-[14px] opacity-70 relative">
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 font-serif text-2xl text-[#8b8478] rotate-90 tracking-widest">
                  TAB
                </div>
                {[...Array(tabLineCount)].map((_, i) => (
                  <div key={i} className="w-full h-[1px] border-b border-dashed border-[#8b8478]/50" />
                ))}
                <motion.div
                  animate={scoreAnimating ? { opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] } : {}}
                  transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
                  className="absolute top-1/3 left-1/4 bg-[#fdfdf9] px-2 rounded text-[#7c756a] text-sm font-serif italic border border-[#7c756a]/20"
                  style={{ transform: 'translateY(-10px)' }}
                >
                  0
                </motion.div>
                <motion.div
                  animate={scoreAnimating ? { opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] } : {}}
                  transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
                  className="absolute bottom-1/3 left-1/2 bg-[#fdfdf9] px-2 rounded text-[#7c756a] text-sm font-serif italic border border-[#7c756a]/20"
                >
                  3
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 底部：播放 / 练习 */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex w-full max-w-sm items-center gap-3">
          <button
            type="button"
            onClick={handlePlaybackToggle}
            className={cn(
              'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl border text-[15px] font-medium tracking-wide shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8fa492]/45',
              sessionMode === 'playback'
                ? 'border-[#8fa492]/50 bg-[#8fa492]/25 text-[#3d4a3e]'
                : 'border-white/70 bg-white/45 text-[#5c5549] backdrop-blur-md hover:bg-white/55'
            )}
          >
            {sessionMode === 'playback' ? '暂停播放' : '播放'}
          </button>
          <button
            type="button"
            onClick={handlePracticeToggle}
            className={cn(
              'flex min-h-[3.25rem] flex-1 items-center justify-center rounded-2xl border text-[15px] font-medium tracking-wide shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e8c382]/50',
              sessionMode === 'practice'
                ? 'border-[#e8c382]/60 bg-[#e8c382]/30 text-[#6b5a3a]'
                : 'border-white/70 bg-white/45 text-[#5c5549] backdrop-blur-md hover:bg-white/55'
            )}
          >
            {sessionMode === 'practice' ? '结束练习' : '练习'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
