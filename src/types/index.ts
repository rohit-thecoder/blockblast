export type ColorKey = 'purple' | 'gold' | 'blue' | 'cyan' | 'green' | 'orange' | 'red';
export type Special = 'star' | 'gem';
export interface Cell { color: ColorKey; special?: Special }
export type Grid = (Cell | null)[][];
export type Mode = 'classic' | 'collect';
export type Status = 'playing' | 'revive' | 'over' | 'won';

export interface Piece {
  uid: number;
  family: string;
  color: ColorKey;
  cells: ReadonlyArray<readonly [number, number]>; // [row, col]
  w: number;
  h: number;
}
export type Tray = (Piece | null)[];

export interface GameState {
  mode: Mode;
  level: number;
  grid: Grid;
  tray: Tray;
  score: number;
  best: number;
  combo: number;
  boostLeft: number;
  revived: boolean;
  newBestShown: boolean;
  status: Status;
  targets: { star: number; gem: number };
  collected: { star: number; gem: number };
  seed: number;
  nextUid: number;
  trayCount: number;
}

export interface PlaceResult {
  ok: boolean;
  rows: number[];
  cols: number[];
  clearedCells: { r: number; c: number; color: ColorKey }[];
  gained: number;
  combo: number;
  newBest: boolean;
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  notifications: boolean;
  mode: Mode;
}
