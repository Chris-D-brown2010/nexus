@echo off
REM ============================================================
REM   AI BOS - One-click launcher (Windows)
REM   Just double-click this file. It does everything for you.
REM ============================================================

cd /d "%~dp0"

cls
echo.
echo   ============================================
echo     AI BOS - AI Business Operating System
echo   ============================================
echo.

REM 1) Check Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
  echo   [X] Node.js is not installed yet.
  echo.
  echo   ^>^> Please install it ^(free^) from:  https://nodejs.org
  echo      Choose the big green "LTS" button, install, then
  echo      double-click this file again.
  echo.
  pause
  exit /b
)

for /f "delims=" %%v in ('node --version') do set NODEVER=%%v
echo   [OK] Node.js found: %NODEVER%
echo.

REM 2) Install dependencies the first time only
if not exist "node_modules" (
  echo   Installing components ^(first time only, ~1 minute^)...
  echo.
  call npm install
  echo.
)

echo   Starting AI BOS...
echo.
echo   ------------------------------------------------------
echo     Open this in your browser:   http://localhost:3000
echo     Login:  demo@aibos.app   /   demo1234
echo   ------------------------------------------------------
echo.
echo   (Keep this window open while using the app.)
echo   (To stop the app, just close this window.)
echo.

REM 3) Auto-open the browser
start "" "http://localhost:3000"

REM 4) Start the server
call npm start
pause
