import { createInitialAchievements } from '../game/achievementEngine';
import { createChallengesForPeriod } from '../game/challengeEngine';
import {
  Difficulty,
  Operation,
  PracticeMode,
  SpeedMathSaveData,
  TopicMastery,
  UserPreferences,
} from '../game/types';
import { toIsoTimestamp } from '../utils/date';

export const SAVE_SCHEMA_VERSION = 2;
export const SAVE_STORAGE_KEY = 'speedMathSaveDataV2';

export const defaultPreferences: UserPreferences = {
  soundEnabled: true,
  hapticsEnabled: true,
  musicEnabled: false,
  reducedMotion: false,
  largerText: false,
  theme: 'dark',
  adaptiveDifficulty: true,
  defaultMode: PracticeMode.TIMED,
  defaultDifficulty: Difficulty.BEGINNER,
  defaultOperations: [Operation.ADDITION],
  gameDurationSeconds: 60,
};

export const createDefaultTopicMastery = (): TopicMastery[] => (
  Object.values(Operation).map((operation) => ({
    operation,
    masteryScore: operation === Operation.MIXED ? 20 : 25,
    attempts: 0,
    correct: 0,
    averageResponseTimeMs: 0,
    recentMistakes: [],
  }))
);

export const createDefaultSaveData = (now = new Date().toISOString()): SpeedMathSaveData => {
  const timestamp = toIsoTimestamp(now);
  const topicMastery = createDefaultTopicMastery();
  const base = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    onboardingComplete: false,
    preferences: defaultPreferences,
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    topicMastery,
    achievements: createInitialAchievements(),
    challenges: [],
    sessionHistory: [],
    recentMistakes: [],
    recentProblemSignatures: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  return {
    ...base,
    challenges: createChallengesForPeriod(base, timestamp),
  };
};
