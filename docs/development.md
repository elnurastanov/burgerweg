# Development

## Requirements

- Node.js ≥ 20 and npm
- For Android: JDK 17 and the Android SDK (`ANDROID_HOME`), plus an emulator or device
- For the data and image scripts: Python 3 with `pymupdf` and `pillow`

## Run

```bash
npm install
npm run web              # app at http://localhost:8081/app (base path /app, like production)
npm run android          # Expo Go on an emulator/device
npm run typecheck        # must pass
npx expo-doctor          # dependency/config check
```

All native modules used are in **Expo Go**, so it's enough for day-to-day work. Expo Go shows its own icon and name;
to see Bürgerweg's real icon, splash and name, build the app (`npx expo run:android` for a development build, or the
release APK, see [android-fdroid.md](android-fdroid.md)).

`android/` (and `ios/`, if you ever generate it) is created by `expo prebuild` and git-ignored. Never edit it by
hand: configure `app.json` and regenerate with `npx expo prebuild --clean`.

## Website (landing page + PWA)

```bash
SITE_URL=http://localhost:8090 npm run build:site
npm run serve:site       # http://localhost:8090 → landing; /app/ → app
```

Details in [deployment.md](deployment.md). The service worker only runs in production builds, so test offline
behavior on the built site, not on the dev server.

## Linting

No ESLint setup is committed. On the maintainer's machine npm runs with `strict-allow-scripts`, which blocks the
ESLint resolver's install script, so the TypeScript check is the static gate. Contributions that add a lint setup
compatible with that policy are welcome.

## Testing tips

- **Fake state on web:** edit `localStorage['ebt:v1']` (`{ settings, progress }`) and reload.
- **Selectors:** RN-web `Pressable` renders `role="button"`, and answer options render `role="radio"`.
- **Phone size:** test at 375×812. Long labels in side-by-side buttons wrap; stack those buttons instead.
- **Embedded browsers** (IDE previews, in-app webviews) may block `window.confirm`; the app uses its own
  `DialogProvider`, so dialogs work there too.
- **Deep links skip onboarding** (state `null` → only general questions), which is handy for screenshots.
- **Android headless:** `adb exec-out screencap -p > shot.png`, `adb shell input tap x y`.
- **Transfer links:** open `/app/transfer#EBT1.…` on a fresh browser profile; the import card should appear and the
  fragment should disappear from the address bar.
- **PWA:** in Chrome DevTools → Application, check the manifest, the service worker (scope `/app/`) and the cache
  `buergerweg-v1`, then tick *Offline* and reload `/app/`.

## Verified so far

| Platform | What was exercised |
| --- | --- |
| Web (dev + production build) | onboarding, home, list, practice incl. picture questions, exam (translate, select, overview, close + confirm, submit + confirm), result review, flashcards, transfer round trip and transfer link, German UI, dark mode, landing → app |
| PWA | manifest linked in static HTML, service worker active with scope `/app/`, app shell cached (offline mode itself not toggled yet) |
| Transfer link | fresh profile opens `/app/transfer#EBT1.…` → import card → Replace restores 263 records, 4 exams, state, onboarding; Cancel clears the code from the URL |
| Android | Expo Go: onboarding, home, exam with translation. Release APK: installs, icon in the drawer, onboarding → home (see [android-fdroid.md](android-fdroid.md)) |
| Not yet | phone camera → transfer link on real devices, file export/import on a real Android phone, iOS Safari install |
