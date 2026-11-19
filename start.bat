@echo off
setlocal
cd /d "%~dp0"

title AI-KMS Launcher
echo ===================================================
echo             Starting AI-KMS System
echo ===================================================
echo.

:: 1. Launch Ollama Local Service if installed
echo [1/4] Checking Ollama Local AI Service...
where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo [Ollama] Starting Ollama background service...
    start "Ollama Background Service" /min cmd /c "ollama serve"
) else (
    if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        echo [Ollama] Starting Ollama from local app directory...
        start "Ollama Background Service" /min "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
    ) else (
        echo [Ollama] Ollama not found (Using Gemini Cloud AI fallback).
    )
)

:: 2. Launch ChromaDB Server if installed
echo [2/4] Checking ChromaDB Vector Database...
where chroma >nul 2>nul
if %errorlevel% equ 0 (
    echo [ChromaDB] Starting ChromaDB Vector Server on port 8000...
    start "ChromaDB Server (Port 8000)" /min cmd /c "chroma run --port 8000"
) else (
    echo [ChromaDB] Chroma CLI not detected (Using Gemini Cloud RAG fallback).
)

:: 3. Launch Backend Server on port 3000
echo.
echo [3/4] Launching Backend Server on port 3000...
start "AI-KMS Backend (Port 3000)" cmd /k "cd /d "%~dp0Backend" && echo [Backend] Starting server... && npm run dev"

:: 4. Launch Frontend Client on port 5173
echo [4/4] Launching Frontend Client on port 5173...
start "AI-KMS Frontend (Port 5173)" cmd /k "cd /d "%~dp0Frontend" && echo [Frontend] Starting client... && npm run dev"

echo.
echo ===================================================
echo  AI-KMS services are starting up!
echo  - Ollama   : http://localhost:11434 (Auto-Started)
echo  - Backend  : http://localhost:3000
echo  - Frontend : http://localhost:5173
echo ===================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 >nul
start http://localhost:5173

exit

