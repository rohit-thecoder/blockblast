/** TypeScript/Jest fallback; Metro resolves the native or web implementation. */
let enabled = true;
export const setHapticsEnabled = (value: boolean) => { enabled = value; };
export const hapticPickup = () => { if (enabled) return; };
export const hapticDrop = () => { if (enabled) return; };
export const hapticClear = (_lines: number) => { if (enabled) return; };
export const hapticError = () => { if (enabled) return; };
