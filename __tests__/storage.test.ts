const mem: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => (k in mem ? mem[k] : null)),
    setItem: jest.fn(async (k: string, v: string) => { mem[k] = v; }),
  },
}));
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultSave, loadSave, sanitize, writeSave } from '../src/services/storage';

describe('storage', () => {
  beforeEach(() => { Object.keys(mem).forEach((k) => delete mem[k]); });
  it('returns defaults when nothing is saved', async () => {
    expect(await loadSave()).toEqual(defaultSave());
  });
  it('persists and restores best score, settings and notification state', async () => {
    const s = defaultSave();
    s.best = 3540; s.collectLevel = 4;
    s.settings = { sound: false, haptics: false, notifications: true, mode: 'collect' };
    s.notif = { scheduled: true, asked: true };
    expect(await writeSave(s)).toBe(true);
    expect(await loadSave()).toEqual(s);
  });
  it('recovers from corrupt data instead of crashing', async () => {
    mem['blockblast:save'] = '{not json';
    expect(await loadSave()).toEqual(defaultSave());
    expect(sanitize({ best: -5, collectLevel: 'x', settings: { mode: 'weird', sound: 3 } })).toEqual(defaultSave());
  });
  it('reports a failed write without throwing', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('disk full'));
    expect(await writeSave(defaultSave())).toBe(false);
  });
});
