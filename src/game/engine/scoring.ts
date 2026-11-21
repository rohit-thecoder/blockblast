/** points = cells placed + 10 * lines^2, scaled up by the combo streak. */
export function scorePlacement(cellsPlaced: number, lines: number, combo: number): number {
  if (lines === 0) return cellsPlaced;
  return cellsPlaced + Math.round(10 * lines * lines * (1 + 0.5 * Math.max(0, combo - 1)));
}
export function feedbackLabel(lines: number, combo: number): 'RELAXING!' | 'EXCITING!' | 'EXCELLENT!' {
  if (lines >= 2 || combo >= 3) return 'EXCELLENT!';
  if (lines >= 1) return 'EXCITING!';
  return 'RELAXING!';
}
