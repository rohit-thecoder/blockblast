# Block Blast Puzzle (React Native + Expo)

An 8x8 block-puzzle game: drag 3 polyomino pieces onto the board, clear full rows/columns, chain combos.
Expo SDK 58 · TypeScript · Reanimated 4 · Gesture Handler 3 · **runs in Expo Go** (no custom native code).

## Modes
- **Classic** – endless, chase your best score. Revive once per game ("So close to your best!": clears the 2 fullest rows + 1 column, +50, short boost phase).
- **Collect** – 60 pre-filled levels. Clear lines containing ★ Gold Stars and ◆ Pink Gems to reach the targets.

"Boost Then Kill" difficulty lives in `src/game/engine/generator.ts` (boost = helpful pieces early and after revive; kill = 3x3, 5-long, L, S/Z pieces when score >= 85% of best).

## Setup (Bun)
```bash
# 1. install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash
#    Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# 2. install dependencies (all versions are pinned to Expo SDK 58)
bun install

# 3. verify Expo-compatible versions
bunx expo install --check
```
Packages in `package.json` were installed with: `bunx expo install react react-native react-native-reanimated react-native-gesture-handler react-native-worklets react-native-safe-area-context expo-haptics expo-notifications expo-audio expo-linear-gradient expo-status-bar expo-constants @react-native-async-storage/async-storage @expo/vector-icons`

## Run
```bash
bun run start          # dev server, scan QR with Expo Go
bunx expo start --android
bun run typecheck      # tsc --noEmit
bun run test           # jest (engine, levels, storage, reminders)
```

## Notifications & Expo Go
Two daily local reminders (10:00 and 20:00) are scheduled with fixed identifiers, so toggling never creates duplicates.
Local notifications work in Expo Go; Android delivery times can be delayed by battery optimisation. Remote push is *not* used. If testing on Android shows limits in Expo Go, use a development build.

## Builds (EAS)
```bash
bun add -g eas-cli          # or: bunx eas-cli ...
eas login
bun run build:dev           # development build (APK)
bun run build:aab           # production Play Store bundle (AAB)
```
Change `android.package` / `ios.bundleIdentifier` in `app.json` (`com.yourstudio.blockblastpuzzle`) before publishing.

## Structure
```
App.tsx, index.ts
src/game/engine   pieces, board, scoring, generator (boost/kill), engine (state machine), rng
src/game/levels   60 deterministic, validated Collect levels
src/hooks         useGameController (state + storage + audio/haptics glue)
src/components    Board, Block, TrayPiece (drag), Effects (beam/particles), Overlays/modals
src/screens       GameScreen
src/services      storage, audio, haptics, notifications
assets/sounds     generated .wav effects (silent fallback if audio unavailable)
__tests__         jest tests for pure logic
```
