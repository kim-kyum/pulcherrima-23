export function getNextScreenIndex(activeScreen: number, screenCount: number): number {
  if (screenCount <= 0) return 0;
  return Math.min(Math.max(activeScreen + 1, 0), screenCount - 1);
}
