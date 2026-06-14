export const APPROVED_DURATION_PRESETS = [30, 60, 120, 300] as const;

export type DurationPresetSeconds = (typeof APPROVED_DURATION_PRESETS)[number];

export const DEFAULT_DURATION_SECONDS: DurationPresetSeconds = 60;

export const isApprovedDurationPreset = (value: unknown): value is DurationPresetSeconds => {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    APPROVED_DURATION_PRESETS.includes(value as DurationPresetSeconds)
  );
};

export const normalizeDurationSeconds = (value: unknown): DurationPresetSeconds => {
  return isApprovedDurationPreset(value) ? value : DEFAULT_DURATION_SECONDS;
};

export const formatDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const formatDurationLabel = (seconds: DurationPresetSeconds): string => {
  return seconds < 60 ? `${seconds}s` : `${seconds / 60}m`;
};
