@echo off
title SecureDoc Advanced - Guardian Launcher
cd /d "%~dp0"
echo ==========================================================
echo Starting SecureDoc Advanced...
echo ==========================================================
node scripts/start-all.js
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Startup encountered an issue.
  pause
)
