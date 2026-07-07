@echo off
setlocal enabledelayedexpansion

:: Force Python to output stdout/stderr using UTF-8 encoding to prevent emoji print crashes on Windows
set PYTHONIOENCODING=utf-8

cd /d "%~dp0"

echo ==========================================================
echo   NIRVANA AI - LOCAL ASSISTANT LAUNCHER
echo ==========================================================
echo.

REM Step 1 Check Python installation
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python is not installed or not added to your PATH.
    echo Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Step 2 Check Node.js and npm installation
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js/npm is not installed or not added to your PATH.
    echo Please install Node.js and try again.
    pause
    exit /b 1
)

REM Step 3 Handle Python Virtual Environment
if not exist .venv (
    echo [1/3] Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo [1/3] Virtual environment already exists.
)

REM Step 4 Install or Update Python dependencies
echo [2/3] Checking and installing Python dependencies...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)

REM Step 5 Check and Install Frontend dependencies
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

REM Step 6 Start the servers and open the browser
echo.
echo ==========================================================
echo Launching servers and opening browser...
echo ==========================================================
echo.
echo Backend Server:  http://localhost:5000
echo Frontend Server: http://localhost:5173
echo.
echo [NOTE] Press Ctrl+C in this command window to stop both servers.
echo ==========================================================
echo.

REM Start a background task to wait 3 seconds and open the browser
start /b cmd /c "ping 127.0.0.1 -n 4 >nul && start http://localhost:5173"

REM Run the Flask and Vite servers
python app.py

pause
