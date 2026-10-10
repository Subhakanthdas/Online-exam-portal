@echo off
setlocal
cd /d "%~dp0"
title ExamForge - Setup and Start

echo ========================================
echo  ExamForge - first-time setup and launch
echo ========================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js 20 or 22 LTS from https://nodejs.org/ then run this file again.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Reinstall Node.js with npm included.
  pause
  exit /b 1
)

echo [1/4] Installing backend packages (SQLite is pinned to better-sqlite3 11.10.0)...
call npm install --prefix backend
if errorlevel 1 goto failed

echo [2/4] Installing frontend packages...
call npm install --prefix frontend
if errorlevel 1 goto failed

echo [3/4] Installing root launcher package...
call npm install
if errorlevel 1 goto failed

if not exist "backend\.env" (
  echo [4/4] Creating local environment configuration...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$secret = -join ((1..48 | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }); @('PORT=3000','NODE_ENV=development','FRONTEND_URL=http://127.0.0.1:5173',('JWT_SECRET=' + $secret)) | Set-Content -Encoding ascii 'backend\.env'"
  if errorlevel 1 goto failed
) else (
  echo [4/4] Existing backend\.env found; keeping it unchanged.
)

echo.
echo Setup complete. Starting API and website...
echo Website: http://127.0.0.1:5173
echo API health: http://127.0.0.1:3000/api/health
echo Demo creator: creator@examforge.demo
echo Demo password: CreatorDemo123!
echo Demo student: register a Student account in the portal.
echo Press Ctrl+C to stop both servers.
echo.
call npm run dev
set "EXITCODE=%ERRORLEVEL%"
echo.
echo ExamForge stopped with exit code %EXITCODE%.
pause
exit /b %EXITCODE%

:failed
echo.
echo SETUP FAILED. Copy the error above. If better-sqlite3 fails to install, verify Node.js 20/22 LTS and internet access, then run this file again.
pause
exit /b 1
