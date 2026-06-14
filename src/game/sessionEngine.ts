import { generateProblem } from './problemGenerator';
import { calculateSessionRewards } from './scoringEngine';
import {
  AnswerAttempt,
  Difficulty,
  Operation,
  PracticeMode,
  SessionState,
  SessionSummary,
} from './types';
import { average } from '../utils/format';
import { toIsoTimestamp } from '../utils/date';

interface StartSessionOptions {
  mode: PracticeMode;
  operationMix: Operation[];
  difficulty: Difficulty;
  now?: string;
  recentProblemSignatures?: string[];
}

const concreteOperation = (operations: Operation[]): Operation => {
  const valid = operations.filter((operation) => Object.values(Operation).includes(operation));
  if (valid.length === 0) return Operation.ADDITION;
  if (valid.includes(Operation.MIXED)) return Operation.MIXED;
  return valid[0];
};

export const startSession = ({
  mode,
  operationMix,
  difficulty,
  now = new Date().toISOString(),
  recentProblemSignatures = [],
}: StartSessionOptions): SessionState => {
  const validMode = Object.values(PracticeMode).includes(mode) ? mode : PracticeMode.TIMED;
  const validDifficulty = Object.values(Difficulty).includes(difficulty) ? difficulty : Difficulty.BEGINNER;
  const mix = operationMix.length > 0 ? operationMix : [Operation.ADDITION];
  const currentProblem = generateProblem({
    operation: concreteOperation(mix),
    difficulty: validDifficulty,
    recentSignatures: recentProblemSignatures,
    now,
  });

  return {
    id: `session:${toIsoTimestamp(now)}:${Math.random().toString(36).slice(2, 8)}`,
    mode: validMode,
    operationMix: mix,
    difficultyStart: validDifficulty,
    currentDifficulty: validDifficulty,
    startedAt: toIsoTimestamp(now),
    currentProblem,
    attempts: [],
    currentStreak: 0,
    bestStreak: 0,
    recentProblemSignatures: [...recentProblemSignatures.slice(-20), currentProblem.signature],
  };
};

export const submitAnswer = (state: SessionState, selectedAnswer: number, now = new Date().toISOString()): SessionState => {
  const isCorrect = selectedAnswer === state.currentProblem.correctAnswer;
  const responseTimeMs = Math.max(0, new Date(now).getTime() - new Date(state.currentProblem.createdAt).getTime());
  const attempt: AnswerAttempt = {
    problemId: state.currentProblem.id,
    selectedAnswer,
    correctAnswer: state.currentProblem.correctAnswer,
    isCorrect,
    responseTimeMs,
    operation: state.currentProblem.operation,
    difficulty: state.currentProblem.difficulty,
    timestamp: toIsoTimestamp(now),
  };
  const currentStreak = isCorrect ? state.currentStreak + 1 : 0;
  const recentProblemSignatures = [...state.recentProblemSignatures, state.currentProblem.signature].slice(-20);
  const nextProblem = generateProblem({
    operation: concreteOperation(state.operationMix),
    difficulty: state.currentDifficulty,
    recentSignatures: recentProblemSignatures,
    now,
  });

  return {
    ...state,
    attempts: [...state.attempts, attempt],
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    currentProblem: nextProblem,
    recentProblemSignatures: [...recentProblemSignatures, nextProblem.signature].slice(-20),
  };
};

export const endSession = (state: SessionState, now = new Date().toISOString()): { summary: SessionSummary; attempts: AnswerAttempt[] } => {
  const totalProblems = state.attempts.length;
  const correctCount = state.attempts.filter((attempt) => attempt.isCorrect).length;
  const incorrectCount = totalProblems - correctCount;
  const rewards = calculateSessionRewards(state.attempts);
  const summary: SessionSummary = {
    id: state.id,
    mode: state.mode,
    startedAt: state.startedAt,
    endedAt: toIsoTimestamp(now),
    operationMix: state.operationMix,
    difficultyStart: state.difficultyStart,
    difficultyEnd: state.currentDifficulty,
    totalProblems,
    correctCount,
    incorrectCount,
    accuracy: totalProblems > 0 ? Math.round((correctCount / totalProblems) * 100) : 0,
    averageResponseTimeMs: Math.round(average(state.attempts.filter((attempt) => attempt.isCorrect).map((attempt) => attempt.responseTimeMs))),
    bestStreak: Math.max(state.bestStreak, rewards.bestStreak),
    xpEarned: rewards.xpEarned,
    score: rewards.score,
    badgesUnlocked: [],
    challengesCompleted: [],
  };

  return { summary, attempts: state.attempts };
};
