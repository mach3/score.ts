export const BEAT_PATTERNS = [
  "kick-2",
  "kick-4",
  "kick-8",
  "triple",
  "rock",
  "pop",
  "offbeat",
  "shuffle",
  "16beat",
] as const;

export type BeatPattern = (typeof BEAT_PATTERNS)[number];

interface BeatDefinition {
  kick: number[];
  hat: number[];
}

const BEATS_MAP: Record<BeatPattern, BeatDefinition> = {
  "kick-2": { kick: [0, 8], hat: [] },
  "kick-4": { kick: [0, 4, 8, 12], hat: [] },
  "kick-8": { kick: [0, 2, 4, 6, 8, 10, 12, 14], hat: [] },
  triple: { kick: [0, 6, 12], hat: [] },
  rock: { kick: [0, 8], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  pop: { kick: [0, 4, 8, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] },
  offbeat: { kick: [0, 8], hat: [2, 6, 10, 14] },
  shuffle: { kick: [0, 8], hat: [0, 3, 6, 9, 12, 15] },
  "16beat": {
    kick: [0, 4, 8, 12],
    hat: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
};

/**
 * ビートパターン名からビート定義を取得する
 * @throws ビートパターンが見つからない場合
 */
export function getBeatDefinition(pattern: string): BeatDefinition {
  const entry = BEATS_MAP[pattern as BeatPattern];
  if (!entry) {
    throw new Error(`Beat pattern "${pattern}" not found`);
  }
  return entry;
}
