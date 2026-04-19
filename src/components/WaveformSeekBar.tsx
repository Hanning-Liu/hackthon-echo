import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

export type WaveformSeekBarProps = {
  peaks: number[] | null;
  /** 0–1，播放进度；拖动时用 scrub 预览值 */
  progress: number;
  onSeek: (ratio: number) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function ratioFromPointer(clientX: number, rect: DOMRect): number {
  const w = rect.width;
  if (w <= 0) return 0;
  return clamp01((clientX - rect.left) / w);
}

export function WaveformSeekBar({
  peaks,
  progress,
  onSeek,
  disabled = false,
  loading = false,
  className,
}: WaveformSeekBarProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrubbingRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w < 2 || h < 2) return;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const padX = 2;
    const padY = 4;
    const innerW = w - padX * 2;
    const innerH = h - padY * 2;
    const cx = padX;
    const cy = padY + innerH / 2;
    const p = clamp01(progress);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#e4dfd0';
    ctx.fillRect(0, 0, w, h);

    if (loading) {
      ctx.fillStyle = 'rgba(143, 164, 146, 0.22)';
      ctx.fillRect(padX, padY, innerW * 0.35, innerH);
      return;
    }

    const barCount = peaks?.length ?? Math.min(120, Math.floor(innerW / 2));
    const playedW = innerW * p;

    if (peaks && peaks.length > 0) {
      const n = peaks.length;
      const step = innerW / n;
      for (let i = 0; i < n; i++) {
        const x0 = cx + i * step;
        const amp = peaks[i] * (innerH * 0.48);
        const isPlayed = (i + 0.5) * step <= playedW;
        ctx.fillStyle = isPlayed ? '#8fa492' : '#c4bdb2';
        ctx.globalAlpha = isPlayed ? 0.95 : 0.55;
        const bw = Math.max(1, step * 0.72);
        ctx.fillRect(x0, cy - amp, bw, amp * 2);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#c4bdb2';
      ctx.fillRect(cx, cy - 2, innerW, 4);
      ctx.fillStyle = '#8fa492';
      ctx.fillRect(cx, cy - 2, playedW, 4);
    }

    const playX = cx + playedW;
    ctx.fillStyle = 'rgba(61, 74, 62, 0.55)';
    ctx.fillRect(playX - 0.5, padY, 1.5, innerH);
  }, [peaks, progress, loading]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [draw]);

  const applySeek = useCallback(
    (clientX: number) => {
      const el = wrapRef.current;
      if (!el || disabled) return;
      const r = el.getBoundingClientRect();
      onSeek(ratioFromPointer(clientX, r));
    },
    [disabled, onSeek]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    scrubbingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    applySeek(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!scrubbingRef.current || disabled) return;
    applySeek(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    scrubbingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const ariaValueNow = Math.round(clamp01(progress) * 100);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSeek(clamp01(progress - 0.02));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSeek(clamp01(progress + 0.02));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSeek(1);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={cn(
        'relative h-9 max-h-9 w-full shrink-0 touch-none select-none rounded-md outline-none sm:h-10 sm:max-h-10',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className
      )}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ariaValueNow}
      aria-label="播放进度"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden />
    </div>
  );
}
