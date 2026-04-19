import type { SelectedTrack } from '../types';
import type { TapeReview, TapePlaybackTrim } from './tapeData';
import { firstLyricLine, getLyricsForSampleId } from './sampleLyrics';

export function buildPracticePlazaTape(opts: {
  selectedTrack: SelectedTrack | null;
  audioSrc: string;
  trimRange: { startSec: number; endSec: number } | null;
}): TapeReview {
  const { selectedTrack, audioSrc, trimRange } = opts;
  const lyrics = getLyricsForSampleId(selectedTrack?.sampleId);
  const snippet = firstLyricLine(lyrics);

  const title =
    selectedTrack?.artist && selectedTrack.title
      ? `${selectedTrack.artist} · ${selectedTrack.title}`
      : selectedTrack?.title
        ? `${selectedTrack.title} · 练习乐章`
        : '我的练习乐章';

  const movie =
    selectedTrack?.title && selectedTrack.title.length > 0
      ? selectedTrack.title
      : '原创练习';

  let playbackTrim: TapePlaybackTrim | undefined;
  if (
    trimRange &&
    Number.isFinite(trimRange.startSec) &&
    Number.isFinite(trimRange.endSec) &&
    trimRange.endSec - trimRange.startSec >= 0.45
  ) {
    playbackTrim = { startSec: trimRange.startSec, endSec: trimRange.endSec };
  }

  return {
    id: `practice_plaza_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title,
    movie,
    snippet,
    content: lyrics,
    colorTheme: 'from-[#E8D5B7] to-[#F5ECD7]',
    tapeStyle: 'style1',
    audioUrl: audioSrc,
    playbackTrim,
  };
}
