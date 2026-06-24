@echo off
echo Starting Smile Saviours Dental SaaS locally...

:: Step 1: Start PostgreSQL container
echo Starting Postgres database container...
docker compose up postgres -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to start postgres container. Make sure Docker Desktop is running!
    pause
    exit /b %ERRORLEVEL%
)

:: Step 2: Start NestJS Backend in a new window
echo Starting NestJS Backend in a new window...
start "Smile Saviours Backend" cmd /c "cd /d %~dp0\..\backend && npm run start:dev"

:: Step 3: Start Vite Frontend in a new window
echo Starting Vite Frontend in a new window...
start "Smile Saviours Frontend" cmd /c "cd /d %~dp0\..\frontend && npm run dev"

echo All services started!
echo Frontend: http://localhost:45173
echo Backend API: http://localhost:43000
echo Database Port: 45433
pause
