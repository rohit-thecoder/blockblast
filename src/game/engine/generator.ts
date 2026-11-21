import type { Grid, Piece } from '../../types';
import { canPlace, canPlaceAnywhere, fullLines, placePiece } from './board';
import { SHAPES, toPiece, type Shape } from './pieces';
import { GRID } from '../../constants/theme';

export type Phase = 'boost' | 'normal' | 'kill';

/** Always keep game rewarding and playable without punishing kill streaks */
export function pickPhase(boostLeft: number, _score: number, _best: number): Phase {
  if (boostLeft > 0) return 'boost';
  return 'normal';
}

interface Info { shape: Shape; fits: boolean; completes: boolean }

export function analyse(grid: Grid): Info[] {
  return SHAPES.map((shape) => {
    let fits = false, completes = false;
    outer: for (let r = 0; r < GRID; r++)
      for (let c = 0; c < GRID; c++) {
        if (!canPlace(grid, shape, r, c)) continue;
        fits = true;
        const f = fullLines(placePiece(grid, toPiece(shape, 0), r, c));
        if (f.rows.length + f.cols.length > 0) { completes = true; break outer; }
      }
    return { shape, fits, completes };
  });
}

type Rand = () => number;
function weightedPick(items: Info[], weight: (i: Info) => number, rand: Rand, avoid: Set<string>): Info | null {
  const pool = items.filter((i) => weight(i) > 0);
  const pref = pool.filter((i) => !avoid.has(i.shape.family));
  const list = pref.length ? pref : pool;
  const total = list.reduce((s, i) => s + weight(i), 0);
  if (!list.length || total <= 0) return null;
  let x = rand() * total;
  for (const i of list) { x -= weight(i); if (x <= 0) return i; }
  return list[list.length - 1];
}

export function generateShapes(grid: Grid, phase: Phase, rand: Rand): Shape[] {
  const infos = analyse(grid);
  const chosen: Shape[] = [];
  const used = new Set<string>();
  const add = (i: Info | null) => { if (i) { chosen.push(i.shape); used.add(i.shape.family); } };

  if (phase === 'boost') {
    const helpers = infos.filter((i) => i.completes);
    const want = helpers.length >= 2 && rand() < 0.6 ? 2 : 1;
    for (let k = 0; k < want; k++) add(weightedPick(helpers, () => 1, rand, used));
    if (chosen.length === 0) add(weightedPick(infos.filter((i) => i.fits && i.shape.tier !== 'hard'), () => 1, rand, used));
    while (chosen.length < 3)
      add(weightedPick(infos, (i) => (i.fits ? (i.shape.tier === 'hard' ? 0.35 : 1.2) : 0.1), rand, used));
  } else {
    // Prefer pieces that actually fit on the current board so the endless loop stays smooth
    while (chosen.length < 3) {
      add(
        weightedPick(
          infos,
          (i) => {
            const base = { easy: 2.2, medium: 2.0, hard: 1.0 }[i.shape.tier];
            return base * (i.fits ? 2.5 : 0.25) * (i.completes ? 1.4 : 1);
          },
          rand,
          used
        )
      );
    }
  }

  // Guarantee at least 1 piece in the tray fits on the board if any empty space exists
  if (!chosen.some((s) => canPlaceAnywhere(grid, s))) {
    const fitting = infos.filter((i) => i.fits);
    const pick = fitting.length ? fitting[Math.floor(rand() * fitting.length) % fitting.length] : null;
    if (pick) chosen[Math.floor(rand() * 3) % 3] = pick.shape;
  }
  return chosen.slice(0, 3);
}

export function generateTray(grid: Grid, phase: Phase, rand: Rand, startUid: number): Piece[] {
  return generateShapes(grid, phase, rand).map((s, i) => toPiece(s, startUid + i));
}
