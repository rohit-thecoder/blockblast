import { canPlace, clearLines, emptyGrid, fullLines, placePiece, previewLines } from '../src/game/engine/board';
import { SHAPES, toPiece } from '../src/game/engine/pieces';
import { createGame, declineRevive, placeAt, revive, REVIVE_BONUS } from '../src/game/engine/engine';
import { scorePlacement } from '../src/game/engine/scoring';
import { analyse, generateShapes, pickPhase } from '../src/game/engine/generator';
import { makeRng } from '../src/game/engine/rng';
import type { GameState, Piece } from '../src/types';

const shape = (family: string, i = 0) => SHAPES.filter((s) => s.family === family)[i];
const piece = (family: string, i = 0): Piece => toPiece(shape(family, i), 99);

describe('pieces', () => {
  it('builds unique orientations without duplicates', () => {
    expect(SHAPES.filter((s) => s.family === 'sq2')).toHaveLength(1);
    expect(SHAPES.filter((s) => s.family === 'line5')).toHaveLength(2);
    expect(SHAPES.filter((s) => s.family === 'lsmall')).toHaveLength(4);
    expect(SHAPES.filter((s) => s.family === 'sz')).toHaveLength(2);
  });
  it('every shape is normalised to the origin', () => {
    SHAPES.forEach((s) => {
      expect(Math.min(...s.cells.map((c) => c[0]))).toBe(0);
      expect(Math.min(...s.cells.map((c) => c[1]))).toBe(0);
    });
  });
});

describe('board', () => {
  it('rejects out-of-bounds and overlapping placement', () => {
    const g = emptyGrid();
    expect(canPlace(g, piece('line5'), 0, 4)).toBe(false);
    expect(canPlace(g, piece('line5'), 0, 3)).toBe(true);
    const g2 = placePiece(g, piece('dot'), 2, 2);
    expect(canPlace(g2, piece('domino'), 2, 1)).toBe(false);
  });
  it('detects and clears full rows and columns, including intersections', () => {
    let g = emptyGrid();
    for (let i = 0; i < 8; i++) { g[3][i] = { color: 'red' }; g[i][5] = { color: 'blue' }; }
    const { rows, cols } = fullLines(g);
    expect(rows).toEqual([3]);
    expect(cols).toEqual([5]);
    const res = clearLines(g, rows, cols);
    expect(res.removed).toHaveLength(15);
    expect(fullLines(res.grid)).toEqual({ rows: [], cols: [] });
  });
  it('previews lines that would clear', () => {
    const g = emptyGrid();
    for (let c = 0; c < 7; c++) g[0][c] = { color: 'red' };
    expect(previewLines(g, piece('dot'), 0, 7).rows).toEqual([0]);
    expect(previewLines(g, piece('dot'), 1, 7).rows).toEqual([]);
  });
});

describe('scoring', () => {
  it('awards cells only without clears and grows with lines and combo', () => {
    expect(scorePlacement(4, 0, 0)).toBe(4);
    expect(scorePlacement(1, 1, 1)).toBe(11);
    expect(scorePlacement(1, 2, 1)).toBe(41);
    expect(scorePlacement(1, 1, 3)).toBeGreaterThan(scorePlacement(1, 1, 1));
  });
});

function withTray(base: GameState, pieces: (Piece | null)[]): GameState { return { ...base, tray: pieces, boostLeft: 0 }; }

describe('game flow', () => {
  it('starts classic with an empty board, 3 pieces and at least one placeable piece', () => {
    const s = createGame('classic', 1, 0, 123);
    expect(s.tray).toHaveLength(3);
    expect(s.grid.flat().every((c) => c === null)).toBe(true);
    expect(s.status).toBe('playing');
  });
  it('invalid placement does not change state', () => {
    const s = withTray(createGame('classic', 1, 0, 5), [piece('line5'), null, null]);
    const r = placeAt(s, 0, 0, 6);
    expect(r.result.ok).toBe(false);
    expect(r.state).toBe(s);
    expect(placeAt(s, 1, 0, 0).result.ok).toBe(false); // empty slot
  });
  it('clears a line, scores it, and increments combo', () => {
    let s = withTray(createGame('classic', 1, 0, 5), [piece('line4'), piece('line4'), piece('dot')]);
    s = placeAt(s, 0, 0, 0).state;
    const r = placeAt(s, 1, 0, 4);
    expect(r.result.rows).toEqual([0]);
    expect(r.result.combo).toBe(1);
    expect(r.state.score).toBe(4 + (4 + 10));
    expect(r.state.grid[0].every((c) => c === null)).toBe(true);
  });
  it('spawns three new pieces only after all three are placed', () => {
    let s = withTray(createGame('classic', 1, 0, 9), [piece('dot'), piece('dot'), piece('dot')]);
    s = placeAt(s, 0, 0, 0).state;
    s = placeAt(s, 1, 1, 1).state;
    expect(s.tray.filter(Boolean)).toHaveLength(1);
    const uidBefore = s.nextUid;
    s = placeAt(s, 2, 2, 2).state;
    expect(s.tray.every(Boolean)).toBe(true);
    expect(s.nextUid).toBe(uidBefore + 3);
  });
  it('goes to revive when nothing fits, then to over after a second failure', () => {
    const base = createGame('classic', 1, 100, 7);
    const g = emptyGrid();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 0) g[r][c] = { color: 'red' };
    // checkerboard: only dots fit; place the last dot so only big pieces remain
    let s: GameState = { ...base, grid: g, tray: [piece('dot'), piece('sq2'), piece('line5')], boostLeft: 0 };
    s = placeAt(s, 0, 0, 1).state;
    expect(s.status).toBe('revive');
    expect(declineRevive(s).status).toBe('over');
  });
  it('revive clears the 2 fullest rows + fullest column, adds 50, deals a boost tray, and works once', () => {
    const base = createGame('classic', 1, 100, 7);
    const g = emptyGrid();
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (!(r >= 6 && c >= 6) && !(r === 2 && c < 3)) g[r][c] = { color: 'blue' };
    g[0][7] = null; // row 0 not full so no accidental clears matter
    const s: GameState = { ...base, grid: g, tray: [piece('sq3'), null, null], status: 'revive', score: 80 };
    const before = g.flat().filter(Boolean).length;
    const r = revive(s);
    expect(r.result.ok).toBe(true);
    expect(r.state.score).toBe(80 + REVIVE_BONUS);
    expect(r.state.revived).toBe(true);
    expect(r.state.tray.filter(Boolean)).toHaveLength(3);
    expect(r.state.grid.flat().filter(Boolean).length).toBeLessThan(before);
    expect(r.result.rows).toHaveLength(2);
    expect(r.result.cols).toHaveLength(1);
    expect(revive({ ...r.state, status: 'revive' }).result.ok).toBe(false);
    expect(r.state.boostLeft).toBeGreaterThanOrEqual(1); // boost phase still running
  });
  it('flags NEW BEST once when beating a previous best', () => {
    let s = withTray(createGame('classic', 1, 3, 5), [piece('line4'), piece('dot'), piece('dot')]);
    const r1 = placeAt(s, 0, 0, 0);
    expect(r1.result.newBest).toBe(true);
    const r2 = placeAt(r1.state, 1, 4, 4);
    expect(r2.result.newBest).toBe(false);
  });
});

describe('generator (boost then kill)', () => {
  it('phase selection', () => {
    expect(pickPhase(2, 500, 100)).toBe('boost');
    expect(pickPhase(0, 90, 100)).toBe('kill');
    expect(pickPhase(0, 10, 100)).toBe('normal');
    expect(pickPhase(0, 10, 0)).toBe('normal');
  });
  it('boost trays contain a line-completing piece when one exists', () => {
    const g = emptyGrid();
    for (let c = 0; c < 6; c++) g[7][c] = { color: 'red' };
    for (let seed = 1; seed <= 25; seed++) {
      const rng = makeRng(seed);
      const tray = generateShapes(g, 'boost', () => rng.next());
      const info = analyse(g);
      expect(tray.some((s) => info.find((i) => i.shape === s)!.completes)).toBe(true);
    }
  });
  it('kill trays are harder on average than boost trays and always keep one piece placeable', () => {
    const g = emptyGrid();
    for (let c = 0; c < 6; c++) g[7][c] = { color: 'red' };
    const hard = (phase: 'boost' | 'kill') => {
      let n = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const rng = makeRng(seed * 31);
        const t = generateShapes(g, phase, () => rng.next());
        n += t.filter((s) => s.tier === 'hard').length;
        expect(t.some((s) => canPlace(g, s, 0, 0) || analyse(g).find((i) => i.shape === s)!.fits)).toBe(true);
      }
      return n;
    };
    expect(hard('kill')).toBeGreaterThan(hard('boost') * 1.5);
  });
  it('is deterministic for a given seed', () => {
    const a = createGame('classic', 1, 0, 4242), b = createGame('classic', 1, 0, 4242);
    expect(a.tray.map((p) => p!.family + p!.cells.join())).toEqual(b.tray.map((p) => p!.family + p!.cells.join()));
  });
});
