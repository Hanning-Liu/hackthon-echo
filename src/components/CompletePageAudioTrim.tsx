import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '../lib/utils';

const MIN_TRIM_GAP_SEC = 0.45;

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export type CompletePageAudioTrimProps = {
  audioSrc: string;
  className?: string;
  /** 裁剪区间变化（秒），便于发布按钮后续使用 */
  onTrimChange?: (range: { startSec: number; endSec: number }) => void;
};

export function CompletePageAudioTrim({ audioSrc, className, onTrimChange }: CompletePageAudioTrimProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const trimRef = useRef({ start: 0, end: 0 });
  const durationRef = useRef(0);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    trimRef.current = { start: trimStart, end: trimEnd };
  }, [trimStart, trimEnd]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const onTrimChangeRef = useRef(onTrimChange);
  onTrimChangeRef.current = onTrimChange;
  useEffect(() => {
    onTrimChangeRef.current?.({ startSec: trimStart, endSec: trimEnd });
  }, [trimStart, trimEnd]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onMeta = () => {
      const dur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
      setDuration(dur);
      durationRef.current = dur;
      if (dur > 0) {
        setTrimStart(0);
        setTrimEnd(dur);
      }
    };
    const onTime = () => {
      const el = audioRef.current;
      if (!el) return;
      let t = el.currentTime;
      const ts = trimRef.current.start;
      const te = trimRef.current.end;
      if (t >= te - 0.02) {
        el.pause();
        t = te;
        el.currentTime = te;
        setIsPlaying(false);
      }
      setCurrentTime(t);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    onMeta();
    return () => {
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
    };
  }, [audioSrc]);

  const clientXToTime = useCallback((clientX: number) => {
    const track = trackRef.current;
    const dur = durationRef.current;
    if (!track || dur <= 0) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * dur;
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const t = clientXToTime(e.clientX);
      const dur = durationRef.current;
      const { start, end } = trimRef.current;
      if (dur <= 0) return;
      if (dragging === 'start') {
        const next = Math.min(Math.max(0, t), end - MIN_TRIM_GAP_SEC);
        setTrimStart(next);
      } else {
        const next = Math.max(Math.min(dur, t), start + MIN_TRIM_GAP_SEC);
        setTrimEnd(next);
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, clientXToTime]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || durationRef.current <= 0) return;
    const ts = trimRef.current.start;
    const te = trimRef.current.end;
    if (el.paused) {
      let t = el.currentTime;
      if (t < ts || t >= te - 0.05) {
        el.currentTime = ts;
        t = ts;
      }
      void el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, []);

  const onTrackPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-trim-handle]')) return;
    const el = audioRef.current;
    const dur = durationRef.current;
    if (!el || dur <= 0) return;
    const t = clientXToTime(e.clientX);
    const ts = trimRef.current.start;
    const te = trimRef.current.end;
    const clamped = Math.min(Math.max(t, ts), Math.max(ts, te - 0.01));
    el.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const pct = (t: number) => (duration > 0 ? (t / duration) * 100 : 0);
  const ready = duration > 0;

  return (
    <div className={cn('w-full', className)}>
      <audio
        key={audioSrc}
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={isPlaying ? '暂停' : '播放'}
          disabled={!ready}
          onClick={togglePlay}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors',
            ready ? 'hover:bg-white/20' : 'cursor-not-allowed opacity-40'
          )}
        >
          {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
        </button>
        <div className="min-w-0 flex-1">
          <div
            ref={trackRef}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={ready ? pct(currentTime) : 0}
            aria-label="播放进度与裁剪范围"
            className={cn(
              'relative h-10 cursor-pointer rounded-lg bg-white/10',
              !ready && 'cursor-not-allowed opacity-50'
            )}
            onPointerDown={ready ? onTrackPointerDown : undefined}
          >
            {ready && (
              <>
                <div
                  className="absolute inset-y-0 rounded-lg bg-[#d4af37]/35"
                  style={{
                    left: `${pct(trimStart)}%`,
                    width: `${pct(trimEnd - trimStart)}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                  style={{ left: `${pct(currentTime)}%` }}
                />
                <button
                  type="button"
                  data-trim-handle
                  aria-label="裁剪起点"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDragging('start');
                  }}
                  className="absolute top-1/2 z-10 h-7 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/80 bg-[#f3e5ab] shadow-md cursor-grab active:cursor-grabbing"
                  style={{ left: `${pct(trimStart)}%` }}
                />
                <button
                  type="button"
                  data-trim-handle
                  aria-label="裁剪终点"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setDragging('end');
                  }}
                  className="absolute top-1/2 z-10 h-7 w-3 -translate-x-1/2 -translate-y-1/2 rounded-sm border border-white/80 bg-[#f3e5ab] shadow-md cursor-grab active:cursor-grabbing"
                  style={{ left: `${pct(trimEnd)}%` }}
                />
              </>
            )}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[10px] tabular-nums text-white/50">
            <span>{formatTime(ready ? currentTime : 0)}</span>
            <span>
              {ready
                ? `${formatTime(trimStart)} – ${formatTime(trimEnd)}`
                : '加载中…'}
            </span>
            <span>{formatTime(ready ? duration : 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
