@echo off
echo ========================================================
echo   Starting WasteWise AI - Smart Waste Collection System
echo ========================================================

echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "WasteWise Backend" cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting React + Vite Frontend on http://localhost:5173...
cd frontend
start "WasteWise Frontend" cmd /k "npm run dev"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo Opening WasteWise AI in your default browser...
start http://localhost:5173/

echo.
echo Both servers are active!
echo - Frontend: http://localhost:5173/
echo - Backend API & Docs: http://127.0.0.1:8000/docs
echo.
pause
