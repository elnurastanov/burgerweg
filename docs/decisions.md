# Decisions and history

Newest first. Add an entry when you change behavior someone might otherwise "fix" back.

## 2026-10-29: icon framing, platform copy and calmer screenshot

- **Android launcher icon looked stretched:** the full artwork was the adaptive icon's background layer, which
  launchers crop to the middle 2/3 and enlarge. The artwork is now drawn at 2/3 size inside the layer (details in
  [branding.md](branding.md)). The monochrome layer uses the same framing.
- **Landing "On every device" section rewritten** (de + en): it described the PWA only for iPhone and the browser
  version only for computers, and the first rewrite called Bürgerweg "a web app" (it also has an Android app). Now it
  is three simple, equal cards (icon, title, one line, one action): **In the browser** (any device), **Install as an
  app** (links to the guide) and **Android app** (F-Droid, coming soon).
- **New "How to install as an app" section** (`#how-to-install` / `#so-installierst-du`): split by device
  (iPhone & iPad, Android, Computer), one row per common browser (Safari, Chrome, Edge, Firefox, Samsung Internet),
  including the honest "Firefox desktop can't install apps". Menu labels change between browser versions, so
  recheck them now and then. The offline FAQ and JSON-LD `operatingSystem` match the new wording.
- **Calmer feature screenshot:** the exam screenshot ("Which task does NOT belong…", with a wrong answer selected)
  was replaced by question 6, "Wie heißt die deutsche Verfassung?", with the correct answer and translation shown.
  The same image is used for the F-Droid listing (`phoneScreenshots/2.jpg`). Prefer short, friendly questions with the
  right answer selected for marketing screenshots.

## 2026-10-29: scope = web + PWA + Android/F-Droid; landing page; open-source prep

- **Owner decision:** skip native iOS. The MVP covers the **web app**, a **PWA** for every other platform
  (iPhone via Safari "Add to Home Screen"), and an **Android APK published only on F-Droid**, so everything stays free.
- **F-Droid compatibility:** removed `expo-camera` (its Android barcode scanner uses proprietary Google ML Kit)
  and five unused template modules. The release dependency tree has no Google Play Services, Firebase, ML Kit or
  analytics. The `ios/` folder and the `ios` section of `app.json` are gone.
- **Transfer without a scanner:** the QR code now holds a **link** `…/app/transfer#EBT1.…`; any phone camera opens
  it, and the web app imports from the URL fragment (never sent to a server) and then clears it. "Replace" also
  completes onboarding. Pasting a link or a bare code still works. `src/app/scan.tsx` was removed.
- **Web layout:** the app moved to **`/app/`** (`experiments.baseUrl`), and a **static landing page** (`landing/`, de at
  `/`, en at `/en/`) sits at the root. It's plain HTML/CSS with no JavaScript, for SEO and speed, plus real
  screenshots, JSON-LD, hreflang, Open Graph cards, sitemap and robots. `scripts/build-site.mjs` combines both into
  `site/`.
- **PWA:** `public/manifest.webmanifest`, `public/sw.js` (offline) and generated icons. The service worker registers
  only in production web builds. Registration first waited for `window.load`, which had already fired when the lazy
  layout bundle ran, so it never registered; it now registers right away when the page is complete.
- **Native crash fixed:** expo-router's `<Head>` threw on iOS ("add the handoff origin"). It now renders only on web.
  Found with a native iOS development build before iOS was dropped.
- **Open source:** MIT license (copyright "Bürgerweg contributors"), `NOTICE.md` (BAMF content, five third-party
  photos), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, F-Droid `fastlane/` listing and a draft recipe in `fdroid/`.
  Docs were generalized for outside contributors (no personal machine paths).

## 2026-10-28: name "Bürgerweg" and app icon

- **Name:** "Einbürgerungstest" was too generic, so the owner picked **Bürgerweg** ("citizen's path") from a short list
  (they found no app with that name in the Apple App Store). "Einbürgerungstest" stays in subtitles and descriptions
  so people searching for it still find the app. Changed: `app.json` name/slug/scheme, app id `com.buergerweg.app`,
  `appName` strings, export file `buergerweg-progress.txt`. The AsyncStorage key `ebt:v1` and the transfer prefix
  `EBT1.` were **kept** so existing progress and codes still work. The project folder is still `einbuergerungstest/`.
- **Icon:** chosen after several preview rounds (sunrise path → flag-colored sky → softened → waving flag →
  S3-style rolling waves → round steps). Final: **Y3 "rainbow arcs"**: muted flag colors (charcoal, dusty red,
  sand gold) as concentric arcs with paper-cut shadows, over green hills and a cream road. The owner wanted
  rounded, soft transitions (no flat horizon lines) and the German flag without loud colors. See branding.md.
- **Web title:** a custom `src/app/+html.tsx` stopped Expo's dev server from injecting the app script (blank
  page), so it was removed. The title and theme color now come from `<Head>` in `_layout.tsx`; the favicon comes
  from `app.json` `web.favicon` (served as `/favicon.ico`). Don't reintroduce `+html.tsx` without checking that
  the page still loads.

## 2026-10-28: centered progress section on phones

- **Owner request:** on mobile screens the home progress section should be center aligned.
- Below 520 px window width (`compact` in `src/app/index.tsx`) the label, ring and readiness pill are centered,
  and the stats list goes full width under the ring. Wider screens keep the ring and stats side by side.

## 2026-10-28: flashcards = random exam-style question + Shuffle

- **Owner requests:** flashcards should show a random question with its answers, **with answer options like the
  exam simulator**. Tabs and the progress bar aren't needed. After a correct *and* after a wrong answer the user
  must see a **Shuffle** button.
- Now: one random question rendered with the shared `QuestionView` (options A–D, image, translate toggle).
  Tapping an option reveals green/red, a feedback line appears, and Shuffle (always visible, primary after
  answering) draws the next question from a shuffled pile.
- Removed: deck chips, the 20-card session, the progress bar, the end summary, the flip card, "Again" / "Knew it",
  `recordCard`, and the "to repeat" count on home (the home card says "random questions").
- Flashcard answers are recorded with `recordAnswer`, like practice, so they count toward mastery.
- Buttons now use 16 px side padding, so two buttons fit side by side on phones without wrapping.

## 2026-10-28: docs folder and iOS check

- Added `docs/` so other agents can pick up the project. iOS verified in the simulator via Expo Go.
- Added `docs/SPEC.md`, the numbered requirements contract. Change the spec first when behavior changes.
- Removed the unused template `src/global.css` and the `reset-project` script.

## 2026-10-28: in-app dialogs instead of browser/system dialogs

- **Bug:** the exam close (X) button did nothing on web. `window.confirm` was blocked by the browser and returned
  `false` instantly, so the leave confirmation never passed.
- **Fix:** `src/components/dialog.tsx` (`DialogProvider`, `useDialog`). It's used for leaving the exam, submitting,
  resetting progress and transfer notices. The leave action falls back to `router.replace('/exam')` when there's no
  history (e.g. after a reload).
- **Rule:** never use `window.confirm` / `alert`, and prefer this dialog over `Alert.alert` for consistency.

## 2026-10-28: translation button always available

- **Bug report:** "can't see translation button in web". The UI was German, and the button was hidden when the UI
  language had no translation target.
- **Change:** `translationLang(uiLang)` returns the UI language, or `en` when the UI is German. The button now shows
  on practice, exam, results and flashcards for every language.

## 2026-10-28: initial build

- **Expo / React Native** for one codebase across web/Android/iOS (owner's choice).
- **Offline transfer only** (owner's choice): a compact `EBT1.` code as QR, text or file, with merge/replace on import.
  This avoids a server and accounts entirely.
- **Data from the official BAMF PDF** (Stand 07.05.2025), parsed by script. The answer key and English translations
  were written for the app and still need review (see question-data.md).
- **Exam simulator** chrome hard-coded to German via `translate('de', …)`. The result review uses the UI language.
- **Learning boxes (0–5)** rather than date-based spaced repetition: simpler, and it fits in the 3-char transfer
  encoding. (Flashcards originally had their own rating. Replaced later by exam-style answering, see above.)
- Exam state, practice order and pending scans are module-level (not persisted). A reload mid-exam ends the exam.
- Images are cropped from page renders (not the embedded originals), so captions like "Bild 1–4" and map numbers
  stay with the picture. JPEG at 720 px keeps the bundle at ~1.5 MB.
- Layout: buttons with long labels are stacked vertically; onboarding state grid is one column on phones
  (`flexBasis: 260`), two on wide screens.

## Open

- Review answers and translations (blocking for release).
- Domain (`SITE_URL`), first commit + push to `github.com/elnurastanov/burgerweg`, F-Droid submission, rights for
  five catalog photos.
- CI (typecheck + site build) once the repository is public; lint setup is blocked by the npm script policy.
- Deep links into feature screens bypass onboarding. Consider a guard in `_layout.tsx` if that matters.
