# Product

## Owner requirements (original brief)

- Einbürgerungstest preparation app for **web, Android and iOS**.
  - *Revised 2026-10-29:* the MVP is **web + PWA + Android via F-Droid**, everything free; iPhone users get the
    PWA. A calm, SEO-friendly **landing page** routes visitors into the app.
- Design: **calm and smooth**.
- Main page has a **progress section**, **all questions**, a **real exam simulator** and **flash cards** for quick reminders.
- **Multi-language**: at least English and Deutsch to start. The interface shows in the chosen language.
- **Exam simulator is always in German**, with a **translation button**. When pressed, translations appear
  **under the main text, smaller and with less opacity**.
- **Sync without an online account**: users can move their progress between devices and platforms.

Choices the owner made when asked: Expo / React Native, **offline transfer only** (QR / code / file, no server),
questions built from the official BAMF catalog, full MVP on all three platforms.

## The real test (rules the app mirrors)

- 33 questions: 30 from the 300 general questions plus 3 from the 10 questions of the user's federal state.
- 60 minutes. Pass with **17** or more correct answers.
- Constants live in `EXAM` in `src/lib/questions.ts`.

A user's question pool is **310** questions: 300 general plus the 10 for their state (`questionsFor(state)`).

## Screens

| Route | File | What it does |
| --- | --- | --- |
| `/onboarding` | `src/app/onboarding.tsx` | First launch: pick UI language, then federal state. Sets `settings.onboarded`. |
| `/` | `src/app/index.tsx` | Dashboard. Redirects to onboarding if not done. Progress ring (mastery %), stats, readiness hint (centered and stacked on phones < 520 px, side by side on wider screens), the three feature cards, recent exams, link to transfer. |
| `/questions` | `src/app/questions/index.tsx` | All 310 questions. Search (German, translation, number) and filters: All, General, My state, New, Wrong, Starred. Status dot per question. |
| `/questions/[id]` | `src/app/questions/[id].tsx` | Practice one question with instant feedback (green/red), star, translate toggle, previous/next within the list the user came from. |
| `/exam` | `src/app/exam/index.tsx` | Exam intro (German, translated hint below if the UI isn't German). |
| `/exam/run` | `src/app/exam/run.tsx` | The exam: German chrome, timer (red under 5 min), progress bar, overview grid to jump between questions, translate toggle, close (with confirm), submit (with confirm). Auto-submits at 0:00. |
| `/exam/result` | `src/app/exam/result.tsx` | Score ring, passed/not passed, time, "take another exam", and a review of every question with your answer vs the correct one. Shown in the UI language. |
| `/flashcards` | `src/app/flashcards.tsx` | One random question from the user's 310, shown **like the exam** with options A–D. Tapping an option reveals correct/wrong at once. **Shuffle** (always visible, highlighted after answering) draws the next. No tabs, no progress bar. A shuffled pile means no repeats until all were shown. Answers count toward progress. |
| `/settings` | `src/app/settings.tsx` | Language, federal state, theme (system/light/dark), "show translations while practising", transfer, reset progress, about/source. |
| `/transfer` | `src/app/transfer.tsx` | Send: QR code with a transfer **link**, copy link, save as file. Receive: opening a link imports automatically; or paste a link/code, or open a file. Then merge or replace. |

## Landing page

Static pages at `/` (German) and `/en/` (English) in `landing/`: hero with the icon artwork and a phone screenshot,
test facts (33 / 60 / 17 / 310), four feature sections with real screenshots (exam with translation, flashcards,
progress, transfer), install instructions (iPhone PWA, Android browser or F-Droid, desktop), FAQ, a closing call to
action and a footer with privacy note, BAMF disclaimer, source link and language switch. Every call to action leads
to `/app/`. Details: [deployment.md](deployment.md).

## Translation behavior

- Translation target = the UI language, or **English when the UI is German** (`translationLang()`).
  So the translate button is always available.
- Practice, flashcards and results: translations start **on** if the UI isn't German and
  `settings.practiceTranslations` is true. In the exam they always start **off**.
- Image-only answer options ("Bild 1".."Bild 4") translate to "Image 1".."Image 4". Map numbers stay "1".."4".

## Learning model

Per question, `QStat` in `src/lib/store.tsx`:

- `r`: last result (0 never, 1 correct, 2 wrong). `c` / `w`: correct and wrong counts. `star`.
- `b`: learning box 0–5. A correct practice or exam answer raises it (min 2 after the first correct answer).
  A wrong answer resets it to 1. Practice, flashcard and exam answers all update it.
- **Mastered** = `r === 1 && b >= 2`. The home ring shows mastered / 310.
- **Readiness** (`useStats`): Exam ready = ≥85 % mastered and the last 3 exams passed. Looking good ≥60 %,
  Building up ≥20 %, otherwise Just getting started.
- Exam answers also update per-question stats. The last 50 exams are kept.

## Not built yet / ideas

- More UI languages (Turkish, Arabic, Ukrainian, Russian…). The structure supports it. Arabic would need an RTL check.
- Store screenshots and listing text.
- Reminder notifications, answer explanations, statistics per topic.
