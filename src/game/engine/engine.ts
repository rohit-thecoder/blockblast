import type { GameState, Grid, Mode, PlaceResult, Piece } from '../../types';
import { GRID } from '../../constants/theme';
import { canPlace, canPlaceAnywhere, clearLines, colFill, emptyGrid, fullLines, placePiece, rowFill } from './board';
import { generateTray, pickPhase } from './generator';
import { makeRng } from './rng';
import { scorePlacement } from './scoring';
import { getLevel, LEVEL_COUNT } from '../levels/levels';

export const REVIVE_BONUS = 50;
export const BOOST_TRAYS = 2;

function dealTray(s: GameState): GameState {
  const rng = makeRng(s.seed);
  const phase = pickPhase(s.boostLeft, s.score, s.best);
  const tray = generateTray(s.grid, phase, () => rng.next(), s.nextUid);
  return {
    ...s,
    tray,
    seed: rng.state,
    nextUid: s.nextUid + 3,
    trayCount: s.trayCount + 1,
    boostLeft: Math.max(0, s.boostLeft - 1),
  };
}

export function createGame(mode: Mode, level: number, best: number, seed = (Date.now() & 0x7fffffff) | 1): GameState {
  let grid: Grid = emptyGrid();
  let targets = { star: 0, gem: 0 };
  let lv = 1;
  if (mode === 'collect') {
    const cfg = getLevel(level);
    lv = cfg.level;
    grid = cfg.grid.map((r) => r.map((c) => (c ? { ...c } : null)));
    targets = { ...cfg.targets };
  }
  return dealTray({
    mode,
    level: lv,
    grid,
    tray: [],
    score: 0,
    best,
    combo: 0,
    boostLeft: BOOST_TRAYS,
    revived: false,
    newBestShown: false,
    status: 'playing',
    targets,
    collected: { star: 0, gem: 0 },
    seed,
    nextUid: 1,
    trayCount: 0,
  });
}

const noResult: PlaceResult = { ok: false, rows: [], cols: [], clearedCells: [], gained: 0, combo: 0, newBest: false };

/**
 * Endless / Continuous Loop Handler:
 * Never triggers 'revive' or 'over' interruptions.
 * If remaining tray pieces cannot fit on the board, automatically clears the fullest lines
 * and refreshes the tray with fitting pieces while preserving score, best, and combo!
 */
function ensurePlayableEndless(s: GameState): { state: GameState; autoCleared: { rows: number[]; cols: number[]; removed: { r: number; c: number; cell: { color: any; special?: any } }[] } } {
  if (s.mode === 'collect' && s.collected.star >= s.targets.star && s.collected.gem >= s.targets.gem) {
    return { state: { ...s, status: 'won' }, autoCleared: { rows: [], cols: [], removed: [] } };
  }

  let cur: GameState = { ...s, status: 'playing', revived: false };
  const autoRows: number[] = [];
  const autoCols: number[] = [];
  const autoRemoved: { r: number; c: number; cell: { color: any; special?: any } }[] = [];

  let guard = 0;
  while (guard++ < 6) {
    const remaining = cur.tray.filter((p): p is Piece => !!p);
    if (remaining.length === 0) {
      cur = dealTray(cur);
      continue;
    }
    if (remaining.some((p) => canPlaceAnywhere(cur.grid, p))) {
      break;
    }

    // Board is too tight for current pieces: clear 2 fullest rows & 2 fullest cols smoothly
    const rank = (n: number, f: (i: number) => number) =>
      Array.from({ length: n }, (_, i) => i).sort((a, b) => f(b) - f(a) || a - b);

    const rows = rank(GRID, (r) => rowFill(cur.grid, r)).filter((r) => rowFill(cur.grid, r) > 0).slice(0, 2);
    const cols = rank(GRID, (c) => colFill(cur.grid, c)).filter((c) => colFill(cur.grid, c) > 0).slice(0, 2);

    if (rows.length === 0 && cols.length === 0) {
      // Fallback: reset board grid keeping score & best intact
      cur = { ...cur, grid: emptyGrid(), boostLeft: BOOST_TRAYS };
      cur = dealTray(cur);
      break;
    }

    const { grid, removed } = clearLines(cur.grid, rows, cols);
    const collected = { ...cur.collected };
    removed.forEach(({ cell }) => {
      if (cell.special) collected[cell.special]++;
    });

    autoRows.push(...rows);
    autoCols.push(...cols);
    autoRemoved.push(...removed);

    cur = {
      ...cur,
      grid,
      collected,
      boostLeft: BOOST_TRAYS,
    };
    // Deal fresh fitting tray pieces for the cleared space
    cur = dealTray(cur);
  }

  // Final safety net: if still blocked after 6 passes, clear board keeping score/best
  const finalRemaining = cur.tray.filter((p): p is Piece => !!p);
  if (!finalRemaining.some((p) => canPlaceAnywhere(cur.grid, p))) {
    cur = { ...cur, grid: emptyGrid(), boostLeft: BOOST_TRAYS };
    cur = dealTray(cur);
  }

  cur.status = 'playing';
  return {
    state: cur,
    autoCleared: {
      rows: Array.from(new Set(autoRows)),
      cols: Array.from(new Set(autoCols)),
      removed: autoRemoved,
    },
  };
}

export function placeAt(state: GameState, slot: number, row: number, col: number): { state: GameState; result: PlaceResult } {
  const piece = state.tray[slot];
  if (state.status !== 'playing' || !piece || !canPlace(state.grid, piece, row, col)) {
    return { state, result: noResult };
  }

  const placed = placePiece(state.grid, piece, row, col);
  const { rows, cols } = fullLines(placed);
  const lines = rows.length + cols.length;
  const { grid, removed } = clearLines(placed, rows, cols);

  const collected = { ...state.collected };
  removed.forEach(({ cell }) => { if (cell.special) collected[cell.special]++; });

  const combo = lines > 0 ? state.combo + 1 : 0;
  const gained = scorePlacement(piece.cells.length, lines, combo);
  const score = state.score + gained;
  const newBest = state.best > 0 && score > state.best && !state.newBestShown;

  let next: GameState = {
    ...state,
    grid,
    collected,
    combo,
    score,
    best: Math.max(state.best, score),
    newBestShown: state.newBestShown || newBest,
    tray: state.tray.map((p, i) => (i === slot ? null : p)),
  };

  if (next.tray.every((p) => p === null)) {
    next = dealTray(next);
  }

  const ensured = ensurePlayableEndless(next);
  next = ensured.state;

  const allRows = Array.from(new Set([...rows, ...ensured.autoCleared.rows]));
  const allCols = Array.from(new Set([...cols, ...ensured.autoCleared.cols]));
  const allCleared = [...removed, ...ensured.autoCleared.removed].map(({ r, c, cell }) => ({
    r,
    c,
    color: cell.color,
  }));

  return {
    state: next,
    result: {
      ok: true,
      rows: allRows,
      cols: allCols,
      clearedCells: allCleared,
      gained,
      combo,
      newBest,
    },
  };
}

/** Kept for backward compatibility; clears fullest lines without ending game */
export function revive(state: GameState): { state: GameState; result: PlaceResult } {
  const rank = (n: number, f: (i: number) => number) =>
    Array.from({ length: n }, (_, i) => i).sort((a, b) => f(b) - f(a) || a - b);
  const rows = rank(GRID, (r) => rowFill(state.grid, r)).slice(0, 2);
  const cols = rank(GRID, (c) => colFill(state.grid, c)).slice(0, 1);
  const { grid, removed } = clearLines(state.grid, rows, cols);
  const collected = { ...state.collected };
  removed.forEach(({ cell }) => { if (cell.special) collected[cell.special]++; });
  let next: GameState = {
    ...state,
    grid,
    collected,
    score: state.score + REVIVE_BONUS,
    best: Math.max(state.best, state.score + REVIVE_BONUS),
    revived: false,
    status: 'playing',
    combo: 0,
    boostLeft: BOOST_TRAYS,
  };
  next = dealTray(next);
  next = ensurePlayableEndless(next).state;
  return {
    state: next,
    result: {
      ok: true,
      rows,
      cols,
      gained: REVIVE_BONUS,
      combo: 0,
      newBest: false,
      clearedCells: removed.map(({ r, c, cell }) => ({ r, c, color: cell.color })),
    },
  };
}

export function declineRevive(state: GameState): GameState {
  return ensurePlayableEndless({ ...state, status: 'playing' }).state;
}

export const hasNextLevel = (level: number) => level < LEVEL_COUNT;
