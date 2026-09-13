@echo off
setlocal enabledelayedexpansion

title Register GPR File Explorer Protocol
cd /d "%~dp0"

set "SCRIPT_PATH=%~dp0gpr-explorer.vbs"

if not exist "%SCRIPT_PATH%" (
    echo [ERROR] Could not locate gpr-explorer.vbs at:
    echo "%SCRIPT_PATH%"
    echo.
    pause
    exit /b 1
)

echo Registering gpr-explorer:// URI scheme in Windows Registry (HKCU)...

reg add "HKCU\Software\Classes\gpr-explorer" /ve /d "URL:GPR File Explorer Protocol" /f >nul 2>&1
reg add "HKCU\Software\Classes\gpr-explorer" /v "URL Protocol" /d "" /f >nul 2>&1
reg add "HKCU\Software\Classes\gpr-explorer\shell\open\command" /ve /d "wscript.exe \"%SCRIPT_PATH%\" \"%%1\"" /f >nul 2>&1

if %errorlevel% neq 0 (
    echo [ERROR] Failed to write registry keys.
    pause
    exit /b 1
)

echo.
echo =====================================================================
echo   SUCCESS: GPR File Explorer Protocol (gpr-explorer://) Registered!
echo =====================================================================
echo.
echo   Target Script: %SCRIPT_PATH%
echo.
echo   When you click 'Show in folder' in the GPR Printing Press web app
echo   (including the Vercel deployed version), Windows will now automatically
echo   open File Explorer and select your exact invoice or statement file.
echo.
echo   Note: On the first time your browser asks "Open GPR File Explorer?",
echo   check "Always allow" and click Open.
echo.
if /i not "%~1"=="/quiet" pause
