import { REMINDERS } from '../constants/reminders';

/** TypeScript/Jest fallback; Metro resolves the native or web implementation. */
export const CHANNEL_ID = 'daily-reminders';
export const notificationsAvailable = false;
export { REMINDERS };
export function configureNotifications() {}
export async function requestPermission(): Promise<boolean> { return false; }
export async function cancelReminders() {}
export async function scheduleReminders(): Promise<boolean> { return false; }
export async function setRemindersEnabled(_on: boolean): Promise<boolean> { return false; }
