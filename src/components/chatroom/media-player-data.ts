export const formatMediaDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const rounded = Math.floor(seconds);
  const minutes = Math.floor(rounded / 60);
  return `${minutes}:${String(rounded % 60).padStart(2, "0")}`;
};

export interface WaveformBar {
  id: string;
  height: number;
}

export const waveformBars = (seed: string, count = 36): WaveformBar[] => {
  let state = 2_166_136_261;

  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16_777_619);
  }

  return Array.from({ length: count }, (_, index) => {
    state = Math.imul(state ^ (index + 1), 1_664_525) + 1_013_904_223;
    const wave = Math.abs(Math.sin((index + 1) * 0.72)) * 28;
    return {
      id: `${seed}-${index + 1}`,
      height: 24 + (state >>> 24) * 0.2 + wave,
    };
  });
};
