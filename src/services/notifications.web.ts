import { REMINDERS } from '../constants/reminders';

export const CHANNEL_ID = 'daily-reminders';
export const notificationsAvailable = false;
export { REMINDERS };

/** Poki games must not ask browser notification permission. */
export function configureNotifications() {}
export async function requestPermission(): Promise<boolean> { return false; }
export async function cancelReminders() {}
export async function scheduleReminders(): Promise<boolean> { return false; }
export async function setRemindersEnabled(_on: boolean): Promise<boolean> { return false; }
