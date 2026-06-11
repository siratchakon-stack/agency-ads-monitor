# 🚀 Agency Ads Balance Monitor

> A production-ready SaaS dashboard for digital marketing agencies to monitor Facebook Ad Account balances across 100+ accounts with automatic LINE alerts.

---

## ✨ Features

- **Facebook OAuth Login** — Connect your primary agency Facebook account
- **100+ Ad Accounts** — Batch API calls optimized for large account lists
- **Balance Monitoring** — Track topup vs. spend in real-time
- **LINE Auto-Alerts** — Instant notification when balance < 1,500 THB
- **Vercel Cron Jobs** — Auto-sync every 2 hours
- **Manual Sync** — One-click "Sync Now" button
- **Dark Mode** — Full dark mode support
- **Mobile Responsive** — Mobile-first design

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styling | TailwindCSS |
| Database | Supabase (PostgreSQL) |
| Auth | Facebook OAuth 2.0 |
| Ads API | Meta Marketing API v21 |
| Alerts | LINE Messaging API |
| Hosting | Vercel (with Cron Jobs) |

---

## 📁 Project Structure

```
agency-ads-monitor/
├── app/
│   ├── (auth)/login/          # Facebook OAuth login page
│   ├── (dashboard)/
│   │   ├── dashboard/         # Main dashboard
│   │   ├── ad-accounts/       # All ad accounts with filters
│   │   ├── notifications/     # Alert history
│   │   └── settings/          # LINE token & thresholds config
│   ├── api/
│   │   ├── auth/              # Facebook OAuth callback
│   │   ├── ad-accounts/       # CRUD for ad accounts
│   │   ├── sync/              # Manual sync endpoint
│   │   ├── cron/sync/         # Vercel cron endpoint
│   │   ├── notifications/     # Notification history
│   │   ├── settings/          # User settings
│   │   └── dashboard/stats/   # Dashboard stats
├── components/
│   ├── layout/                # Sidebar, Header
│   └── dashboard/             # StatsCard, AccountsTable, TopupModal
├── lib/
│   ├── facebook/              # Meta Marketing API client
│   ├── line/                  # LINE Messaging API client
│   ├── supabase/              # Supabase client (browser + server)
│   └── utils/                 # Helpers, sync logic
├── types/                     # TypeScript interfaces
├── supabase/schema.sql        # Complete DB schema
└── vercel.json                # Cron job config
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd agency-ads-monitor
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example .env.local
```

Fill in all required values in `.env.local`

### 3. Setup Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → Run the contents of `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** to `.env.local`
4. Copy your **service_role key** to `.env.local`

### 4. Setup Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new App → Select **Business** type
3. Add **Marketing API** product
4. Go to Settings → Basic → copy **App ID** and **App Secret**
5. Add OAuth Redirect URI: `http://localhost:3000/api/auth/callback`
6. Required permissions: `ads_management`, `ads_read`, `business_management`

### 5. Setup LINE Messaging API

1. Go to [developers.line.biz](https://developers.line.biz)
2. Create a new **Messaging API channel**
3. Get your **Channel Access Token** (long-lived)
4. Get your **User ID** from LINE Official Account Manager
5. Add to `.env.local`

### 6. Run Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Import your repo
2. Add all environment variables from `.env.example`
3. Deploy!

### 3. Configure Cron Job

The `vercel.json` already configures the cron job to run every 2 hours:

```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "0 */2 * * *"
  }]
}
```

Set the `CRON_SECRET` env var on Vercel for security.

### 4. Update Facebook OAuth

In your Facebook App settings, add your production URL:
```
https://your-app.vercel.app/api/auth/callback
```

Also update `.env`:
```
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 📊 How It Works

### Balance Calculation

```
remaining_balance = topup_amount - total_spend
```

1. User inputs the **latest topup amount** for each ad account
2. System fetches **total lifetime spend** from Meta API
3. Calculates remaining balance automatically
4. Shows color-coded status on dashboard

### Alert Logic

```
IF remaining_balance < threshold (default: 1,500 THB)
AND alert_sent = false
AND topup_amount > 0
THEN send LINE notification
     SET alert_sent = true
```

**Reset alert**: Click "Topup Completed" button on any account to reset `alert_sent = false`, allowing future alerts.

### Cron Schedule

- Runs automatically: **every 2 hours** via Vercel Cron
- Manual trigger: Click **"Sync Now"** on dashboard
- Batch API calls: 50 accounts per batch (optimized for 100+)

---

## 🎨 Dashboard Status Colors

| Status | Threshold | Color |
|--------|-----------|-------|
| Normal | ≥ 3,000 THB | 🟢 Green |
| Warning | 1,500 – 3,000 THB | 🟡 Yellow |
| Critical | < 1,500 THB | 🔴 Red |
| Inactive | Disabled account | ⚫ Gray |

---

## 🔒 Security

- `session_token` stored as **HttpOnly cookie**
- Facebook access tokens encrypted in Supabase
- Row Level Security (RLS) on all tables
- Cron endpoint protected by `CRON_SECRET`
- Environment variables never exposed to client

---

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role (server only) |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | ✅ | Facebook App ID |
| `FACEBOOK_APP_SECRET` | ✅ | Facebook App Secret (server only) |
| `NEXT_PUBLIC_FACEBOOK_REDIRECT_URI` | ✅ | OAuth callback URL |
| `LINE_CHANNEL_ACCESS_TOKEN` | ⚠️ | LINE Channel Access Token |
| `LINE_CHANNEL_SECRET` | ⚠️ | LINE Channel Secret |
| `LINE_USER_ID` | ⚠️ | LINE User ID to receive alerts |
| `CRON_SECRET` | ✅ | Secret for cron job auth |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app's public URL |

---

## 🐛 Troubleshooting

**Facebook Login fails**
- Check App ID and App Secret are correct
- Verify Redirect URI matches exactly in Facebook App settings
- Make sure Marketing API product is added

**LINE alerts not sending**
- Verify Channel Access Token in Settings page
- Make sure LINE_USER_ID is correct
- Check Notifications page for failed alerts

**Cron job not running**
- Verify `vercel.json` is in root directory
- Check CRON_SECRET is set in Vercel env vars
- Check Vercel Functions logs

---

Built with ❤️ using Next.js 15, Supabase, Meta Marketing API & LINE Messaging API
