Write-Host "Starting Smart Campus Hub..." -ForegroundColor Green
Write-Host ""

# Navigate to the project directory
Set-Location -Path "c:\Users\Suhail D Tamboli\Desktop\mp-react"

# Check if node_modules exists, if not install dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
npm run build
Write-Host ""

# Start the server
Write-Host "Starting the server..." -ForegroundColor Yellow
Write-Host "The application will be available at http://localhost:5010" -ForegroundColor Cyan
npm start