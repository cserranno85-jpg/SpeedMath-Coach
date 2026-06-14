import { AnswerAttempt, Difficulty, Operation, SessionSummary, SpeedMathSaveData, TopicMastery } from './types';
import { getLevelFromXp } from './scoringEngine';
import { getLocalDateKey, isConsecutiveLocalDay, clampNumber } from '../utils/date';
import { average } from '../utils/format';

const difficultyWeight: Record<Difficulty, number> = {
  [Difficulty.BEGINNER]: 0.85,
  [Difficulty.EASY]: 0.95,
  [Difficulty.MEDIUM]: 1.05,
  [Difficulty.HARD]: 1.15,
  [Difficulty.EXPERT]: 1.25,
};

const speedTargetMs: Record<Operation, number> = {
  [Operation.ADDITION]: 2600,
  [Operation.SUBTRACTION]: 3000,
  [Operation.MULTIPLICATION]: 3800,
  [Operation.DIVISION]: 4200,
  [Operation.MIXED]: 3600,
};

export const updateTopicMastery = (
  topics: TopicMastery[],
  attempts: AnswerAttempt[],
  now = new Date().toISOString(),
): TopicMastery[] => {
  return topics.map((topic) => {
    const topicAttempts = attempts.filter((attempt) => attempt.operation === topic.operation);
    if (topicAttempts.length === 0) return topic;

    const correct = topicAttempts.filter((attempt) => attempt.isCorrect).length;
    const accuracy = correct / topicAttempts.length;
    const avgSpeed = average(topicAttempts.map((attempt) => attempt.responseTimeMs));
    const targetSpeed = speedTargetMs[topic.operation] ?? speedTargetMs[Operation.MIXED];
    const speedScore = clampNumber(1 - (avgSpeed - targetSpeed) / targetSpeed, 0, 1);
    const avgDifficultyWeight = average(topicAttempts.map((attempt) => difficultyWeight[attempt.difficulty] ?? 1));
    const performanceScore = clampNumber(((accuracy * 72) + (speedScore * 28)) * avgDifficultyWeight, 0, 100);
    const sampleWeight = clampNumber(topicAttempts.length / 20, 0.08, 0.28);
    const nextMastery = Math.round(topic.masteryScore * (1 - sampleWeight) + performanceScore * sampleWeight);
    const totalAttempts = topic.attempts + topicAttempts.length;
    const totalCorrect = topic.correct + correct;
    const previousWeightedSpeed = topic.averageResponseTimeMs * topic.attempts;
    const currentWeightedSpeed = topicAttempts.reduce((sum, attempt) => sum + attempt.responseTimeMs, 0);
    const recentMistakes = [
      ...topic.recentMistakes,
      ...topicAttempts.filter((attempt) => !attempt.isCorrect).map((attempt) => attempt.problemId),
    ].slice(-8);

    return {
      ...topic,
      masteryScore: clampNumber(nextMastery, 0, 100),
      attempts: totalAttempts,
      correct: totalCorrect,
      averageResponseTimeMs: totalAttempts > 0 ? Math.round((previousWeightedSpeed + currentWeightedSpeed) / totalAttempts) : 0,
      recentMistakes,
      lastPracticedAt: now,
    };
  });
};

export const getWeakestMastery = (topics: TopicMastery[]): TopicMastery => (
  [...topics].sort((left, right) => left.masteryScore - right.masteryScore)[0]
);

export const getStrongestMastery = (topics: TopicMastery[]): TopicMastery => (
  [...topics].sort((left, right) => right.masteryScore - left.masteryScore)[0]
);

export const applySessionToProgress = (
  saveData: SpeedMathSaveData,
  session: SessionSummary,
  attempts: AnswerAttempt[],
  now = new Date().toISOString(),
): SpeedMathSaveData => {
  const practiceDate = getLocalDateKey(session.endedAt);
  const currentStreak = saveData.lastPracticeDate === practiceDate
    ? saveData.currentStreak
    : isConsecutiveLocalDay(saveData.lastPracticeDate, practiceDate)
      ? saveData.currentStreak + 1
      : 1;
  const totalXp = saveData.totalXp + session.xpEarned;
  const recentMistakes = [
    ...saveData.recentMistakes,
    ...attempts.filter((attempt) => !attempt.isCorrect),
  ].slice(-25);
  const recentProblemSignatures = [
    ...saveData.recentProblemSignatures,
    ...attempts.map((attempt) => attempt.problemId),
  ].slice(-40);

  return {
    ...saveData,
    totalXp,
    level: getLevelFromXp(totalXp),
    currentStreak,
    bestStreak: Math.max(saveData.bestStreak, currentStreak, session.bestStreak),
    lastPracticeDate: practiceDate,
    topicMastery: updateTopicMastery(saveData.topicMastery, attempts, now),
    sessionHistory: [...saveData.sessionHistory, session].slice(-250),
    recentMistakes,
    recentProblemSignatures,
    updatedAt: now,
  };
};
