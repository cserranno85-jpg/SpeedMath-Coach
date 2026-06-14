import { AnswerAttempt, Difficulty, SessionSummary } from './types';

const difficultyXp: Record<Difficulty, number> = {
  [Difficulty.BEGINNER]: 6,
  [Difficulty.EASY]: 8,
  [Difficulty.MEDIUM]: 11,
  [Difficulty.HARD]: 15,
  [Difficulty.EXPERT]: 21,
};

const difficultyScore: Record<Difficulty, number> = {
  [Difficulty.BEGINNER]: 10,
  [Difficulty.EASY]: 14,
  [Difficulty.MEDIUM]: 20,
  [Difficulty.HARD]: 28,
  [Difficulty.EXPERT]: 40,
};

export const scoreAttempt = (attempt: AnswerAttempt, streak: number): { score: number; xp: number } => {
  if (!attempt.isCorrect) return { score: 0, xp: 0 };

  const speedBonus = attempt.responseTimeMs <= 1500 ? 10 : attempt.responseTimeMs <= 3000 ? 6 : attempt.responseTimeMs <= 5000 ? 3 : 0;
  const streakBonus = Math.min(12, Math.floor(streak / 3) * 2);
  const baseScore = difficultyScore[attempt.difficulty] ?? 10;
  const baseXp = difficultyXp[attempt.difficulty] ?? 6;

  return {
    score: baseScore + speedBonus + streakBonus,
    xp: baseXp + Math.ceil(speedBonus / 2) + Math.floor(streakBonus / 2),
  };
};

export const calculateSessionRewards = (
  attempts: AnswerAttempt[],
  challengeBonusXp = 0,
): { score: number; xpEarned: number; bestStreak: number } => {
  let score = 0;
  let xpEarned = 0;
  let streak = 0;
  let bestStreak = 0;

  for (const attempt of attempts) {
    if (attempt.isCorrect) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      const reward = scoreAttempt(attempt, streak);
      score += reward.score;
      xpEarned += reward.xp;
    } else {
      streak = 0;
    }
  }

  const correct = attempts.filter((attempt) => attempt.isCorrect).length;
  if (attempts.length >= 5 && correct === attempts.length) {
    xpEarned += 25;
    score += 50;
  }

  xpEarned += challengeBonusXp;
  return { score, xpEarned, bestStreak };
};

export const getXpForLevel = (level: number): number => {
  const safeLevel = Math.max(1, Math.floor(level));
  if (safeLevel <= 1) return 0;
  return Math.floor(80 * ((safeLevel - 1) ** 1.45) + (safeLevel - 1) * 20);
};

export const getLevelFromXp = (totalXp: number): number => {
  const safeXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (getXpForLevel(level + 1) <= safeXp) {
    level += 1;
  }
  return level;
};

export const getProgressToNextLevel = (totalXp: number): { level: number; currentLevelXp: number; nextLevelXp: number; xpIntoLevel: number; xpNeeded: number; percent: number } => {
  const level = getLevelFromXp(totalXp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const xpIntoLevel = Math.max(0, totalXp - currentLevelXp);
  const xpNeeded = Math.max(1, nextLevelXp - currentLevelXp);
  const rawPercent = (xpIntoLevel / xpNeeded) * 100;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeeded,
    percent: xpIntoLevel > 0 ? Math.min(100, Math.max(1, Math.round(rawPercent))) : 0,
  };
};

export const mergeSessionBadgesAndChallenges = (
  summary: SessionSummary,
  badgesUnlocked: string[],
  challengesCompleted: string[],
  challengeBonusXp = 0,
): SessionSummary => ({
  ...summary,
  badgesUnlocked,
  challengesCompleted,
  xpEarned: summary.xpEarned + challengeBonusXp,
});
