@echo off
TITLE Smart Campus Hub

REM Navigate to the project directory
cd /d "%~dp0"

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Build the project
echo Building the project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed with error code %errorlevel%
    echo.
    echo Press any key to close this window...
    pause >nul
    exit /b %errorlevel%
)
echo.

REM Copy service worker to dist folder
echo Copying service worker...
copy public\service-worker.js dist\service-worker.js >nul 2>&1
echo.

REM Start the server
echo Starting the server...
echo The application will be available at http://localhost:5011
echo.
echo ====================================================
echo SERVER IS NOW RUNNING
echo ====================================================
echo.
echo Opening the application in your default browser...
echo If the browser doesn't open automatically, please visit:
echo    http://localhost:5011
echo.
echo To stop the server and close this window:
echo    Press Ctrl+C and then Y, or
echo    Simply close this window
echo.
echo DO NOT close this window if you want to keep the server running.
echo.

REM Start server and open browser
start "" http://localhost:5011
call npm start

:END
echo.
echo Server has stopped.
echo Press any key to close this window...
pause >nul