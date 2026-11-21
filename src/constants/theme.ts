import type { ColorKey } from '../types';
export const GRID = 8;
export const theme = {
  bgTop: '#4B62B8', bgBottom: '#3A4E9F',
  board: '#1E2440', cell: '#272E4F', border: '#323A63',
  white: '#FFFFFF', gold: '#FACC15', pink: '#F472B6',
  panel: '#2F3F8C', danger: '#EF4444',
};
export const BLOCK_COLORS: Record<ColorKey, string> = {
  purple: '#A855F7', gold: '#FACC15', blue: '#3B82F6', cyan: '#22D3EE',
  green: '#22C55E', orange: '#F97316', red: '#EF4444',
};
export const COLOR_KEYS = Object.keys(BLOCK_COLORS) as ColorKey[];

/** mix colour with white (amt>0) or black (amt<0) */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const ch = (v: number) => Math.round((t - v) * p + v);
  const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}
