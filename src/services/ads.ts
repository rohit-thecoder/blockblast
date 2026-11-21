import {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const PROD_BANNER_ID = process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '';
const PROD_INTERSTITIAL_ID = process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '';
const PROD_REWARDED_ID = process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? '';

export const BANNER_AD_ID = __DEV__ || !PROD_BANNER_ID ? TestIds.BANNER : PROD_BANNER_ID;
const INTERSTITIAL_AD_ID = __DEV__ || !PROD_INTERSTITIAL_ID ? TestIds.INTERSTITIAL : PROD_INTERSTITIAL_ID;
const REWARDED_AD_ID = __DEV__ || !PROD_REWARDED_ID ? TestIds.REWARDED : PROD_REWARDED_ID;

// --- 1. INTERSTITIAL AD (Preloaded) ---
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

// --- 2. REWARDED AD (Preloaded) ---
const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_ID, {
  requestNonPersonalizedAdsOnly: false,
});
let rewardedLoaded = false;
let pendingRewardCallback: (() => void) | null = null;

rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
  rewardedLoaded = true;
});
rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
  if (pendingRewardCallback) {
    pendingRewardCallback();
    pendingRewardCallback = null;
  }
});
rewarded.addAdEventListener(AdEventType.CLOSED, () => {
  rewardedLoaded = false;
  pendingRewardCallback = null;
  rewarded.load();
});
rewarded.addAdEventListener(AdEventType.ERROR, () => {
  rewardedLoaded = false;
});

export function initAds() {
  try {
    interstitial.load();
    rewarded.load();
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

export function showRewarded(onReward: () => void): boolean {
  if (rewardedLoaded) {
    pendingRewardCallback = onReward;
    rewarded.show();
    return true;
  }
  rewarded.load();
  return false;
}