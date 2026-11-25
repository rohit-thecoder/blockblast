import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import type { Mode, Settings } from '../types';

export function Button({ label, onPress, kind = 'primary' }: { label: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger' }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [styles.btn, kind === 'primary' && styles.btnPrimary, kind === 'danger' && styles.btnDanger, kind === 'ghost' && styles.btnGhost, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}>
      <Text style={[styles.btnText, kind === 'primary' && { color: '#3B2A00' }, kind === 'ghost' && { color: '#DCE4FF' }]}>{label}</Text>
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)} style={styles.backdrop}>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.card}>{children}</Animated.View>
    </Animated.View>
  );
}

export function ReviveModal({ score, best, onRevive, onDecline }: { score: number; best: number; onRevive: () => void; onDecline: () => void }) {
  return (
    <Card>
      <Text style={styles.emoji}>👑</Text>
      <Text style={styles.title}>So close to your best!</Text>
      <Text style={styles.sub}>Score {score}{best > 0 ? `  •  Best ${best}` : ''}</Text>
      <Text style={styles.small}>Revive clears the 2 fullest rows and 1 column, and gives +50.</Text>
      <Button label="Revive" onPress={onRevive} />
      <Button label="No Thanks" kind="ghost" onPress={onDecline} />
    </Card>
  );
}

export function GameOverModal({ score, best, onPlayAgain }: { score: number; best: number; onPlayAgain: () => void }) {
  return (
    <Card>
      <Text style={styles.title}>Game Over</Text>
      <Text style={styles.big}>{score}</Text>
      <Text style={styles.sub}>Best {best}</Text>
      <Button label="Play Again" onPress={onPlayAgain} />
    </Card>
  );
}

export function WinModal({ level, last, onNext, onReplay }: { level: number; last: boolean; onNext: () => void; onReplay: () => void }) {
  return (
    <Card>
      <Text style={styles.emoji}>🏆</Text>
      <Text style={styles.title}>Level {level} Complete!</Text>
      {last ? <Text style={styles.small}>You finished every level. Amazing!</Text> : null}
      {!last && <Button label="Next Level" onPress={onNext} />}
      <Button label="Replay" kind="ghost" onPress={onReplay} />
    </Card>
  );
}

export function NewBestBanner({ score, onDone }: { score: number; onDone: () => void }) {
  React.useEffect(() => { const t = setTimeout(onDone, 650); return () => clearTimeout(t); }, [onDone]);
  return (
    <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} pointerEvents="none" style={styles.bannerWrap}>
      <Text style={{ fontSize: 56 }}>👑</Text>
      <View style={styles.ribbon}><Text style={styles.ribbonText}>NEW BEST</Text></View>
      <Text style={styles.bannerScore}>{score}</Text>
    </Animated.View>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.gold, false: '#55608F' }} thumbColor="#fff" />
    </View>
  );
}

export function SettingsModal(p: {
  settings: Settings; level: number;
  onChange: (patch: Partial<Settings>) => void; onNotifications: (on: boolean) => void;
  notificationsAvailable: boolean;
  onMode: (m: Mode) => void; onRestart: () => void; onClose: () => void;
}) {
  const { settings } = p;
  return (
    <Card>
      <View style={styles.settingsHead}>
        <Text style={styles.title}>Settings</Text>
        <Pressable onPress={p.onClose} hitSlop={12} accessibilityLabel="Close settings"><Ionicons name="close" size={28} color="#fff" /></Pressable>
      </View>
      <Row label="Sound" value={settings.sound} onChange={(v) => p.onChange({ sound: v })} />
      <Row label="Haptics" value={settings.haptics} onChange={(v) => p.onChange({ haptics: v })} />
      {p.notificationsAvailable ? <Row label="Daily reminders" value={settings.notifications} onChange={p.onNotifications} /> : null}
      <Text style={styles.rowLabel}>Mode</Text>
      <View style={styles.segment}>
        {(['classic', 'collect'] as Mode[]).map((m) => (
          <Pressable key={m} onPress={() => p.onMode(m)} style={[styles.seg, settings.mode === m && styles.segOn]}>
            <Text style={[styles.segText, settings.mode === m && { color: '#3B2A00' }]}>
              {m === 'classic' ? 'Classic' : `Collect · Lv ${p.level}`}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button label="Restart" kind="danger" onPress={p.onRestart} />
    </Card>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(10,15,40,0.65)', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#3B4C9E', borderRadius: 24, padding: 22, gap: 12, borderWidth: 2, borderColor: '#6D82D6' },
  emoji: { fontSize: 54, textAlign: 'center' },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' },
  sub: { color: '#DCE4FF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  small: { color: '#C3CFF5', fontSize: 14, textAlign: 'center' },
  big: { color: theme.gold, fontSize: 56, fontWeight: '900', textAlign: 'center' },
  btn: { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: theme.gold, borderBottomWidth: 4, borderBottomColor: '#CA9A04' },
  btnDanger: { backgroundColor: '#E5484D', borderBottomWidth: 4, borderBottomColor: '#A02A2F' },
  btnGhost: { backgroundColor: 'rgba(255,255,255,0.12)' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  settingsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  segment: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 4 },
  seg: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  segOn: { backgroundColor: theme.gold },
  segText: { color: '#DCE4FF', fontWeight: '800' },
  bannerWrap: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 150 },
  ribbon: { backgroundColor: '#9333EA', paddingHorizontal: 26, paddingVertical: 8, borderRadius: 6, marginTop: -6, transform: [{ rotate: '-3deg' }] },
  ribbonText: { color: '#fff', fontWeight: '900', fontSize: 28, fontStyle: 'italic', letterSpacing: 1 },
  bannerScore: { color: theme.gold, fontSize: 64, fontWeight: '900', textShadowColor: '#7C2D12', textShadowRadius: 6, textShadowOffset: { width: 0, height: 3 } },
});
