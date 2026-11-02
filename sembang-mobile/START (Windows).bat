@echo off
title Agilist - phone app
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo First run: installing Expo and the native modules. This takes a few minutes.
  call npm run setup
  if errorlevel 1 ( pause & exit /b 1 )
)
echo.
echo Scan the QR code with your phone:
echo   iPhone  - open the Camera app and point it at the code
echo   Android - open the Expo Go app and tap "Scan QR code"
echo The phone and this computer must be on the same Wi-Fi.
echo If it doesn't connect, close this window and run:  npx expo start --tunnel
echo.
call npx expo start
pause
