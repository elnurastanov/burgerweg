# Progress transfer (account-free sync)

The owner chose **offline transfer only**: no server and no account. Progress moves as a short code, wrapped in a
**link** to the web app: `https://<site>/app/transfer#EBT1.…`. The link is shown as a **QR code**, can be **copied**,
or saved as a **file**. Code: `src/lib/transfer.ts` (format), `src/lib/config.ts` (link), UI: `src/app/transfer.tsx`.

**Why a link instead of an in-app scanner:** the camera scanner (`expo-camera`) uses Google ML Kit on Android, which
F-Droid doesn't allow, and the web app can't scan reliably anyway. Every phone's camera app can open a QR link, and
the code sits in the URL **fragment** (`#…`), which browsers never send to a server.

## Format `EBT1.`

```
"EBT1." + base64url( deflate( UTF-8( JSON payload ) ) )
```

Payload:

```ts
{
  v: 1,
  cat: '2025-05-07',          // CATALOG_VERSION
  st: 'BE' | null,            // federal state
  q: string,                  // 3 chars per question, in QUESTIONS order (460 × 3)
  e: [minutesSinceEpoch, score, total, seconds][],  // last 20 exams
  u: number,                  // updatedAt (ms)
}
```

Per question (base 36, each value clamped to 0–35):

1. `r * 12 + b * 2 + star`: last result (0/1/2), learning box (0–5), star (0/1)
2. correct count
3. wrong count

Unseen questions are `000`, so the string compresses very well. A real code is about **200 characters**
(one exam + 34 answers), which fits easily in one QR code (`ecl="L"`).

**Order matters:** stats are matched by index in `questions.de.json`. If a future catalog changes the order or
count, bump the prefix (`EBT2.`) and keep a decoder for `EBT1.`.

Settings (language, theme) are **not** transferred. The federal state is, and it's applied only on *Replace*.

## Import flow

1. The code arrives as:
   - a **transfer link** opened in the browser/PWA: `captureTransferFromUrl()` runs once at startup in
     `_layout.tsx`, before the router initializes (it remounts screens and rewrites the URL during startup), decodes
     the fragment and keeps the result until the user decides. The transfer screen starts with the import card open.
     After Merge, Replace or Cancel, the code is removed from the address bar (`history.replaceState`). A broken link
     shows the "invalid code" message;
   - a **transfer link** opened in the **Android app** (see *Opening links in the installed app* below):
     `src/app/+native-intent.tsx` (`redirectSystemPath`) calls `captureTransferFromLink(url)` and routes to
     `/transfer`. This also works while the app is running: the transfer screen listens with `onTransferLink` and
     swaps in the new import card;
   - **pasted** text (a link or a bare code); `decodeTransfer` accepts any text containing `EBT1.`;
   - a **file** (`expo-document-picker`; on web `asset.file.text()`, on native `new File(uri).text()`).
2. A "Progress found" card replaces the receive card and shows answered count, exams and state.
3. The user picks:
   - **Merge** (`mergeProgress`): for each question, keep the record with more attempts (`c + w`); on a tie, the
     higher box wins. Stars are OR-ed. Exams are combined, de-duplicated by minute, newest first, max 50.
   - **Replace**: incoming progress replaces local, the state is adopted, and onboarding is marked done (so a
     brand-new device opened via a link goes straight to the dashboard).

## Opening links in the installed app

A scanned QR code opens `…/app/transfer#EBT1.…`. Where Bürgerweg is installed, that link should open the app:

| Installed as | How | Status |
| --- | --- | --- |
| **Android app** | Android App Links. `app.config.js` adds an intent filter (`autoVerify`) for `https://<host><path>/transfer`, derived from `EXPO_PUBLIC_WEB_APP_URL`. Android trusts it only if `https://<host>/.well-known/assetlinks.json` lists the app's signing-certificate SHA-256. `scripts/build-site.mjs` writes that file from `ANDROID_CERT_SHA256` (comma-separated). | Works once the fingerprint is published; until then users can allow it by hand: *App info → Open by default → Add links*. |
| **PWA on Android** (installed via Chrome "Install app") | Chrome's WebAPK opens links inside the manifest scope (`<base>/app/`) in the installed PWA. | Built in, nothing to configure. A home-screen *shortcut* (older "Add to Home screen") doesn't capture links. |
| **PWA on desktop Chrome/Edge** | Manifest `handle_links: "preferred"` + `launch_handler: navigate-existing`. | Depends on browser support/flags. |
| **PWA on iPhone/iPad** | Not possible: iOS always opens links in Safari. | Limitation. In Safari the import works, but home-screen apps have separate storage, so use paste/file into the installed PWA. |

**Fingerprints:** the local test build is signed with React Native's public debug key
(`FA:C6:17:45:…:3B:9C`, see `android/app/debug.keystore`). F-Droid signs with its own key, whose SHA-256 is shown on
the app's F-Droid page after the first release. Put the release fingerprint into the `ANDROID_CERT_SHA256` build
variable on Cloudflare. Listing the public debug key in production is possible for testing but lets any app signed
with that key claim transfer links, so remove it once the F-Droid key is known. The domain must also route
`/.well-known/assetlinks.json` to the same Worker (see deployment.md).

## Export

- Link: `transferLink(code)` = `webAppUrl() + '/transfer#' + code`. `webAppUrl()` is `EXPO_PUBLIC_WEB_APP_URL`
  (set at build time, e.g. by `scripts/build-site.mjs`), falling back to the current address on web. If neither
  exists (an Android build without the variable), the bare code is used.
- Web file: Blob → hidden `<a download="buergerweg-progress.txt">` (contains the link).
- Native: write to `Paths.cache` with `expo-file-system` `File`, then `Sharing.shareAsync`.

## Tested

A web round trip (export → wipe storage + change state → paste → Replace) restored all stats, exams and state
exactly. A link carrying 259 answered questions is about 600 characters, still one QR code, but dense; a check with
real phone cameras is still to do. Opening a link on a real phone has **not** been tested yet.
