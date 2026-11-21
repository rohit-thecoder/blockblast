import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Mode, Settings } from '../types';

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

const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const int = (v: unknown, d: number, min = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.floor(v)) : d);

/** Validates unknown JSON into a safe SaveData (defaults for anything missing/corrupt). */
export function sanitize(raw: unknown): SaveData {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const o = raw as Record<string, any>;
  const s = (o.settings ?? {}) as Record<string, unknown>;
  const n = (o.notif ?? {}) as Record<string, unknown>;
  const mode: Mode = s.mode === 'collect' ? 'collect' : 'classic';
  return {
    version: SCHEMA_VERSION,
    best: int(o.best, 0),
    collectLevel: int(o.collectLevel, 1, 1),
    settings: {
      sound: bool(s.sound, d.settings.sound), haptics: bool(s.haptics, d.settings.haptics),
      notifications: bool(s.notifications, false), mode,
    },
    notif: { scheduled: bool(n.scheduled, false), asked: bool(n.asked, false) },
  };
}

export async function loadSave(): Promise<SaveData> {
  try {
    const txt = await AsyncStorage.getItem(KEY);
    return txt ? sanitize(JSON.parse(txt)) : defaultSave();
  } catch {
    return defaultSave();
  }
}

export async function writeSave(data: SaveData): Promise<boolean> {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}
