@echo off
setlocal enabledelayedexpansion

:: Force UTF-8 encoding for console output to properly show emojis
chcp 65001 >nul

cd /d "%~dp0"

echo ==========================================================
echo   🧘‍♂️  NIRVANA AI - LOCAL ASSISTANT LAUNCHER  🧘‍♂️
echo ==========================================================
echo.

:: Step 1: Check Python installation
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed or not added to your PATH.
    echo Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

:: Step 2: Check Node.js and npm installation (needed for frontend)
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js/npm is not installed or not added to your PATH.
    echo Please install Node.js (which includes npm) and try again.
    pause
    exit /b 1
)

:: Step 3: Handle Python Virtual Environment (.venv)
if not exist .venv (
    echo [1/3] Creating Python virtual environment (.venv)...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo [1/3] Virtual environment (.venv) already exists.
)

:: Step 4: Install/Update Python dependencies
echo [2/3] Checking and installing Python dependencies...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

:: Step 5: Check and Install Frontend dependencies
if not exist frontend\node_modules (
    echo [3/3] Frontend node_modules not found. Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
) else (
    echo [3/3] Frontend dependencies already installed.
)

:: Step 6: Start the servers and open the browser
echo.
echo ==========================================================
echo 🚀 Launching servers and opening browser...
echo ==========================================================
echo.
echo 📍 Backend Server:  http://localhost:5000
echo 📍 Frontend Server: http://localhost:5173
echo.
echo [NOTE] Press Ctrl+C in this command window to stop both servers.
echo ==========================================================
echo.

:: Start a background task to wait 3 seconds (giving the servers time to boot)
:: and then automatically open the default browser to the web UI.
start /b cmd /c "timeout /t 3 >nul && start http://localhost:5173"

:: Run the Flask and Vite servers (blocks until exit)
python app.py

:: If the app exits, pause so the user can read any potential error messages
pause
