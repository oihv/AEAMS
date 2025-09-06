# AEAMS API Data Push Comprehensive Guide

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [API Endpoint Details](#api-endpoint-details)
4. [Authentication](#authentication)
5. [Data Structure](#data-structure)
6. [Push Methods](#push-methods)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Overview

The AEAMS (Advanced Environmental Agriculture Monitoring System) API allows you to push sensor data from agricultural monitoring devices to a centralized database. The system supports hierarchical rod structures with main rods controlling multiple secondary sensor rods.

**API Base URL:** `https://aeams-test-production.up.railway.app`

## System Architecture

```
Main Rod (Farm Controller)
├── Secondary Rod 1 (Sensor Unit)
│   ├── Temperature Reading
│   ├── Moisture Reading
│   ├── pH Reading
│   └── NPK Readings
├── Secondary Rod 2 (Sensor Unit)
│   └── [Same sensor readings]
└── Secondary Rod N...
```

## API Endpoint Details

### Primary Data Push Endpoint
**URL:** `POST /api/rod/{main_rod_id}`

**Purpose:** Submit sensor readings from secondary rods to a specific main rod

**Authentication:** Secret key based (stored in database config)

## Authentication

The API uses a shared secret key system:
- **Secret Key:** `AEAMS_SECRET_zhmaj9w00ag`
- **Location:** Required in both the main payload and each reading
- **Validation:** Server validates against database config table

⚠️ **Security Note:** The secret key must be included twice:
1. In the main request payload
2. In each individual reading object

## Data Structure

### Request Payload Schema

```json
{
  "secret": "AEAMS_SECRET_zhmaj9w00ag",
  "readings": [
    {
      "rod_id": "secondary_rod_identifier",
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
```

### Data Field Specifications

| Field | Type | Unit | Range | Required | Description |
|-------|------|------|--------|----------|-------------|
| `rod_id` | string | - | - | ✅ | Unique identifier for secondary rod |
| `secret` | string | - | - | ✅ | Authentication secret |
| `timestamp` | string | ISO 8601 | - | ✅ | Reading timestamp |
| `temperature` | float | °C | -50 to 100 | ❌ | Air/soil temperature |
| `moisture` | float | % | 0 to 100 | ❌ | Soil moisture percentage |
| `ph` | float | pH | 0 to 14 | ❌ | Soil pH level |
| `conductivity` | float | mS/cm | 0+ | ❌ | Electrical conductivity |
| `nitrogen` | float | ppm/mg/kg | 0+ | ❌ | Nitrogen content |
| `phosphorus` | float | ppm/mg/kg | 0+ | ❌ | Phosphorus content |
| `potassium` | float | ppm/mg/kg | 0+ | ❌ | Potassium content |

### Success Response

```json
{
  "message": "Data received successfully",
  "farm_id": "farm_uuid",
  "main_rod_id": "main_rod_identifier",
  "processed_readings": 1,
  "readings": [
    {
      "rod_id": "secondary_rod_identifier",
      "reading_id": "reading_uuid",
      "status": "success"
    }
  ]
}
```

## Push Methods

### Method 1: curl.exe Command Line (Recommended)

**Single Reading:**
```bash
curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/YOUR_MAIN_ROD_ID" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"readings\":[{\"rod_id\":\"YOUR_SECONDARY_ROD_ID\",\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"timestamp\":\"2025-09-02T14:30:00Z\",\"temperature\":23.5,\"moisture\":45.2,\"ph\":6.8,\"conductivity\":1.2,\"nitrogen\":12.5,\"phosphorus\":8.3,\"potassium\":15.7}]}"
```

### Method 2: PowerShell Function

Using the provided `AEAMS-PowerShell-Helper.ps1`:

```powershell
# Load the helper functions
. .\AEAMS-PowerShell-Helper.ps1

# Send data with default values
Send-RodData

# Send custom data
Send-RodData -RodId "greenhouse_01" -Temperature 26.5 -Moisture 55.3 -Ph 7.1 -MainRodId "farm_north"
```

### Method 3: PowerShell with Invoke-WebRequest

```powershell
$data = @{
    secret = "AEAMS_SECRET_zhmaj9w00ag"
    readings = @(
        @{
            rod_id = "sensor_001"
            secret = "AEAMS_SECRET_zhmaj9w00ag"
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            temperature = 24.8
            moisture = 48.7
            ph = 6.9
            conductivity = 1.3
            nitrogen = 14.2
            phosphorus = 7.8
            potassium = 16.4
        }
    )
} | ConvertTo-Json -Depth 3

Invoke-WebRequest `
    -Uri "https://aeams-test-production.up.railway.app/api/rod/your_main_rod" `
    -Method POST `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $data
```

### Method 4: Python Script

```python
import requests
import json
from datetime import datetime

def push_sensor_data(main_rod_id, secondary_rod_id, sensor_data):
    url = f"https://aeams-test-production.up.railway.app/api/rod/{main_rod_id}"
    
    payload = {
        "secret": "AEAMS_SECRET_zhmaj9w00ag",
        "readings": [{
            "rod_id": secondary_rod_id,
            "secret": "AEAMS_SECRET_zhmaj9w00ag",
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
            **sensor_data
        }]
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# Usage
sensor_readings = {
    "temperature": 25.3,
    "moisture": 52.1,
    "ph": 7.2,
    "conductivity": 1.4,
    "nitrogen": 15.2,
    "phosphorus": 9.8,
    "potassium": 18.5
}

result = push_sensor_data("main_rod_01", "sensor_greenhouse_1", sensor_readings)
print(result)
```

### Method 5: Node.js/JavaScript

```javascript
const pushSensorData = async (mainRodId, secondaryRodId, sensorData) => {
    const url = `https://aeams-test-production.up.railway.app/api/rod/${mainRodId}`;
    
    const payload = {
        secret: "AEAMS_SECRET_zhmaj9w00ag",
        readings: [{
            rod_id: secondaryRodId,
            secret: "AEAMS_SECRET_zhmaj9w00ag",
            timestamp: new Date().toISOString(),
            ...sensorData
        }]
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    return response.json();
};

// Usage
const sensorReadings = {
    temperature: 25.3,
    moisture: 52.1,
    ph: 7.2,
    conductivity: 1.4,
    nitrogen: 15.2,
    phosphorus: 9.8,
    potassium: 18.5
};

pushSensorData("main_rod_01", "sensor_001", sensorReadings)
    .then(result => console.log(result));
```

## Examples

### Example 1: Single Sensor Reading

```bash
curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/farm_greenhouse" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"readings\":[{\"rod_id\":\"temp_sensor_01\",\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"timestamp\":\"2025-09-02T15:30:00Z\",\"temperature\":26.8,\"moisture\":58.3}]}"
```

### Example 2: Multiple Sensor Readings

```bash
curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/farm_field_a" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"readings\":[{\"rod_id\":\"sensor_north\",\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"timestamp\":\"2025-09-02T15:30:00Z\",\"temperature\":25.5,\"moisture\":45.2,\"ph\":6.8},{\"rod_id\":\"sensor_south\",\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"timestamp\":\"2025-09-02T15:30:00Z\",\"temperature\":27.1,\"moisture\":48.7,\"ph\":7.1}]}"
```

### Example 3: Full NPK Analysis Reading

```bash
curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/research_plot" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"readings\":[{\"rod_id\":\"npk_analyzer_01\",\"secret\":\"AEAMS_SECRET_zhmaj9w00ag\",\"timestamp\":\"2025-09-02T15:30:00Z\",\"temperature\":24.2,\"moisture\":52.8,\"ph\":6.9,\"conductivity\":1.35,\"nitrogen\":18.7,\"phosphorus\":12.4,\"potassium\":22.1}]}"
```

## Troubleshooting

### Common Error Codes

| Status Code | Error | Solution |
|-------------|-------|----------|
| 401 | Invalid secret key | Verify secret key matches exactly |
| 404 | Main rod not found | Ensure main rod exists in database |
| 400 | Main rod not bound to farm | Bind main rod to a farm first |
| 500 | Internal server error | Check database connectivity |

### Common Issues

#### 1. "Main rod not found"
```bash
# Solution: Check if main rod exists
curl.exe -X GET "https://aeams-test-production.up.railway.app/api/main-rods"
```

#### 2. "Main rod not bound to any farm"
- The main rod must be associated with a farm
- Use the web interface to bind the rod to a farm
- Or use the farm creation API

#### 3. "Invalid secret key"
- Verify secret is exactly: `AEAMS_SECRET_zhmaj9w00ag`
- Check both main payload and reading-level secrets
- Ensure no extra spaces or encoding issues

#### 4. Network connectivity issues (especially in China)
- Use `curl.exe` instead of PowerShell `Invoke-WebRequest`
- Consider VPN if connection is unstable
- Check firewall settings

### Debug Commands

```bash
# Test API health
curl.exe -X GET "https://aeams-test-production.up.railway.app/api/health"

# Check authentication
curl.exe -X GET "https://aeams-test-production.up.railway.app/api/auth-status"

# Test database connection
curl.exe -X GET "https://aeams-test-production.up.railway.app/api/test-db"
```

## Best Practices

### 1. Timestamp Management
```powershell
# Always use ISO 8601 format
$timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
```

### 2. Error Handling
```powershell
try {
    $response = curl.exe -X POST $url -H "Content-Type: application/json" -d $data
    if ($response -like "*Data received successfully*") {
        Write-Host "✅ Success!"
    } else {
        Write-Host "❌ Error: $response"
    }
} catch {
    Write-Host "❌ Network error: $($_.Exception.Message)"
}
```

### 3. Data Validation
```powershell
# Validate sensor ranges
if ($Temperature -lt -50 -or $Temperature -gt 100) {
    Write-Error "Temperature out of valid range (-50 to 100°C)"
    return
}
if ($Moisture -lt 0 -or $Moisture -gt 100) {
    Write-Error "Moisture out of valid range (0-100%)"
    return
}
if ($Ph -lt 0 -or $Ph -gt 14) {
    Write-Error "pH out of valid range (0-14)"
    return
}
```

### 4. Batch Operations
For multiple readings, include them in a single request rather than multiple requests:

```json
{
  "secret": "AEAMS_SECRET_zhmaj9w00ag",
  "readings": [
    {"rod_id": "sensor_01", "secret": "...", "timestamp": "...", "temperature": 25.0},
    {"rod_id": "sensor_02", "secret": "...", "timestamp": "...", "temperature": 26.0},
    {"rod_id": "sensor_03", "secret": "...", "timestamp": "...", "temperature": 24.5}
  ]
}
```

### 5. Monitoring and Logging
```powershell
# Log all API calls for debugging
$logFile = "aeams-api-calls-$(Get-Date -Format 'yyyy-MM-dd').log"
"$(Get-Date): Sending data for rod $RodId" | Add-Content $logFile
```

## System Requirements

### Prerequisites
- Windows PowerShell 5.1+ or PowerShell Core 7+
- curl.exe (included in Windows 10+ by default)
- Network access to Railway hosting platform
- Valid main rod ID registered in the system
- Main rod must be bound to a farm

### Dependencies
- No additional PowerShell modules required
- Uses built-in cmdlets and curl.exe
- JSON formatting handled natively

---

*This guide covers all aspects of pushing data to the AEAMS API. For additional support, check the troubleshooting section or examine the existing PowerShell helper functions.*
