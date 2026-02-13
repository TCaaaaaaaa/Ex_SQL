@echo off
cd /d "%~dp0"

echo ===================================================
echo   Stopping ExtenicSQL Project...
echo ===================================================

echo [1/2] Killing Backend process (Port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
    echo   - Stopped PID %%a
)

echo [2/2] Killing Frontend process (Port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5173" ^| find "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
    echo   - Stopped PID %%a
)

echo.
echo ===================================================
echo   All services stopped.
echo   Note: Command windows may need to be closed manually.
echo ===================================================
pause