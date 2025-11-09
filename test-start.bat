@echo off
TITLE Smart Campus Hub Test
echo Starting Smart Campus Hub Test...
echo.

REM Navigate to the project directory
cd /d "%~dp0"

REM Build the project
echo Building the project...
npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b %errorlevel%
)
echo.

REM Start the server
echo Starting the server...
echo The application will be available at http://localhost:5011
echo.
npm start
pause