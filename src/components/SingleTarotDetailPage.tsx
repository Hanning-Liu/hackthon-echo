import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, HeartCrack, Share2, Play, Pause } from 'lucide-react';
import type { TarotCard } from '../lib/tarotData';
import { AUDIO_TRACKS, getCardImageBasename } from '../lib/tarotData';
import TarotCardArtImage from './TarotCardArtImage';

/** Tarot txts use 【正位】/【逆位】 blocks; show only the block matching the draw. */
function formatAssetTextForOrientation(raw: string, isReversed: boolean): string {
  const uprightMarker = '【正位】';
  const reversedMarker = '【逆位】';
  const u = raw.indexOf(uprightMarker);
  const r = raw.indexOf(reversedMarker);
  if (u === -1 || r === -1 || r <= u) return raw.trim();

  const header = raw.slice(0, u).trim();
  const uprightBody = raw.slice(u + uprightMarker.length, r).trim();
  const reversedBody = raw.slice(r + reversedMarker.length).trim();

  if (isReversed) {
    return [header, reversedMarker, reversedBody].filter(Boolean).join('\n\n');
  }
  return [header, uprightMarker, uprightBody].filter(Boolean).join('\n\n');
}

function TarotAudioPlayer({ audioUrl }: { audioUrl: string }) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audioUrl);

    const onTimeUpdate = () => {
      if (!audioRef.current) return;
      const t = audioRef.current.currentTime;
      setTime(t);
      if (t >= 15) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };

    const onEnded = () => {
      setPlaying(false);
      setTime(0);
    };

    audioRef.current.addEventListener('timeupdate', onTimeUpdate);
    audioRef.current.addEventListener('ended', onEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current.removeEventListener('ended', onEnded);
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      if (time >= 15) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.play().catch((e) => console.log('Audio play failed:', e));
    }
    setPlaying(!playing);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatTime = (seconds: number) => `0:${pad(Math.floor(seconds))}`;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[20px] p-4 shadow-sm border border-white flex items-center gap-4 my-6">
      <button
        type="button"
        onClick={togglePlay}
        className="w-12 h-12 shrink-0 bg-gradient-to-tr from-[#8c8276] to-[#a1998f] text-white rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all"
      >
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
      </button>
      <div className="flex-1 w-full">
        <div className="flex justify-between text-[11px] text-[#8c8276] mb-1.5 font-sans font-medium tracking-wide">
          <span>{formatTime(time)}</span>
          <span>0:15</span>
        </div>
        <div className="w-full h-1.5 bg-[#e8dfcf] rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8c8276] to-[#a1998f]"
            style={{ width: `${Math.min((time / 15) * 100, 100)}%`, transition: 'width 0.1s linear' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SingleTarotDetailPage({
  keyword,
  card,
  isReversed,
  selectedIdx,
  interpretation,
  onHeart,
  onHeartCrack,
  onShare,
}: {
  keyword: string;
  card: TarotCard;
  isReversed: boolean;
  selectedIdx: number;
  interpretation: string;
  onHeart: () => void;
  onHeartCrack: () => void;
  onShare: () => void;
}) {
  const [assetText, setAssetText] = useState<string | null>(null);

  useEffect(() => {
    const basename = getCardImageBasename(card.id);
    const url = `/tarot%20cards/${encodeURIComponent(basename)}.txt`;
    let cancelled = false;
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        if (!cancelled) setAssetText(t.trim());
      })
      .catch(() => {
        if (!cancelled) setAssetText(null);
      });
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  const assetTextForOrientation = useMemo(() => {
    if (!assetText) return null;
    return formatAssetTextForOrientation(assetText, isReversed);
  }, [assetText, isReversed]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden pt-[calc(12%_+_2.75rem)]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col items-center overflow-hidden px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <p className="mb-2 max-w-[16rem] text-center font-serif text-[11px] font-medium leading-relaxed tracking-[0.12em] text-[#8c8276]">
          心系「{keyword}」
        </p>
        <motion.div
          layoutId={`single-card-${selectedIdx}`}
          className="relative mb-4 mt-2 h-[220px] w-[140px] shrink-0"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, type: 'spring', damping: 17 }}
            className="h-full w-full"
          >
            <TarotCardArtImage
              card={card}
              isReversed={isReversed}
              className="h-full w-full overflow-hidden rounded-md border-2 border-[#e8dfcf] bg-[#fdfbf6] shadow-sm"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="absolute -bottom-5 left-1/2 mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#e8dfcf] bg-[#fffaf2] px-2.5 py-0.5 font-serif text-[10px] font-medium tracking-widest text-[#8c8276] shadow-sm"
          >
            {isReversed ? '逆位' : '正位'}
          </motion.div>
        </motion.div>

        <div className="scrollbar-none mt-3 min-h-0 w-full flex-1 overflow-y-auto rounded-[24px] border border-white/80 bg-white/60 p-6 text-justify font-light text-[13px] leading-loose tracking-wide text-[#5c5346] shadow-[0_8px_30px_rgba(100,90,80,0.06)] backdrop-blur-md">
          <p className="mb-3 font-serif text-[11px] font-medium tracking-[0.18em] text-[#8c8276]">与你的「{keyword}」</p>
          {interpretation.split('\n\n').map((para, i) => (
            <p key={i} className="mb-4 last:mb-0">
              {para}
            </p>
          ))}
          {assetTextForOrientation && (
            <>
              <div className="my-5 h-px w-full bg-[#e8dfcf]/80" aria-hidden />
              <p className="mb-2 font-serif text-[11px] font-medium tracking-[0.18em] text-[#8c8276]">牌义参考</p>
              <p className="mb-3 text-left text-[12px] leading-relaxed text-[#6c6152]">
                以下为零基础牌义（{isReversed ? '逆位' : '正位'}），可结合上文关于「{keyword}」的启示阅读，并与你所念的「{keyword}」对照。
              </p>
              <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed text-[#6c6152]">
                {assetTextForOrientation}
              </pre>
            </>
          )}
        </div>

        <div className="w-full shrink-0">
          <TarotAudioPlayer audioUrl={AUDIO_TRACKS[card.audioCategory]} />
        </div>

        <div className="mt-4 flex shrink-0 justify-center gap-6 pb-2 opacity-90">
          <button
            type="button"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e8dfcf]/50 bg-white text-[#d6aa65] shadow-sm transition-all hover:scale-110 active:scale-95"
            onClick={onHeart}
          >
            <Heart fill="currentColor" size={24} />
          </button>
          <button
            type="button"
            aria-label="心碎并移除此牌"
            onClick={onHeartCrack}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e8dfcf]/50 bg-white text-[#a1998f] shadow-sm transition-all hover:scale-110 active:scale-95"
          >
            <HeartCrack size={24} />
          </button>
          <button
            type="button"
            aria-label="分享至音乐盲盒广场"
            onClick={onShare}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8c8276] text-white shadow-md transition-all hover:scale-110 active:scale-95"
          >
            <Share2 size={24} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
