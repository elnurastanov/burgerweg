# Contributing to Bürgerweg

Thanks for helping people prepare for the German citizenship test! Contributions of all sizes are welcome:
fixing a wrong answer, improving a translation, adding a language, or improving the app.

## Most useful right now

1. **Check answers.** The BAMF catalog does not publish solutions, so the answer key was written for this
   project. If you find a wrong answer, open an issue or a pull request with the question id (e.g. `g72`,
   `BE-4`) and a source.
2. **Improve translations.** English translations live in `scripts/catalog/en/` (general questions) and
   `scripts/build_data.py` (state questions). Regenerate the app data afterwards (see below).
3. **Add a language.** See [docs/architecture.md](docs/architecture.md#i18n).

## Getting started

```bash
npm install
npx expo start          # w = web, a = Android
npx tsc --noEmit        # must pass before you open a pull request
```

Read [docs/README.md](docs/README.md) first. It explains the product rules (for example, the exam simulator is
always in German), the architecture and the data pipeline.

## Changing question data

`src/data/*` and `assets/questions/*` are generated. Don't edit them by hand:

```bash
pip install pymupdf pillow
python3 scripts/parse_bamf.py katalog.pdf questions.json img/
python3 scripts/build_data.py questions.json scripts/catalog/en img/ src/data
```

## Pull requests

- Keep changes focused, and describe *why* in the pull request.
- Match the existing code style. Keep the UI calm: use the palette in `src/lib/theme.ts`.
- If you change behavior, update `docs/SPEC.md` and explain the reason in the doc that covers the area, or in the pull request.
- By contributing you agree that your contribution is licensed under the MIT License.

Please be kind and respectful. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
