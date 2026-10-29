# Branding

## Name

**Bürgerweg** ("citizen's path"). Keep "Einbürgerungstest" in store subtitles, the web title and descriptions,
because that's what people search for. Example store subtitle: *Bürgerweg – Einbürgerungstest & Leben in Deutschland*.

| Where | Value |
| --- | --- |
| Display name | `app.json` → `expo.name`, `appName` in `src/lib/i18n.ts` (both languages) |
| Web tab title | `<Head>` in `src/app/_layout.tsx`: "Bürgerweg – Einbürgerungstest" |
| App id | `com.buergerweg.app` (Android package) |
| Link scheme | `buergerweg://` |

## Icon: "rainbow arcs" (variant Y3)

A sunrise-path landscape where the sky is the German flag, softened: concentric arcs in warm charcoal `#4A4544`,
dusty red `#C27A6C` and sand gold `#EDCB86`, with paper-cut shadows. Below them are green hills
(`#5E9686`, `#4A8273`) and a cream road `#F7F3EA` winding up to the horizon. Calm, recognizably German, and
still legible at browser-tab size.

### Source and regeneration

Everything is generated from code in `assets/icon-src/make_icons.py` (needs `pymupdf` and `pillow`):

```bash
cd assets/icon-src
python make_icons.py build Y3 ../images          # writes every PNG below
python make_icons.py sheet preview.png Y3 S2 X2  # comparison sheet of any variants
```

| File | Size | Use |
| --- | --- | --- |
| `assets/images/icon.png` | 1024 | default app icon (full bleed; the OS rounds corners) |
| `assets/images/android-icon-background.png` | 432 | Android adaptive icon background: the whole artwork drawn at 2/3 size in the middle, with the scene continuing outward (see below) |
| `assets/images/android-icon-foreground.png` | 512 | transparent (all artwork is in the background layer) |
| `assets/images/android-icon-monochrome.png` | 432 | Android 13+ themed icon (light shapes: gold arc + road), same 2/3 framing |
| `assets/images/splash-icon.png` | 512 | splash screen image, rounded corners, shown at 120 px on `#F5F3EE` / `#111816` |
| `assets/images/favicon.png` | 64 | web app favicon (Expo serves it as `/app/favicon.ico`) |
| `public/icons/icon-192.png`, `icon-512.png` | 192, 512 | PWA icons (rounded) |
| `public/icons/maskable-512.png` | 512 | PWA maskable icon (full bleed) |
| `public/icons/apple-touch-icon.png` | 180 | iPhone/iPad home screen (PWA) |

`app.json` → `android.adaptiveIcon.backgroundColor` is `#4A4544` to match.

**Adaptive icon framing:** an adaptive layer is 108 dp, but launchers show only the middle ~72 dp (and mask it to a
circle or squircle); the rest is reserved for parallax effects. Using the plain 1024 px artwork as the layer made
launchers zoom it ~150% and crop it, so the icon looked stretched. `make_icons.py` therefore renders the adaptive
layers with `icon_image(key, size, pad=256)`: the SVG view widens by 256 units on each side, so the full artwork fills
exactly the visible 2/3 and the scene simply continues into the hidden margin.

Other variants explored live in the same script; render any of them with `python make_icons.py sheet …`.
Landing-page visuals (hero SVG, Open Graph cards, landing favicons) come from `scripts/landing_assets.py`, which
reuses this artwork.

Renderer notes: MuPDF's SVG support ignores `clipPath`, `stroke-dasharray` and gradients, so rounded corners,
gradients, shadows and the monochrome cut-out are done with Pillow.

### Verification status

Web favicon, title, theme color and PWA manifest icons were checked in the browser. The icon was also seen on an
iOS simulator home screen during a native-build test (before iOS was dropped from the MVP). For Android, see
[android-fdroid.md](android-fdroid.md).
