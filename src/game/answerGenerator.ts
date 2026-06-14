import { Difficulty, Operation } from './types';

interface GenerateAnswerChoicesOptions {
  correctAnswer: number;
  operation: Operation;
  operands: number[];
  difficulty: Difficulty;
}

const difficultySpread: Record<Difficulty, number> = {
  [Difficulty.BEGINNER]: 4,
  [Difficulty.EASY]: 8,
  [Difficulty.MEDIUM]: 16,
  [Difficulty.HARD]: 35,
  [Difficulty.EXPERT]: 60,
};

const deterministicShuffle = (values: number[], seed: number): number[] => {
  const next = [...values];
  let state = Math.abs(Math.floor(seed)) + 1;

  for (let i = next.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const j = state % (i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
};

const digitSwap = (value: number): number | null => {
  const sign = value < 0 ? -1 : 1;
  const text = Math.abs(value).toString();
  if (text.length < 2) return null;

  const chars = text.split('');
  [chars[chars.length - 2], chars[chars.length - 1]] = [chars[chars.length - 1], chars[chars.length - 2]];
  const swapped = Number(chars.join('')) * sign;
  return Number.isFinite(swapped) && swapped !== value ? swapped : null;
};

export const generateAnswerChoices = ({
  correctAnswer,
  operation,
  operands,
  difficulty,
}: GenerateAnswerChoicesOptions): number[] => {
  if (!Number.isFinite(correctAnswer)) {
    throw new Error('Cannot generate choices for a non-finite correct answer.');
  }

  const spread = difficultySpread[difficulty] ?? 10;
  const candidates = new Set<number>([correctAnswer]);
  const [a = 0, b = 0] = operands;
  const nearbyOffsets = [-2, -1, 1, 2, 3, -3, spread, -spread];

  for (const offset of nearbyOffsets) {
    candidates.add(correctAnswer + offset);
  }

  if (operation === Operation.ADDITION) {
    candidates.add(a - b);
    candidates.add(a + b + 10);
  } else if (operation === Operation.SUBTRACTION) {
    candidates.add(a + b);
    candidates.add(Math.abs(b - a));
  } else if (operation === Operation.MULTIPLICATION) {
    candidates.add((a + 1) * b);
    candidates.add(a * Math.max(0, b - 1));
    candidates.add(a + b);
  } else if (operation === Operation.DIVISION) {
    candidates.add(a / Math.max(1, b) + 1);
    candidates.add(b);
    candidates.add(Math.max(0, correctAnswer - 1));
  } else {
    candidates.add(a + b);
    candidates.add(a * b);
  }

  const swapped = digitSwap(correctAnswer);
  if (swapped !== null) candidates.add(swapped);
  candidates.add(Math.round(correctAnswer / 10) * 10);

  const readable = [...candidates]
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.round(value))
    .filter((value) => Math.abs(value) < 100000);

  const unique = new Set<number>(readable);
  let step = 1;
  while (unique.size < 4) {
    unique.add(correctAnswer + step);
    if (unique.size < 4) unique.add(correctAnswer - step);
    step += 1;
  }

  const wrongChoices = [...unique]
    .filter((value) => value !== correctAnswer)
    .sort((left, right) => Math.abs(left - correctAnswer) - Math.abs(right - correctAnswer))
    .slice(0, 3);

  return deterministicShuffle([correctAnswer, ...wrongChoices], correctAnswer + operands.reduce((sum, value) => sum + value, 0));
};
