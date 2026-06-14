export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const toIsoTimestamp = (value: Date | string | number = new Date()): string => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export const getLocalDateKey = (value: Date | string | number = new Date()): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return getLocalDateKey(new Date());

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalWeekKey = (value: Date | string | number = new Date()): string => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return getLocalWeekKey(new Date());

  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay() === 0 ? 7 : local.getDay();
  local.setDate(local.getDate() + 4 - day);

  const yearStart = new Date(local.getFullYear(), 0, 1);
  const week = Math.ceil((((local.getTime() - yearStart.getTime()) / MS_PER_DAY) + 1) / 7);
  return `${local.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const isConsecutiveLocalDay = (previousDate: string | undefined, nextDate: string): boolean => {
  if (!previousDate) return false;

  const previous = new Date(`${previousDate}T12:00:00`);
  const next = new Date(`${nextDate}T12:00:00`);
  if (Number.isNaN(previous.getTime()) || Number.isNaN(next.getTime())) return false;

  return Math.round((next.getTime() - previous.getTime()) / MS_PER_DAY) === 1;
};

export const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
