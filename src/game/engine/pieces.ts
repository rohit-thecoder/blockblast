import type { ColorKey, Piece } from '../../types';

export type Tier = 'easy' | 'medium' | 'hard';
interface Family { id: string; rows: string[]; color: ColorKey; tier: Tier; rotate: boolean }

const F = (id: string, rows: string[], color: ColorKey, tier: Tier, rotate = true): Family =>
  ({ id, rows, color, tier, rotate });

export const FAMILIES: Family[] = [
  F('dot', ['X'], 'cyan', 'easy', false),
  F('domino', ['XX'], 'orange', 'easy'),
  F('tri', ['XXX'], 'gold', 'easy'),
  F('lsmall', ['XX', 'X.'], 'purple', 'easy'),
  F('sq2', ['XX', 'XX'], 'red', 'easy', false),
  F('line4', ['XXXX'], 'cyan', 'medium'),
  F('rect23', ['XXX', 'XXX'], 'blue', 'medium'),
  F('ltet', ['X.', 'X.', 'XX'], 'orange', 'medium'),
  F('jtet', ['.X', '.X', 'XX'], 'blue', 'medium'),
  F('tet', ['XXX', '.X.'], 'cyan', 'medium'),
  F('sz', ['.XX', 'XX.'], 'green', 'hard'),
  F('zs', ['XX.', '.XX'], 'green', 'hard'),
  F('line5', ['XXXXX'], 'gold', 'hard'),
  F('l3', ['X..', 'X..', 'XXX'], 'purple', 'hard'),
  F('sq3', ['XXX', 'XXX', 'XXX'], 'purple', 'hard', false),
];

type Cells = [number, number][];
const parse = (rows: string[]): Cells => {
  const out: Cells = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'X') out.push([r, c]); }));
  return out;
};
const normalize = (cells: Cells): Cells => {
  const mr = Math.min(...cells.map((c) => c[0]));
  const mc = Math.min(...cells.map((c) => c[1]));
  return cells.map(([r, c]) => [r - mr, c - mc] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
};
const rot = (cells: Cells): Cells => normalize(cells.map(([r, c]) => [c, -r] as [number, number]));
const key = (cells: Cells) => cells.map((c) => c.join(',')).join(';');

export interface Shape { family: string; color: ColorKey; tier: Tier; cells: Cells; w: number; h: number }

function buildShapes(): Shape[] {
  const out: Shape[] = [];
  for (const f of FAMILIES) {
    let cur = normalize(parse(f.rows));
    const seen = new Set<string>();
    for (let i = 0; i < (f.rotate ? 4 : 1); i++) {
      const k = key(cur);
      if (!seen.has(k)) {
        seen.add(k);
        out.push({
          family: f.id, color: f.color, tier: f.tier, cells: cur,
          w: Math.max(...cur.map((c) => c[1])) + 1, h: Math.max(...cur.map((c) => c[0])) + 1,
        });
      }
      cur = rot(cur);
    }
  }
  return out;
}
/** Every distinct orientation of every piece family */
export const SHAPES: Shape[] = buildShapes();

export function toPiece(shape: Shape, uid: number): Piece {
  return { uid, family: shape.family, color: shape.color, cells: shape.cells, w: shape.w, h: shape.h };
}
