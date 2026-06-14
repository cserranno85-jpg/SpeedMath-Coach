import { generateAnswerChoices } from './answerGenerator';
import { Difficulty, MathProblem, Operation } from './types';
import { toIsoTimestamp } from '../utils/date';

interface GenerateProblemOptions {
  operation: Operation;
  difficulty: Difficulty;
  recentSignatures?: string[];
  now?: string;
}

const operationSymbols: Record<Exclude<Operation, 'mixed'>, string> = {
  [Operation.ADDITION]: '+',
  [Operation.SUBTRACTION]: '-',
  [Operation.MULTIPLICATION]: '×',
  [Operation.DIVISION]: '÷',
};

const concreteOperations = [
  Operation.ADDITION,
  Operation.SUBTRACTION,
  Operation.MULTIPLICATION,
  Operation.DIVISION,
] as const;

const randomInt = (min: number, max: number): number => {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};

const chooseOperation = (operation: Operation): Exclude<Operation, 'mixed'> => {
  if (operation !== Operation.MIXED) return operation;
  return concreteOperations[randomInt(0, concreteOperations.length - 1)];
};

const difficultyScore: Record<Difficulty, number> = {
  [Difficulty.BEGINNER]: 1,
  [Difficulty.EASY]: 2,
  [Difficulty.MEDIUM]: 3,
  [Difficulty.HARD]: 4,
  [Difficulty.EXPERT]: 5,
};

const generateOperands = (operation: Exclude<Operation, 'mixed'>, difficulty: Difficulty): { operands: number[]; answer: number } => {
  if (operation === Operation.ADDITION) {
    const ranges: Record<Difficulty, [number, number]> = {
      [Difficulty.BEGINNER]: [0, 9],
      [Difficulty.EASY]: [2, 25],
      [Difficulty.MEDIUM]: [10, 99],
      [Difficulty.HARD]: [40, 250],
      [Difficulty.EXPERT]: [90, 900],
    };
    const [min, max] = ranges[difficulty];
    const a = randomInt(min, max);
    const b = randomInt(min, max);
    return { operands: [a, b], answer: a + b };
  }

  if (operation === Operation.SUBTRACTION) {
    const ranges: Record<Difficulty, [number, number]> = {
      [Difficulty.BEGINNER]: [0, 10],
      [Difficulty.EASY]: [4, 40],
      [Difficulty.MEDIUM]: [10, 120],
      [Difficulty.HARD]: [30, 300],
      [Difficulty.EXPERT]: [100, 1000],
    };
    const [min, max] = ranges[difficulty];
    let a = randomInt(min, max);
    let b = randomInt(min, max);
    if (
      (difficulty === Difficulty.BEGINNER || difficulty === Difficulty.EASY || difficulty === Difficulty.MEDIUM) &&
      b > a
    ) {
      [a, b] = [b, a];
    }
    return { operands: [a, b], answer: a - b };
  }

  if (operation === Operation.MULTIPLICATION) {
    const ranges: Record<Difficulty, [number, number]> = {
      [Difficulty.BEGINNER]: [0, 5],
      [Difficulty.EASY]: [0, 10],
      [Difficulty.MEDIUM]: [2, 14],
      [Difficulty.HARD]: [6, 24],
      [Difficulty.EXPERT]: [12, 55],
    };
    const [min, max] = ranges[difficulty];
    const a = randomInt(min, max);
    const b = randomInt(min, max);
    return { operands: [a, b], answer: a * b };
  }

  const divisorRanges: Record<Difficulty, [number, number]> = {
    [Difficulty.BEGINNER]: [1, 5],
    [Difficulty.EASY]: [1, 10],
    [Difficulty.MEDIUM]: [2, 12],
    [Difficulty.HARD]: [3, 24],
    [Difficulty.EXPERT]: [4, 60],
  };
  const quotientRanges: Record<Difficulty, [number, number]> = {
    [Difficulty.BEGINNER]: [1, 5],
    [Difficulty.EASY]: [2, 12],
    [Difficulty.MEDIUM]: [3, 18],
    [Difficulty.HARD]: [4, 35],
    [Difficulty.EXPERT]: [8, 90],
  };
  const divisor = randomInt(...divisorRanges[difficulty]);
  const quotient = randomInt(...quotientRanges[difficulty]);
  return { operands: [divisor * quotient, divisor], answer: quotient };
};

const createProblem = (operationInput: Operation, difficulty: Difficulty, now?: string): MathProblem => {
  const operation = chooseOperation(operationInput);
  const { operands, answer } = generateOperands(operation, difficulty);
  const prompt = `${operands[0]} ${operationSymbols[operation]} ${operands[1]}`;
  const signature = `${operation}:${difficulty}:${operands.join(':')}`;
  const createdAt = toIsoTimestamp(now ?? new Date());

  if (!Number.isFinite(answer) || !prompt || prompt.includes('undefined')) {
    throw new Error(`Malformed generated problem: ${signature}`);
  }

  const choices = generateAnswerChoices({
    correctAnswer: answer,
    operation,
    operands,
    difficulty,
  });

  if (choices.filter((choice) => choice === answer).length !== 1 || new Set(choices).size !== choices.length) {
    throw new Error(`Generated invalid choices for ${signature}`);
  }

  return {
    id: `${signature}:${createdAt}:${Math.random().toString(36).slice(2, 8)}`,
    prompt,
    operation,
    difficulty,
    operands,
    correctAnswer: answer,
    choices,
    createdAt,
    estimatedDifficultyScore: difficultyScore[difficulty] * 10 + Math.max(...operands.map(Math.abs)) / 10,
    signature,
  };
};

export const generateProblem = ({ operation, difficulty, recentSignatures = [], now }: GenerateProblemOptions): MathProblem => {
  const validOperation = Object.values(Operation).includes(operation) ? operation : Operation.ADDITION;
  const validDifficulty = Object.values(Difficulty).includes(difficulty) ? difficulty : Difficulty.BEGINNER;
  const recent = new Set(recentSignatures.slice(-8));
  let fallback = createProblem(validOperation, validDifficulty, now);

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const problem = createProblem(validOperation, validDifficulty, now);
    fallback = problem;
    if (!recent.has(problem.signature)) return problem;
  }

  return fallback;
};
