# 🌍 Put AI BOS Online (free HTTPS link for your phone)

This gives you a permanent web link like `https://ai-bos.onrender.com` that:
- works on your **Android phone** and **PC**, anywhere (not just your home Wi-Fi),
- has **HTTPS**, which is required for the **"Jarvis" voice** to work on a phone,
- can be **installed as an app** on your phone's home screen.

You don't write any code. You'll create 2 free accounts and click a few buttons.
**Total time: about 10 minutes.** Everything is already prepared for you.

---

## STEP 1 — Put the code on GitHub (free)

GitHub stores your app so the host can read it.

1. Go to **https://github.com** and create a free account (or sign in).
2. Click the **+** (top-right) → **New repository**.
   - Repository name: `ai-bos`
   - Set it to **Public** (simplest).
   - Click **Create repository**.
3. On the next page, click **"uploading an existing file"** (a blue link in the middle).
4. **Drag the whole `aibos` folder's contents** into the upload box.
   - ✅ Include: `server`, `public`, `package.json`, `package-lock.json`, `render.yaml`, `Dockerfile`, and the rest.
   - ❌ Do **NOT** upload the `node_modules` folder or the `data` folder (the host makes these itself). If you don't see those folders, great — nothing to skip.
5. Scroll down, click **Commit changes**. Your code is now on GitHub. 🎉

> 💡 Easier alternative: install **GitHub Desktop** (https://desktop.github.com) and drag the folder in — but the web upload above works fine.

---

## STEP 2 — Deploy it on Render (free, gives you HTTPS)

1. Go to **https://render.com** and click **Get Started** → sign up with your **GitHub** account (one click).
2. On your Render dashboard, click **New +** → **Web Service**.
3. Click **Connect** next to your `ai-bos` repository.
   - (If asked, give Render permission to see your GitHub repos.)
4. Render reads the included `render.yaml` and fills most settings in automatically. Just confirm:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** **Free**
5. Click **Create Web Service**.
6. Wait 2–4 minutes while it builds (you'll see logs scrolling). When it says **"Live"**, you'll get your link at the top, like:
   ```
   https://ai-bos.onrender.com
   ```
   That's your app, online! 🚀

> 🔑 Login is the same: **demo@aibos.app** / **demo1234**

---

## STEP 3 — Use it on your Android phone 📱

1. On your phone, open **Chrome** and go to your new link (e.g. `https://ai-bos.onrender.com`).
2. Sign in.
3. Tap the **🎙️ mic button** → tap **Allow** when it asks for the microphone.
4. Say **"Jarvis"**, wait for the beep, then speak your command — it talks back! 🔊
5. To make it a real app icon: tap Chrome's **⋮ menu → "Install app" / "Add to Home screen"**.

Now you have your AI Business Operating System as an installed app on your phone, with full hands-free voice. 🎉

---

## ❓ Good to know

- **First load may be slow.** On Render's free plan the app "sleeps" after 15 minutes of no use and takes ~30–50 seconds to wake up on the next visit. That's normal for the free tier. (A paid plan ~$7/mo keeps it always-on — optional.)
- **Updating the app later:** change a file on GitHub → Render automatically rebuilds and redeploys. Nothing else to do.
- **Your data:** the demo database lives on a small persistent disk, so your tasks/posts/etc. stay between visits.
- **Other free hosts work too** (Railway, Fly.io) — they can use the included `Dockerfile`. Render is the simplest, so start there.

---

## 🙋 Want me to do parts of this for you?
I can't log into your personal GitHub/Render accounts for you (they're yours and need your sign-in), but I've prepared **every file** so it "just works." If you get stuck on any step, tell me what screen you're on and I'll guide you click-by-click.
