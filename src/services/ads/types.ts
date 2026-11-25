export type AdBreakResult = boolean;

/** Platform-specific advertising contract used by the game controller. */
export interface AdsService {
  initAds(): Promise<boolean>;
  showInterstitial(): Promise<AdBreakResult>;
  showTransitionAd(): Promise<AdBreakResult>;
  notifyGameLoadingFinished(): void;
  notifyGameplayStart(): void;
  notifyGameplayStop(): void;
}
