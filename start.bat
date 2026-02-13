@echo off
cd /d "%~dp0"

echo ===================================================
echo   Starting ExtenicSQL Project...
echo ===================================================

echo [1/2] Starting Backend (Port 8000)...
:: Start backend in new window
start "ExtenicSQL Backend" cmd /k "cd back && python -m uvicorn app.main:app --reload"

echo [2/2] Starting Frontend (Port 5173)...
:: Start frontend in new window
start "ExtenicSQL Frontend" cmd /k "cd front && npm run dev"

echo.
echo ===================================================
echo   Success! 
echo   - Frontend: http://localhost:5173
echo   - Backend Docs: http://localhost:8000/docs
echo ===================================================
echo.
pause
