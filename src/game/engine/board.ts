import { GRID } from '../../constants/theme';
import type { Cell, Grid, Piece } from '../../types';

export const emptyGrid = (): Grid => Array.from({ length: GRID }, () => Array<Cell | null>(GRID).fill(null));
export const cloneGrid = (g: Grid): Grid => g.map((row) => row.slice());

type Shapeish = { cells: ReadonlyArray<readonly [number, number]> };

export function canPlace(grid: Grid, piece: Shapeish, row: number, col: number): boolean {
  for (const [dr, dc] of piece.cells) {
    const r = row + dr, c = col + dc;
    if (r < 0 || c < 0 || r >= GRID || c >= GRID || grid[r][c]) return false;
  }
  return true;
}

export function findPlacements(grid: Grid, piece: Shapeish, limit = Infinity): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (canPlace(grid, piece, r, c)) { out.push([r, c]); if (out.length >= limit) return out; }
  return out;
}
export const canPlaceAnywhere = (grid: Grid, piece: Shapeish) => findPlacements(grid, piece, 1).length > 0;

export function placePiece(grid: Grid, piece: Piece, row: number, col: number): Grid {
  const g = cloneGrid(grid);
  for (const [dr, dc] of piece.cells) g[row + dr][col + dc] = { color: piece.color };
  return g;
}

export function fullLines(grid: Grid): { rows: number[]; cols: number[] } {
  const rows: number[] = [], cols: number[] = [];
  for (let r = 0; r < GRID; r++) if (grid[r].every(Boolean)) rows.push(r);
  for (let c = 0; c < GRID; c++) if (grid.every((row) => row[c])) cols.push(c);
  return { rows, cols };
}

export function clearLines(grid: Grid, rows: number[], cols: number[]) {
  const g = cloneGrid(grid);
  const removed: { r: number; c: number; cell: Cell }[] = [];
  const mark = new Set<string>();
  rows.forEach((r) => { for (let c = 0; c < GRID; c++) mark.add(`${r},${c}`); });
  cols.forEach((c) => { for (let r = 0; r < GRID; r++) mark.add(`${r},${c}`); });
  mark.forEach((k) => {
    const [r, c] = k.split(',').map(Number);
    const cell = g[r][c];
    if (cell) removed.push({ r, c, cell });
    g[r][c] = null;
  });
  return { grid: g, removed };
}

export function previewLines(grid: Grid, piece: Piece, row: number, col: number) {
  if (!canPlace(grid, piece, row, col)) return { rows: [] as number[], cols: [] as number[] };
  return fullLines(placePiece(grid, piece, row, col));
}

export const countFilled = (grid: Grid) => grid.reduce((n, row) => n + row.filter(Boolean).length, 0);
export const rowFill = (grid: Grid, r: number) => grid[r].filter(Boolean).length;
export const colFill = (grid: Grid, c: number) => grid.filter((row) => row[c]).length;
