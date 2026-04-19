import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

/**
 * 遍历 OSMD cursor，记录每步的乐谱绝对时间（CurrentEnrolledTimestamp），
 * 与 goToCursorStep 的 step 下标一一对应。
 */
export function buildCursorMusicalTimes(osmd: OpenSheetMusicDisplay): number[] {
  const c = osmd.cursor;
  const times: number[] = [];
  c.reset();
  while (!c.iterator.EndReached) {
    const v = c.iterator.CurrentEnrolledTimestamp.RealValue;
    times.push(Number.isFinite(v) ? v : 0);
    c.next();
  }
  c.reset();
  return times;
}

/**
 * 将 MIDI 时间（秒）按全曲时长比例映射到乐谱时间轴，再二分得到 cursor 步。
 * 与「音频整段线性对应 MIDI 时长」一致。
 * 若无法映射则返回 null，由调用方回退到 note 序号比例法。
 */
export function midiTimeToCursorStepFromMusicalTimes(
  midiT: number,
  midiDurationSec: number,
  musicalTimes: number[]
): number | null {
  if (musicalTimes.length === 0) return null;
  if (musicalTimes.length === 1) return 0;

  const t0 = musicalTimes[0];
  const tLast = musicalTimes[musicalTimes.length - 1];
  const span = tLast - t0;
  if (!Number.isFinite(span) || span <= 0) return null;

  const md = midiDurationSec > 0 ? midiDurationSec : 1;
  const p = Math.min(1, Math.max(0, midiT / md));
  const targetMusical = t0 + p * span;

  let lo = 0;
  let hi = musicalTimes.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (musicalTimes[mid] <= targetMusical) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(0, Math.min(musicalTimes.length - 1, hi));
}
