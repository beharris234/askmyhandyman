# BoneDropper — Deploy & Store Submission Guide

The app lives at **`/bonedropper/`** in this repo. It's a static PWA plus one
serverless function (`/api/coach.js`) that powers the Big Drop AI coach.

---

## 1. Deploy the web app (Vercel)

This repo is already configured for Vercel (`vercel.json` builds the static
files + the `api/` function).

1. Push to GitHub (done — branch `claude/tenderism-app-gI9pc`).
2. In **vercel.com → Add New → Project**, import this repo. Vercel auto-detects
   the config; no build command needed.
3. **Add the AI coach key:** Project → Settings → Environment Variables →
   add `ANTHROPIC_API_KEY = sk-ant-...` (from console.anthropic.com).
   Apply to Production (and Preview if you want the coach in previews).
4. **Redeploy** so the env var takes effect.
5. The app is live at `https://<your-project>.vercel.app/bonedropper/`.
   The coach posts to `/api/coach`; privacy/terms are at `/privacy.html` and
   `/terms.html`.

### Custom domain (recommended)
- Add `bonedropper.app` (or similar) in Project → Settings → Domains.
- Then set the canonical share URL: in `bonedropper/index.html` find
  `const SHARE_URL=` and hard-set it to `https://bonedropper.app/bonedropper/`
  (or move the app to the domain root — see note below).

> **Optional: serve at the domain root** (`bonedropper.app` instead of
> `/bonedropper/`). Move the contents of `bonedropper/` to the repo root, or add
> a Vercel rewrite from `/` → `/bonedropper/`, and update the `start_url`/`scope`
> in `manifest.json` and the `/bonedropper/` paths in `sw.js`.

---

## 2. Protect the coach (cost control)

`api/coach.js` already enforces input caps and a coarse per-IP throttle, and the
app gives free users 5 coach questions/day. The throttle lives in one server
instance's memory, so for real protection add a shared store:

- Create a **Vercel KV** (or Upstash Redis) store, then key a daily counter per
  IP/device in `coach.js`. ~15 lines. Do this before you promote the app widely.
- Set a **monthly spend limit** in the Anthropic console as a backstop.

---

## 3. App icons & branding

- Placeholder icons are in `bonedropper/icons/` (a bone on the ember gradient),
  generated from a vector. Replace with a designed logo before launch if you
  want something custom — keep the same filenames/sizes:
  `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`.
- Make sure the **maskable** icon keeps the bone within the center ~80% safe zone.

---

## 4. Package as native apps (App Store + Google Play)

The app installs to the home screen as a PWA today. To submit to the stores,
wrap it with Capacitor (scaffold + full steps are in
[`native/README.md`](native/README.md)). Short version:

```bash
cd bonedropper/native
npm install
npm run copy:web          # copies the web app into ./www (rewrites paths)
npm run add:ios           # Mac + Xcode only
npm run add:android       # Android Studio
npm run open:ios          # archive & upload in Xcode
npm run open:android      # build signed AAB in Android Studio
```

- **iOS** needs a Mac with Xcode + CocoaPods.
- **Android** needs Android Studio.
- Point the native app at your deployed coach (it calls `/api/coach`); set the
  app's server/base URL to your domain, or bundle a small config so the native
  build hits `https://bonedropper.app/api/coach`.
- Wire native push/local notifications via `@capacitor/local-notifications` for
  reliable background timer alerts (see `native/README.md`).

---

## 5. Store accounts & listings

| | Apple App Store | Google Play |
|---|---|---|
| Account | Apple Developer — **$99/yr** | Play Console — **$25 once** |
| Build | `.ipa` via Xcode | signed `.aab` via Android Studio |
| Review time | ~1–3 days | ~hours–days |

**Listing assets you'll need (both):**
- App name: **BoneDropper**; subtitle/short desc: *"Fall off the bone, every time."*
- Full description (what it does + the heritage angle)
- **Screenshots** for required device sizes (you can regenerate them the way we did)
- App icon (1024×1024 for App Store)
- Category: **Food & Drink**
- **Privacy Policy URL** → `https://<domain>/privacy.html` (required)
- **Support URL** + contact email

**Privacy / data disclosures (required):**
- Apple **App Privacy** + Google **Data safety** forms. Disclose that:
  - Cook data & photos are stored on-device.
  - Photos/messages sent to the AI coach are transmitted to a third party
    (Anthropic) to generate replies.
  - No account, no ads, no tracking SDKs (unless you add analytics later).

---

## 6. Before-launch checklist

- [ ] `ANTHROPIC_API_KEY` set in Vercel; coach replies on production
- [ ] Custom domain + `SHARE_URL` updated
- [ ] KV-backed rate limit + Anthropic spend cap
- [ ] Real contact email in `privacy.html` / `terms.html`; lawyer review
- [ ] Designed icon (or keep the bone) + 1024² App Store icon
- [ ] Capacitor builds run on real iOS + Android devices
- [ ] Test: onboarding, camera/photo, Bluetooth probe, notifications, share, offline
- [ ] (Optional) Cloud sync for Pro, analytics, crash reporting
- [ ] Trademark check + secure domain/handles for "BoneDropper"
