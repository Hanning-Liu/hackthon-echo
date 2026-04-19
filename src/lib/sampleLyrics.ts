import type { SampleId } from '../types';
import lyrics02 from './lyrics/test-02.txt?raw';
import lyrics03 from './lyrics/test-03.txt?raw';
import lyrics04 from './lyrics/test-04.txt?raw';

const PLACEHOLDER =
  '这一段练习还没有绑定示例歌词。\n从首页选择示例曲目后完成练习，即可在音乐广场看到完整歌词。';

const BY_SAMPLE: Record<SampleId, string> = {
  'test-02': lyrics02.trim(),
  'test-03': lyrics03.trim(),
  'test-04': lyrics04.trim(),
};

export function getLyricsForSampleId(sampleId: SampleId | undefined): string {
  if (!sampleId) return PLACEHOLDER;
  return BY_SAMPLE[sampleId] ?? PLACEHOLDER;
}

export function firstLyricLine(lyrics: string): string {
  const line = lyrics.split(/\r?\n/).find((l) => l.trim().length > 0);
  return line?.trim() ?? '…';
}
