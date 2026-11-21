import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BLOCK_COLORS, shade, theme } from '../constants/theme';
import type { ColorKey, Special } from '../types';

interface Props { color: ColorKey; size: number; special?: Special; dim?: boolean }

/** Glossy bevelled block: lighter top/left edges, darker bottom/right edges. */
function BlockBase({ color, size, special, dim }: Props) {
  const base = BLOCK_COLORS[color];
  const bw = Math.max(2, Math.round(size * 0.12));
  return (
    <View
      style={{
        width: size, height: size, backgroundColor: base, borderWidth: bw,
        borderTopColor: shade(base, 0.45), borderLeftColor: shade(base, 0.3),
        borderBottomColor: shade(base, -0.4), borderRightColor: shade(base, -0.28),
        alignItems: 'center', justifyContent: 'center', opacity: dim ? 0.55 : 1,
      }}
    >
      {special === 'star' && <Text style={[styles.star, { fontSize: size * 0.62 }]}>★</Text>}
      {special === 'gem' && (
        <View style={{ width: size * 0.38, height: size * 0.38, backgroundColor: theme.pink, borderRadius: 3,
          transform: [{ rotate: '45deg' }], borderWidth: 2, borderColor: '#FFFFFFCC' }} />
      )}
    </View>
  );
}
export const Block = memo(BlockBase);

const styles = StyleSheet.create({
  star: { color: '#FFFBEB', textShadowColor: '#B45309', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 }, fontWeight: '900' },
});
