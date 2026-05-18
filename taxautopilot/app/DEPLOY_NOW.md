# 🚀 TaxAutopilot — Deploy in 4 Steps

You're tired. I get it. Here's the absolute minimum to get this live.

I've prepared everything I can. You only need to do 4 things.

---

## Step 1: Create the Supabase project (5 min)

1. Open https://supabase.com/dashboard
2. Click **"New Project"**
3. Name: `taxautopilot` · Region: closest to you · Password: hit "Generate"
4. Wait ~2 min for it to finish

Once it's ready:
- Go to **SQL Editor** in the left sidebar
- Click **"New query"**
- Open the file `supabase/ALL_MIGRATIONS_COMBINED.sql` from this repo
- Copy the whole thing
- Paste into the SQL Editor
- Click **"Run"** (bottom right)
- Should say "Success. No rows returned."

Now grab your keys:
- Go to **Settings → API** in the left sidebar
- You need 3 values (paste these into a notepad):
  - **Project URL** (looks like `https://xxxxx.supabase.co`)
  - **anon public** key (long string starting with `eyJ`)
  - **service_role** key (different long string — under "Reveal")

---

## Step 2: Get an Anthropic API key (5 min)

1. Open https://console.anthropic.com/settings/keys
2. Sign up if you don't have an account (gets you $5 free credit)
3. Click **"Create Key"** → name it `taxautopilot`
4. Copy the key (`sk-ant-api03-...`) — paste it in your notepad

---

## Step 3: Deploy to Vercel (10 min)

1. Open https://vercel.com/new
2. Sign in with GitHub
3. Find and import **`beharris234/askmyhandyman`**
4. **IMPORTANT** — In the configure screen:
   - **Root Directory** → click "Edit" → set to `taxautopilot/app`
   - **Framework** → should auto-detect as Next.js
5. Expand **"Environment Variables"** and add these 5 (copy-paste from your notepad):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | (Supabase Project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase anon public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (Supabase service_role key) |
| `ANTHROPIC_API_KEY` | (Anthropic key) |
| `ENCRYPTION_KEY` | `kltdCTd6fJO03Tewh4zpzKalXMY4Z7cdK8UIYzf+4/sygdsRVGrTGKkadKueoeR5` |

Then click **"Deploy"**.

Wait ~2-3 minutes for it to build.

---

## Step 4: Add the app URL back to itself (2 min)

Vercel gives you a URL like `taxautopilot-xxxx.vercel.app`. Copy it.

Back in Vercel → your project → **Settings → Environment Variables**:

Add one more variable:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://taxautopilot-xxxx.vercel.app` (whatever yours is) |

Then **Deployments → Redeploy** the latest one.

---

## ✅ Done — go test it

1. Open your `taxautopilot-xxxx.vercel.app` URL
2. Should redirect to `/login`
3. Click "Create one"
4. Sign up as yourself (any email/password works — Supabase doesn't require email verification by default)
5. You should land in the dashboard with the welcome modal
6. Try the AI helper (💬 bottom-right) — ask "how do I import clients?"
7. Try `/demo` — drop a tax doc photo, see the magic

If anything breaks, hit the 💬 helper or screenshot the error and send it to me.

---

## What's NOT set up yet (add later when you're ready)

- **Stripe** — for taking real payments (you have an account, do `/settings/billing` setup steps later)
- **Resend** — for transactional email (welcome/invite/etc emails — works without it, just no auto-send)
- **Google OAuth (Gmail)** — for connecting Gmail inboxes
- **Microsoft OAuth (Outlook)** — for connecting Outlook
- **Twilio** — for SMS (when you sign up)

All these have their own setup steps in `.env.local.example` — but none are needed for the first sign-in test.

---

## Domain (when you're ready)

After you've tested everything works:

1. Go to https://vercel.com/domains/search?q=taxautopilot.ai — buy it for $160 / 2 years
2. Vercel → your project → **Settings → Domains** → Add `taxautopilot.ai`
3. Vercel will tell you exactly what DNS to set (it auto-detects if you bought through them)
4. Wait 5-10 minutes for DNS to propagate
5. Update `NEXT_PUBLIC_APP_URL` to `https://taxautopilot.ai`
6. Redeploy
