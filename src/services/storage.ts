import type { Mode, Settings } from '../types';
import { getStoredItem, setStoredItem } from './storageBackend';

const KEY = 'blockblast:save';
export const SCHEMA_VERSION = 1;

export interface SaveData {
  version: number;
  best: number;
  collectLevel: number;
  settings: Settings;
  notif: { scheduled: boolean; asked: boolean };
}

export const defaultSave = (): SaveData => ({
  version: SCHEMA_VERSION,
  best: 0,
  collectLevel: 1,
  settings: { sound: true, haptics: true, notifications: false, mode: 'classic' },
  notif: { scheduled: false, asked: false },
});

const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
const int = (value: unknown, fallback: number, min = 0) =>
  (typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.floor(value)) : fallback);

/** Validates unknown JSON into safe, forward-compatible save data. */
export function sanitize(raw: unknown): SaveData {
  const defaults = defaultSave();
  if (!raw || typeof raw !== 'object') return defaults;
  const value = raw as Record<string, unknown>;
  const settings = (value.settings ?? {}) as Record<string, unknown>;
  const notification = (value.notif ?? {}) as Record<string, unknown>;
  const mode: Mode = settings.mode === 'collect' ? 'collect' : 'classic';
  return {
    version: SCHEMA_VERSION,
    best: int(value.best, 0),
    collectLevel: int(value.collectLevel, 1, 1),
    settings: {
      sound: bool(settings.sound, defaults.settings.sound),
      haptics: bool(settings.haptics, defaults.settings.haptics),
      notifications: bool(settings.notifications, false),
      mode,
    },
    notif: { scheduled: bool(notification.scheduled, false), asked: bool(notification.asked, false) },
  };
}

export async function loadSave(): Promise<SaveData> {
  try {
    const text = await getStoredItem(KEY);
    return text ? sanitize(JSON.parse(text)) : defaultSave();
  } catch { return defaultSave(); }
}

export async function writeSave(data: SaveData): Promise<boolean> {
  try {
    await setStoredItem(KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}
