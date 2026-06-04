#!/bin/bash
# ============================================================
#  AI BOS — One-click launcher (Mac / Linux)
#  Just double-click this file. It does everything for you.
# ============================================================

# Go to the folder this file lives in
cd "$(dirname "$0")"

clear
echo ""
echo "  ============================================"
echo "    🧠  AI BOS — AI Business Operating System"
echo "  ============================================"
echo ""

# 1) Check Node.js is installed
if ! command -v node >/dev/null 2>&1; then
  echo "  ❌ Node.js is not installed yet."
  echo ""
  echo "  👉 Please install it (free) from:  https://nodejs.org"
  echo "     Choose the big green 'LTS' button, install, then"
  echo "     double-click this file again."
  echo ""
  read -p "  Press Enter to close..."
  exit 1
fi

echo "  ✅ Node.js found: $(node --version)"
echo ""

# 2) Install dependencies the first time only
if [ ! -d "node_modules" ]; then
  echo "  📦 First-time setup — installing components..."
  echo "     (this happens only once and may take a minute)"
  echo ""
  npm install
  echo ""
fi

echo "  🚀 Starting AI BOS..."
echo ""
echo "  ------------------------------------------------------"
echo "    Open this in your browser:   http://localhost:3000"
echo "    Login:  demo@aibos.app   /   demo1234"
echo "  ------------------------------------------------------"
echo ""
echo "  (Keep this window open while using the app.)"
echo "  (To stop the app, just close this window.)"
echo ""

# 3) Try to auto-open the browser
( sleep 2
  if command -v open >/dev/null 2>&1; then open "http://localhost:3000"      # Mac
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:3000"  # Linux
  fi
) &

# 4) Start the server
npm start
