import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type SoundName = 'pickup' | 'drop' | 'clear' | 'combo' | 'gameover';
const SOURCES: Record<SoundName, number> = {
  pickup: require('../../assets/sounds/pickup.wav'),
  drop: require('../../assets/sounds/drop.wav'),
  clear: require('../../assets/sounds/clear.wav'),
  combo: require('../../assets/sounds/combo.wav'),
  gameover: require('../../assets/sounds/gameover.wav'),
};

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;
let ready = false;

export const setSoundEnabled = (v: boolean) => { enabled = v; };

/** Never throws: if audio is unavailable the game simply stays silent. */
export async function initAudio() {
  if (ready) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    (Object.keys(SOURCES) as SoundName[]).forEach((k) => { players[k] = createAudioPlayer(SOURCES[k]); });
    ready = true;
  } catch { /* silent fallback */ }
}

export function play(name: SoundName) {
  if (!enabled || !ready) return;
  try {
    const p = players[name];
    if (!p) return;
    p.seekTo(0);
    p.play();
  } catch { /* silent fallback */ }
}

export function releaseAudio() {
  (Object.keys(players) as SoundName[]).forEach((k) => { try { players[k]?.remove(); } catch {} delete players[k]; });
  ready = false;
}
