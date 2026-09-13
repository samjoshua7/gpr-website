@echo off
setlocal

title Unregister GPR File Explorer Protocol
echo Removing gpr-explorer:// URI scheme from Windows Registry (HKCU)...

reg delete "HKCU\Software\Classes\gpr-explorer" /f >nul 2>&1

echo.
echo GPR File Explorer Protocol unregistered successfully.
echo.
pause
