@echo off
setlocal
cd /d "%~dp0"

title AI-KMS Launcher
echo ===================================================
echo             Starting AI-KMS System
echo ===================================================
echo.
echo [1/2] Launching Backend Server on port 3000...
start "AI-KMS Backend (Port 3000)" cmd /k "cd /d "%~dp0Backend" && echo [Backend] Starting server... && npm run dev"

echo [2/2] Launching Frontend Client on port 5173...
start "AI-KMS Frontend (Port 5173)" cmd /k "cd /d "%~dp0Frontend" && echo [Frontend] Starting client... && npm run dev"

echo.
echo ===================================================
echo  AI-KMS servers are starting up!
echo  - Backend  : http://localhost:3000
echo  - Frontend : http://localhost:5173
echo ===================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173

exit

