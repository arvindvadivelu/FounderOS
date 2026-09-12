@echo off
title Blog Deployment Pipeline

:: Always run from the folder where this .bat file is located
cd /d "%~dp0"

echo ===================================================
echo   Initiating Deployment to GitHub...
echo ===================================================
echo.

echo [1/4] Checking Git status...
git status

if errorlevel 1 (
    echo.
    echo [ERROR] Git status failed.
    echo Make sure this folder is a valid Git repository.
    pause
    exit /b 1
)

echo.
echo [2/4] Staging all changes...
git add .

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to stage changes.
    pause
    exit /b 1
)

echo [OK] Changes staged.

echo.
set /p commitMsg="Enter commit message (Press Enter for 'Auto-update blog content'): "

if "%commitMsg%"=="" set "commitMsg=Auto-update blog content"

echo.
echo [3/4] Creating commit...
git commit -m "%commitMsg%"

if errorlevel 1 (
    echo.
    echo [ERROR] Commit failed.
    echo.
    echo Possible reason:
    echo - No changes to commit
    echo - Git configuration issue
    echo - Commit hook failed
    pause
    exit /b 1
)

echo [OK] Changes committed.

echo.
echo [4/4] Pushing to GitHub...
git push origin main

if errorlevel 1 (
    echo.
    echo [ERROR] Push failed.
    echo Check your internet connection, GitHub authentication,
    echo remote URL, or branch configuration.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   Deployment Complete!
echo   Changes successfully pushed to GitHub.
echo ===================================================
pause