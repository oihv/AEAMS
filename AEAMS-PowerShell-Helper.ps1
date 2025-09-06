# AEAMS API Helper Functions for PowerShell
# Works reliably from China by using curl.exe instead of Invoke-WebRequest

function Test-AEAMS-Health {
    Write-Host "🔍 Testing AEAMS API Health..." -ForegroundColor Cyan
    $response = curl.exe -X GET "https://aeams-test-production.up.railway.app/api/health"
    Write-Host "Response: $response" -ForegroundColor Green
    return $response
}

function Send-RodData {
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
    
    Write-Host "📡 Sending rod data to AEAMS API..." -ForegroundColor Cyan
    Write-Host "   Rod ID: $RodId" -ForegroundColor Yellow
    Write-Host "   Main Rod: $MainRodId" -ForegroundColor Yellow
    Write-Host "   Temperature: $Temperature°C, Moisture: $Moisture%, pH: $Ph" -ForegroundColor Yellow
    
    $timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    $jsonData = @"
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
    
    $response = curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/$MainRodId" -H "Content-Type: application/json" -d $jsonData
    
    if ($response -like "*Data received successfully*") {
        Write-Host "✅ Success! Data sent to database." -ForegroundColor Green
    } else {
        Write-Host "❌ Error sending data." -ForegroundColor Red
    }
    
    Write-Host "Response: $response" -ForegroundColor White
    return $response
}

# Quick test functions
Write-Host "🚀 AEAMS PowerShell Helper Loaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "  Test-AEAMS-Health          - Check if API is working" -ForegroundColor White
Write-Host "  Send-RodData               - Send sample rod data" -ForegroundColor White
Write-Host "  Send-RodData -RodId 'xyz'  - Send data for specific rod" -ForegroundColor White
Write-Host ""
Write-Host "Example usage:" -ForegroundColor Yellow
Write-Host "  Test-AEAMS-Health" -ForegroundColor White
Write-Host "  Send-RodData -RodId 'sensor_001' -Temperature 25.3 -Moisture 60.1" -ForegroundColor White
Write-Host ""

# Test the API immediately
Test-AEAMS-Health
