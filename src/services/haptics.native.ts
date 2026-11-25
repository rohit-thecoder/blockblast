import * as Haptics from 'expo-haptics';

let enabled = true;
export const setHapticsEnabled = (value: boolean) => { enabled = value; };
const run = (action: () => Promise<void>) => { if (enabled) void action().catch(() => {}); };

export const hapticPickup = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
export const hapticDrop = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const hapticClear = (lines: number) =>
  run(() => (lines > 1 ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success) : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)));
export const hapticError = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
