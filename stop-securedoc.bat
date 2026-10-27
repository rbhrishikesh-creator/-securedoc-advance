@echo off
title SecureDoc Advanced - Stopper
cd /d "%~dp0"
node scripts/stop-all.js
echo.
pause
