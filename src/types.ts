export enum Difficulty {
  BEGINNER = 'BEGINNER',
  NOVICE = 'NOVICE',
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
  MASTER = 'MASTER'
}

export enum GameMode {
  TIMED = 'TIMED',
  UNTIMED = 'UNTIMED'
}

export enum Operation {
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  MULTIPLICATION = 'MULTIPLICATION',
  DIVISION = 'DIVISION'
}

export interface Settings {
  difficulty: Difficulty;
  gameMode: GameMode;
  operations: Record<Operation, boolean>;
  aiProgressiveHardening: boolean;
  gameDurationSeconds: number;
}

export interface MathProblem {
  num1: number;
  num2: number;
  operation: Operation;
  correctAnswer: number;
}

export interface GameSession {
  timestamp: number;
  score: number;
  totalSubmissions: number;
  settings: Settings;
  history: any[];
}
