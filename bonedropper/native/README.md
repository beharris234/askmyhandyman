# BoneDropper — Native App (iOS + Android)

The BoneDropper app lives as a self-contained web app in the parent
`/bonedropper` folder. It already installs to a phone home screen as a PWA and
works offline. This folder wraps that same app with
[Capacitor](https://capacitorjs.com) so it can be submitted to the **Apple App
Store** and **Google Play**, with true background **local notifications** for
the cook-timer milestones.

## What you get
- One codebase (the web app) → real iOS + Android apps
- Native local notifications (fire even when the app is backgrounded/closed)
- App icon, splash screen, status-bar theming

## Prerequisites
- **Node.js 18+**
- **iOS:** a Mac with **Xcode** + CocoaPods (`sudo gem install cocoapods`)
- **Android:** **Android Studio** (with an SDK + an emulator or a device)
- Apple Developer account ($99/yr) to publish to the App Store
- Google Play Developer account ($25 one-time) to publish to Play

## Build it
```bash
cd bonedropper/native

# 1. install tooling
npm install

# 2. copy the web app into ./www (rewrites /bonedropper/ paths to relative)
npm run copy:web

# 3. add the native platforms (creates ios/ and android/ folders)
npm run add:ios       # Mac only
npm run add:android

# 4. open in the native IDE to run / archive / submit
npm run open:ios      # opens Xcode
npm run open:android  # opens Android Studio
```

Any time you change the web app, re-run `npm run sync` to push the latest
into the native projects.

## Wiring up native notifications (optional but recommended)
The web app already fires in-app alerts + vibration at each cook milestone
using the Web Notification API. To make them fire reliably in the background
on a real device, schedule them through Capacitor's LocalNotifications plugin.

In `index.html`, the `startCook()` function knows every milestone's fire time
(`a.start + a.duration * milestone.f`). When running inside Capacitor
(`window.Capacitor?.isNativePlatform()`), schedule them like:

```js
import { LocalNotifications } from '@capacitor/local-notifications';

await LocalNotifications.requestPermissions();
await LocalNotifications.schedule({
  notifications: active.miles.map((m, i) => ({
    id: i + 1,
    title: '🍖 ' + m.l,
    body: m.m,
    schedule: { at: new Date(active.start + active.duration * m.f) }
  }))
});
```

That's the only native-specific code needed — everything else is the shared
web app.

## App identity
- **App ID:** `com.bonedropper.app` (change in `capacitor.config.json` before publishing)
- **Display name:** BoneDropper
- Replace the placeholder icon/splash via `@capacitor/assets` or directly in
  Xcode / Android Studio before submitting.
