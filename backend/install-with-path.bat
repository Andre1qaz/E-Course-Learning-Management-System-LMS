@echo off
setlocal enabledelayedexpansion
set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=!NODE_PATH!;%PATH%"
cd /d "%~dp0"
set "NODE=!NODE_PATH!\node.exe"
set "NPM=!NODE_PATH!\npm.cmd"
set "NPX=!NODE_PATH!\npx.cmd"

echo Installing dependencies...
!NPM! install --no-audit --no-fund

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation successful!
    echo Running Prisma generate...
    !NPX! prisma generate
) else (
    echo.
    echo Installation failed with error code %ERRORLEVEL%
)

endlocal
