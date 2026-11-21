import { GRID, COLOR_KEYS } from '../../constants/theme';
import type { Cell, Grid } from '../../types';
import { emptyGrid, fullLines } from '../engine/board';
import { makeRng } from '../engine/rng';

export const LEVEL_COUNT = 60;

export interface LevelConfig {
  level: number;
  grid: Grid;
  targets: { star: number; gem: number };
}

/** Deterministic: the same level number always yields the same board. */
function buildLevel(level: number): LevelConfig {
  const rng = makeRng(0x9e3779b1 ^ (level * 7919));
  const rand = () => rng.next();
  const stars = Math.min(2 + Math.floor((level - 1) / 4), 8);
  const gems = Math.min(1 + Math.floor((level - 1) / 5), 6);
  const density = Math.min(18 + level, 36); // pre-filled cells
  const g = emptyGrid();
  const rowCnt = Array(GRID).fill(0), colCnt = Array(GRID).fill(0);
  const filled: [number, number][] = [];
  let guard = 0;
  while (filled.length < density && guard++ < 5000) {
    const r = Math.floor(rand() * GRID), c = Math.floor(rand() * GRID);
    if (g[r][c] || rowCnt[r] >= GRID - 2 || colCnt[c] >= GRID - 2) continue;
    g[r][c] = { color: COLOR_KEYS[Math.floor(rand() * COLOR_KEYS.length)] };
    rowCnt[r]++; colCnt[c]++; filled.push([r, c]);
  }
  const pool = filled.slice();
  const take = (n: number, special: 'star' | 'gem') => {
    for (let i = 0; i < n && pool.length; i++) {
      const idx = Math.floor(rand() * pool.length);
      const [r, c] = pool.splice(idx, 1)[0];
      (g[r][c] as Cell).special = special;
    }
  };
  take(stars + 2, 'star');
  take(gems + 2, 'gem');
  return { level, grid: g, targets: { star: stars, gem: gems } };
}

const cache = new Map<number, LevelConfig>();
export function getLevel(level: number): LevelConfig {
  const n = Math.min(Math.max(1, Math.floor(level)), LEVEL_COUNT);
  let cfg = cache.get(n);
  if (!cfg) { cfg = buildLevel(n); cache.set(n, cfg); }
  return cfg;
}

export function countSpecials(grid: Grid) {
  let star = 0, gem = 0;
  grid.forEach((row) => row.forEach((c) => { if (c?.special === 'star') star++; if (c?.special === 'gem') gem++; }));
  return { star, gem };
}

/** Returns a list of problems (empty = valid). */
export function validateLevel(cfg: LevelConfig): string[] {
  const errs: string[] = [];
  const s = countSpecials(cfg.grid);
  if (s.star < cfg.targets.star) errs.push('not enough stars on board');
  if (s.gem < cfg.targets.gem) errs.push('not enough gems on board');
  const f = fullLines(cfg.grid);
  if (f.rows.length || f.cols.length) errs.push('board starts with a complete line');
  if (cfg.targets.star < 1 && cfg.targets.gem < 1) errs.push('no objective');
  if (cfg.grid.every((r) => r.every(Boolean))) errs.push('board is full');
  return errs;
}
