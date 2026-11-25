/**
 * TypeScript/Jest fallback. Metro always selects index.native.tsx or
 * index.web.ts first, so native-only advertising never reaches a web bundle.
 */
export async function initAds(): Promise<boolean> { return false; }
export async function showInterstitial(): Promise<boolean> { return false; }
export async function showTransitionAd(): Promise<boolean> { return false; }
export const supportsMidGameAds = false;
export function notifyGameLoadingFinished() {}
export function notifyGameplayStart() {}
export function notifyGameplayStop() {}
export function AdBanner() { return null; }
