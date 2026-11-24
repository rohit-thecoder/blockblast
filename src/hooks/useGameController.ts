import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { createGame, declineRevive, hasNextLevel, placeAt, revive } from '../game/engine/engine';
import { feedbackLabel } from '../game/engine/scoring';
import { LEVEL_COUNT } from '../game/levels/levels';
import { initAds, showInterstitial } from '../services/ads';
import { initAudio, play, releaseAudio, setSoundEnabled } from '../services/audio';
import { hapticClear, hapticDrop, hapticError, setHapticsEnabled } from '../services/haptics';
import { configureNotifications, scheduleReminders, setRemindersEnabled } from '../services/notifications';
import { defaultSave, loadSave, type SaveData, writeSave } from '../services/storage';
import type { GameState, Mode, PlaceResult, Settings } from '../types';

export interface GameEvent { id: number; result: PlaceResult; label: string }
export type Label = 'RELAXING!' | 'EXCITING!' | 'EXCELLENT!';

export function useGameController() {
  const [save, setSave] = useState<SaveData>(defaultSave());
  const [game, setGame] = useState<GameState | null>(null);
  const [ready, setReady] = useState(false);
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [label, setLabel] = useState<Label>('RELAXING!');
  const [bannerScore, setBannerScore] = useState<number | null>(null);

  const gameRef = useRef<GameState | null>(null);
  const saveRef = useRef(save);
  const eventId = useRef(0);
  const autoClearCount = useRef(0);
  gameRef.current = game;
  saveRef.current = save;

  const commitSave = useCallback((next: SaveData) => {
    saveRef.current = next;
    setSave(next);
    void writeSave(next);
  }, []);

  const applyServices = (s: Settings) => {
    setSoundEnabled(s.sound);
    setHapticsEnabled(s.haptics);
  };

  // Boot
  useEffect(() => {
    let alive = true;
    configureNotifications();
    (async () => {
      const data = await loadSave();
      if (!alive) return;
      applyServices(data.settings);
      saveRef.current = data;
      setSave(data);
      setGame(createGame(data.settings.mode, data.collectLevel, data.settings.mode === 'classic' ? data.best : 0));
      setReady(true);
      void initAudio();
      initAds();

      // Pehli baar app open hone par automatic permission maang kar din mein 2 baar schedule karein
      if (!data.notif.asked) {
        const granted = await setRemindersEnabled(true);
        const updated: SaveData = {
          ...data,
          settings: { ...data.settings, notifications: granted },
          notif: { scheduled: granted, asked: true },
        };
        if (alive) commitSave(updated);
      } else if (data.settings.notifications) {
        void scheduleReminders();
      }
    })();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') void initAudio(); });
    return () => { alive = false; sub.remove(); releaseAudio(); };
  }, [commitSave]);

  // Persist best score / level progress
  useEffect(() => {
    if (!game) return;
    const cur = saveRef.current;
    let next = cur;
    if (game.mode === 'classic' && game.best > cur.best) next = { ...next, best: game.best };
    if (game.status === 'won') {
      const unlocked = Math.min(LEVEL_COUNT, game.level + 1);
      if (unlocked > next.collectLevel) next = { ...next, collectLevel: unlocked };
    }
    if (next !== cur) commitSave(next);
  }, [game, commitSave]);

  // Win celebration sound
  const lastStatus = useRef('playing');
  useEffect(() => {
    if (!game) return;
    if (game.status !== lastStatus.current && game.status === 'won') {
      play('combo');
      hapticClear(2);
    }
    lastStatus.current = game.status;
  }, [game?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = (result: PlaceResult) => {
    const lines = result.rows.length + result.cols.length;
    const lb = feedbackLabel(lines, result.combo);
    setLabel(lb);
    setEvent({ id: ++eventId.current, result, label: lb });
    if (lines > 0) {
      play(result.combo > 1 || lines > 1 ? 'combo' : 'clear');
      hapticClear(lines);
    }
  };

  /** Returns true when the piece was placed */
  const drop = useCallback((slot: number, row: number, col: number): boolean => {
    const g = gameRef.current;
    if (!g) return false;
    const { state, result } = placeAt(g, slot, row, col);
    if (!result.ok) {
      if (row > -90) hapticError();
      return false;
    }

    gameRef.current = state;
    setGame(state);
    play('drop');
    hapticDrop();
    emit(result);
    if (result.newBest) setBannerScore(state.score);

    // Every 2nd 2+ line clear / auto-clear triggers a preloaded Interstitial Ad
    if (result.rows.length + result.cols.length >= 2) {
      autoClearCount.current += 1;
      if (autoClearCount.current % 2 === 0) {
        setTimeout(() => { showInterstitial(); }, 450);
      }
    }
    return true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startNew = useCallback((mode: Mode, level: number) => {
    const s = saveRef.current;
    const g = createGame(mode, level, mode === 'classic' ? s.best : 0);
    gameRef.current = g;
    setGame(g);
    setLabel('RELAXING!');
    setEvent(null);
    setBannerScore(null);
  }, []);

  const restart = useCallback(() => {
    const g = gameRef.current;
    const s = saveRef.current;
    startNew(s.settings.mode, g && g.mode === 'collect' ? g.level : s.collectLevel);
  }, [startNew]);

  const doRevive = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const { state, result } = revive(g);
    if (!result.ok) return;
    gameRef.current = state;
    setGame(state);
    emit(result);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const decline = useCallback(() => {
    const g = gameRef.current;
    if (g) setGame(declineRevive(g));
  }, []);

  const nextLevel = useCallback(() => {
    const g = gameRef.current;
    if (!g || !hasNextLevel(g.level)) return;
    startNew('collect', g.level + 1);
  }, [startNew]);

  const changeSettings = useCallback((patch: Partial<Settings>) => {
    const s = saveRef.current;
    const settings = { ...s.settings, ...patch };
    applyServices(settings);
    commitSave({ ...s, settings });
  }, [commitSave]);

  const setMode = useCallback((mode: Mode) => {
    changeSettings({ mode });
    startNew(mode, saveRef.current.collectLevel);
  }, [changeSettings, startNew]);

  const setNotifications = useCallback(async (on: boolean) => {
    const result = await setRemindersEnabled(on);
    if (on && !result) Alert.alert('Notifications are off', 'Allow notifications for this app in your phone settings to get daily reminders.');
    const s = saveRef.current;
    commitSave({ ...s, settings: { ...s.settings, notifications: result }, notif: { scheduled: result, asked: true } });
  }, [commitSave]);

  return {
    ready,
    game,
    save,
    label,
    event,
    bannerScore,
    dismissBanner: () => setBannerScore(null),
    drop,
    restart,
    doRevive,
    decline,
    nextLevel,
    changeSettings,
    setMode,
    setNotifications,
    replay: restart,
  };
}