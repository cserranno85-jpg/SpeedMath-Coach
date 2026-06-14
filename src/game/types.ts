export const Operation = {
  ADDITION: 'addition',
  SUBTRACTION: 'subtraction',
  MULTIPLICATION: 'multiplication',
  DIVISION: 'division',
  MIXED: 'mixed',
} as const;

export type Operation = (typeof Operation)[keyof typeof Operation];

export const Difficulty = {
  BEGINNER: 'beginner',
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
} as const;

export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

export const PracticeMode = {
  TIMED: 'timed',
  UNTIMED: 'untimed',
  CHALLENGE: 'challenge',
  CUSTOM: 'custom',
} as const;

export type PracticeMode = (typeof PracticeMode)[keyof typeof PracticeMode];

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'legend';
export type ChallengeCadence = 'daily' | 'weekly' | 'permanent' | 'adaptive';
export type ChallengeStatus = 'locked' | 'active' | 'completed' | 'claimed';
export type ChallengeType = 'daily_spark' | 'speed_demon' | 'perfect_run' | 'weekly_climb' | 'focus_builder' | 'weak_spot_fix';
export type CoachIntensityLevel = 'recovery' | 'steady' | 'push' | 'challenge';

export interface MathProblem {
  id: string;
  prompt: string;
  operation: Operation;
  difficulty: Difficulty;
  operands: number[];
  correctAnswer: number;
  choices: number[];
  createdAt: string;
  estimatedDifficultyScore: number;
  signature: string;
}

export interface AnswerAttempt {
  problemId: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  operation: Operation;
  difficulty: Difficulty;
  timestamp: string;
}

export interface SessionSummary {
  id: string;
  mode: PracticeMode;
  startedAt: string;
  endedAt: string;
  operationMix: Operation[];
  difficultyStart: Difficulty;
  difficultyEnd: Difficulty;
  totalProblems: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  averageResponseTimeMs: number;
  bestStreak: number;
  xpEarned: number;
  score: number;
  badgesUnlocked: string[];
  challengesCompleted: string[];
}

export interface TopicMastery {
  operation: Operation;
  masteryScore: number;
  attempts: number;
  correct: number;
  averageResponseTimeMs: number;
  recentMistakes: string[];
  lastPracticedAt?: string;
}

export interface AchievementState {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  tier: AchievementTier;
  unlockedAt?: string;
  hiddenUntilUnlocked: boolean;
}

export interface ChallengeState {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  type: ChallengeType;
  cadence: ChallengeCadence;
  target: number;
  progress: number;
  rewardXp: number;
  status: ChallengeStatus;
  startedAt: string;
  completedAt?: string;
  operation?: Operation;
  periodKey?: string;
}

export interface UserProgress {
  totalXp: number;
  level: number;
  currentStreak: number;
  bestStreak: number;
  lastPracticeDate?: string;
  topicMastery: TopicMastery[];
  achievements: AchievementState[];
  challenges: ChallengeState[];
  sessionHistory: SessionSummary[];
  recentMistakes: AnswerAttempt[];
  recentProblemSignatures: string[];
}

export interface UserPreferences {
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  adaptiveDifficulty: boolean;
  defaultMode: PracticeMode;
  defaultDifficulty: Difficulty;
  defaultOperations: Operation[];
  gameDurationSeconds: number;
}

export interface SpeedMathSaveData extends UserProgress {
  schemaVersion: number;
  onboardingComplete: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface AdaptiveDecision {
  nextDifficulty: Difficulty;
  recommendedOperation: Operation;
  recommendedMode: PracticeMode;
  shouldOfferChallenge: boolean;
  coachMessage: string;
  intensityLevel: CoachIntensityLevel;
}

export interface CoachRecommendation {
  shortMotivation: string;
  recommendedMode: PracticeMode;
  recommendedOperation: Operation;
  nextGoal: string;
  reason: string;
}

export interface SessionState {
  id: string;
  mode: PracticeMode;
  operationMix: Operation[];
  difficultyStart: Difficulty;
  currentDifficulty: Difficulty;
  startedAt: string;
  currentProblem: MathProblem;
  attempts: AnswerAttempt[];
  currentStreak: number;
  bestStreak: number;
  recentProblemSignatures: string[];
}
