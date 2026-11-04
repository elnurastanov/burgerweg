# Question data

## Source

Official BAMF *Gesamtfragenkatalog zum Test „Leben in Deutschland“ und zum „Einbürgerungstest“*,
**Stand 07.05.2025** (PDF, 191 pages), downloaded from bamf.de:
`https://www.bamf.de/SharedDocs/Anlagen/DE/Integration/Einbuergerung/gesamtfragenkatalog-lebenindeutschland.pdf?__blob=publicationFile`

- Teil I: 300 general questions ("Aufgabe 1–300").
- Teil II: 10 questions per federal state (16 × 10 = 160). For every state, question 1 is "which coat of arms" and
  question 8 is "which state on the map", both picture questions.
- **The PDF does not contain the correct answers.**
- `CATALOG_VERSION = '2025-05-07'` in `src/lib/questions.ts`. Bump it when the catalog changes, because the transfer
  code depends on question order (see progress-transfer.md).

## Generated files (don't edit by hand)

| File | Content |
| --- | --- |
| `src/data/questions.de.json` | `[{ id, n, s, q, o[4], a, img? }]`. `id` is `g1`..`g300` or `<STATE>-<n>` e.g. `BE-8`. `s` is the state code or `null`. `a` is the 0-based correct index. |
| `src/data/translations/en.json` | `{ [id]: { q, o[4] } }` |
| `src/data/images.ts` | `questionImages[id] = { src: require(...jpg), ratio }` |
| `assets/questions/<id>.jpg` | 43 images (11 general + 16 coats of arms + 16 maps), max 720 px wide, JPEG q82 (~1.5 MB total) |

State codes: BW BY BE BB HB HH HE MV NI NW RP SL SN ST SH TH.

## Pipeline

```bash
# 1. PDF → raw questions + cropped PNGs (needs: pip install pymupdf)
python3 scripts/parse_bamf.py katalog.pdf questions.json img/
# 2. raw + answers/translations → app data (needs: pip install pillow)
python3 scripts/build_data.py questions.json scripts/catalog/en img/ src/data
```

`build_data.py` writes `../../assets/questions` relative to the output dir, so pass exactly `src/data`.

### parse_bamf.py: how it works and the gotchas it handles

- It reads spans with PyMuPDF `get_text("dict")`, sorts lines by y, and merges spans on the same line.
- Question headers are bold lines matching `Aufgabe N`. Sections switch on `Fragen für das Bundesland X`.
- Option markers: mostly a **Wingdings2** glyph, but newer questions (e.g. 59, 111, 118, 149, 182, 184, 288) use a
  plain **"□"** character, and their option text is indented at x≈106 instead of 143.
- Header spans are split ("Aufgabe", " ", "16"), so whitespace spans are kept when joining.
- Images: the BAMF logo (y < 130) is ignored. Each question's images are unioned and **cropped from the page render**
  (with the "Bild 1..4" captions) down to the first option, so one image per question.
- When option texts are just "Bild N" or digits, the merged-line artifacts get normalized to `Bild 1..4` / `1..4`.
- Caption leaks are fixed in `build_data.py` `FIX_Q` (e.g. g130 "In Anlehnung an Bundeswahlordnung…").

### build_data.py: answers and translations

- **General questions:** `scripts/catalog/en/p1.json` (g1–100), `p2.json` (g101–200), `p3.json` (g201–300).
  The format is `"gN": [answer (1-based), "English question", "opt1", "opt2", "opt3", "opt4"]`.
  For picture-option questions only `[answer, "English question"]`; options become "Image 1..4" or stay "1..4".
- **State questions:** generated from templates in `state_q()`. Answers come from small tables in the script:
  `COAT` (coat of arms image per state), `MAP` (map number per state), `DISTRICT`, `CAPITAL`, `VOTE_18`
  (states where the municipal voting age is 18: BY, HE, SN), Bremen's Landtag term of 4 years, flag colors
  (always option 2 in this catalog), the head-of-government title, and "which minister does X not have" (foreign).

## Translation rules

The German text is the official BAMF wording and is never edited (except the PDF caption fix in `FIX_Q`). Translations
live only in `scripts/catalog/en/` (and the state templates in `build_data.py`), and `src/data/translations/en.json`
must match them.

- **Exact translation.** Same meaning, same sentence shape: an unfinished German sentence ("… ist …") stays an
  unfinished English one, and a question stays a question. Nothing is added or left out.
- **No hints.** The English must not make the right answer easier to spot than the German does. Example: *Schöffe*
  is "lay assessor", not "lay judge", because the correct answer to g150 is "an honorary judge" and the German
  question doesn't say *Richter*.
- **Allowed helps:** the German term in brackets after German institutions and concepts, e.g. "youth welfare office
  (Jugendamt)", and small aids like "22:00 (10 pm)". Use "they" for *sie/er*.
- **Terms** (follow the official English translation of the Basic Law where it has one):

  | German | English |
  | --- | --- |
  | Grundgesetz | Basic Law (Grundgesetz) |
  | Rechtsstaat | state governed by the rule of law (Rechtsstaat) |
  | Meinungsfreiheit | freedom of expression |
  | Bundestag, Bundesrat | Bundestag, Bundesrat (not translated) |
  | Bundesversammlung | Federal Convention |
  | Landtag | state parliament (Landtag) |
  | Bundesland | federal state |
  | Ministerpräsident/in | Minister-President |
  | Fraktion | parliamentary group (Fraktion) |
  | Schöffe | lay assessor (Schöffe) |
  | Ehrenamt, ehrenamtlich | honorary office (Ehrenamt), honorary |
  | DDR | GDR |

**Review 2026-11-04:** all 460 questions were translated with DeepL (DE → EN-GB) as an independent second opinion
and compared with ours; differing questions were checked against the German, and every English text was scanned for
additions. DeepL's own output was not used as the translation (it changed meanings, e.g. parties as "she",
*Faustrecht* as "rule of thumb"). Fixes went into 1.5.0.

## Review status

Answers were compiled by the AI agent from its own knowledge plus a visual check of every picture question;
they were **not** taken from an official answer key. Before release:

- [ ] Check all 460 answers against the BAMF online test centre (oet.bamf.de) or another trusted key.
- [ ] Specifically double-check **SL-4** (Saarland municipal voting age set to 16), and the time-sensitive ones:
      g72 (chancellor: Friedrich Merz), g73 (largest groups: CDU/CSU and AfD), g75 (head of state: Steinmeier),
      g213 (84 million inhabitants).
- [ ] Have a fluent speaker proofread the English translations (they are unofficial and marked as such in the app).
      A machine-assisted review against the rules above was done on 2026-11-04.
- Already fixed after the visual check: g209 is image 4 (GDR emblem), g226 is image 2 (EU flag).

## Updating for a new catalog

1. Download the new PDF and run both scripts.
2. Diff the raw `questions.json` against the old one. New or changed questions need entries in `scripts/catalog/en/*.json`.
3. Re-check picture answers (`COAT`, `MAP`) by looking at the regenerated images.
4. Bump `CATALOG_VERSION`. If question **order or count** changed, also bump the transfer format version.
