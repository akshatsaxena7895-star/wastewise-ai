Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting WasteWise AI - Smart Waste Collection System" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$RootPath = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }

# Check if ports are in use or launch
Write-Host "`n[1/2] Starting Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory $RootPath

Start-Sleep -Seconds 3

Write-Host "`n[2/2] Starting Frontend (Vite)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory "$RootPath\frontend"

Start-Sleep -Seconds 3

Write-Host "`nOpening application in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173/"

Write-Host "`nWasteWise AI is running!" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:5173/"
Write-Host "- Backend API & Swagger: http://127.0.0.1:8000/docs"
