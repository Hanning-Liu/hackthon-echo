/** 模块级缓存，避免同一 URL 重复解码 */
const peaksCache = new Map<string, Promise<number[]>>();

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const n = audioBuffer.length;
  const ch = audioBuffer.numberOfChannels;
  if (ch === 1) return audioBuffer.getChannelData(0);
  const out = new Float32Array(n);
  const scale = 1 / ch;
  for (let c = 0; c < ch; c++) {
    const data = audioBuffer.getChannelData(c);
    for (let i = 0; i < n; i++) out[i] += data[i] * scale;
  }
  return out;
}

function computePeaksFromMono(mono: Float32Array, bucketCount: number): number[] {
  const len = mono.length;
  if (len === 0 || bucketCount <= 0) return [];
  const samplesPerBucket = Math.max(1, Math.floor(len / bucketCount));
  const peaks: number[] = [];
  for (let b = 0; b < bucketCount; b++) {
    const start = b * samplesPerBucket;
    const end = Math.min(start + samplesPerBucket, len);
    let max = 0;
    for (let i = start; i < end; i++) {
      const v = Math.abs(mono[i]);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  const maxPeak = Math.max(...peaks, 1e-8);
  return peaks.map((p) => p / maxPeak);
}

export type DecodePeaksResult = { ok: true; peaks: number[] } | { ok: false; error: unknown };

/**
 * 拉取并解码音频，生成归一化峰值（0–1），桶数约 512。
 */
export async function decodeAudioSrcToPeaks(
  src: string,
  bucketCount = 512
): Promise<DecodePeaksResult> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const audioBuffer = await ctx.decodeAudioData(buf.slice(0));
    const mono = mixToMono(audioBuffer);
    const peaks = computePeaksFromMono(mono, bucketCount);
    return { ok: true, peaks };
  } catch (e) {
    return { ok: false, error: e };
  } finally {
    await ctx.close();
  }
}

export function getCachedWaveformPeaks(src: string, bucketCount = 512): Promise<number[]> {
  const key = `${src}@${bucketCount}`;
  let p = peaksCache.get(key);
  if (!p) {
    p = decodeAudioSrcToPeaks(src, bucketCount).then((r) => {
      if (r.ok) return r.peaks;
      throw r.error;
    });
    peaksCache.set(key, p);
  }
  return p;
}

export function clearWaveformPeaksCacheEntry(src: string, bucketCount = 512): void {
  peaksCache.delete(`${src}@${bucketCount}`);
}
