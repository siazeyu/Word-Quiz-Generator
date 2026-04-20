@echo off
chcp 65001 >nul

:: Word Dictation Generator One-click Run Script
:: This script starts the API server and frontend application

echo =============================================
echo Word Dictation Generator One-click Run Script
echo =============================================

:: Check PostgreSQL service status
echo Checking PostgreSQL service...
sc query "postgresql-16" >nul 2>nul
if %errorlevel% equ 0 (
    sc query "postgresql-16" | find "STATE" | find "RUNNING" >nul
    if %errorlevel% equ 0 (
        echo PostgreSQL service is running
    ) else (
        echo PostgreSQL service is installed but not running, starting...
        net start "postgresql-16"
        echo PostgreSQL service started
    )
) else (
    sc query "postgresql-x64-16" >nul 2>nul
    if %errorlevel% equ 0 (
        sc query "postgresql-x64-16" | find "STATE" | find "RUNNING" >nul
        if %errorlevel% equ 0 (
            echo PostgreSQL service is running
        ) else (
            echo PostgreSQL service is installed but not running, starting...
            net start "postgresql-x64-16"
            echo PostgreSQL service started
        )
    ) else (
        echo Warning: PostgreSQL service not found, please ensure PostgreSQL is installed and running
    )
)

:: Start API server
echo.
echo Starting API server...
start "API Server" /D "%~dp0artifacts\api-server" cmd /c "pnpm dev"

:: Wait for API server to start
echo Waiting for API server to start...
timeout /t 5 /nobreak >nul

:: Start frontend application
echo.
echo Starting frontend application...
start "Frontend Application" /D "%~dp0artifacts\word-dictation" cmd /c "pnpm dev"

:: Wait for frontend application to start
echo Waiting for frontend application to start...
timeout /t 5 /nobreak >nul

echo.
echo =============================================
echo Application startup completed!
echo =============================================
echo API server address: http://localhost:8080
echo Frontend application address: http://localhost:3001
echo =============================================

echo.
echo Press any key to exit...
pause >nul
