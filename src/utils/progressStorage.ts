export const PROGRESS_STORAGE_KEY = 'speedMathProgress';
export const PROGRESS_STORAGE_KEYS_TO_CLEAR = [PROGRESS_STORAGE_KEY] as const;

export type ProgressSession = Record<string, unknown>;

export const loadProgress = (): ProgressSession[] => {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getProgress = loadProgress;

export const saveProgress = (progress: ProgressSession[]): void => {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
};

export const appendProgress = (session: ProgressSession): ProgressSession[] => {
  const nextProgress = [...loadProgress(), session];
  saveProgress(nextProgress);
  return nextProgress;
};

export const clearProgress = (): void => {
  PROGRESS_STORAGE_KEYS_TO_CLEAR.forEach((key) => {
    localStorage.removeItem(key);
  });
};
