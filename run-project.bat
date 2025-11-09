@echo off
TITLE Smart Campus Hub
echo Starting Smart Campus Hub...
echo.

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
    pause
    exit /b %errorlevel%
)
echo.

REM Start the server
echo Starting the server...
echo The application will be available at http://localhost:5011
echo.
echo Server started successfully!
echo.
echo You can now access the application in your browser at:
echo    http://localhost:5011
echo.
echo To stop the server, close this window or press Ctrl+C
echo.
call npm start