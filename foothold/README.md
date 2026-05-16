# Foothold

> Lasting ground for your GLP-1 journey.

The companion app built for every dose — and the days you're off it.

## What this is

A focused product for GLP-1 users (Ozempic, Wegovy, Mounjaro, Zepbound, compounded) that solves what existing trackers miss:

1. **Doctor-Ready Reports** — One-tap PDF of dose history, side effects, vitals, weight, and protein adherence. Built for the 15-minute appointment.
2. **Shortage & Pharmacy Tracker** — Real-time inventory map, crowdsourced by users. Stop driving 90 minutes for nothing.
3. **The Off-Ramp** — Tapering, maintenance, and life after the drug. Most apps abandon users at the exact moment they need help the most.

## Repo layout

```
foothold/
├── landing/        Next.js 14 marketing site + waitlist (Vercel deploy)
├── mobile/         Expo React Native app (iOS + Android)
└── supabase/       Database migrations
```

Each app is independent — install and run separately.

## Stack

- **Landing**: Next.js 14 (App Router), TypeScript, Tailwind, Vercel
- **Mobile**: Expo (React Native), TypeScript, Expo Router
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions)
- **Hosting**: Vercel (landing), EAS Build (mobile)

## First-time setup

1. **Create a Supabase project** at https://supabase.com (free tier).
2. Run the migration in `supabase/migrations/` against your new project (paste into Supabase SQL Editor, or use the Supabase CLI).
3. Copy your project URL + publishable key into `landing/.env.local` and `mobile/.env.local` (see each `.env.example`).
4. Follow the README inside `landing/` to run the marketing site locally.
5. Follow the README inside `mobile/` to run the Expo app on a device or simulator.

## Status

- ✅ Brand + positioning locked
- ✅ Repo scaffold + Supabase schema for waitlist
- ✅ Landing page (Next.js) with waitlist form
- ⬜ Domain registered (`foothold.health` + `foothold.app` recommended)
- ⬜ Supabase project created + migration applied
- ⬜ Landing deployed to Vercel
- ⬜ Mobile app — sign up, dose logging, symptom tracker
- ⬜ Doctor-ready PDF export
- ⬜ Shortage tracker (Phase 2)
- ⬜ Off-ramp module (Phase 2)
