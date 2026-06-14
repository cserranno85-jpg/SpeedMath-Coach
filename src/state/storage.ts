import { createDefaultSaveData, defaultPreferences, SAVE_SCHEMA_VERSION, SAVE_STORAGE_KEY } from './defaults';
import { getLevelFromXp } from '../game/scoringEngine';
import {
  Difficulty,
  Operation,
  PracticeMode,
  SessionSummary,
  SpeedMathSaveData,
  UserPreferences,
} from '../game/types';
import { getLocalDateKey, toIsoTimestamp } from '../utils/date';

const LEGACY_PROGRESS_KEY = 'speedMathProgress';
const LEGACY_SETTINGS_KEY = 'speedMathSettings';
const LEGACY_MUTED_KEY = 'speedMathMuted';
const LEGACY_THEME_KEY = 'speedMathTheme';

const upperDifficultyMap: Record<string, Difficulty> = {
  BEGINNER: Difficulty.BEGINNER,
  NOVICE: Difficulty.BEGINNER,
  EASY: Difficulty.EASY,
  MEDIUM: Difficulty.MEDIUM,
  HARD: Difficulty.HARD,
  EXPERT: Difficulty.EXPERT,
  MASTER: Difficulty.EXPERT,
};

const upperModeMap: Record<string, PracticeMode> = {
  TIMED: PracticeMode.TIMED,
  UNTIMED: PracticeMode.UNTIMED,
  CHALLENGE: PracticeMode.CHALLENGE,
  CUSTOM: PracticeMode.CUSTOM,
};

const upperOperationMap: Record<string, Operation> = {
  ADDITION: Operation.ADDITION,
  SUBTRACTION: Operation.SUBTRACTION,
  MULTIPLICATION: Operation.MULTIPLICATION,
  DIVISION: Operation.DIVISION,
  MIXED: Operation.MIXED,
};

const isObject = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const parseJson = (raw: unknown): unknown => {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

const readLocalStorage = (key: string): string | undefined => {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

const normalizeDifficulty = (value: unknown): Difficulty => {
  if (typeof value !== 'string') return defaultPreferences.defaultDifficulty;
  if (Object.values(Difficulty).includes(value as Difficulty)) return value as Difficulty;
  return upperDifficultyMap[value] ?? defaultPreferences.defaultDifficulty;
};

const normalizeMode = (value: unknown): PracticeMode => {
  if (typeof value !== 'string') return defaultPreferences.defaultMode;
  if (Object.values(PracticeMode).includes(value as PracticeMode)) return value as PracticeMode;
  return upperModeMap[value] ?? defaultPreferences.defaultMode;
};

const normalizeOperation = (value: unknown): Operation | undefined => {
  if (typeof value !== 'string') return undefined;
  if (Object.values(Operation).includes(value as Operation)) return value as Operation;
  return upperOperationMap[value];
};

const normalizePreferences = (
  preferences: unknown,
  legacySettings?: unknown,
  legacyMuted?: unknown,
  legacyTheme?: unknown,
): UserPreferences => {
  const source = isObject(preferences) ? preferences : {};
  const legacy = isObject(legacySettings) ? legacySettings : {};
  const rawOperations = isObject(source.defaultOperations) ? source.defaultOperations : isObject(legacy.operations) ? legacy.operations : undefined;
  const operationList = Array.isArray(source.defaultOperations)
    ? source.defaultOperations.map(normalizeOperation).filter(Boolean) as Operation[]
    : rawOperations
      ? Object.entries(rawOperations).filter(([, enabled]) => enabled === true).map(([operation]) => normalizeOperation(operation)).filter(Boolean) as Operation[]
      : defaultPreferences.defaultOperations;

  return {
    soundEnabled: typeof source.soundEnabled === 'boolean' ? source.soundEnabled : legacyMuted !== 'true',
    theme: source.theme === 'light' || source.theme === 'dark'
      ? source.theme
      : legacyTheme === 'light' || legacyTheme === 'dark'
        ? legacyTheme
        : defaultPreferences.theme,
    adaptiveDifficulty: typeof source.adaptiveDifficulty === 'boolean'
      ? source.adaptiveDifficulty
      : legacy.adaptiveDifficulty === true || defaultPreferences.adaptiveDifficulty,
    defaultMode: normalizeMode(source.defaultMode ?? legacy.gameMode),
    defaultDifficulty: normalizeDifficulty(source.defaultDifficulty ?? legacy.difficulty),
    defaultOperations: operationList.length > 0 ? operationList : defaultPreferences.defaultOperations,
    gameDurationSeconds: typeof source.gameDurationSeconds === 'number'
      ? source.gameDurationSeconds
      : typeof legacy.gameDurationSeconds === 'number'
        ? legacy.gameDurationSeconds
        : defaultPreferences.gameDurationSeconds,
  };
};

const migrateLegacySession = (session: Record<string, unknown>, index: number): SessionSummary => {
  const date = toIsoTimestamp(typeof session.date === 'string' ? session.date : new Date());
  const score = typeof session.score === 'number' ? session.score : 0;
  const totalSubmissions = typeof session.totalSubmissions === 'number'
    ? session.totalSubmissions
    : typeof session.totalQuestions === 'number'
      ? session.totalQuestions
      : score;
  const history = Array.isArray(session.history) ? session.history : [];
  const settings = isObject(session.settings) ? session.settings : {};
  const operationMix = history
    .map((entry) => isObject(entry) && isObject(entry.problem) ? normalizeOperation(entry.problem.operation) : undefined)
    .filter(Boolean) as Operation[];

  return {
    id: `legacy:${date}:${index}`,
    mode: normalizeMode(settings.gameMode),
    startedAt: date,
    endedAt: date,
    operationMix: operationMix.length > 0 ? [...new Set(operationMix)] : defaultPreferences.defaultOperations,
    difficultyStart: normalizeDifficulty(settings.difficulty),
    difficultyEnd: normalizeDifficulty(settings.difficulty),
    totalProblems: totalSubmissions,
    correctCount: score,
    incorrectCount: Math.max(0, totalSubmissions - score),
    accuracy: totalSubmissions > 0 ? Math.round((score / totalSubmissions) * 100) : 0,
    averageResponseTimeMs: 0,
    bestStreak: 0,
    xpEarned: Math.max(0, score * 6),
    score,
    badgesUnlocked: [],
    challengesCompleted: [],
  };
};

const normalizeSaveData = (value: unknown, now = new Date().toISOString()): SpeedMathSaveData => {
  const defaults = createDefaultSaveData(now);
  if (!isObject(value)) return defaults;

  const sessionHistory = Array.isArray(value.sessionHistory)
    ? value.sessionHistory.filter(isObject).map((session, index) => migrateLegacySession(session, index))
    : defaults.sessionHistory;
  const totalXp = typeof value.totalXp === 'number'
    ? Math.max(0, value.totalXp)
    : sessionHistory.reduce((sum, session) => sum + session.xpEarned, 0);

  return {
    ...defaults,
    ...value,
    schemaVersion: SAVE_SCHEMA_VERSION,
    onboardingComplete: value.onboardingComplete === true,
    preferences: normalizePreferences(value.preferences),
    totalXp,
    level: getLevelFromXp(totalXp),
    currentStreak: typeof value.currentStreak === 'number' ? Math.max(0, value.currentStreak) : defaults.currentStreak,
    bestStreak: typeof value.bestStreak === 'number' ? Math.max(0, value.bestStreak) : defaults.bestStreak,
    lastPracticeDate: typeof value.lastPracticeDate === 'string' ? value.lastPracticeDate : sessionHistory.at(-1) ? getLocalDateKey(sessionHistory.at(-1)!.endedAt) : undefined,
    topicMastery: Array.isArray(value.topicMastery) ? value.topicMastery as SpeedMathSaveData['topicMastery'] : defaults.topicMastery,
    achievements: Array.isArray(value.achievements) ? value.achievements as SpeedMathSaveData['achievements'] : defaults.achievements,
    challenges: Array.isArray(value.challenges) ? value.challenges as SpeedMathSaveData['challenges'] : defaults.challenges,
    sessionHistory: sessionHistory.slice(-250),
    recentMistakes: Array.isArray(value.recentMistakes) ? value.recentMistakes as SpeedMathSaveData['recentMistakes'] : defaults.recentMistakes,
    recentProblemSignatures: Array.isArray(value.recentProblemSignatures) ? value.recentProblemSignatures.filter((item): item is string => typeof item === 'string').slice(-40) : defaults.recentProblemSignatures,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : defaults.createdAt,
    updatedAt: toIsoTimestamp(now),
  };
};

export const migrateSaveData = (raw: unknown): SpeedMathSaveData => {
  const now = new Date().toISOString();
  const parsed = parseJson(raw);
  if (!isObject(parsed)) return createDefaultSaveData(now);

  if ('schemaVersion' in parsed || 'sessionHistory' in parsed || 'preferences' in parsed) {
    return normalizeSaveData(parsed, now);
  }

  const legacyProgress = Array.isArray(parsed.legacyProgress)
    ? parsed.legacyProgress
    : Array.isArray(parsed.progress)
      ? parsed.progress
      : [];
  const legacySettings = parsed.legacySettings ?? parsed.settings;
  const legacyMuted = parsed.legacyMuted;
  const legacyTheme = parsed.legacyTheme;
  const sessionHistory = legacyProgress.filter(isObject).map(migrateLegacySession);
  const totalXp = sessionHistory.reduce((sum, session) => sum + session.xpEarned, 0);
  const defaults = createDefaultSaveData(now);

  return {
    ...defaults,
    preferences: normalizePreferences(undefined, legacySettings, legacyMuted, legacyTheme),
    totalXp,
    level: getLevelFromXp(totalXp),
    sessionHistory,
    lastPracticeDate: sessionHistory.at(-1) ? getLocalDateKey(sessionHistory.at(-1)!.endedAt) : undefined,
    updatedAt: now,
  };
};

export const loadSaveData = (): SpeedMathSaveData => {
  const newSave = readLocalStorage(SAVE_STORAGE_KEY);
  if (newSave) return migrateSaveData(newSave);

  const legacyProgress = parseJson(readLocalStorage(LEGACY_PROGRESS_KEY));
  const legacySettings = parseJson(readLocalStorage(LEGACY_SETTINGS_KEY));
  const legacyMuted = readLocalStorage(LEGACY_MUTED_KEY);
  const legacyTheme = readLocalStorage(LEGACY_THEME_KEY);

  return migrateSaveData({
    legacyProgress,
    legacySettings,
    legacyMuted,
    legacyTheme,
  });
};

export const saveData = (data: SpeedMathSaveData): SpeedMathSaveData => {
  const normalized = normalizeSaveData(data);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // Local persistence should never break gameplay.
  }
  return normalized;
};

export const resetSaveData = (): SpeedMathSaveData => {
  const defaults = createDefaultSaveData();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(defaults));
    }
  } catch {
    // Ignore storage failures; callers still receive fresh defaults.
  }
  return defaults;
};
