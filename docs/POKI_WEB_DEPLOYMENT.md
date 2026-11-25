# Poki web deployment

## What changed

The native game had static imports of `react-native-google-mobile-ads`, which Expo's web resolver cannot bundle. Ads are now selected by platform:

- `src/services/ads/index.native.tsx` keeps the established AdMob initialization, interstitial policy, and anchored banner for Android/iOS.
- `src/services/ads/index.web.ts` has no native-ad import. It loads `https://game-cdn.poki.com/scripts/v2/poki-sdk.js`, calls `PokiSDK.init()`, signals loading completion, and emits gameplay start/stop lifecycle events.
- A Poki commercial break can occur before replay, a new Classic game, or the next Collect level. Input and audio effects are paused during the request. A failure, SDK block, or offline session simply resumes the game without an ad.

No rewarded-break call was added because the game has no real earned-reward mechanic. Mid-game AdMob interstitials remain native-only; web has no banners or third-party ad tags.

Web also uses browser-safe storage, optional `navigator.vibrate`, no notification permission request, responsive board sizing, and browser-scroll suppression for space/arrow/wheel controls.

## Build and package

From the repository root:

```bash
bun install
bun run typecheck
bun run test
bun run export:web
```

The static output is `dist/`. Upload the **contents** of that directory (not the `dist` directory itself) to the Poki build uploader. The included archive `block-puzzle-poki-web.zip` is already laid out this way: `index.html` is at the archive root alongside `_expo/`, assets, and the favicon.

To verify a local production build:

```bash
npx serve dist
```

Then open the served address in a desktop and mobile-sized browser viewport. The app remains playable if the Poki script is blocked locally. Poki supplies the SDK in its environment; no private credentials, ad IDs, or build artifacts are required for the web integration.

## Poki checklist

- Confirm the uploaded archive has `index.html` at its root.
- Test initial load, a valid and invalid piece drop, row/column clears, Classic revive and decline, Collect completion, replay, and next level.
- Check mobile portrait, desktop, a narrow embedded viewport, and a short landscape viewport.
- Verify no browser page scroll occurs while using Space, arrow keys, or the wheel during play.
- Use Poki's own pre-release review and SDK validation before launch.

The integration follows the official [Poki HTML5 SDK guide](https://developers.poki.com/guide/sdk-html5).

## Native scope and configuration note

Android behavior is preserved. The Expo configuration intentionally has no `iosAppId` for `react-native-google-mobile-ads`, because no authentic iOS AdMob ID was provided and one must not be invented. Expo may warn about that on a web export while evaluating native config; it does not enter the web bundle. Add the real iOS application ID before shipping an iOS AdMob build.

## Lockfile note

`package.json` contains the Expo SDK 58 web dependencies. In this Windows environment, Bun 1.4.4 fails before lockfile generation with `EBADF accessing temporary directory`, even when `BUN_TMPDIR`, `TEMP`, `TMP`, and `BUN_INSTALL` point to writable project directories. The production web export was validated with the installed dependency tree, but `bun.lock` could not be regenerated here. Run `bun install` in a working Bun environment and commit the refreshed lockfile before a reproducible Bun-only release.
