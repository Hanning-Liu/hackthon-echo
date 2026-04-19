export type Instrument = 'piano' | 'guitar' | 'bass' | 'drums' | 'other' | 'vocals';

/** 首页示例卡片 id，用于绑定 stems / 乐谱 / MIDI */
export type SampleId = 'test-02' | 'test-03' | 'test-04';

export type SelectedTrack = {
  title: string;
  artist: string;
  /** 全曲或默认预览音频（混音 mp3 等） */
  audioSrc?: string;
  sampleId?: SampleId;
  /** 分轨：乐器 -> URL（如钢琴 WAV） */
  stemAudio?: Partial<Record<Instrument, string>>;
  /** MusicXML，供 OSMD 渲染 */
  scoreUrl?: string;
  /** 与 score 对应的 MIDI，用于时间轴 */
  midiUrl?: string;
};