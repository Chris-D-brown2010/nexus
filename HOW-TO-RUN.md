# 🧠 AI BOS — How to Run It (No Coding Needed!)

You **do not need to write or understand any code.** Follow the steps for your computer below.

The login is already filled in for you:
> **Email:** `demo@aibos.app`  **Password:** `demo1234`

---

## 🟢 THE EASY WAY (just double-click)

### On **Windows**
1. Install Node.js once (free) → go to **https://nodejs.org** and click the big green **"LTS"** button, then run the installer (keep clicking *Next*).
2. Open the `aibos` folder.
3. **Double-click the file named `START-HERE-Windows.bat`**
4. A black window opens, sets things up, and your browser opens the app automatically. Done! 🎉

> If Windows shows a blue "Windows protected your PC" box, click **More info → Run anyway** (it's safe — it's just your own app).

### On **Mac**
1. Install Node.js once (free) → go to **https://nodejs.org** and click the big green **"LTS"** button, then run the installer.
2. Open the `aibos` folder.
3. **Double-click the file named `START-HERE.command`**
4. A Terminal window opens, sets things up, and your browser opens the app automatically. Done! 🎉

> If Mac says *"cannot be opened because it is from an unidentified developer"*:
> Right-click the file → **Open** → **Open** again. (Only needed the first time.)

---

## 🟡 THE COPY-PASTE WAY (if double-click didn't work)

You'll paste 3 short lines, one at a time. **You never edit any code.**

### Step 1 — Install Node.js (once)
Go to **https://nodejs.org**, click the green **LTS** button, install it.

### Step 2 — Open the command window
- **Windows:** press the Start key, type `cmd`, press Enter.
- **Mac:** press `Cmd + Space`, type `terminal`, press Enter.

### Step 3 — Copy and paste these, ONE line at a time
Paste a line, press **Enter**, wait for it to finish, then paste the next.

**Line 1** — go into the app folder. *(Replace the path with where your `aibos` folder is. Tip: type `cd ` with a space, then drag the `aibos` folder onto the window, then press Enter.)*
```
cd path/to/aibos
```

**Line 2** — install the app (only needed the first time, takes ~1 minute):
```
npm install
```

**Line 3** — start the app:
```
npm start
```

### Step 4 — Open it
You'll see a message like `AI BOS server running → http://localhost:3000`.
Open your browser and go to:
```
http://localhost:3000
```
Sign in with the demo login above. 🎉

**To stop the app later:** close the command window (or press `Ctrl + C` in it).
**To start it again next time:** just do Step 3 (`npm start`) — no need to install again.

---

## 🎙️ Talking to it (hands-free voice)

Your assistant can **listen and talk back** — fully hands-free, like Alexa/Siri.

**To turn it on:**
1. Open the app and sign in.
2. Click the **🎙️ microphone button** at the top-right (or the floating mic orb in the bottom-right corner).
3. The first time, your browser asks **"Allow microphone?"** → click **Allow**.
4. You'll hear it say *"Voice mode on."* It's now always listening for the wake word.

**To use it:** just say **"Jarvis"**, wait for the soft beep, then speak your command. It will do the action and **read the answer out loud** in a female voice.

**Try saying:**
- *"Jarvis, give me my morning briefing"*
- *"Jarvis, any flagged transactions?"*
- *"Jarvis, open the dashboard"* (it navigates for you)
- *"Jarvis, draft a LinkedIn post about our launch"*
- *"Jarvis, show me today's market"*
- *"Jarvis, turn off voice"* (to stop hands-free mode)

**To change the wake word, the voice, or test it:** go to **Security & Privacy** in the menu → the **🎙️ Voice Assistant** card at the top. You can pick "Jarvis", "Hey BOS", "Assistant", or "Computer", switch between a female/male voice, and press **🔊 Test voice**.

> ⚠️ Voice works best in **Google Chrome** (on PC and Android). On a phone or any public website, it needs **HTTPS** — so for full phone voice, host it online (ask me to do this for you).
> 💡 There's also a **mic button inside the Master AI chat** — tap it, speak once, and it replies out loud (no wake word needed).

---

## 📱 Want it on your Android phone?
1. Start the app on your computer (steps above) and keep it running.
2. Make sure your phone and computer are on the **same Wi-Fi**.
3. Find your computer's IP address:
   - **Windows:** in the command window type `ipconfig` → look for **IPv4 Address** (like `192.168.1.20`).
   - **Mac:** type `ipconfig getifaddr en0` → it shows the IP.
4. On your phone's **Chrome**, go to: `http://YOUR-IP:3000` (e.g. `http://192.168.1.20:3000`)
5. Tap Chrome's **⋮ menu → "Install app" / "Add to Home screen"**. Now it's an app icon on your phone! 📲

---

## ❓ Quick help

- **"node is not recognized" / "command not found"** → Node.js isn't installed yet, or you need to close and reopen the command window after installing. Do Step 1 again.
- **"port 3000 already in use"** → the app is already running in another window. Just open `http://localhost:3000`.
- **Page won't load** → make sure the command window still shows it's running (don't close it while using the app).
- **Forgot the login** → `demo@aibos.app` / `demo1234`

That's everything. Enjoy your AI Business Operating System! 🚀
