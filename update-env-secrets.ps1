# PowerShell script to add security secrets to .env file
# Run this script to automatically add the generated secrets

$envFile = ".env"
$secrets = @"

# Security Secrets (Auto-generated)
JWT_SECRET=e7c901639f8ee6f114eb4020801cf96f32fa5775c1a9fcec03a5cb43b7000587
JWT_REFRESH_SECRET=e4ef10f47fe4375363c00182b7249c4a7967f7b9d7a877b0d76a72fe2601f1ac
ENCRYPTION_SECRET=dde189be0780c1894cebdaed796899dd40f96edf4b027ae54a0b53993e7393e6
ALLOWED_ORIGINS=http://localhost:5173

"@

# Check if .env file exists
if (Test-Path $envFile) {
    # Read current content
    $currentContent = Get-Content $envFile -Raw
    
    # Check if secrets already exist
    if ($currentContent -match "JWT_SECRET=") {
        Write-Host "⚠️  JWT_SECRET already exists in .env file" -ForegroundColor Yellow
        Write-Host "Please manually update if needed." -ForegroundColor Yellow
    } else {
        # Append secrets to .env file
        Add-Content -Path $envFile -Value $secrets
        Write-Host "✅ Security secrets added to .env file successfully!" -ForegroundColor Green
    }
} else {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Creating new .env file with secrets..." -ForegroundColor Yellow
    Set-Content -Path $envFile -Value $secrets
    Write-Host "✅ Created .env file with security secrets!" -ForegroundColor Green
    Write-Host "⚠️  Don't forget to add your DATABASE_URL and other configuration!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Current .env file preview:" -ForegroundColor Cyan
Get-Content $envFile | Select-Object -First 20
