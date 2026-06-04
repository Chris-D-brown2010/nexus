# 🧠 AI BOS — AI Business Operating System

A centralized **AI executive command center** for business owners. A primary **Master AI** coordinates **7 specialized AI co-workers** across content, communication, finance, market intelligence, feedback, website, and strategy.

Built as a **PWA (Progressive Web App)** — runs in any browser on **PC** and installs like a native app on **Android** (home-screen icon, offline shell, fullscreen).

---

## ✨ What's included (this MVP)

- **Full-stack app**: Node.js + Express backend, SQLite database, JWT auth.
- **Master AI assistant** with **voice control** (mic), natural-language commands, and intent routing that **delegates to co-worker modules**.
- **7 AI Co-worker modules**, each with its own working screen:
  1. 📝 Content & Publishing — drafts posts/ads, approval-gated publishing
  2. 💬 Communication — drafts emails/replies, approval-gated send
  3. 📈 Market & Stock — watchlist, alerts, news summaries
  4. 🔐 Escrow & Transactions — payment monitoring + risk flagging
  5. ⭐ Customer Feedback — sentiment analysis + CSAT
  6. 🌐 Website Management — health score, issues, SEO wins
  7. 🧠 Business Intelligence — KPIs, forecasts, executive reports
- **Command-center dashboard** — KPIs, charts, pending approvals, alerts.
- **Task management** (kanban).
- **Security & Privacy** — role-based access control (RBAC), MFA toggle, secure-integration connectors, **audit trail / activity log**, approval gates before publishing/sending/financial actions.
- **Notifications center** with per-module badges.
- **Simulated AI** — no API keys needed; fully clickable with realistic sample data.

> 🔑 **Demo login (pre-filled):** `demo@aibos.app` / `demo1234`

---

## ▶️ Run on your PC

```bash
cd aibos
npm install      # first time only
npm start
```
Then open **http://localhost:3000** in your browser. Sign in with the demo account (or create a new one).

---

## 📱 Install on Android (PWA — easiest, no build tools)

1. Make the server reachable from your phone. Two options:
   - **Same Wi-Fi:** run `npm start` on your PC, find your PC's local IP (e.g. `192.168.1.20`), then on your Android Chrome open `http://192.168.1.20:3000`.
   - **Public URL:** deploy to any Node host (Render, Railway, Fly.io, a VPS) and open the HTTPS URL. *(PWA install + voice require HTTPS in production.)*
2. In **Chrome on Android**, tap the **⋮ menu → "Add to Home screen" / "Install app"**.
3. It now opens fullscreen with its own icon, works offline (app shell), and behaves like a native app.

### Optional: build a real APK with Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "AI BOS" app.aibos --web-dir=public
npx cap add android
npx cap copy
npx cap open android      # opens Android Studio → Build → Build APK
```
Point the app at your deployed backend URL (set the API base in `public/js/api.js`).

---

## 🗂 Project structure

```
aibos/
├── server/
│   ├── index.js     # Express API: auth, dashboard, modules, CRUD, RBAC, audit
│   ├── db.js        # SQLite schema + demo seed data
│   └── ai.js        # Simulated Master AI + co-worker engine
├── public/          # PWA frontend (no build step)
│   ├── index.html
│   ├── manifest.json, sw.js
│   ├── css/styles.css
│   ├── js/api.js    # API client + helpers
│   ├── js/views.js  # all module screens
│   ├── js/app.js    # auth, router, shell, notifications
│   └── icons/
└── data/aibos.db    # created on first run
```

---

## 🔒 Security model (demonstrated)

- **JWT** auth (7-day tokens), bcrypt-hashed passwords.
- **Role-based access control**: only `owner`/`manager` can publish/send; only `owner` can execute financial actions (escrow).
- **Approval gates**: AI never publishes content, sends messages, or moves money without explicit user approval.
- **Audit trail**: every sensitive action is logged (visible under *Security & Privacy*).
- **MFA toggle**, secure-integration (OAuth) connectors, encryption/compliance indicators.

---

## 🚀 Going to production (real AI + integrations)

The architecture is ready to swap the simulated engine for real services:

- **Real LLM**: replace `server/ai.js` `masterReply()/runModule()` with calls to OpenAI / Claude / Gemini (add your API key as an env var). The frontend contract stays the same.
- **Social APIs**: implement OAuth in the "Connect" buttons (Security screen) → Meta Graph API, X API, LinkedIn, YouTube Data API, WhatsApp Business, Telegram Bot API.
- **Market data**: wire the watchlist to a live quotes API.
- **Payments/Escrow**: integrate Stripe/escrow provider; keep the approval gate.
- **DB**: SQLite → Postgres for multi-user scale.
- **Push notifications**: add Web Push (VAPID) to the service worker.

---

Built with ❤️ as an AI BOS MVP. Everything is clickable today; nothing is locked behind paid keys.
