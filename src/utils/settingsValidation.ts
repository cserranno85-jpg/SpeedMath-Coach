import { Difficulty, GameMode, Operation, Settings } from '../types';
import { DEFAULT_DURATION_SECONDS, normalizeDurationSeconds } from './durationPresets';

export type ThemePreference = 'light' | 'dark';

export const SETTINGS_STORAGE_KEY = 'speedMathSettings';
export const THEME_STORAGE_KEY = 'speedMathTheme';
export const DEFAULT_THEME: ThemePreference = 'dark';

export const DEFAULT_SETTINGS: Settings = {
  difficulty: Difficulty.BEGINNER,
  gameMode: GameMode.TIMED,
  operations: {
    [Operation.ADDITION]: true,
    [Operation.SUBTRACTION]: false,
    [Operation.MULTIPLICATION]: false,
    [Operation.DIVISION]: false,
  },
  adaptiveDifficulty: false,
  gameDurationSeconds: DEFAULT_DURATION_SECONDS,
  theme: DEFAULT_THEME,
};

const isEnumValue = <T extends Record<string, string>>(enumObject: T, value: unknown): value is T[keyof T] => {
  return typeof value === 'string' && Object.values(enumObject).includes(value);
};

export const normalizeThemePreference = (value: unknown): ThemePreference => {
  return value === 'light' || value === 'dark' ? value : DEFAULT_THEME;
};

export const normalizeOperations = (value: unknown): Settings['operations'] => {
  const rawOperations = value && typeof value === 'object' ? value as Partial<Record<Operation, unknown>> : {};
  const operations = Object.values(Operation).reduce((acc, op) => {
    acc[op] = rawOperations[op] === true;
    return acc;
  }, {} as Settings['operations']);

  if (!Object.values(operations).some(Boolean)) {
    operations[Operation.ADDITION] = true;
  }

  return operations;
};

export const normalizeSettings = (value: unknown): Settings => {
  const rawSettings = value && typeof value === 'object' ? value as Partial<Settings> : {};

  return {
    difficulty: isEnumValue(Difficulty, rawSettings.difficulty) ? rawSettings.difficulty : DEFAULT_SETTINGS.difficulty,
    gameMode: isEnumValue(GameMode, rawSettings.gameMode) ? rawSettings.gameMode : DEFAULT_SETTINGS.gameMode,
    operations: normalizeOperations(rawSettings.operations),
    adaptiveDifficulty: rawSettings.adaptiveDifficulty === true,
    gameDurationSeconds: normalizeDurationSeconds(rawSettings.gameDurationSeconds),
    theme: normalizeThemePreference(rawSettings.theme),
  };
};

export const loadSettings = (): Settings => {
  let settings = DEFAULT_SETTINGS;

  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    settings = savedSettings ? normalizeSettings(JSON.parse(savedSettings)) : DEFAULT_SETTINGS;
  } catch {
    settings = DEFAULT_SETTINGS;
  }

  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    settings = {
      ...settings,
      theme: normalizeThemePreference(savedTheme ?? settings.theme),
    };
  } catch {
    settings = {
      ...settings,
      theme: normalizeThemePreference(settings.theme),
    };
  }

  return settings;
};

export const saveSettings = (settings: Settings): Settings => {
  const normalizedSettings = normalizeSettings(settings);
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings));
  localStorage.setItem(THEME_STORAGE_KEY, normalizedSettings.theme);
  return normalizedSettings;
};
