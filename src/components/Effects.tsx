import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { BLOCK_COLORS, GRID } from '../constants/theme';
import type { ColorKey } from '../types';

export interface Burst {
  id: number;
  rows: number[];
  cols: number[];
  cells: { r: number; c: number; color: ColorKey }[];
}

const MAX_PARTICLES = 40;

function Particle({ p, x, y, vx, vy, size, color }: { p: SharedValue<number>; x: number; y: number; vx: number; vy: number; size: number; color: string }) {
  const s = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateX: vx * p.value },
      { translateY: vy * p.value + 220 * p.value * p.value },
      { scale: 1 - 0.6 * p.value },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size, backgroundColor: color, borderRadius: 2 }, s]} />;
}

function BurstView({ burst, cell, onDone }: { burst: Burst; cell: number; onDone: (id: number) => void }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 650, easing: Easing.out(Easing.quad) }, (fin) => {
      if (fin) scheduleOnRN(onDone, burst.id);
    });
  }, [p, burst.id, onDone]);

  const beam = useAnimatedStyle(() => ({ opacity: 1 - p.value * p.value, transform: [{ scale: 0.6 + p.value * 0.6 }] }));
  const size = cell * GRID;

  const particles = useMemo(() => {
    const step = Math.max(1, Math.ceil(burst.cells.length / MAX_PARTICLES));
    return burst.cells.filter((_, i) => i % step === 0).map((c, i) => {
      const a = ((i * 137.5) % 360) * (Math.PI / 180);
      const sp = 40 + ((i * 53) % 70);
      return {
        key: `${c.r}-${c.c}`, x: c.c * cell + cell / 2 - 4, y: c.r * cell + cell / 2 - 4,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, color: BLOCK_COLORS[c.color],
      };
    });
  }, [burst, cell]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: size, height: size }]}>
      {burst.rows.map((r) => (
        <Animated.View key={`r${r}`} style={[{ position: 'absolute', left: 0, top: r * cell, width: size, height: cell }, beam]}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ))}
      {burst.cols.map((c) => (
        <Animated.View key={`c${c}`} style={[{ position: 'absolute', top: 0, left: c * cell, height: size, width: cell }, beam]}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ))}
      {particles.map((pt) => (
        <Particle key={pt.key} p={p} x={pt.x} y={pt.y} vx={pt.vx} vy={pt.vy} size={8} color={pt.color} />
      ))}
    </View>
  );
}

export function Effects({ bursts, cell, onDone }: { bursts: Burst[]; cell: number; onDone: (id: number) => void }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { left: 2, top: 2 }]}>
      {bursts.map((b) => <BurstView key={b.id} burst={b} cell={cell} onDone={onDone} />)}
    </View>
  );
}
