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
| [decisions.md](decisions.md) | want to know *why* something is the way it is, and what is still open |

## Status (2026-10-29)

- MVP works on **web** (dev and production build), as a **PWA** (offline, installable) and on **Android** (Expo Go
  and a release APK).
- **Scope:** web + PWA + Android/F-Droid. No native iOS build (iPhone users install the PWA).
- Landing page in German (`/`) and English (`/en/`); the app lives at `/app/`.
- App id `com.buergerweg.app`, version 1.0.0 (versionCode 1). Icon: "rainbow arcs", see [branding](branding.md).
- Prepared for open source: MIT license, `NOTICE.md`, contributing guide, code of conduct, security policy,
  F-Droid metadata. Git repository (branch `master`, remote `github.com/elnurastanov/burgerweg`) with only the
  template's initial commit; **all project work is uncommitted**.
- **Open before release:** review the answer key and translations ([question-data.md](question-data.md#review-status)),
  clarify the rights to five third-party catalog photos (`NOTICE.md`), pick a domain, commit and publish the
  repository, and submit to F-Droid. Full list: [SPEC.md §6](SPEC.md#6-release-acceptance-checklist).

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
