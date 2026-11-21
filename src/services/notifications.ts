import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { REMINDERS } from '../constants/reminders';

export const CHANNEL_ID = 'daily-reminders';
export { REMINDERS };

export function configureNotifications() {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
  } catch {}
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily reminders', importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Asks only if permission can still be requested (never nags after denial). */
export async function requestPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    if (!cur.canAskAgain) return false;
    const res = await Notifications.requestPermissionsAsync();
    return res.granted;
  } catch { return false; }
}

export async function cancelReminders() {
  try {
    await Promise.all(REMINDERS.map((r) => Notifications.cancelScheduledNotificationAsync(r.id)));
  } catch {}
}

/** Cancel-then-schedule with fixed identifiers => never duplicates. */
export async function scheduleReminders(): Promise<boolean> {
  try {
    await ensureChannel();
    await cancelReminders();
    for (const r of REMINDERS) {
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute, channelId: CHANNEL_ID },
      });
    }
    return true;
  } catch { return false; }
}

/** Turn reminders on/off; returns the resulting enabled state. */
export async function setRemindersEnabled(on: boolean): Promise<boolean> {
  if (!on) { await cancelReminders(); return false; }
  if (!(await requestPermission())) return false;
  return scheduleReminders();
}
