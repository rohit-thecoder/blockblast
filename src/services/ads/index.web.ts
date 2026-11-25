/** The subset of PokiSDK used by the game. It is supplied by Poki at runtime. */
interface PokiSdk {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
}

declare global {
  interface Window { PokiSDK?: PokiSdk }
}

const SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
const SDK_SELECTOR = 'script[data-blockblast-poki-sdk]';
let initialization: Promise<boolean> | null = null;
let commercialBreak: Promise<boolean> | null = null;
let initialized = false;

function loadSdkScript(): Promise<void> {
  if (typeof document === 'undefined') return Promise.reject(new Error('Poki SDK requires a browser'));
  if (window.PokiSDK) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(SDK_SELECTOR);
    const script = existing ?? document.createElement('script');
    const timeout = window.setTimeout(() => reject(new Error('Timed out loading Poki SDK')), 10_000);
    const finish = (callback: () => void) => () => {
      window.clearTimeout(timeout);
      callback();
    };

    script.addEventListener('load', finish(resolve), { once: true });
    script.addEventListener('error', finish(() => reject(new Error('Unable to load Poki SDK'))), { once: true });
    if (!existing) {
      script.async = true;
      script.src = SDK_URL;
      script.dataset.blockblastPokiSdk = 'true';
      document.head.appendChild(script);
    }
  });
}

/** Loads Poki opportunistically; a blocked SDK never blocks local play. */
export async function initAds(): Promise<boolean> {
  if (initialization) return initialization;
  initialization = (async () => {
    await loadSdkScript();
    if (!window.PokiSDK) throw new Error('Poki SDK did not expose its API');
    await window.PokiSDK.init();
    initialized = true;
    return true;
  })().catch(() => false);
  return initialization;
}

function withSdk(callback: (sdk: PokiSdk) => void) {
  if (!initialized || typeof window === 'undefined' || !window.PokiSDK) return;
  try { callback(window.PokiSDK); } catch { /* SDK failures must not affect the game. */ }
}

export function notifyGameLoadingFinished() { withSdk((sdk) => sdk.gameLoadingFinished()); }
export function notifyGameplayStart() { withSdk((sdk) => sdk.gameplayStart()); }
export function notifyGameplayStop() { withSdk((sdk) => sdk.gameplayStop()); }

/**
 * Poki decides whether an opportunity becomes an actual ad. Concurrent calls
 * are ignored so a double click cannot start two commercial breaks.
 */
export async function showTransitionAd(): Promise<boolean> {
  if (commercialBreak) return false;
  if (!(await initAds())) return false;
  if (!window.PokiSDK) return false;

  commercialBreak = window.PokiSDK.commercialBreak()
    .then(() => true)
    .catch(() => false)
    .finally(() => { commercialBreak = null; });
  return commercialBreak;
}

/** Mid-game interruptions are not appropriate for the Poki version. */
export const supportsMidGameAds = false;
export const showInterstitial = showTransitionAd;

/** Poki monetizes the web build; there are no third-party banner ads. */
export function AdBanner() { return null; }
