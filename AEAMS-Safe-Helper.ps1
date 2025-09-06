# AEAMS API - Reliable Method Using JSON Files
# This avoids JSON escaping issues in PowerShell

function Send-RodData-Safe {
    param(
        [string]$RodId = "asdasdsa",
        [double]$Temperature = 23.5,
        [double]$Moisture = 45.2,
        [double]$Ph = 6.8,
        [double]$Conductivity = 1.2,
        [double]$Nitrogen = 12.5,
        [double]$Phosphorus = 8.3,
        [double]$Potassium = 15.7,
        [string]$MainRodId = "justintul"
    )
    
    Write-Host "📡 Sending rod data safely to AEAMS API..." -ForegroundColor Cyan
    Write-Host "   Rod ID: $RodId" -ForegroundColor Yellow
    Write-Host "   Main Rod: $MainRodId" -ForegroundColor Yellow
    Write-Host "   Temperature: $Temperature°C, Moisture: $Moisture%, pH: $Ph" -ForegroundColor Yellow
    
    $timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    # Create JSON content
    $jsonContent = @"
{
    "secret": "AEAMS_SECRET_zhmaj9w00ag",
    "readings": [
        {
            "rod_id": "$RodId",
            "secret": "AEAMS_SECRET_zhmaj9w00ag",
            "timestamp": "$timestamp",
            "temperature": $Temperature,
            "moisture": $Moisture,
            "ph": $Ph,
            "conductivity": $Conductivity,
            "nitrogen": $Nitrogen,
            "phosphorus": $Phosphorus,
            "potassium": $Potassium
        }
    ]
}
"@
    
    # Write to temporary file
    $tempFile = "temp-rod-data.json"
    $jsonContent | Out-File -FilePath $tempFile -Encoding UTF8
    
    # Send with curl using file
    Write-Host "🚀 Sending data..." -ForegroundColor Green
    $response = curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/$MainRodId" -H "Content-Type: application/json" -d "@$tempFile"
    
    # Clean up temp file
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    if ($response -like "*Data received successfully*") {
        Write-Host "✅ Success! Data sent to database." -ForegroundColor Green
    } else {
        Write-Host "❌ Error sending data." -ForegroundColor Red
    }
    
    Write-Host "Response: $response" -ForegroundColor White
    return $response
}

Write-Host "🔧 AEAMS Safe API Helper Loaded!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ This version avoids JSON escaping issues!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage: Send-RodData-Safe -RodId 'your_sensor' -Temperature 25.0" -ForegroundColor Cyan
Write-Host ""
