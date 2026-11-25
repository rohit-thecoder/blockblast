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

/** Moves the game to its documented revive/game-over state when no tray piece fits. */
function resolveBlockedState(s: GameState): GameState {
  if (s.mode === 'collect' && s.collected.star >= s.targets.star && s.collected.gem >= s.targets.gem) {
    return { ...s, status: 'won' };
  }
  const remaining = s.tray.filter((piece): piece is Piece => !!piece);
  if (remaining.some((piece) => canPlaceAnywhere(s.grid, piece))) return { ...s, status: 'playing' };
  if (s.mode === 'classic' && !s.revived) return { ...s, status: 'revive' };
  return { ...s, status: 'over' };
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

  next = resolveBlockedState(next);

  const clearedCells = removed.map(({ r, c, cell }) => ({
    r,
    c,
    color: cell.color,
  }));

  return {
    state: next,
    result: {
      ok: true,
      rows,
      cols,
      clearedCells,
      gained,
      combo,
      newBest,
    },
  };
}

export function revive(state: GameState): { state: GameState; result: PlaceResult } {
  if (state.status !== 'revive' || state.revived) return { state, result: noResult };
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
    revived: true,
    status: 'playing',
    combo: 0,
    boostLeft: BOOST_TRAYS,
  };
  next = dealTray(next);
  next = resolveBlockedState(next);
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
  return state.status === 'revive' ? { ...state, status: 'over' } : state;
}

export const hasNextLevel = (level: number) => level < LEVEL_COUNT;
