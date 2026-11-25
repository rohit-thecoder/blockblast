import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { REMINDERS } from '../constants/reminders';

export const CHANNEL_ID = 'daily-reminders';
export const notificationsAvailable = true;
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

export async function requestPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch { return false; }
}

export async function cancelReminders() {
  try { await Promise.all(REMINDERS.map((reminder) => Notifications.cancelScheduledNotificationAsync(reminder.id))); } catch {}
}

export async function scheduleReminders(): Promise<boolean> {
  try {
    await ensureChannel();
    await cancelReminders();
    for (const reminder of REMINDERS) {
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: { title: reminder.title, body: reminder.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: reminder.hour, minute: reminder.minute, channelId: CHANNEL_ID },
      });
    }
    return true;
  } catch { return false; }
}

export async function setRemindersEnabled(on: boolean): Promise<boolean> {
  if (!on) { await cancelReminders(); return false; }
  if (!(await requestPermission())) return false;
  return scheduleReminders();
}
