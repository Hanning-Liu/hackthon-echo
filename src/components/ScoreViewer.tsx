import React, { useCallback, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { cn } from '../lib/utils';
import {
  audioTimeToMidiTime,
  indexForTime,
  loadMidiTimeline,
  midiNoteIndexToCursorStep,
  type MidiTimeline,
} from '../lib/midiTimeline';
import {
  buildCursorMusicalTimes,
  midiTimeToCursorStepFromMusicalTimes,
} from '../lib/osmdCursorTimeline';

/** 每行（系统）排 4 个小节 */
const MEASURES_PER_SYSTEM = 4;
/** 整体缩小，便于在手机宽度内浏览 */
const SCORE_ZOOM = 0.72;
/** 首屏先渲染的小节数上限（约 8 行 × 4 小节） */
const INITIAL_DRAW_UP_TO_MEASURE = 32;
/** 全曲渲染时 drawUpTo 使用足够大的值（OSMD 按小节号裁剪） */
const FULL_SCORE_DRAW_UP_TO = 999_999;

function applyLayoutRules(osmd: OpenSheetMusicDisplay) {
  osmd.EngravingRules.RenderXMeasuresPerLineAkaSystem = MEASURES_PER_SYSTEM;
  /** 每行多小节时跨小节连线一般可正常排版；若见错位可改回 false */
  osmd.EngravingRules.RenderSlurs = true;
  osmd.zoom = SCORE_ZOOM;
}

function scheduleWhenIdle(fn: () => void, timeoutMs: number) {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(fn, { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const t = window.setTimeout(fn, 1);
  return () => clearTimeout(t);
}

/** 音频尚未出 duration 时用 MIDI 时长参与映射，与展示总时长一致 */
function effectiveAudioDurationSec(
  audioEl: HTMLAudioElement | null,
  timeline: MidiTimeline
): number {
  if (audioEl && Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
    return audioEl.duration;
  }
  if (timeline.midiDurationSec > 0) return timeline.midiDurationSec;
  return 1;
}

function computeCursorStepForAudioTime(
  audioEl: HTMLAudioElement | null,
  timeline: MidiTimeline,
  syncOffsetSec: number,
  musicalTimes: number[],
  cursorSteps: number
): number {
  const audioDur = effectiveAudioDurationSec(audioEl, timeline);
  const tAudio = Math.max(0, (audioEl?.currentTime ?? 0) + syncOffsetSec);
  const midiT = audioTimeToMidiTime(tAudio, audioDur, timeline.midiDurationSec);
  const fromMusical = midiTimeToCursorStepFromMusicalTimes(
    midiT,
    timeline.midiDurationSec,
    musicalTimes
  );
  if (fromMusical !== null) return fromMusical;
  return midiNoteIndexToCursorStep(
    indexForTime(timeline.noteOnTimesSec, midiT),
    timeline.noteOnTimesSec.length,
    cursorSteps
  );
}

export type ScoreViewerProps = {
  scoreUrl: string;
  midiUrl: string;
  /** 与乐谱同步的音频（直接读 currentTime / duration，避免父组件每帧 setState） */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** 音频时间加该偏移后再映射到 MIDI（可对齐 WAV 前静音） */
  syncOffsetSec?: number;
  /** 是否在 idle 时暂停 rAF 同步（仍显示静态谱） */
  followPlayback: boolean;
  className?: string;
};

function countCursorSteps(osmd: OpenSheetMusicDisplay): number {
  const c = osmd.cursor;
  c.reset();
  let n = 0;
  while (!c.iterator.EndReached) {
    c.next();
    n++;
  }
  c.reset();
  return Math.max(1, n);
}

function goToCursorStep(osmd: OpenSheetMusicDisplay, step: number, prevStep: number): void {
  const c = osmd.cursor;
  const max = Math.max(0, step);
  if (max === 0) {
    c.reset();
    c.update();
    return;
  }
  if (max === prevStep + 1) {
    c.next();
    c.update();
    return;
  }
  c.reset();
  for (let i = 0; i < max; i++) {
    c.next();
  }
  c.update();
}

export function ScoreViewer({
  scoreUrl,
  midiUrl,
  audioRef,
  syncOffsetSec = 0,
  followPlayback,
  className,
}: ScoreViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const midiRef = useRef<MidiTimeline | null>(null);
  const cursorStepsRef = useRef(1);
  /** 与 cursor 步对齐的乐谱时间戳，用于 MIDI 时间轴映射 */
  const cursorMusicalTimesRef = useRef<number[]>([]);
  const lastStepRef = useRef(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const disposeOsmd = useCallback(() => {
    const osmd = osmdRef.current;
    if (osmd) {
      try {
        osmd.clear();
      } catch {
        /* ignore */
      }
      osmdRef.current = null;
    }
    if (hostRef.current) {
      hostRef.current.innerHTML = '';
    }
    setReady(false);
    lastStepRef.current = 0;
    cursorMusicalTimesRef.current = [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cancelIdle: (() => void) | undefined;
    let resizeObserver: ResizeObserver | null = null;
    const host = hostRef.current;
    const scrollEl = scrollRef.current;
    if (!host || !scrollEl) return undefined;

    disposeOsmd();
    setLoadError(null);

    const pageHeight = 10000;

    const layoutWidth = () => {
      const w = scrollEl.clientWidth;
      return Math.max(120, Math.floor(w - 8));
    };

    const applyPageToOsmd = (osmd: OpenSheetMusicDisplay) => {
      osmd.setCustomPageFormat(layoutWidth(), pageHeight);
    };

    (async () => {
      try {
        const [xmlText, timeline] = await Promise.all([
          fetch(scoreUrl).then((r) => {
            if (!r.ok) throw new Error(`乐谱请求失败 ${r.status}`);
            return r.text();
          }),
          loadMidiTimeline(midiUrl),
        ]);
        if (cancelled) return;
        midiRef.current = timeline;

        const osmd = new OpenSheetMusicDisplay(host, {
          autoResize: true,
          backend: 'svg',
          drawingParameters: 'default',
          followCursor: true,
          disableCursor: false,
          pageFormat: `${layoutWidth()}x${pageHeight}`,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMetronomeMarks: false,
          drawMeasureNumbersOnlyAtSystemStart: true,
          drawSlurs: false,
        });

        await osmd.load(xmlText);
        if (cancelled) return;

        osmdRef.current = osmd;

        /** setOptions 会写回 EngravingRules，须在之后重新应用每行小节数与 zoom */
        osmd.setOptions({
          stretchLastSystemLine: false,
          drawSlurs: false,
          drawUpToMeasureNumber: INITIAL_DRAW_UP_TO_MEASURE,
        });
        applyLayoutRules(osmd);
        applyPageToOsmd(osmd);
        osmd.render();
        osmd.cursor.show();
        cursorStepsRef.current = countCursorSteps(osmd);
        cursorMusicalTimesRef.current = buildCursorMusicalTimes(osmd);
        lastStepRef.current = 0;
        setReady(true);

        resizeObserver = new ResizeObserver(() => {
          const inst = osmdRef.current;
          if (!inst || cancelled) return;
          applyLayoutRules(inst);
          applyPageToOsmd(inst);
          inst.render();
          inst.cursor.show();
          cursorStepsRef.current = countCursorSteps(inst);
          cursorMusicalTimesRef.current = buildCursorMusicalTimes(inst);
        });
        resizeObserver.observe(scrollEl);

        const finishFullScore = () => {
          if (cancelled) return;
          requestAnimationFrame(() => {
            if (cancelled) return;
            const o = osmdRef.current;
            if (!o) return;
            o.setOptions({
              stretchLastSystemLine: false,
              drawSlurs: false,
              drawUpToMeasureNumber: FULL_SCORE_DRAW_UP_TO,
            });
            applyLayoutRules(o);
            applyPageToOsmd(o);
            o.render();
            o.cursor.show();
            cursorStepsRef.current = countCursorSteps(o);
            cursorMusicalTimesRef.current = buildCursorMusicalTimes(o);
            const tl = midiRef.current;
            if (tl) {
              const step = computeCursorStepForAudioTime(
                audioRef.current,
                tl,
                syncOffsetSec,
                cursorMusicalTimesRef.current,
                cursorStepsRef.current
              );
              const prev = lastStepRef.current;
              goToCursorStep(o, step, prev);
              lastStepRef.current = step;
            }
          });
        };

        cancelIdle = scheduleWhenIdle(finishFullScore, 400);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelIdle?.();
      resizeObserver?.disconnect();
      disposeOsmd();
    };
  }, [scoreUrl, midiUrl, disposeOsmd, audioRef, syncOffsetSec]);

  useEffect(() => {
    if (!ready || !followPlayback) return;
    const osmd = osmdRef.current;
    const timeline = midiRef.current;
    if (!osmd || !timeline) return;

    let raf = 0;
    const tick = () => {
      const el = audioRef.current;
      const audioDur = effectiveAudioDurationSec(el, timeline);
      const tAudio = Math.max(0, (el?.currentTime ?? 0) + syncOffsetSec);
      const midiT = audioTimeToMidiTime(tAudio, audioDur, timeline.midiDurationSec);
      const fromMusical = midiTimeToCursorStepFromMusicalTimes(
        midiT,
        timeline.midiDurationSec,
        cursorMusicalTimesRef.current
      );
      const step =
        fromMusical !== null
          ? fromMusical
          : midiNoteIndexToCursorStep(
              indexForTime(timeline.noteOnTimesSec, midiT),
              timeline.noteOnTimesSec.length,
              cursorStepsRef.current
            );
      const prev = lastStepRef.current;
      if (step !== prev) {
        goToCursorStep(osmd, step, prev);
        lastStepRef.current = step;
        const cur = osmd.cursor.cursorElement;
        const wrap = scrollRef.current;
        if (cur && wrap) {
          const er = cur.getBoundingClientRect();
          const wr = wrap.getBoundingClientRect();
          const pad = 48;
          if (er.top < wr.top + pad || er.bottom > wr.bottom - pad) {
            const delta = er.top - wr.top - (wr.height / 2 - er.height / 2);
            wrap.scrollTop += delta;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, followPlayback, syncOffsetSec, audioRef]);

  return (
    <div className={cn('flex min-h-0 h-full flex-1 flex-col', className)}>
      {loadError !== null && (
        <p className="shrink-0 text-center text-xs text-red-700/90 px-2 py-2">乐谱加载失败：{loadError}</p>
      )}
      <div
        ref={scrollRef}
        className={cn(
          'score-scroll min-h-0 flex-1 w-full h-full overflow-y-auto overflow-x-hidden',
          'rounded-[2.5rem] border border-[#e4dfd0]/90 bg-white/85 shadow-inner'
        )}
      >
        <div
          ref={hostRef}
          className="osmd-host min-h-[200px] w-full min-w-0 max-w-full p-0 [&_svg]:max-w-full [&_svg]:h-auto"
        />
      </div>
    </div>
  );
}
