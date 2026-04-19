import { Midi } from '@tonejs/midi';

export type MidiTimeline = {
  /** 单调递增的 note-on 时间（秒），已合并多轨 */
  noteOnTimesSec: number[];
  /** @tonejs/midi 解析的时长（秒） */
  midiDurationSec: number;
};

const midiTimelinePromises = new Map<string, Promise<MidiTimeline>>();

async function loadMidiTimelineFromNetwork(midiUrl: string): Promise<MidiTimeline> {
  const res = await fetch(midiUrl);
  if (!res.ok) {
    throw new Error(`Failed to load MIDI: ${midiUrl} (${res.status})`);
  }
  const buf = await res.arrayBuffer();
  const midi = new Midi(buf);
  const times: number[] = [];
  for (const track of midi.tracks) {
    for (const note of track.notes) {
      times.push(note.time);
    }
  }
  times.sort((a, b) => a - b);
  const midiDurationSec =
    Number.isFinite(midi.duration) && midi.duration > 0
      ? midi.duration
      : times.length > 0
        ? times[times.length - 1] + 1e-3
        : 1;
  return { noteOnTimesSec: times, midiDurationSec };
}

/**
 * 拉取 MIDI 并提取所有音符 onset 时间（秒），按时间排序。
 * 同一 URL 复用 Promise，避免 PracticePage 与 ScoreViewer 重复请求。
 */
export function loadMidiTimeline(midiUrl: string): Promise<MidiTimeline> {
  let p = midiTimelinePromises.get(midiUrl);
  if (!p) {
    p = loadMidiTimelineFromNetwork(midiUrl).catch((err) => {
      midiTimelinePromises.delete(midiUrl);
      throw err;
    });
    midiTimelinePromises.set(midiUrl, p);
  }
  return p;
}

/**
 * 将音频当前时间映射到 MIDI 时间轴：整首音频 [0, audioDuration] 线性对应 MIDI [0, midiDuration]。
 */
export function audioTimeToMidiTime(
  audioCurrentTimeSec: number,
  audioDurationSec: number,
  midiDurationSec: number
): number {
  if (audioDurationSec <= 0 || midiDurationSec <= 0) return 0;
  const p = Math.min(1, Math.max(0, audioCurrentTimeSec / audioDurationSec));
  return p * midiDurationSec;
}

/** 找到满足 times[i] <= t 的最大 i */
export function indexForTime(times: number[], t: number): number {
  if (times.length === 0) return 0;
  let lo = 0;
  let hi = times.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= t) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(0, hi);
}

/**
 * MIDI note 索引映射到 OSMD 游标步（当两者数量不一致时按进度比例插值）。
 */
export function midiNoteIndexToCursorStep(
  noteIndex: number,
  midiNoteCount: number,
  cursorSteps: number
): number {
  if (cursorSteps <= 1) return 0;
  if (midiNoteCount <= 1) return Math.min(cursorSteps - 1, Math.max(0, noteIndex));
  const p = noteIndex / (midiNoteCount - 1);
  return Math.min(cursorSteps - 1, Math.max(0, Math.round(p * (cursorSteps - 1))));
}
