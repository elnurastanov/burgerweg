# Specification: Bürgerweg (Einbürgerungstest app)

Version 1.1 · 2026-10-29 · Status: **MVP implemented**, answer key pending review

This is the contract for what the app must do. Other docs explain *how* it's done:
[product.md](product.md) (screens), [architecture.md](architecture.md) (code),
[question-data.md](question-data.md), [progress-transfer.md](progress-transfer.md),
[deployment.md](deployment.md) (web, PWA, landing page), [android-fdroid.md](android-fdroid.md).
When behavior changes, update this spec first, then the code, then the doc that covers the area.

Requirement keywords: **MUST** = required for release, **SHOULD** = expected unless there's a recorded reason,
**MAY** = optional. Status column: ✅ done · ⚠️ done with caveat · ⏳ not done.

---

## 1. Purpose and scope

Help people living in Germany prepare for the *Einbürgerungstest* / *Leben in Deutschland* test by practising the
official question catalog, simulating the real exam and repeating weak questions, on any device and without an account.

**In scope:** the official BAMF catalog (300 general + 16 × 10 state questions), practice, exam simulation, flashcards,
progress tracking, UI in multiple languages, device-to-device progress transfer.

**Out of scope (v1):** user accounts, cloud sync / any backend, payments, ads, analytics, answer explanations,
push notifications, the *Orientierungskurs* content beyond the catalog, **a native iOS app** (iOS is served by the
PWA), and paid app stores. The MVP must stay **free to build, host and publish**.

## 2. Users and platforms

- **Users:** adults preparing for the test. Many aren't fluent in German, so German exam content needs optional help
  in their language. Users may switch between phone and computer.
- **Platforms (MUST), one codebase (Expo / React Native):**
  - **Web app**, also installable as a **PWA** (offline, home-screen icon). This covers iPhone/iPad, desktop and
    Android browsers.
  - **Android app**, distributed **only through F-Droid**, so it must build from source with no proprietary
    dependencies.
  - iOS native builds are **not** part of the MVP (they need a paid Apple developer account).
- **Landing page (MUST):** a calm, SEO-friendly page that introduces the app and links into it (section 3.10).

## 3. Functional requirements

### 3.1 Onboarding

| ID | Requirement | Status |
| --- | --- | --- |
| ON-1 | On first launch the user MUST choose a UI language and then their federal state before seeing the dashboard. | ✅ |
| ON-2 | The default UI language SHOULD follow the device locale (German if the device is German, else English). | ✅ |
| ON-3 | Both choices MUST be changeable later in Settings. | ✅ |

### 3.2 Dashboard (main page)

| ID | Requirement | Status |
| --- | --- | --- |
| DB-1 | The main page MUST have a **progress section**: mastery % of the user's 310 questions, answered, correct, to review, exams passed / taken. | ✅ |
| DB-2 | It MUST give access to **All questions**, the **Exam simulator** and **Flashcards**. | ✅ |
| DB-3 | It SHOULD show recent exam results (score, pass/fail, date, duration) and a readiness hint. | ✅ |
| DB-4 | It MUST give access to Settings and Progress transfer. | ✅ |

### 3.3 Question catalog and practice

| ID | Requirement | Status |
| --- | --- | --- |
| QC-1 | The app MUST contain all questions of the current official BAMF catalog (Stand 07.05.2025): 300 general + 10 per state, including the 43 picture questions with their images. | ✅ |
| QC-2 | The user's pool MUST be the 300 general questions plus the 10 of their selected state. | ✅ |
| QC-3 | The list MUST support search (German text, translation, question number) and filters: all, general, my state, new, wrong, starred. | ✅ |
| QC-4 | In practice, choosing an answer MUST immediately show correct (green) or wrong (red, with the correct answer highlighted). | ✅ |
| QC-5 | The user MUST be able to star questions and go to the previous / next question within the current list. | ✅ |
| QC-6 | Question content MUST be shown in German (the test language); a translation MAY be shown below it (see 3.6). | ✅ |
| QC-7 | Every question's marked correct answer MUST be correct. | ⚠️ compiled for this app, pending review ([question-data.md](question-data.md#review-status)) |

### 3.4 Exam simulator

| ID | Requirement | Status |
| --- | --- | --- |
| EX-1 | An exam MUST draw 33 questions: 30 random general + 3 random from the user's state, in random order. | ✅ |
| EX-2 | It MUST have a 60-minute countdown and MUST auto-submit at 0:00. Remaining time SHOULD be highlighted when under 5 minutes. | ✅ |
| EX-3 | A score of **17 or more** correct MUST count as passed. | ✅ |
| EX-4 | The simulator (questions, answers and its own controls) MUST always be in **German**, regardless of UI language. | ✅ |
| EX-5 | A **translation button** MUST toggle translations, shown **under** the German text, **smaller and with lower opacity**. It MUST be available for every UI language (German UI → English). | ✅ |
| EX-6 | No right/wrong feedback MUST be shown during the exam. The user MUST be able to change answers, move back/forward and jump via an overview of all 33 questions. | ✅ |
| EX-7 | Submitting with unanswered questions MUST ask for confirmation, stating how many are open. | ✅ |
| EX-8 | Leaving mid-exam MUST be possible via a close button with confirmation. Cancel keeps the exam running. | ✅ |
| EX-9 | Confirmations MUST NOT depend on browser-native dialogs (`window.confirm` can be blocked). | ✅ |
| EX-10 | The result MUST show score, pass/fail, the pass mark, time used, and a review of every question (your answer vs the correct one, with optional translation). It MAY be shown in the UI language. | ✅ |
| EX-11 | A finished exam MUST be saved to history and MUST update the per-question progress. | ✅ |

### 3.5 Flashcards

| ID | Requirement | Status |
| --- | --- | --- |
| FC-1 | Flashcards MUST show **one random question** from the user's 310 with its **four answer options, like the exam simulator** (A–D, image if any, optional translation). | ✅ |
| FC-2 | Choosing an option MUST immediately show correct (green) or wrong (red, with the correct answer highlighted). | ✅ |
| FC-3 | A **Shuffle** button MUST be visible both before and after answering, whether the answer was correct or wrong, and MUST show another random question. | ✅ |
| FC-4 | Every question MUST come up once before any repeats (shuffled pile). Shuffle MUST NOT show the same card twice in a row. | ✅ |
| FC-5 | No deck tabs, progress bar, sessions or self-rating. Answers count toward progress like practice. | ✅ |

### 3.6 Languages and translation

| ID | Requirement | Status |
| --- | --- | --- |
| LN-1 | The UI MUST be available in **English** and **Deutsch**. | ✅ |
| LN-2 | The whole interface (outside the exam simulator) MUST appear in the chosen language. | ✅ |
| LN-3 | Translations of question content MUST exist for every question in every non-German UI language. | ✅ (en) |
| LN-4 | Translations MUST be presented as secondary: under the German text, smaller, fainter. | ✅ |
| LN-5 | Adding a language SHOULD need only data files (UI strings + question translations), no screen changes. | ✅ |
| LN-6 | Translations MUST be labeled unofficial in the app's About section. | ✅ |

### 3.7 Progress and storage

| ID | Requirement | Status |
| --- | --- | --- |
| PR-1 | All progress MUST be stored locally on the device and persist across restarts. | ✅ |
| PR-2 | The app MUST work fully offline after install / first load. | ✅ |
| PR-3 | Tracked per question: last result, correct count, wrong count, learning box (0–5), star. Per exam: date, score, total, duration (last 50). | ✅ |
| PR-4 | "Mastered" = last answer correct and box ≥ 2. | ✅ |
| PR-5 | The user MUST be able to reset all progress, with confirmation. | ✅ |

### 3.8 Progress transfer (sync without an account)

| ID | Requirement | Status |
| --- | --- | --- |
| TR-1 | The user MUST be able to move progress between any two devices/platforms **without creating an account** and **without a server**. | ✅ |
| TR-2 | Export as a **QR code**, a **copyable link** and a **file**. The QR code and the link point to the web app's transfer screen with the code in the URL fragment (`…/app/transfer#EBT1.…`), so **any phone camera** can open it. | ✅ |
| TR-3 | Import by **opening a transfer link** (web/PWA imports it automatically and removes it from the address bar), **pasting a link or code**, or **opening the file**. There is no in-app camera scanner (see TR-9). | ✅ / ⏳ camera → link untested on real phones |
| TR-9 | The transfer code MUST NOT be sent to any server; the fragment (`#…`) is never transmitted by browsers. | ✅ |
| TR-4 | Before applying, the app MUST show what was found (answered count, exams, state) and offer **Merge** or **Replace**. | ✅ |
| TR-5 | Merge MUST keep the more practised record per question, OR stars, and combine exam history without duplicates. Replace MUST make this device match the source, including the federal state. | ✅ |
| TR-6 | The link MUST fit in a single QR code for any amount of progress. | ✅ (3 chars/question before compression; typically 200–600 chars incl. URL) |
| TR-7 | Invalid codes MUST show a clear error and change nothing. | ✅ |
| TR-8 | The format MUST be versioned (`EBT1.`) so a future catalog change can't silently corrupt imports. | ✅ |

### 3.9 Web app and PWA

| ID | Requirement | Status |
| --- | --- | --- |
| PW-1 | The web app MUST be served under `/app/` (landing page at `/`). | ✅ |
| PW-2 | It MUST be installable (web manifest with name, icons 192/512 + maskable, theme color, standalone display; Apple touch icon and meta tags for iOS). | ✅ |
| PW-3 | After the first visit it MUST work offline (service worker: network-first pages, cache-first static files). | ✅ |
| PW-4 | The service worker MUST only run in production builds, never in development. | ✅ |

### 3.10 Landing page

| ID | Requirement | Status |
| --- | --- | --- |
| LP-1 | A static, JavaScript-free landing page in **German (`/`)** and **English (`/en/`)**, in the app's calm style, with light and dark mode. | ✅ |
| LP-2 | It MUST introduce the app with real screenshots and link prominently to the app (`/app/`). | ✅ |
| LP-6 | It MUST present the three ways to use Bürgerweg (browser on any device, installed as an app (PWA), Android app via F-Droid) and include an install guide split by device (iPhone/iPad, Android, computer) covering the common browsers (Safari, Chrome, Edge, Firefox, Samsung Internet). | ✅ |
| LP-3 | SEO: unique title (≤ 60 chars) and meta description (≤ 160 chars), one `h1`, canonical URL, `hreflang` alternates, Open Graph/Twitter cards with a 1200×630 image, JSON-LD (`WebApplication`, `FAQPage`), `robots.txt`, `sitemap.xml`, descriptive `alt` text, image dimensions set. | ✅ |
| LP-4 | It MUST state that the project is independent of the BAMF and that translations are unofficial, and describe the privacy model (no cookies, no tracking). | ✅ |
| LP-5 | Absolute URLs come from `SITE_URL` at build time. | ✅ |

### 3.11 Settings

| ID | Requirement | Status |
| --- | --- | --- |
| ST-1 | Language, federal state, appearance (system / light / dark). | ✅ |
| ST-2 | Toggle "show translations while practising" (non-German UI). | ✅ |
| ST-3 | Links to progress transfer and reset; About with source and catalog date. | ✅ |

## 4. Non-functional requirements

| ID | Requirement | Status |
| --- | --- | --- |
| NF-1 | **Calm, smooth design:** soft muted palette, generous spacing, rounded cards, gentle fade/zoom/flip animations, no aggressive colors or sounds. | ✅ |
| NF-2 | Light and dark mode, following the system by default. | ✅ |
| NF-3 | Phone-first layouts that also read well on tablets/desktop (content max width 720). Long button labels MUST NOT break mid-word. | ✅ |
| NF-4 | Privacy: no tracking, no cookies, no network calls for app features, no camera or other runtime permissions. | ✅ |
| NF-8 | **Free & FOSS:** no proprietary dependencies (no Google Play Services, Firebase, ML Kit, analytics), so the Android app qualifies for F-Droid. Hosting must work on any free static host. | ✅ (dependency scan clean) |
| NF-5 | Performance: the list of 310 questions scrolls smoothly (virtualized). Question images ≤ ~1.5 MB total. | ✅ |
| NF-6 | Accessibility: buttons and options carry roles/labels. Text uses system fonts and respects platform text scaling. | ⚠️ basic; no full audit yet |
| NF-7 | Code quality: TypeScript strict passes (`npx tsc --noEmit`), `npx expo-doctor` passes. | ✅ (lint blocked by npm policy) |

## 5. Data specification

- Question: `{ id, n, s, q, o[4], a, img? }`. `id` = `g1`..`g300` or `<STATE>-<1..10>`. `a` = 0-based correct index.
- Translation file per language: `{ [id]: { q, o[4] } }`.
- Federal state codes: BW BY BE BB HB HH HE MV NI NW RP SL SN ST SH TH.
- Stored app data: AsyncStorage key `ebt:v1` → `{ settings, progress }`.
- Transfer code: `EBT1.` + base64url(deflate(JSON)). Full layout in [progress-transfer.md](progress-transfer.md).

## 6. Release acceptance checklist

- [ ] QC-7: all 460 answers reviewed against an authoritative key; time-sensitive answers rechecked (chancellor,
      largest groups, head of state, population, voting ages).
- [ ] English translations proofread.
- [ ] Rights for the five third-party catalog photos confirmed, or the photos replaced (see `NOTICE.md`).
- [ ] TR-3: phone camera → transfer link tested on real iPhone and Android; file export/import tested on Android.
- [x] App name (Bürgerweg) and icon set (app icon, Android adaptive + monochrome, splash, favicon, PWA icons).
- [x] F-Droid listing (fastlane metadata, de + en, screenshots) and draft build recipe.
- [x] Repository published on GitHub (`REPO_URL` default points to it).
- [ ] `v1.0.0` tag.
- [ ] Domain chosen; site deployed on Cloudflare Pages with `SITE_URL` set.
- [ ] F-Droid merge request opened and accepted.
- [ ] Legal page if required for the operator (e.g. German *Impressum*), decided by the maintainer.

## 7. Future (not committed)

More UI languages (Turkish, Arabic with RTL, Ukrainian, Russian…), answer explanations, topic statistics, study
reminders, Android App Links so transfer links open the native app, a native iOS app, an optional live sync
(it would need a server and is explicitly out of scope for v1).
