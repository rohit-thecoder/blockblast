import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { type SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { GRID } from '../constants/theme';
import type { Piece } from '../types';
import { Block } from './Block';

export const TRAY_SCALE = 0.55;

interface Props {
  piece: Piece;
  slot: number;
  slotSize: number;
  cell: number;
  lift: number;
  boardX: SharedValue<number>;
  boardY: SharedValue<number>;
  activeSlot: SharedValue<number>;
  disabled: boolean;
  onPickup: (slot: number) => void;
  onHover: (slot: number, row: number, col: number) => void;
  onDrop: (slot: number, row: number, col: number) => void;
  onCancel: () => void;
}

export function TrayPiece({
  piece,
  slot,
  slotSize,
  cell,
  lift,
  boardX,
  boardY,
  activeSlot,
  disabled,
  onPickup,
  onHover,
  onDrop,
  onCancel,
}: Props) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const scale = useSharedValue(0.2);
  const dragging = useSharedValue(0);
  const mine = useSharedValue(0);
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const lastRow = useSharedValue(-99);
  const lastCol = useSharedValue(-99);

  const pw = piece.w * cell;
  const ph = piece.h * cell;

  useEffect(() => {
    scale.value = withSpring(TRAY_SCALE, { damping: 12, stiffness: 160 });
  }, [scale]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(2)
    .onBegin((e) => {
      'worklet';
      // Slot center in absolute screen coordinates
      cx.value = e.absoluteX - e.x + slotSize / 2;
      cy.value = e.absoluteY - e.y + slotSize / 2;
    })
    .onStart((e) => {
      'worklet';
      if (activeSlot.value !== -1) return;
      activeSlot.value = slot;
      mine.value = 1;
      dragging.value = 1;
      lastRow.value = -99;
      lastCol.value = -99;

      const fx = e.absoluteX;
      const fy = e.absoluteY - lift;
      tx.value = fx - cx.value;
      ty.value = fy - cy.value;
      scale.value = withSpring(1, { damping: 14, stiffness: 220 });
      scheduleOnRN(onPickup, slot);
    })
    .onUpdate((e) => {
      'worklet';
      if (!mine.value) return;
      const fx = e.absoluteX;
      const fy = e.absoluteY - lift;
      tx.value = fx - cx.value;
      ty.value = fy - cy.value;

      // Top-left of piece relative to board inner origin (boardX, boardY)
      const col = Math.round((fx - pw / 2 - boardX.value) / cell);
      const row = Math.round((fy - ph / 2 - boardY.value) / cell);

      const inside = row > -2 && col > -2 && row < GRID + 1 && col < GRID + 1;
      const r = inside ? row : -99;
      const c = inside ? col : -99;

      if (r !== lastRow.value || c !== lastCol.value) {
        lastRow.value = r;
        lastCol.value = c;
        scheduleOnRN(onHover, slot, r, c);
      }
    })
    .onEnd(() => {
      'worklet';
      if (!mine.value) return;
      scheduleOnRN(onDrop, slot, lastRow.value, lastCol.value);
    })
    .onFinalize(() => {
      'worklet';
      if (!mine.value) return;
      mine.value = 0;
      dragging.value = 0;
      activeSlot.value = -1;
      tx.value = withSpring(0, { damping: 16 });
      ty.value = withSpring(0, { damping: 16 });
      scale.value = withSpring(TRAY_SCALE, { damping: 14 });
      scheduleOnRN(onCancel);
    });

  const style = useAnimatedStyle(() => ({
    zIndex: dragging.value ? 100 : 1,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: slotSize, height: slotSize, alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
        <Animated.View style={[{ width: pw, height: ph }, styles.shadow, style]}>
          {piece.cells.map(([r, c]) => (
            <View key={`${r}-${c}`} style={{ position: 'absolute', left: c * cell, top: r * cell }}>
              <Block color={piece.color} size={cell} />
            </View>
          ))}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  shadow: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
});
