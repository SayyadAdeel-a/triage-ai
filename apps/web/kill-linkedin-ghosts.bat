@echo off
echo ========================================
echo Killing ghost Chromium/Python processes
echo ========================================

taskkill /f /im python.exe /t 2>nul
taskkill /f /im chrome.exe /t 2>nul
taskkill /f /im msedge.exe /t 2>nul

echo.
echo Ghost processes cleared! 
echo You can now safely run: uvx mcp-server-linkedin@latest --login
echo.
