import { countSpecials, getLevel, LEVEL_COUNT, validateLevel } from '../src/game/levels/levels';
import { createGame, placeAt } from '../src/game/engine/engine';
import { emptyGrid } from '../src/game/engine/board';
import { SHAPES, toPiece } from '../src/game/engine/pieces';

describe('collect levels', () => {
  it('provides every requested level and each one validates', () => {
    for (let n = 1; n <= LEVEL_COUNT; n++) {
      const cfg = getLevel(n);
      expect(cfg.level).toBe(n);
      expect(validateLevel(cfg)).toEqual([]);
    }
  });
  it('levels are distinct and deterministic', () => {
    const sig = (n: number) => JSON.stringify(getLevel(n).grid);
    const set = new Set(Array.from({ length: LEVEL_COUNT }, (_, i) => sig(i + 1)));
    expect(set.size).toBe(LEVEL_COUNT);
    expect(sig(7)).toBe(JSON.stringify(getLevel(7).grid));
  });
  it('difficulty ramps up', () => {
    expect(getLevel(LEVEL_COUNT).targets.star).toBeGreaterThan(getLevel(1).targets.star);
  });
  it('clamps out-of-range level numbers', () => {
    expect(getLevel(0).level).toBe(1);
    expect(getLevel(9999).level).toBe(LEVEL_COUNT);
  });
  it('clearing a line holding specials collects them and winning flips status', () => {
    const base = createGame('collect', 1, 0, 11);
    const g = emptyGrid();
    for (let c = 0; c < 7; c++) g[0][c] = { color: 'red', special: c === 0 ? 'star' : c === 1 ? 'gem' : undefined };
    const dot = toPiece(SHAPES.find((s) => s.family === 'dot')!, 50);
    const s = { ...base, grid: g, tray: [dot, null, null], boostLeft: 0, targets: { star: 1, gem: 1 } };
    const r = placeAt(s, 0, 0, 7);
    expect(r.state.collected).toEqual({ star: 1, gem: 1 });
    expect(r.state.status).toBe('won');
  });
  it('level boards keep their special tiles on filled cells', () => {
    const cfg = getLevel(10);
    const sp = countSpecials(cfg.grid);
    expect(sp.star).toBe(cfg.targets.star + 2);
  });
});
