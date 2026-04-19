import { useEffect, useState } from 'react';
import { getCachedWaveformPeaks } from './waveformPeaks';

export type WaveformPeaksState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; peaks: number[] }
  | { status: 'error' };

export function useWaveformPeaks(audioSrc: string | null): WaveformPeaksState {
  const [state, setState] = useState<WaveformPeaksState>({ status: 'idle' });

  useEffect(() => {
    if (!audioSrc) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    getCachedWaveformPeaks(audioSrc, 512)
      .then((peaks) => {
        if (!cancelled) setState({ status: 'ready', peaks });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [audioSrc]);

  return state;
}
