# Project docs

Start here if you are a person or an agent picking up this project.

**What it is:** **Bürgerweg** ("citizen's path"), a calm, local-first app for preparing for the German citizenship
test (*Einbürgerungstest* / *Leben in Deutschland*). One Expo / React Native codebase ships as a **web app + PWA**
(covering iPhone, desktop and Android browsers) and a native **Android app for F-Droid**, plus a static, SEO-friendly
**landing page**. Everything stays free to build, host and publish.

| Doc | Read it when you… |
| --- | --- |
| [SPEC.md](SPEC.md) | need the contract: numbered requirements (MUST/SHOULD), status, and the release checklist |
| [product.md](product.md) | need the requirements, what each screen does, and the rules the owner asked for |
| [architecture.md](architecture.md) | change code: stack, folders, routing, state, theming, i18n, components |
| [question-data.md](question-data.md) | touch questions, answers, translations or images, or need to regenerate them |
| [progress-transfer.md](progress-transfer.md) | touch sync / transfer (account-free links, QR, file) |
| [deployment.md](deployment.md) | build or host the website: landing page, `/app` PWA, service worker, SEO |
| [android-fdroid.md](android-fdroid.md) | build the Android APK or work on the F-Droid release |
| [development.md](development.md) | set up, run and test locally |
| [branding.md](branding.md) | change the name, icon, splash or favicon |

## Status (2026-10-29)

- MVP works on **web** (dev and production build), as a **PWA** (offline, installable) and on **Android** (Expo Go
  and a release APK).
- **Scope:** web + PWA + Android/F-Droid. No native iOS build (iPhone users install the PWA).
- Landing page in German (`/`) and English (`/en/`); the app lives at `/app/`.
- App id `com.buergerweg.app`, version 1.3.0 (versionCode 6); every change bumps it (see `AGENTS.md`). Icon: "rainbow arcs", see [branding](branding.md).
- Open source on GitHub (`github.com/elnurastanov/burgerweg`, branch `master`): MIT license, `NOTICE.md`,
  contributing guide, code of conduct, security policy, F-Droid metadata.
- Website: **https://astanov.com/burgerweg/** on Cloudflare Workers, static assets only
  ([deployment.md](deployment.md#cloudflare-workers-chosen-host)). The base path follows `SITE_URL`.
- **Open before release:** review the answer key and translations ([question-data.md](question-data.md#review-status)),
  clarify the rights to five third-party catalog photos (`NOTICE.md`), finish the Cloudflare route, tag the current version (`v1.2.0`) and
  submit to F-Droid. Full list: [SPEC.md §6](SPEC.md#6-release-acceptance-checklist).
- **Smaller open items:** CI (typecheck + site build); lint is blocked by the npm install-script policy. Deep links into
  feature screens skip onboarding (a guard in `_layout.tsx` would fix it). Per-ABI APK splits.

## Golden rules

1. The **exam simulator is always German**. Translations are opt-in via the translate button and render
   *under* the German text, smaller and fainter (`Bilingual` component).
2. The **UI language** is the user's choice (English or Deutsch for now). Question content stays German everywhere;
   translations are an overlay.
3. **No accounts, no backend.** Progress lives on the device and moves only through the transfer link/code.
4. **No proprietary dependencies.** Anything pulling in Google Play Services, Firebase, ML Kit or analytics breaks
   F-Droid. Run the dependency check in [android-fdroid.md](android-fdroid.md) after adding native modules.
5. **Never use browser dialogs** (`window.confirm` / `alert`): some browsers and embedded webviews block them.
   Use `useDialog()` from `src/components/dialog.tsx`.
6. **Web-only APIs stay web-only.** For example, expo-router's `<Head>` crashes on iOS without a web origin; guard
   such code with `Platform.OS === 'web'`.
7. Design is **calm and smooth**: soft palette from `src/lib/theme.ts` (mirrored in `landing/styles.css`), rounded
   cards, gentle fade/zoom animations. Don't introduce loud colors or abrupt transitions.
8. Follow the root `AGENTS.md`: Expo SDK 58. Check versioned docs before using Expo APIs, and use `npx expo install`.
