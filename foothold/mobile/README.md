# Foothold — Mobile

Expo (React Native) app for Foothold. Targets iOS and Android from one codebase.

## Local setup

```bash
cd foothold/mobile
npm install
cp .env.example .env       # fill in Supabase URL + anon key
npx expo start             # press i for iOS sim, a for Android, w for web
```

You'll need either:
- The **Expo Go** app on your phone (scan the QR code), or
- An iOS Simulator (Mac + Xcode), or
- An Android emulator (Android Studio).

## Ship to Play Store (Android-first plan)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview      # internal APK for testing
eas build -p android --profile production   # signed AAB for Play Store
eas submit -p android                       # upload to Play Console
```

Play Console one-time setup:
1. Create a Google Play Console account ($25 one-time).
2. Create the **Foothold** app listing.
3. First release goes to **Internal testing** track — invite yourself + 5–10 testers.
4. Promote to closed/open testing as you gather feedback, then production.

## Current state

This is a v0.1 scaffold — no features wired yet. The app shows the brand and value props. Next session we add:

- Onboarding (medication + phase selection)
- Sign in (Supabase Auth — email magic link)
- Dose logger
- Symptom tracker
- Weight + protein tracking
