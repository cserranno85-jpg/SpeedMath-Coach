import { Difficulty, Operation, MathProblem } from '../types';

const DIFFICULTY_ORDER = [
  Difficulty.BEGINNER,
  Difficulty.NOVICE,
  Difficulty.EASY,
  Difficulty.MEDIUM,
  Difficulty.HARD,
  Difficulty.EXPERT,
  Difficulty.MASTER,
] as const;

const ADD_SUB_RANGES: Record<Difficulty, [number, number]> = {
  [Difficulty.BEGINNER]: [0, 9],
  [Difficulty.NOVICE]: [2, 9],
  [Difficulty.EASY]: [5, 15],
  [Difficulty.MEDIUM]: [10, 30],
  [Difficulty.HARD]: [20, 100],
  [Difficulty.EXPERT]: [50, 200],
  [Difficulty.MASTER]: [100, 500],
};

const MULT_DIV_RANGES: Record<Difficulty, [number, number]> = {
  [Difficulty.BEGINNER]: [0, 5],
  [Difficulty.NOVICE]: [2, 4],
  [Difficulty.EASY]: [2, 6],
  [Difficulty.MEDIUM]: [3, 9],
  [Difficulty.HARD]: [4, 15],
  [Difficulty.EXPERT]: [10, 30],
  [Difficulty.MASTER]: [20, 50],
};

const getRandomInt = (min: number, max: number) => {
  const safeMin = Math.ceil(Math.min(min, max));
  const safeMax = Math.floor(Math.max(min, max));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};

export const getNextAdaptiveDifficulty = ({
  adaptiveDifficulty,
  currentDifficulty,
  streak,
  timeSpentSeconds,
}: {
  adaptiveDifficulty: boolean;
  currentDifficulty: Difficulty;
  streak: number;
  timeSpentSeconds: number;
}): { nextDifficulty: Difficulty; shouldResetStreak: boolean } => {
  if (!adaptiveDifficulty || streak < 3 || timeSpentSeconds >= 5) {
    return { nextDifficulty: currentDifficulty, shouldResetStreak: false };
  }

  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  if (currentIndex === -1 || currentIndex >= DIFFICULTY_ORDER.length - 1) {
    return { nextDifficulty: currentDifficulty, shouldResetStreak: false };
  }

  return {
    nextDifficulty: DIFFICULTY_ORDER[currentIndex + 1],
    shouldResetStreak: true,
  };
};

export const generateProblem = (
  difficulty: Difficulty,
  allowedOperations: Record<Operation, boolean>
): MathProblem => {
  const safeDifficulty = ADD_SUB_RANGES[difficulty] ? difficulty : Difficulty.BEGINNER;
  const ops = Object.values(Operation).filter(
    (op) => allowedOperations[op as Operation]
  ) as Operation[];

  const operation = ops.length > 0
    ? ops[Math.floor(Math.random() * ops.length)]
    : Operation.ADDITION;

  let num1 = 0;
  let num2 = 0;
  let correctAnswer = 0;

  const range = ADD_SUB_RANGES[safeDifficulty];
  const multDivRange = MULT_DIV_RANGES[safeDifficulty];

  if (operation === Operation.ADDITION) {
    if (safeDifficulty === Difficulty.BEGINNER) {
      num1 = getRandomInt(0, 9);
      num2 = getRandomInt(0, 9 - num1);
    } else {
      num1 = getRandomInt(range[0], range[1]);
      num2 = getRandomInt(range[0], range[1]);
    }
    correctAnswer = num1 + num2;
  } else if (operation === Operation.SUBTRACTION) {
    if (safeDifficulty === Difficulty.BEGINNER) {
      num1 = getRandomInt(0, 9);
      num2 = getRandomInt(0, num1);
    } else {
      num1 = getRandomInt(range[0] * 2, range[1] * 2);
      num2 = getRandomInt(range[0], num1 - 1);
    }
    correctAnswer = num1 - num2;
  } else if (operation === Operation.MULTIPLICATION) {
    if (safeDifficulty === Difficulty.BEGINNER) {
      num1 = getRandomInt(0, 5);
      num2 = getRandomInt(0, 5);
    } else {
      num1 = getRandomInt(multDivRange[0], multDivRange[1]);
      num2 = getRandomInt(multDivRange[0], multDivRange[1]);
    }
    correctAnswer = num1 * num2;
  } else if (operation === Operation.DIVISION) {
    if (safeDifficulty === Difficulty.BEGINNER) {
      correctAnswer = getRandomInt(0, 5);
      num2 = getRandomInt(1, 5);
    } else {
      num2 = getRandomInt(Math.max(1, multDivRange[0]), multDivRange[1]);
      correctAnswer = getRandomInt(multDivRange[0], multDivRange[1]);
    }
    num1 = num2 * correctAnswer;
  }

  return {
    num1,
    num2,
    operation,
    correctAnswer
  };
};

export const getOperationSymbol = (operation: Operation) => {
  switch (operation) {
    case Operation.ADDITION: return '+';
    case Operation.SUBTRACTION: return '-';
    case Operation.MULTIPLICATION: return '×';
    case Operation.DIVISION: return '÷';
  }
};
