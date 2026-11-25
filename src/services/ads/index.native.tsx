import mobileAds, { AdEventType, BannerAd, BannerAdSize, InterstitialAd, TestIds } from 'react-native-google-mobile-ads';

const PROD_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '';
const PROD_INTERSTITIAL_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '';

export const BANNER_AD_ID = __DEV__ || !PROD_BANNER_ID ? TestIds.BANNER : PROD_BANNER_ID;
const INTERSTITIAL_AD_ID = __DEV__ || !PROD_INTERSTITIAL_ID ? TestIds.INTERSTITIAL : PROD_INTERSTITIAL_ID;

const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_ID, {
  requestNonPersonalizedAdsOnly: false,
});
let interstitialLoaded = false;

interstitial.addAdEventListener(AdEventType.LOADED, () => { interstitialLoaded = true; });
interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  interstitialLoaded = false;
  interstitial.load();
});
interstitial.addAdEventListener(AdEventType.ERROR, () => { interstitialLoaded = false; });

/** Android/iOS keep their existing AdMob initialization and placement policy. */
export async function initAds(): Promise<boolean> {
  try {
    await mobileAds().initialize();
    interstitial.load();
    return true;
  } catch {
    return false;
  }
}

export async function showInterstitial(): Promise<boolean> {
  try {
    if (interstitialLoaded) {
      interstitial.show();
      return true;
    }
    interstitial.load();
  } catch {
    // The game remains playable if an ad request fails.
  }
  return false;
}

/** Web-only transition ads intentionally do nothing on native. */
export async function showTransitionAd(): Promise<boolean> { return false; }

/** Native AdMob keeps the established mid-game placement behaviour. */
export const supportsMidGameAds = true;

export function notifyGameLoadingFinished() {}
export function notifyGameplayStart() {}
export function notifyGameplayStop() {}

export function AdBanner() {
  return (
    <BannerAd
      unitId={BANNER_AD_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
    />
  );
}
