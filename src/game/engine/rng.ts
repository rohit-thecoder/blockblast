/** mulberry32: deterministic, serialisable (state is a single uint32) */
export function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) >>> 0;
  const next = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return {
    next(): number { const [v, n] = nextRandom(s); s = n; return v; },
    get state() { return s; },
  };
}
