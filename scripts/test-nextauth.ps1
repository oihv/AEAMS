#!/usr/bin/env pwsh
# Test NextAuth JWT Configuration

Write-Host "🔧 Testing NextAuth JWT Configuration..." -ForegroundColor Blue
Write-Host ""

# Test local environment variables
Write-Host "📋 Checking Local Environment Variables:" -ForegroundColor Yellow

if (Test-Path ".env.local") {
    Write-Host "✅ .env.local file exists" -ForegroundColor Green
    
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "NEXTAUTH_SECRET=") {
        Write-Host "✅ NEXTAUTH_SECRET is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXTAUTH_SECRET is missing" -ForegroundColor Red
    }
    
    if ($envContent -match "NEXTAUTH_URL=") {
        Write-Host "✅ NEXTAUTH_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXTAUTH_URL is missing" -ForegroundColor Red
    }
    
    if ($envContent -match "DATABASE_URL=") {
        Write-Host "✅ DATABASE_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "❌ DATABASE_URL is missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Testing Production Environment Variables:" -ForegroundColor Yellow

try {
    $railwayVars = railway variables --json | ConvertFrom-Json
    
    $hasNextAuthSecret = $false
    $hasNextAuthUrl = $false
    $hasDatabaseUrl = $false
    
    foreach ($var in $railwayVars) {
        switch ($var.name) {
            "NEXTAUTH_SECRET" { $hasNextAuthSecret = $true }
            "NEXTAUTH_URL" { $hasNextAuthUrl = $true }
            "DATABASE_URL" { $hasDatabaseUrl = $true }
        }
    }
    
    if ($hasNextAuthSecret) {
        Write-Host "✅ NEXTAUTH_SECRET is set in Railway" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXTAUTH_SECRET is missing in Railway" -ForegroundColor Red
    }
    
    if ($hasNextAuthUrl) {
        Write-Host "✅ NEXTAUTH_URL is set in Railway" -ForegroundColor Green
    } else {
        Write-Host "❌ NEXTAUTH_URL is missing in Railway" -ForegroundColor Red
    }
    
    if ($hasDatabaseUrl) {
        Write-Host "✅ DATABASE_URL is set in Railway" -ForegroundColor Green
    } else {
        Write-Host "❌ DATABASE_URL is missing in Railway" -ForegroundColor Red
    }
    
} catch {
    Write-Host "⚠️  Could not check Railway variables: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🧪 Testing API Health:" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://aeams-test-production.up.railway.app/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Production API is responding" -ForegroundColor Green
} catch {
    Write-Host "❌ Production API is not responding: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Local API is responding" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Local API is not running (start with: npm run dev)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 NextAuth JWT Test Summary:" -ForegroundColor Blue
Write-Host "The JWT session error should be resolved if all environment variables are properly configured." -ForegroundColor White
Write-Host "If you still see JWT errors, try clearing browser cookies and restarting the application." -ForegroundColor White
