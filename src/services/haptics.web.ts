let enabled = true;
export const setHapticsEnabled = (value: boolean) => { enabled = value; };

function vibrate(pattern: number | number[]) {
  if (!enabled || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(pattern); } catch { /* Vibration is optional in browsers. */ }
}

export const hapticPickup = () => vibrate(8);
export const hapticDrop = () => vibrate(14);
export const hapticClear = (lines: number) => vibrate(lines > 1 ? [18, 25, 35] : 22);
export const hapticError = () => vibrate([12, 25, 12]);
