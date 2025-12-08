# NewTumblrT1W Development Startup Script
# Checks Docker, Database, and Ports before starting the app.

$ErrorActionPreference = "Stop"

function Test-CommandExists {
    param ($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"
    $exists = (Get-Command $command)
    $ErrorActionPreference = $oldPreference
    return $exists
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   🚀 NewTumblrT1W Development Environment Startup" -ForegroundColor Cyan
Write-Host "========================================================`n"

# 1. Diagnostic: Check System Requirements
Write-Host "📋 [Diagnostic] Checking system requirements..."
if (-not (Test-CommandExists "docker")) {
    Write-Error "❌ Docker is not installed or not in PATH."
    exit 1
}
if (-not (Test-CommandExists "npm")) {
    Write-Error "❌ Node/NPM is not installed or not in PATH."
    exit 1
}
Write-Host "✅ System tools found." -ForegroundColor Green

# 2. Diagnostic: Check Docker Status
Write-Host "`n📋 [Diagnostic] Checking Docker daemon status..." -NoNewline
$dockerRunning = $false
try {
    docker info > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host " Running" -ForegroundColor Green
    }
    else {
        Write-Host " Not Running" -ForegroundColor Yellow
    }
}
catch {
    Write-Host " Error checking Docker" -ForegroundColor Red
}

# 3. Start Docker if needed
if (-not $dockerRunning) {
    Write-Host "🔄 Docker is not running. Attempting to start Docker Desktop..." -ForegroundColor Yellow
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
        
        # Wait for Docker to initialize
        $maxRetries = 60
        $retryInterval = 2
        $started = $false
        
        Write-Host "⏳ Waiting for Docker to initialize (this may take a minute)..."
        for ($i = 0; $i -lt $maxRetries; $i++) {
            Write-Host "." -NoNewline
            docker info > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                $started = $true
                Write-Host "`n✅ Docker started successfully!" -ForegroundColor Green
                break
            }
            Start-Sleep -Seconds $retryInterval
        }
        
        if (-not $started) {
            Write-Error "`n❌ Docker failed to start. Please start Docker Desktop manually and try again."
            exit 1
        }
    }
    else {
        Write-Error "❌ Docker Desktop executable not found at $dockerPath. Please start it manually."
        exit 1
    }
}

# 4. Diagnostic: Check and Start Database
Write-Host "`n📋 [Diagnostic] Checking Database container..."
try {
    docker-compose up -d postgres
}
catch {
    Write-Error "❌ Failed to run docker-compose. Ensure docker-compose is installed."
    exit 1
}

# Wait for DB to be healthy/ready
$dbContainerName = "newtumblr-db"
$dbRunning = $false
Write-Host "⏳ Verifying database container status..."
for ($i = 0; $i -lt 10; $i++) {
    $status = docker inspect -f '{{.State.Running}}' $dbContainerName 2>$null
    if ($status -eq 'true') {
        $dbRunning = $true
        break
    }
    Start-Sleep -Seconds 1
}

if ($dbRunning) {
    Write-Host "✅ Database container '$dbContainerName' is active." -ForegroundColor Green
}
else {
    Write-Error "❌ Database container failed to start. Check 'docker logs $dbContainerName' for details."
    exit 1
}

# 5. Diagnostic: Check Ports
Write-Host "`n📋 [Diagnostic] Checking network ports..."
$ports = @(3001, 5173)
$portsBusy = $false
foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        Write-Host "⚠️  Port $port is already in use." -ForegroundColor Yellow
        $portsBusy = $true
    }
    else {
        Write-Host "✅ Port $port is free." -ForegroundColor Green
    }
}

if ($portsBusy) {
    Write-Host "⚠️  Note: If the ports are used by a previous instance of this app, 'npm run dev' might fail or use different ports." -ForegroundColor Yellow
}

# 6. Start Development Server
Write-Host "`n🚀 Starting application (Frontend + Backend)..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Gray
npm run dev
