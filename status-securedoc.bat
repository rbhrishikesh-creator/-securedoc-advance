@echo off
title SecureDoc Advanced - Status Checker
cd /d "%~dp0"
node scripts/status.js
echo.
pause
