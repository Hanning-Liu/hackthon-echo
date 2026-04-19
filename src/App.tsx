import React, { Fragment, useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, CheckCircle2, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from './lib/utils';
import { ParsingPage } from './components/ParsingPage';
import { SelectPage } from './components/SelectPage';
import { PracticePage } from './components/PracticePage';
import KeywordsPage from './components/KeywordsPage';
import SingleTarotPage from './components/SingleTarotPage';
import TapeDiaryPage from './components/TapeDiaryPage';
import type { TapeReview } from './lib/tapeData';
import type { Instrument, SampleId, SelectedTrack } from './types';
import { resolvePracticeAudioSrc } from './lib/practiceAudio';
import { buildPracticePlazaTape } from './lib/plazaTapeFromPractice';
import { CompletePageAudioTrim } from './components/CompletePageAudioTrim';

type PageState =
  | 'home'
  | 'parsing'
  | 'select'
  | 'practice'
  | 'complete'
  | 'keywords'
  | 'single_tarot'
  | 'tape_diary';

type SampleAudioCase = {
  id: SampleId;
  label: string;
  path: string;
  stemAudio?: Partial<Record<Instrument, string>>;
  scoreUrl?: string;
  midiUrl?: string;
};

function stemAudioForSample(id: SampleId): Partial<Record<Instrument, string>> {
  const keys: Instrument[] = ['piano', 'guitar', 'bass', 'drums', 'other', 'vocals'];
  return Object.fromEntries(keys.map((k) => [k, `/samples/${id}-${k}.mp3`])) as Partial<
    Record<Instrument, string>
  >;
}

/** 本地测试音频（来自项目 test/test-02～test-04），供一键填入输入框做音轨分离 */
const SAMPLE_AUDIO_CASES: readonly SampleAudioCase[] = [
  {
    id: 'test-02',
    label: '陶喆·爱我还是他',
    path: '/samples/test-02.mp3',
    stemAudio: stemAudioForSample('test-02'),
    scoreUrl: '/samples/test-02-piano.musicxml',
    midiUrl: '/samples/test-02-piano.mid',
  },
  {
    id: 'test-03',
    label: '王菲·红豆',
    path: '/samples/test-03.mp3',
    stemAudio: stemAudioForSample('test-03'),
  },
  {
    id: 'test-04',
    label: '周杰伦·七里香',
    path: '/samples/test-04.mp3',
    stemAudio: stemAudioForSample('test-04'),
  },
];

/** 每张卡片独立的暖色渐变，与首页纸质调性一致 */
const SAMPLE_CARD_STYLES = [
  {
    shell: 'from-[#faf6f0] via-[#f5ebe3] to-[#efe2d8]',
    icon: 'from-[#c9a87a] to-[#9e7352]',
    glow: 'shadow-[0_2px_16px_rgba(158,115,82,0.12)]',
  },
  {
    shell: 'from-[#f8f4f7] via-[#f0e8ee] to-[#e8dde6]',
    icon: 'from-[#b08a9d] to-[#8a6278]',
    glow: 'shadow-[0_2px_16px_rgba(138,98,120,0.12)]',
  },
  {
    shell: 'from-[#f4f7f2] via-[#e9efe6] to-[#dde8df]',
    icon: 'from-[#7d9b84] to-[#5a7562]',
    glow: 'shadow-[0_2px_16px_rgba(90,117,98,0.12)]',
  },
] as const;

/** 将「歌手·歌名」转为输入框展示「歌名-歌手」 */
function songTitleArtistDash(artistDotTitle: string): string {
  const i = artistDotTitle.indexOf('·');
  if (i === -1) return artistDotTitle;
  const artist = artistDotTitle.slice(0, i);
  const title = artistDotTitle.slice(i + 1);
  return `${title}-${artist}`;
}

type SoundscapeDriftPoint = { left: number; top: number };

function randomSoundscapePoint(): SoundscapeDriftPoint {
  return {
    left: 14 + Math.random() * 72,
    top: 16 + Math.random() * 68,
  };
}

/** 声境内占位入口在容器内周期性随机漂移，后续可替换为方形 GIF */
function useSoundscapeDrift(seed: 0 | 1): SoundscapeDriftPoint {
  const [p, setP] = useState<SoundscapeDriftPoint>(() => randomSoundscapePoint());
  useEffect(() => {
    const base = seed === 0 ? 3600 : 4400;
    const id = window.setInterval(() => {
      setP(randomSoundscapePoint());
    }, base + Math.random() * 1200);
    return () => clearInterval(id);
  }, [seed]);
  return p;
}

function SoundscapeFloatingEntry({
  driftSeed,
  squareClassName,
  squareImageSrc,
  title,
  subtitle,
  onClick,
}: {
  driftSeed: 0 | 1;
  squareClassName?: string;
  squareImageSrc?: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  const pos = useSoundscapeDrift(driftSeed);
  return (
    <motion.button
      type="button"
      aria-label={`${title}，${subtitle}`}
      onClick={onClick}
      initial={false}
      animate={{ left: `${pos.left}%`, top: `${pos.top}%` }}
      transition={{ duration: 2.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'absolute z-10 flex flex-col items-center gap-2.5 p-0',
        '-translate-x-1/2 -translate-y-1/2 border-0 bg-transparent shadow-none',
        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5a5]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfaec]'
      )}
    >
      <span className="flex max-w-[11rem] flex-col items-center gap-0.5 leading-snug font-serif tracking-widest text-[#5c5346]">
        <span>{title}</span>
        <span className="text-center text-[13px] font-normal tracking-[0.2em]">{subtitle}</span>
      </span>
      <div
        className={cn(
          'h-[88px] w-[88px] shrink-0 rounded-xl sm:h-[100px] sm:w-[100px]',
          squareImageSrc
            ? 'overflow-hidden'
            : cn('shadow-[0_6px_20px_rgba(60,50,40,0.12)] ring-1 ring-black/5', squareClassName)
        )}
        aria-hidden
      >
        {squareImageSrc ? (
          <img
            src={squareImageSrc}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : null}
      </div>
    </motion.button>
  );
}

export default function App() {
  const [page, setPage] = useState<PageState>('home');
  const [url, setUrl] = useState('');
  const [instrument, setInstrument] = useState<Instrument>('piano');
  const [selectedTrack, setSelectedTrack] = useState<SelectedTrack | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [tapeDiaryConfig, setTapeDiaryConfig] = useState({
    showCollections: false,
    sharePrompt: false,
  });
  /** 从塔罗「确认发布」进入广场时，插在牌堆最前的磁带卡片 */
  const [tapeDiaryLeadTape, setTapeDiaryLeadTape] = useState<TapeReview | null>(null);
  /** 完成页音频裁剪区间，供发布到音乐广场 */
  const [publishTrimRange, setPublishTrimRange] = useState<{
    startSec: number;
    endSec: number;
  } | null>(null);
  const [homeTab, setHomeTab] = useState<'pickup' | 'soundscape'>('pickup');

  const completeAudioSrc = useMemo(
    () => resolvePracticeAudioSrc(selectedTrack, instrument),
    [selectedTrack, instrument]
  );

  /** 从声境入口进入的小马 / 小猫子页返回时应回到「声境」而非默认的「拾音」 */
  const goHomeFromSoundscapeEntry = () => {
    setHomeTab('soundscape');
    setPage('home');
  };

  // Auto-transition from parsing to select
  useEffect(() => {
    if (page === 'parsing') {
      const timer = setTimeout(() => {
        setPage('select');
      }, 7000); // 延长解析动画时间，让用户沉浸感受生长
      return () => clearTimeout(timer);
    }
  }, [page]);

  return (
    <div className="box-border flex h-[100dvh] min-h-0 w-full items-center justify-center overflow-hidden bg-[#d8d2c4] font-sans selection:bg-[#cbd5e1] selection:text-[#334155] sm:p-4">
      {/* Mobile Program Frame Constraint - iPhone Mockup */}
      <div className="w-full max-w-[375px] h-[100dvh] sm:h-[812px] bg-[#f9f7f2] relative overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(100,90,80,0.2)] sm:rounded-[45px] sm:ring-[14px] sm:ring-[#1a1a1a]">
        
        {/* iOS Dynamic Island & Status Bar (visible mostly on desktop/forced mock) */}
        <div className="absolute top-0 inset-x-0 h-12 hidden sm:flex justify-between px-7 pt-3.5 z-[60] text-black font-semibold text-[13px] mix-blend-difference pointer-events-none opacity-80">
          <span className="tracking-widest">9:41</span>
          <div className="flex gap-1.5 items-center">
            <svg width="18" height="12" viewBox="0 0 16 12" fill="currentColor">
               <rect x="0" y="8" width="3" height="4" rx="1"/>
               <rect x="4" y="5" width="3" height="7" rx="1"/>
               <rect x="8" y="2" width="3" height="10" rx="1"/>
               <rect x="12" y="0" width="3" height="12" rx="1"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
               <path d="M8 9A1 1 0 108 11A1 1 0 108 9ZM2.5 5.5A7.5 7.5 0 0113.5 5.5L12 7A5.5 5.5 0 004 7L2.5 5.5Z"/>
               <path d="M0 3A10.5 10.5 0 0116 3L14.5 4.5A8.5 8.5 0 001.5 4.5L0 3Z"/>
            </svg>
            <svg width="24" height="12" viewBox="0 0 24 12" fill="currentColor">
               <rect x="0" y="1" width="20" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
               <rect x="2" y="3" width="12" height="6" rx="1" />
               <path d="M21 4V8C22 8 23 7 23 6C23 5 22 4 21 4Z" />
            </svg>
          </div>
        </div>
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-[#000000] rounded-full z-[60] shadow-sm pointer-events-none hidden sm:block" />

        {/* Scaled App Content */}
        <div className="relative flex min-h-0 w-full flex-1 overflow-hidden bg-[#F9F7F2] sm:mt-0">
          <AnimatePresence mode="wait">
            {page === 'home' && (
              <Fragment key="home">
                <HomePage
                  homeTab={homeTab}
                  setHomeTab={setHomeTab}
                  onNext={() => setPage('parsing')}
                  url={url}
                  setUrl={setUrl}
                  setSelectedTrack={setSelectedTrack}
                  onGoToMusicCat={() => setPage('keywords')}
                  onGoToTapeDiary={() => {
                    setTapeDiaryLeadTape(null);
                    setTapeDiaryConfig({ showCollections: false, sharePrompt: false });
                    setPage('tape_diary');
                  }}
                />
              </Fragment>
            )}
            {page === 'parsing' && (
              <Fragment key="parsing">
                <ParsingPage />
              </Fragment>
            )}
            {page === 'select' && (
              <Fragment key="select">
                <SelectPage
                  instrument={instrument}
                  setInstrument={setInstrument}
                  onNext={() => setPage('practice')}
                  onBack={() => setPage('home')}
                />
              </Fragment>
            )}
            {page === 'practice' && (
              <Fragment key="practice">
                <PracticePage
                  instrument={instrument}
                  selectedTrack={selectedTrack}
                  onNext={() => setPage('complete')}
                  onBack={() => setPage('select')}
                />
              </Fragment>
            )}
            {page === 'complete' && (
              <Fragment key="complete">
                <CompletePage
                  audioSrc={completeAudioSrc}
                  onTrimChange={setPublishTrimRange}
                  onPublishToMusicPlaza={() => {
                    setTapeDiaryLeadTape(
                      buildPracticePlazaTape({
                        selectedTrack,
                        audioSrc: completeAudioSrc,
                        trimRange: publishTrimRange,
                      })
                    );
                    setTapeDiaryConfig({ showCollections: false, sharePrompt: false });
                    setPage('tape_diary');
                  }}
                  onReset={() => {
                    setPublishTrimRange(null);
                    setHomeTab('pickup');
                    setPage('home');
                    setUrl('');
                    setSelectedTrack(null);
                  }}
                />
              </Fragment>
            )}
            {page === 'keywords' && (
              <Fragment key="keywords">
                <KeywordsPage
                  onSelect={(kw) => {
                    setSelectedKeyword(kw);
                    setPage('single_tarot');
                  }}
                  onBack={goHomeFromSoundscapeEntry}
                />
              </Fragment>
            )}
            {page === 'single_tarot' && (
              <Fragment key="single_tarot">
                <SingleTarotPage
                  keyword={selectedKeyword}
                  onClose={() => setPage('keywords')}
                  onPublishToPlaza={(tape) => {
                    setTapeDiaryLeadTape(tape);
                    setTapeDiaryConfig({ showCollections: false, sharePrompt: false });
                    setPage('tape_diary');
                  }}
                />
              </Fragment>
            )}
            {page === 'tape_diary' && (
              <Fragment
                key={
                  tapeDiaryLeadTape
                    ? `tape_diary_lead_${tapeDiaryLeadTape.id}`
                    : tapeDiaryConfig.sharePrompt
                      ? 'tape_diary_share'
                      : 'tape_diary'
                }
              >
                <TapeDiaryPage
                  onBack={goHomeFromSoundscapeEntry}
                  defaultShowCollections={tapeDiaryConfig.showCollections}
                  defaultSharePrompt={tapeDiaryConfig.sharePrompt}
                  initialLeadTape={tapeDiaryLeadTape}
                />
              </Fragment>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Home Page: Matches the provided screenshot perfectly
// -------------------------------------------------------------
function HomePage({
  homeTab,
  setHomeTab,
  onNext,
  url,
  setUrl,
  setSelectedTrack,
  onGoToMusicCat,
  onGoToTapeDiary,
}: {
  homeTab: 'pickup' | 'soundscape';
  setHomeTab: (t: 'pickup' | 'soundscape') => void;
  onNext: () => void;
  url: string;
  setUrl: (s: string) => void;
  setSelectedTrack: (t: SelectedTrack | null) => void;
  onGoToMusicCat: () => void;
  onGoToTapeDiary: () => void;
}) {

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && url.trim().length > 0) {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0 flex min-w-0 flex-col overflow-x-hidden bg-gradient-to-br from-[#fcfaec] via-[#fdfdf9] to-[#eee8db]"
    >
      {/* Decorative Ornaments (as seen in screenshot) */}
      <div className="pointer-events-none absolute left-[15%] top-[12%] z-0 opacity-80">
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 20C55 30 65 30 70 20C65 10 55 10 50 20Z" fill="white"/>
          <path d="M70 20C80 25 80 35 70 40C60 35 60 25 70 20Z" fill="white"/>
          <path d="M70 40C65 50 55 50 50 40C55 30 65 30 70 40Z" fill="white"/>
          <path d="M50 40C40 45 40 35 50 30C60 35 60 45 50 40Z" fill="white"/>
          <circle cx="60" cy="30" r="5" fill="#fce484"/>
        </svg>
      </div>
      <div className="pointer-events-none absolute left-[12%] top-[20%] z-0 rotate-[-15deg] font-serif text-2xl text-[#c3bbb1] opacity-60">
        ♪
      </div>
      <div className="pointer-events-none absolute right-[20%] top-[25%] z-0 rotate-[10deg] font-serif text-2xl text-[#d1c9bf] opacity-60">
        ♫
      </div>
      <div className="pointer-events-none absolute bottom-[30%] left-[18%] z-0 rotate-[15deg] font-serif text-xl text-[#c3bbb1] opacity-60">
        ♩
      </div>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {homeTab === 'pickup' && (
            <div
              id="home-panel-pickup"
              role="tabpanel"
              aria-labelledby="home-tab-pickup"
              className="mx-auto flex w-full min-w-0 max-w-4xl flex-col items-center pb-8 pt-16 sm:pt-20"
            >
              {/* Main Content Area — 拾音 */}
              <div className="flex w-full min-w-0 max-w-4xl flex-col items-center">
        
        {/* Title & Subtitle */}
        <div className="flex flex-col items-center mb-12">
          <h1 className="mb-3 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 text-center text-[#5c4a3d]">
            <span className="font-[family-name:var(--font-title-cn)] text-4xl font-medium md:text-5xl">回响</span>
            <span className="font-sans pb-0.5 text-2xl font-light text-[#c4bbb0] md:text-3xl">·</span>
            <span className="font-[family-name:var(--font-title-en)] text-4xl font-medium italic leading-none md:text-5xl">
              Echo
            </span>
          </h1>
          <p className="text-[#a1998f] tracking-[0.3em] font-light text-sm mt-1">
            遇 见 旋 律 的 灵 魂
          </p>
        </div>

        {/* Input Box */}
        <motion.div 
          className="relative w-full min-w-0 max-w-3xl px-6"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 rounded-full bg-white opacity-80 shadow-[0_10px_40px_rgba(0,0,0,0.02)]" />
          <div className="relative z-10">
            {url.trim().length === 0 && (
              <div
                className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-4 text-center sm:px-8"
                aria-hidden
              >
                <span className="font-[family-name:var(--font-noto-ui-sans)] text-xs font-light leading-none text-[#cecbc4] whitespace-nowrap sm:text-sm md:text-base">
                  选取你爱的歌曲，拆分出不同的乐器旋律
                </span>
              </div>
            )}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="选取你爱的歌曲，拆分出不同的乐器旋律"
              placeholder=""
              className={cn(
                'relative z-10 w-full min-h-16 py-2.5 md:min-h-20 md:py-3 bg-transparent rounded-full outline-none text-xs sm:text-sm md:text-base text-[#7a6f65] text-center transition-all font-light',
                'font-[family-name:var(--font-noto-ui-sans)]',
                'px-6',
                url.trim().length > 0 && 'pr-14 md:pr-16'
              )}
            />
            <AnimatePresence>
              {url.trim().length > 0 && (
                <motion.button
                  key="input-forward"
                  type="button"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  aria-label="下一步"
                  onClick={() => onNext()}
                  className={cn(
                    'absolute right-2 top-1/2 z-20 flex h-10 min-w-[2.75rem] -translate-y-1/2 items-center justify-center rounded-xl px-3',
                    'bg-[#5c4a3d]/12 text-[#5c4a3d] shadow-sm',
                    'transition-colors hover:bg-[#5c4a3d]/22 hover:text-[#4a3d32]',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5a5]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfaec]'
                  )}
                >
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="w-full max-w-3xl px-6 mt-7 z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4ccc0]" aria-hidden />
            <p className="text-center text-[11px] tracking-[0.25em] text-[#a89e92] font-light uppercase">示例音乐</p>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4ccc0]" aria-hidden />
          </div>
          <div className="flex flex-col gap-3">
            {SAMPLE_AUDIO_CASES.map((item, i) => {
              const dot = item.label.indexOf('·');
              const artist = dot === -1 ? item.label : item.label.slice(0, dot);
              const track = dot === -1 ? '' : item.label.slice(dot + 1);
              const style = SAMPLE_CARD_STYLES[i];
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => {
                    setUrl(songTitleArtistDash(item.label));
                    const base =
                      dot === -1
                        ? { title: item.label, artist: '', audioSrc: item.path }
                        : { title: track, artist, audioSrc: item.path };
                    setSelectedTrack({
                      ...base,
                      sampleId: item.id,
                      ...(item.stemAudio ? { stemAudio: item.stemAudio } : {}),
                      ...(item.scoreUrl ? { scoreUrl: item.scoreUrl } : {}),
                      ...(item.midiUrl ? { midiUrl: item.midiUrl } : {}),
                    });
                  }}
                  whileHover={{ scale: 1.015, y: -1 }}
                  whileTap={{ scale: 0.992 }}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-[1.35rem] border border-white/70',
                    'bg-gradient-to-br text-left',
                    style.shell,
                    style.glow,
                    'shadow-[0_8px_32px_rgba(60,50,40,0.06)]',
                    'transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(60,50,40,0.1)]',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4b5a5]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fcfaec]'
                  )}
                >
                  <span
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/25 blur-2xl transition-opacity group-hover:opacity-90"
                    aria-hidden
                  />
                  <span className="relative flex items-center gap-3.5 px-3.5 py-3 sm:px-4 sm:py-3.5">
                    <span
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner',
                        'text-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]',
                        style.icon
                      )}
                    >
                      <Music className="h-[18px] w-[18px] opacity-95" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1 font-[family-name:var(--font-noto-ui-sans)]">
                      {dot === -1 ? (
                        <span className="block truncate text-[15px] font-normal leading-snug text-[#4a3d32]">{item.label}</span>
                      ) : (
                        <>
                          <span className="block text-[11px] font-light tracking-wide text-[#8a7f72]">{artist}</span>
                          <span className="mt-0.5 block truncate text-[15px] font-normal leading-snug text-[#4a3d32]">
                            {track}
                          </span>
                        </>
                      )}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#c4b8ab] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#9a8b7a]" />
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
              </div>
            </div>
          )}
          {homeTab === 'soundscape' && (
            <div
              id="home-panel-soundscape"
              role="tabpanel"
              aria-labelledby="home-tab-soundscape"
              className="flex min-h-full flex-col px-4 py-10"
            >
              <div className="relative mx-auto min-h-[min(420px,calc(100dvh-260px))] w-full max-w-sm flex-1">
                <SoundscapeFloatingEntry
                  driftSeed={0}
                  squareImageSrc="/小马循环.gif"
                  title="Mutrix"
                  subtitle="音乐盲盒广场"
                  onClick={onGoToTapeDiary}
                />
                <SoundscapeFloatingEntry
                  driftSeed={1}
                  squareImageSrc="/小猫循环.gif"
                  title="Personal Destiny Notes"
                  subtitle="个人命运音符"
                  onClick={onGoToMusicCat}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <nav
        role="tablist"
        aria-label="首页分区"
        className="relative z-20 flex w-full shrink-0 items-stretch border-t border-[#e8dfcf]/80 bg-[#faf8f3]/90 backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <button
          type="button"
          role="tab"
          id="home-tab-pickup"
          aria-selected={homeTab === 'pickup'}
          aria-controls="home-panel-pickup"
          onClick={() => setHomeTab('pickup')}
          className={cn(
            'flex flex-1 items-center justify-center py-3.5 font-[family-name:var(--font-title-cn)] text-[15px] tracking-[0.25em] transition-colors',
            homeTab === 'pickup'
              ? 'font-medium text-[#5c4a3d] shadow-[inset_0_2px_0_0_#5c5346]'
              : 'text-[#a89e92] hover:text-[#7a6f65]'
          )}
        >
          拾音
        </button>
        <button
          type="button"
          role="tab"
          id="home-tab-soundscape"
          aria-selected={homeTab === 'soundscape'}
          aria-controls="home-panel-soundscape"
          onClick={() => setHomeTab('soundscape')}
          className={cn(
            'flex flex-1 items-center justify-center py-3.5 font-[family-name:var(--font-title-cn)] text-[15px] tracking-[0.25em] transition-colors',
            homeTab === 'soundscape'
              ? 'font-medium text-[#5c4a3d] shadow-[inset_0_2px_0_0_#5c5346]'
              : 'text-[#a89e92] hover:text-[#7a6f65]'
          )}
        >
          声境
        </button>
      </nav>
    </motion.div>
  );
}

// -------------------------------------------------------------
// Complete Page: "Music Blind Box" / Mountains & Stars
// -------------------------------------------------------------
function CompletePage({
  audioSrc,
  onTrimChange,
  onPublishToMusicPlaza,
  onReset,
}: {
  audioSrc: string;
  onTrimChange: (range: { startSec: number; endSec: number }) => void;
  onPublishToMusicPlaza: () => void;
  onReset: () => void;
}) {
  const logTrim = useCallback(
    (range: { startSec: number; endSec: number }) => {
      onTrimChange(range);
      if (import.meta.env.DEV) {
        console.debug('[CompletePage] trim range (sec)', range);
      }
    },
    [onTrimChange]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0914] text-white overflow-hidden"
    >
      {/* Mountain & Stars background */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-bottom opacity-40 mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0914] via-transparent to-[#0d0914] opacity-90" />
      
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="z-10 bg-white/5 backdrop-blur-xl p-10 md:p-14 rounded-3xl border border-white/10 flex flex-col items-center w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="mb-10 w-full border-b border-white/10 pb-10">
          <CompletePageAudioTrim audioSrc={audioSrc} onTrimChange={logTrim} />
        </div>

        <h2 className="w-full text-center text-xl sm:text-2xl md:text-3xl font-serif text-[#f4ecd8] mb-4 tracking-wide font-light whitespace-nowrap">
          你的乐章已完成
        </h2>
        <p className="text-[#a8a1b5] mb-12 text-center font-light tracking-wider">世界角落里，正有人等待与你和鸣</p>

        <div className="flex flex-col sm:flex-row gap-5 w-full">
          <button
            type="button"
            onClick={onPublishToMusicPlaza}
            className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] px-4 py-3 text-center font-medium tracking-wide text-[#3d3215] shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all hover:brightness-110 active:scale-95 sm:px-6 sm:py-4"
          >
            <span className="flex flex-col items-center leading-snug">
              <span>发布到</span>
              <span>音乐广场</span>
            </span>
          </button>
          <button
            type="button"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl border border-white/20 bg-black/30 px-4 py-3 text-center font-medium tracking-wide text-white transition-all hover:bg-white/10 sm:py-4 sm:px-6"
          >
            <span>发布到</span>
            <span>抖音</span>
          </button>
        </div>

        <button 
          onClick={onReset}
          className="mt-10 text-white/50 text-sm hover:text-white transition-colors tracking-widest uppercase"
        >
          返回首页
        </button>
      </motion.div>
    </motion.div>
  );
}


