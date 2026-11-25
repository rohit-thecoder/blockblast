# Web test report

Date: 2026-11-25

## Passed checks

| Check | Result |
| --- | --- |
| TypeScript | `npm run typecheck` passed. |
| Game tests | Direct Jest run passed: 4 suites and 28 tests. |
| Static web export | `expo export --platform web --output-dir dist` passed (936 modules). |
| Native ad exclusion | A scan of `dist/` found no `react-native-google-mobile-ads` or native AdMob component references. |
| Output contents | 28 exported files, including `index.html`, `_expo/` bundles, images, fonts, and WAV audio assets. |
| Static-server smoke test | HTTP requests for `/` and the emitted JavaScript bundle returned 200 from a local static server. |

The export printed an iOS AdMob configuration warning because no iOS AdMob application ID is configured. This is expected for the Android-and-web scope and does not affect the web bundle.

## Not completed in this environment

- A real browser interaction pass (drag/drop, responsive visual inspection, and modal flow) could not run: the available Windows browser automation session was stopped by URL-policy enforcement before it could navigate to the local server.
- Android device/emulator regression testing was not run in this environment.
- `expo-doctor` started but did not complete within the command-run window, so its result is not asserted here.
- Bun could not regenerate `bun.lock` because of the documented Bun temporary-directory failure. See the deployment guide.

Before release, perform the manual Poki checklist in `POKI_WEB_DEPLOYMENT.md`, validate the archive in Poki's test environment, and run a native Android smoke test.
