import { ChallengeState, Operation, PracticeMode, SessionSummary, SpeedMathSaveData } from './types';
import { getLocalDateKey, getLocalWeekKey } from '../utils/date';

const clampProgress = (progress: number, target: number): number => Math.min(target, Math.max(0, Math.floor(progress)));

export const getWeakestTopic = (saveData: Pick<SpeedMathSaveData, 'topicMastery'>): Operation => {
  const eligible = saveData.topicMastery.filter((topic) => topic.operation !== Operation.MIXED);
  if (eligible.length === 0) return Operation.ADDITION;

  return [...eligible].sort((left, right) => {
    if (left.masteryScore !== right.masteryScore) return left.masteryScore - right.masteryScore;
    return left.averageResponseTimeMs - right.averageResponseTimeMs;
  })[0].operation;
};

export const createChallengesForPeriod = (saveData: Pick<SpeedMathSaveData, 'topicMastery'>, now = new Date().toISOString()): ChallengeState[] => {
  const dayKey = getLocalDateKey(now);
  const weekKey = getLocalWeekKey(now);
  const weakestTopic = getWeakestTopic(saveData);

  return [
    {
      id: `daily_spark_${dayKey}`,
      title: 'Daily Spark',
      description: 'Solve 12 problems today.',
      iconKey: 'sparkles',
      type: 'daily_spark',
      cadence: 'daily',
      target: 12,
      progress: 0,
      rewardXp: 35,
      status: 'active',
      startedAt: now,
      periodKey: dayKey,
    },
    {
      id: `speed_demon_${dayKey}`,
      title: 'Speed Demon',
      description: 'Solve 5 problems under 3 seconds today.',
      iconKey: 'zap',
      type: 'speed_demon',
      cadence: 'daily',
      target: 5,
      progress: 0,
      rewardXp: 45,
      status: 'active',
      startedAt: now,
      periodKey: dayKey,
    },
    {
      id: `perfect_run_${dayKey}`,
      title: 'Perfect Run',
      description: 'Complete a 100% accuracy session.',
      iconKey: 'check-circle',
      type: 'perfect_run',
      cadence: 'daily',
      target: 1,
      progress: 0,
      rewardXp: 50,
      status: 'active',
      startedAt: now,
      periodKey: dayKey,
    },
    {
      id: `weekly_climb_${weekKey}`,
      title: 'Weekly Climb',
      description: 'Earn 350 XP this week.',
      iconKey: 'mountain',
      type: 'weekly_climb',
      cadence: 'weekly',
      target: 350,
      progress: 0,
      rewardXp: 100,
      status: 'active',
      startedAt: now,
      periodKey: weekKey,
    },
    {
      id: 'focus_builder',
      title: 'Focus Builder',
      description: 'Complete an untimed practice session.',
      iconKey: 'focus',
      type: 'focus_builder',
      cadence: 'permanent',
      target: 1,
      progress: 0,
      rewardXp: 30,
      status: 'active',
      startedAt: now,
    },
    {
      id: `weak_spot_fix_${weakestTopic}`,
      title: 'Weak Spot Fix',
      description: `Practice ${weakestTopic} for 8 correct answers.`,
      iconKey: 'wrench',
      type: 'weak_spot_fix',
      cadence: 'adaptive',
      target: 8,
      progress: 0,
      rewardXp: 60,
      status: 'active',
      startedAt: now,
      operation: weakestTopic,
    },
  ];
};

const shouldKeepChallenge = (challenge: ChallengeState, now: string): boolean => {
  if (challenge.cadence === 'daily') return challenge.periodKey === getLocalDateKey(now);
  if (challenge.cadence === 'weekly') return challenge.periodKey === getLocalWeekKey(now);
  return true;
};

export const refreshChallenges = (
  challenges: ChallengeState[],
  saveData: Pick<SpeedMathSaveData, 'topicMastery'>,
  now = new Date().toISOString(),
): ChallengeState[] => {
  const current = challenges.filter((challenge) => shouldKeepChallenge(challenge, now));
  const currentIds = new Set(current.map((challenge) => challenge.id));
  const required = createChallengesForPeriod(saveData, now).filter((challenge) => !currentIds.has(challenge.id));
  return [...current, ...required];
};

export const updateChallengesAfterSession = (
  challenges: ChallengeState[],
  session: SessionSummary,
  saveData: Pick<SpeedMathSaveData, 'topicMastery'>,
  now = new Date().toISOString(),
): { challenges: ChallengeState[]; completed: ChallengeState[]; rewardXp: number } => {
  const refreshed = refreshChallenges(challenges, saveData, now);
  const completed: ChallengeState[] = [];

  const updated = refreshed.map((challenge) => {
    if (challenge.status === 'completed' || challenge.status === 'claimed') return challenge;

    let progress = challenge.progress;
    if (challenge.type === 'daily_spark') progress += session.totalProblems;
    if (challenge.type === 'speed_demon') progress += session.averageResponseTimeMs > 0 && session.averageResponseTimeMs <= 3000 ? session.correctCount : 0;
    if (challenge.type === 'perfect_run') progress += session.totalProblems > 0 && session.accuracy === 100 ? 1 : 0;
    if (challenge.type === 'weekly_climb') progress += session.xpEarned;
    if (challenge.type === 'focus_builder') progress += session.mode === PracticeMode.UNTIMED ? 1 : 0;
    if (challenge.type === 'weak_spot_fix') {
      progress += session.operationMix.includes(challenge.operation ?? Operation.ADDITION) ? session.correctCount : 0;
    }

    const nextProgress = clampProgress(progress, challenge.target);
    if (nextProgress >= challenge.target) {
      const nextChallenge = { ...challenge, progress: nextProgress, status: 'completed' as const, completedAt: now };
      completed.push(nextChallenge);
      return nextChallenge;
    }

    return { ...challenge, progress: nextProgress };
  });

  return {
    challenges: updated,
    completed,
    rewardXp: completed.reduce((sum, challenge) => sum + challenge.rewardXp, 0),
  };
};
