import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { Board, type Hover } from '../components/Board';
import { Effects, type Burst } from '../components/Effects';
import { NewBestBanner, SettingsModal, WinModal } from '../components/Overlays';
import { TrayPiece } from '../components/TrayPiece';
import { GRID, theme } from '../constants/theme';
import { hasNextLevel } from '../game/engine/engine';
import { previewLines, canPlace } from '../game/engine/board';
import { useGameController } from '../hooks/useGameController';
import { BANNER_AD_ID } from '../services/ads';
import { hapticPickup } from '../services/haptics';
import { play } from '../services/audio';

export default function GameScreen() {
  const c = useGameController();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cell = Math.floor(Math.min(width - 28, 440) / GRID);
  const boardPx = cell * GRID + 4;
  const slotSize = Math.floor(boardPx / 3);

  const boardRef = useRef<React.ComponentRef<typeof View>>(null);
  const boardX = useSharedValue(0);
  const boardY = useSharedValue(0);
  const activeSlot = useSharedValue(-1);
  const [hover, setHover] = useState<{ slot: number; row: number; col: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [popup, setPopup] = useState<{ id: number; text: string } | null>(null);

  const measure = useCallback(() => {
    boardRef.current?.measureInWindow((x, y) => {
      boardX.value = x + 2;
      boardY.value = y + 2;
    });
  }, [boardX, boardY]);

  useEffect(() => {
    const t = setTimeout(measure, 150);
    return () => clearTimeout(t);
  }, [measure, width, insets.top]);

  // Effects on line clear
  const popScale = useSharedValue(1);
  useEffect(() => {
    const ev = c.event;
    if (!ev) return;
    const { rows, cols, clearedCells, gained, combo } = ev.result;
    if (rows.length + cols.length > 0) {
      setBursts((b) => [...b.slice(-3), { id: ev.id, rows, cols, cells: clearedCells }]);
      setPopup({ id: ev.id, text: combo > 1 ? `+${gained}  COMBO x${combo}` : `+${gained}` });
      popScale.value = withSequence(withTiming(1.25, { duration: 120 }), withTiming(1, { duration: 200 }));
    }
  }, [c.event]); // eslint-disable-line react-hooks/exhaustive-deps

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: popScale.value }] }));
  const removeBurst = useCallback((id: number) => setBursts((b) => b.filter((x) => x.id !== id)), []);
  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 900);
    return () => clearTimeout(t);
  }, [popup]);

  const game = c.game;
  const onPickup = useCallback(() => {
    measure();
    hapticPickup();
    play('pickup');
  }, [measure]);

  const onHover = useCallback((slot: number, row: number, col: number) => {
    setHover(row < -90 ? null : { slot, row, col });
  }, []);

  const onDrop = useCallback((slot: number, row: number, col: number) => {
    setHover(null);
    c.drop(slot, row, col);
  }, [c.drop]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCancel = useCallback(() => setHover(null), []);

  if (!c.ready || !game) {
    return <LinearGradient colors={[theme.bgTop, theme.bgBottom]} style={styles.fill} />;
  }

  let ghost: Hover | null = null;
  const hp = hover ? game.tray[hover.slot] : null;
  if (hover && hp) {
    const valid = canPlace(game.grid, hp, hover.row, hover.col);
    const lines = valid ? previewLines(game.grid, hp, hover.row, hover.col) : { rows: [], cols: [] };
    ghost = { piece: hp, row: hover.row, col: hover.col, valid, rows: lines.rows, cols: lines.cols };
  }

  const collect = game.mode === 'collect';
  const locked = game.status === 'won';

  return (
    <LinearGradient colors={[theme.bgTop, theme.bgBottom]} style={[styles.fill, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 4 }]}>
      {/* Top bar */}
      <View style={[styles.top, { width: boardPx }]}>
        <View style={styles.crown}>
          <Text style={styles.crownIcon}>👑</Text>
          <Text style={styles.best}>{game.best}</Text>
        </View>

        <Pressable onPress={() => setShowSettings(true)} hitSlop={14} accessibilityLabel="Settings" accessibilityRole="button">
          <Ionicons name="settings-sharp" size={32} color="#BBD3F5" />
        </Pressable>
      </View>

      {/* Score / Collect counters */}
      {collect ? (
        <View style={styles.counters}>
          <Text style={styles.counter}>★ {Math.min(game.collected.star, game.targets.star)}/{game.targets.star}</Text>
          <Text style={[styles.counter, { color: theme.pink }]}>◆ {Math.min(game.collected.gem, game.targets.gem)}/{game.targets.gem}</Text>
        </View>
      ) : (
        <Text style={styles.score}>{game.score}</Text>
      )}
      {collect ? <Text style={styles.levelTag}>Level {game.level}  •  Score {game.score}</Text> : <View style={{ height: 4 }} />}

      {/* Board */}
      <View ref={boardRef} collapsable={false} onLayout={() => { measure(); setTimeout(measure, 300); }} style={{ zIndex: 1 }}>
        <Board grid={game.grid} cell={cell} hover={ghost} />
        <Effects bursts={bursts} cell={cell} onDone={removeBurst} />
        {popup ? (
          <Animated.View key={popup.id} entering={FadeInUp.duration(200)} pointerEvents="none" style={styles.popupWrap}>
            <Animated.Text style={[styles.popup, popStyle]}>{popup.text}</Animated.Text>
          </Animated.View>
        ) : null}
      </View>

      {/* Tray */}
      <View style={[styles.tray, { width: boardPx, height: slotSize + 10 }]}>
        {game.tray.map((p, i) => (
          <View key={i} style={{ width: slotSize, height: slotSize, zIndex: hover?.slot === i ? 50 : 1 }}>
            {p ? (
              <TrayPiece
                key={p.uid}
                piece={p}
                slot={i}
                slotSize={slotSize}
                cell={cell}
                lift={cell * 2.4}
                boardX={boardX}
                boardY={boardY}
                activeSlot={activeSlot}
                disabled={locked}
                onPickup={onPickup}
                onHover={onHover}
                onDrop={onDrop}
                onCancel={onCancel}
              />
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.labelWrap}>
        <Text key={c.label} style={styles.label}>{c.label}</Text>
      </View>

      {/* Bottom Sticky Banner Ad */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={BANNER_AD_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        />
      </View>

      {/* Brief New Best Banner */}
      {c.bannerScore !== null && game.status === 'playing' ? (
        <NewBestBanner score={c.bannerScore} onDone={c.dismissBanner} />
      ) : null}

      {/* Level Complete Modal */}
      {game.status === 'won' && (
        <WinModal level={game.level} last={!hasNextLevel(game.level)} onNext={c.nextLevel} onReplay={c.replay} />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={c.save.settings}
          level={c.save.collectLevel}
          onChange={c.changeSettings}
          onNotifications={c.setNotifications}
          onMode={(m) => { c.setMode(m); setShowSettings(false); }}
          onRestart={() => { c.restart(); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  crown: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crownIcon: { fontSize: 30 },
  best: { color: theme.gold, fontSize: 26, fontWeight: '900', textShadowColor: '#0006', textShadowRadius: 3, textShadowOffset: { width: 0, height: 2 } },
  score: { color: '#fff', fontSize: 54, fontWeight: '900', marginVertical: 4, textShadowColor: '#0003', textShadowRadius: 4, textShadowOffset: { width: 0, height: 3 } },
  counters: { flexDirection: 'row', gap: 28, marginTop: 6 },
  counter: { color: theme.gold, fontSize: 38, fontWeight: '900', textShadowColor: '#0004', textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 } },
  levelTag: { color: '#DCE4FF', fontSize: 14, fontWeight: '700', marginBottom: 6 },
  tray: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, zIndex: 10 },
  labelWrap: { flex: 1, justifyContent: 'center', zIndex: 0 },
  label: { color: '#fff', fontSize: 36, fontWeight: '900', fontStyle: 'italic', textShadowColor: '#1D3FBF', textShadowRadius: 0, textShadowOffset: { width: 3, height: 4 } },
  bannerContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 50, marginTop: 4 },
  popupWrap: { position: 'absolute', left: 0, right: 0, top: '38%', alignItems: 'center' },
  popup: { color: '#fff', fontSize: 34, fontWeight: '900', textShadowColor: '#000A', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
});