export const formatPercent = (value: number): string => {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
};

export const formatSeconds = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return '0.0s';
  return `${(milliseconds / 1000).toFixed(1)}s`;
};

export const average = (values: number[]): number => {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return 0;
  return finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
};
