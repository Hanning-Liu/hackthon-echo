import type { Instrument, SelectedTrack } from '../types';

/** 无示例链接时用于演示的默认音频（与首页示例一致） */
export const DEFAULT_PRACTICE_AUDIO = '/samples/test-02.mp3';

export function resolvePracticeAudioSrc(track: SelectedTrack | null, inst: Instrument): string {
  if (!track) return DEFAULT_PRACTICE_AUDIO;
  const stem = track.stemAudio?.[inst];
  if (stem) return stem;
  return track.audioSrc ?? DEFAULT_PRACTICE_AUDIO;
}
