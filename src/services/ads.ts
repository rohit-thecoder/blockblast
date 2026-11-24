import {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

const PROD_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '';
const PROD_INTERSTITIAL_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '';

export const BANNER_AD_ID = __DEV__ || !PROD_BANNER_ID ? TestIds.BANNER : PROD_BANNER_ID;
const INTERSTITIAL_AD_ID = __DEV__ || !PROD_INTERSTITIAL_ID ? TestIds.INTERSTITIAL : PROD_INTERSTITIAL_ID;

const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_ID, {
  requestNonPersonalizedAdsOnly: false,
});
let interstitialLoaded = false;

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  interstitialLoaded = true;
});
interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  interstitialLoaded = false;
  interstitial.load();
});
interstitial.addAdEventListener(AdEventType.ERROR, () => {
  interstitialLoaded = false;
});

export function initAds() {
  try {
    interstitial.load();
  } catch {}
}

export function showInterstitial(): boolean {
  if (interstitialLoaded) {
    interstitial.show();
    return true;
  }
  interstitial.load();
  return false;
}