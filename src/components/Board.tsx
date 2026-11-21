import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GRID, theme } from '../constants/theme';
import type { ColorKey, Grid, Piece } from '../types';
import { Block } from './Block';

export interface Hover { piece: Piece; row: number; col: number; valid: boolean; rows: number[]; cols: number[] }
interface Props { grid: Grid; cell: number; hover: Hover | null }

interface CellProps { size: number; color: ColorKey | null; special?: 'star' | 'gem'; ghost: ColorKey | null; hl: boolean }
const CellView = memo(function CellView({ size, color, special, ghost, hl }: CellProps) {
  return (
    <View style={[styles.cell, { width: size, height: size }]}>
      {color ? <Block color={color} size={size} special={special} /> : null}
      {ghost ? <Block color={ghost} size={size} dim /> : null}
      {hl ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.hl]} /> : null}
    </View>
  );
});

function BoardBase({ grid, cell, hover }: Props) {
  const ghost = useMemo(() => {
    const m = new Map<number, ColorKey>();
    if (hover?.valid) hover.piece.cells.forEach(([dr, dc]) => m.set((hover.row + dr) * GRID + hover.col + dc, hover.piece.color));
    return m;
  }, [hover]);
  const rowsHl = hover?.valid ? hover.rows : null;
  const colsHl = hover?.valid ? hover.cols : null;
  const size = cell * GRID;
  return (
    <View style={[styles.board, { width: size + 4, height: size + 4 }]}>
      {grid.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((c, col) => (
            <CellView key={col} size={cell} color={c?.color ?? null} special={c?.special}
              ghost={ghost.get(r * GRID + col) ?? null}
              hl={!!(rowsHl?.includes(r) || colsHl?.includes(col))} />
          ))}
        </View>
      ))}
    </View>
  );
}
export const Board = memo(BoardBase);

const styles = StyleSheet.create({
  board: { backgroundColor: theme.board, borderRadius: 6, padding: 2, borderWidth: 0 },
  cell: { backgroundColor: theme.cell, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: theme.border },
  hl: { backgroundColor: 'rgba(255,255,255,0.28)' },
});
