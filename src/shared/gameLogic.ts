import type { LeaderboardEntry, PlayerPublic, RoomSettings, WordMode } from './types.ts';
import { getWordsForCategory, WORD_CATEGORIES } from './words.ts';

export const AVATAR_PALETTE = [
  '#2563EB', // Cobalt
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Crimson
  '#7C3AED', // Violet
  '#0891B2', // Teal
  '#BE185D', // Berry
  '#4F46E5', // Indigo
];

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 80,
  wordCount: 3,
  hints: 2,
  wordMode: 'normal',
  isPrivate: false,
  category: 'All',
  customWords: [],
};

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function sanitizeRoomSettings(input?: Partial<RoomSettings>): RoomSettings {
  const validCategory =
    input?.category && WORD_CATEGORIES.includes(input.category)
      ? input.category
      : DEFAULT_ROOM_SETTINGS.category;

  const validMode: WordMode =
    input?.wordMode === 'hidden' || input?.wordMode === 'combination' || input?.wordMode === 'normal'
      ? input.wordMode
      : DEFAULT_ROOM_SETTINGS.wordMode;

  const customWords = Array.isArray(input?.customWords)
    ? Array.from(
        new Set(
          input.customWords
            .map((w) => String(w).trim().toLowerCase())
            .filter((w) => w.length >= 2 && w.length <= 32)
        )
      ).slice(0, 100)
    : [];

  return {
    maxPlayers: clamp(input?.maxPlayers ?? DEFAULT_ROOM_SETTINGS.maxPlayers, 2, 20),
    rounds: clamp(input?.rounds ?? DEFAULT_ROOM_SETTINGS.rounds, 2, 10),
    drawTime: clamp(input?.drawTime ?? DEFAULT_ROOM_SETTINGS.drawTime, 15, 240),
    wordCount: clamp(input?.wordCount ?? DEFAULT_ROOM_SETTINGS.wordCount, 1, 5),
    hints: clamp(input?.hints ?? DEFAULT_ROOM_SETTINGS.hints, 0, 5),
    wordMode: validMode,
    isPrivate: Boolean(input?.isPrivate ?? DEFAULT_ROOM_SETTINGS.isPrivate),
    category: validCategory,
    customWords,
  };
}

export function normalizeGuess(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = i - 1;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev;
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  return dp[n];
}

export type GuessEvaluation = 'exact' | 'close' | 'miss';

export function evaluateGuess(rawGuess: string, rawTarget: string): GuessEvaluation {
  const guess = normalizeGuess(rawGuess);
  const target = normalizeGuess(rawTarget);

  if (!guess || !target) return 'miss';
  if (guess === target) return 'exact';

  // Allow slight typo tolerance for "close" notification without giving away very short words
  const distance = levenshteinDistance(guess, target);
  if (target.length >= 4 && distance <= (target.length >= 8 ? 2 : 1)) {
    return 'close';
  }
  return 'miss';
}

export function buildWordMask(
  word: string,
  revealedIndices: Set<number>,
  mode: WordMode
): string {
  if (!word) return '';

  if (mode === 'hidden') {
    if (revealedIndices.size === 0) {
      return '???';
    }
    return word
      .split('')
      .map((ch, idx) => {
        if (ch === ' ') return '  ';
        if (revealedIndices.has(idx)) return ch;
        return '_';
      })
      .join(' ');
  }

  if (mode === 'combination') {
    const words = word.split(' ');
    return words
      .map((part, pIdx) => {
        const offset = words.slice(0, pIdx).reduce((sum, s) => sum + s.length + 1, 0);
        return part
          .split('')
          .map((ch, i) => {
            const globalIdx = offset + i;
            if (revealedIndices.has(globalIdx)) return ch;
            return '_';
          })
          .join(' ');
      })
      .join('   ');
  }

  // Normal mode: spaces preserved, unrevealed characters rendered as underscores
  return word
    .split('')
    .map((ch, idx) => {
      if (ch === ' ') return '  ';
      if (ch === '-') return '-';
      if (revealedIndices.has(idx)) return ch;
      return '_';
    })
    .join(' ');
}

export function pickHintRevealIndex(
  word: string,
  revealedIndices: Set<number>,
  randomFn: () => number = Math.random
): number | null {
  const candidateIndices: number[] = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (ch !== ' ' && ch !== '-' && !revealedIndices.has(i)) {
      candidateIndices.push(i);
    }
  }
  // Never reveal every single letter; keep at least 1 character hidden
  const totalLetters = word.split('').filter((c) => c !== ' ' && c !== '-').length;
  if (candidateIndices.length === 0 || revealedIndices.size >= Math.max(0, totalLetters - 1)) {
    return null;
  }
  const pick = Math.floor(randomFn() * candidateIndices.length);
  return candidateIndices[pick];
}

export function calculateGuessPoints(
  timeLeft: number,
  drawTime: number,
  guessOrderIndex: number
): number {
  const safeDrawTime = Math.max(1, drawTime);
  const clampedTime = Math.max(0, Math.min(safeDrawTime, timeLeft));
  const speedRatio = clampedTime / safeDrawTime;

  // Base points 100 + up to 300 speed bonus + up to 100 early-bird bonus
  const speedBonus = Math.round(speedRatio * 300);
  const orderBonus = Math.max(0, 100 - guessOrderIndex * 25);
  return 100 + speedBonus + orderBonus;
}

export function calculateDrawerPoints(correctGuessers: number, totalGuessers: number): number {
  if (totalGuessers <= 0 || correctGuessers <= 0) return 0;
  const ratio = correctGuessers / totalGuessers;
  return Math.round(50 + ratio * 200);
}

export function selectWordChoices(
  category: RoomSettings['category'],
  customWords: string[],
  count: number,
  usedWords: Set<string>,
  randomFn: () => number = Math.random,
  wordMode: WordMode = 'normal'
): string[] {
  const pool = new Set<string>(getWordsForCategory(category));
  for (const cw of customWords) {
    if (cw.trim()) pool.add(cw.trim().toLowerCase());
  }

  let available = Array.from(pool).filter((w) => !usedWords.has(w));
  if (available.length < count) {
    available = Array.from(pool);
  }

  // Fisher-Yates partial shuffle
  const copy = [...available];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  const targetCount = clamp(count, 1, 5);
  if (wordMode === 'combination' && copy.length >= 2) {
    const combos: string[] = [];
    for (let i = 0; i < targetCount; i++) {
      const w1 = copy[(i * 2) % copy.length];
      const w2 = copy[(i * 2 + 1) % copy.length];
      combos.push(w1 === w2 ? w1 : `${w1.split(' ')[0]} ${w2.split(' ')[0]}`);
    }
    return combos;
  }

  return copy.slice(0, targetCount);
}

export function buildLeaderboard(players: PlayerPublic[]): LeaderboardEntry[] {
  const active = players.filter((p) => !p.isSpectator);
  const sorted = [...active].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return sorted.map((p, idx) => ({
    playerId: p.id,
    name: p.name,
    score: p.score,
    rank: idx + 1,
    avatarColor: p.avatarColor,
  }));
}

export function generateRoomCode(randomFn: () => number = Math.random): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(randomFn() * chars.length)];
  }
  return code;
}
