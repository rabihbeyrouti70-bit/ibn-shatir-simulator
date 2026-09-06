@echo off
chcp 65001 > nul
cls
echo ===================================================
echo   Starting Arabic PDF and Manuscript AI Converter
echo ===================================================
python gui_app.py
if errorlevel 1 (
    echo.
    echo An error occurred while running the application.
    pause
)

