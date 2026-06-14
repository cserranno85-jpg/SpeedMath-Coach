import { AchievementState, Operation, SessionSummary, SpeedMathSaveData } from './types';
import { getLocalDateKey, getLocalWeekKey } from '../utils/date';

type AchievementDefinition = Omit<AchievementState, 'unlockedAt'> & {
  isUnlocked: (saveData: SpeedMathSaveData, session: SessionSummary) => boolean;
};

export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: 'first_steps',
    title: 'First Steps',
    description: 'Complete your first SpeedMath session.',
    iconKey: 'footprints',
    tier: 'bronze',
    hiddenUntilUnlocked: false,
    isUnlocked: (saveData) => saveData.sessionHistory.length >= 1,
  },
  {
    id: 'quick_thinker',
    title: 'Quick Thinker',
    description: 'Average under 3 seconds in a session with at least 5 correct answers.',
    iconKey: 'zap',
    tier: 'silver',
    hiddenUntilUnlocked: false,
    isUnlocked: (_saveData, session) => session.correctCount >= 5 && session.averageResponseTimeMs > 0 && session.averageResponseTimeMs <= 3000,
  },
  {
    id: 'streak_master',
    title: 'Streak Master',
    description: 'Reach a 5-day practice streak.',
    iconKey: 'flame',
    tier: 'gold',
    hiddenUntilUnlocked: false,
    isUnlocked: (saveData) => saveData.currentStreak >= 5,
  },
  {
    id: 'accuracy_ace',
    title: 'Accuracy Ace',
    description: 'Finish a session with at least 90% accuracy and 10 problems.',
    iconKey: 'target',
    tier: 'silver',
    hiddenUntilUnlocked: false,
    isUnlocked: (_saveData, session) => session.totalProblems >= 10 && session.accuracy >= 90,
  },
  {
    id: 'perfect_run',
    title: 'Perfect Run',
    description: 'Complete a 100% accuracy session with at least 5 problems.',
    iconKey: 'check-circle',
    tier: 'gold',
    hiddenUntilUnlocked: false,
    isUnlocked: (_saveData, session) => session.totalProblems >= 5 && session.accuracy === 100,
  },
  {
    id: 'daily_champion',
    title: 'Daily Champion',
    description: 'Complete two sessions in one local day.',
    iconKey: 'sun',
    tier: 'silver',
    hiddenUntilUnlocked: false,
    isUnlocked: (saveData, session) => {
      const today = getLocalDateKey(session.endedAt);
      return saveData.sessionHistory.filter((item) => getLocalDateKey(item.endedAt) === today).length >= 2;
    },
  },
  {
    id: 'weekly_warrior',
    title: 'Weekly Warrior',
    description: 'Complete five sessions in one local week.',
    iconKey: 'calendar',
    tier: 'gold',
    hiddenUntilUnlocked: false,
    isUnlocked: (saveData, session) => {
      const week = getLocalWeekKey(session.endedAt);
      return saveData.sessionHistory.filter((item) => getLocalWeekKey(item.endedAt) === week).length >= 5;
    },
  },
  {
    id: 'addition_master',
    title: 'Addition Master',
    description: 'Reach 80 mastery in addition.',
    iconKey: 'plus',
    tier: 'gold',
    hiddenUntilUnlocked: false,
    isUnlocked: (saveData) => (saveData.topicMastery.find((topic) => topic.operation === Operation.ADDITION)?.masteryScore ?? 0) >= 80,
  },
  {
    id: 'multiplication_master',
    title: 'Multiplication Master',
    description: 'Reach 80 mastery in multiplication.',
    iconKey: 'x',
    tier: 'gold',
    hiddenUntilUnlocked: false,
    isUnlocked: (saveData) => (saveData.topicMastery.find((topic) => topic.operation === Operation.MULTIPLICATION)?.masteryScore ?? 0) >= 80,
  },
  {
    id: 'division_climber',
    title: 'Division Climber',
    description: 'Reach 65 mastery in division.',
    iconKey: 'divide',
    tier: 'silver',
    hiddenUntilUnlocked: false,
    isUnlocked: (saveData) => (saveData.topicMastery.find((topic) => topic.operation === Operation.DIVISION)?.masteryScore ?? 0) >= 65,
  },
  {
    id: 'lightning_legend',
    title: 'Lightning Legend',
    description: 'Reach level 10 and complete a hard or expert session.',
    iconKey: 'bolt',
    tier: 'legend',
    hiddenUntilUnlocked: true,
    isUnlocked: (saveData, session) => saveData.level >= 10 && ['hard', 'expert'].includes(session.difficultyEnd),
  },
];

export const createInitialAchievements = (): AchievementState[] => (
  achievementDefinitions.map(({ isUnlocked: _isUnlocked, ...definition }) => ({ ...definition }))
);

export const evaluateAchievementUnlocks = (
  existingAchievements: AchievementState[],
  saveData: SpeedMathSaveData,
  session: SessionSummary,
): AchievementState[] => {
  const existingById = new Map(existingAchievements.map((achievement) => [achievement.id, achievement]));
  const now = session.endedAt;
  const newlyUnlocked: AchievementState[] = [];

  for (const definition of achievementDefinitions) {
    const existing = existingById.get(definition.id);
    if (existing?.unlockedAt) continue;

    if (definition.isUnlocked(saveData, session)) {
      const { isUnlocked: _isUnlocked, ...metadata } = definition;
      newlyUnlocked.push({ ...metadata, unlockedAt: now });
    }
  }

  return newlyUnlocked;
};

export const mergeAchievementUnlocks = (
  existingAchievements: AchievementState[],
  newlyUnlocked: AchievementState[],
): AchievementState[] => {
  const unlockedById = new Map(newlyUnlocked.map((achievement) => [achievement.id, achievement]));

  return createInitialAchievements().map((achievement) => {
    const existing = existingAchievements.find((item) => item.id === achievement.id);
    const newlyUnlockedAchievement = unlockedById.get(achievement.id);
    return newlyUnlockedAchievement ?? existing ?? achievement;
  });
};
