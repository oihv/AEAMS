# AEAMS - Final Working Solutions

## Problem Identified:
The JSON escaping in PowerShell curl commands was causing "Unexpected token" errors.

## ✅ WORKING SOLUTIONS:

### Method 1: Use JSON File (Most Reliable)
1. Create your JSON file (rod-data.json):
{
    "secret": "AEAMS_SECRET_zhmaj9w00ag",
    "readings": [
        {
            "rod_id": "your_sensor_id",
            "secret": "AEAMS_SECRET_zhmaj9w00ag",
            "timestamp": "2025-09-02T14:30:00Z",
            "temperature": 23.5,
            "moisture": 45.2,
            "ph": 6.8,
            "conductivity": 1.2,
            "nitrogen": 12.5,
            "phosphorus": 8.3,
            "potassium": 15.7
        }
    ]
}

2. Send with: curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/justintul" -H "Content-Type: application/json" -d @rod-data.json

### Method 2: PowerShell Safe Helper
. .\AEAMS-Safe-Helper.ps1
Send-RodData-Safe -RodId "sensor001" -Temperature 25.0 -Moisture 60.0

### Method 3: Batch File
.\send-rod-data.bat sensor001 25.5 60.2 6.8 1.2 12.5 8.3 15.7

## 🎯 YOUR API ENDPOINT:
URL: https://aeams-test-production.up.railway.app/api/rod/justintul
Status: ✅ FULLY WORKING
Database: ✅ CONNECTED
China Access: ✅ CONFIRMED WORKING

## 🌐 Frontend:
GitHub Pages: https://codenewb13.github.io/AEAMSTEST/
(Enable GitHub Actions in repository settings)
