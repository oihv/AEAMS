# AEAMS API Testing Guide

This guide shows how to test the AEAMS API using online tools like Postman, Insomnia, or web-based API testers.

## 📡 API Endpoint Information

- **Base URL**: `https://aeams-test-production.up.railway.app`
- **Main Endpoint**: `POST /api/rod/{main_rod_id}`
- **Health Check**: `GET /api/health`
- **Secret Setup**: `GET /api/setup-rod-secret`

## 🔑 Authentication

The API uses a secret key for authentication:
- **Current Secret**: `AEAMS_SECRET_zhmaj9w00ag`
- **Purpose**: Prevents unauthorized sensor data submission
- **Location**: Must be included in both the main payload and each reading

## 📋 Testing with Online API Tools

### 1. Postman Setup

**Method**: `POST`  
**URL**: `https://aeams-test-production.up.railway.app/api/rod/justintul`  
**Headers**:
```
Content-Type: application/json
```

**Body** (raw JSON):
```json
{
  "secret": "AEAMS_SECRET_zhmaj9w00ag",
  "readings": [
    {
      "rod_id": 1,
      "secret": "AEAMS_SECRET_zhmaj9w00ag",
      "timestamp": "2025-09-08T12:00:00Z",
      "temperature": 25.5,
      "moisture": 65.0,
      "ph": 6.8,
      "conductivity": 1.4,
      "nitrogen": 22.0,
      "phosphorus": 12.0,
      "potassium": 18.0
    }
  ]
}
```

### 2. curl Command Line

```bash
curl -X POST https://aeams-test-production.up.railway.app/api/rod/justintul \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "AEAMS_SECRET_zhmaj9w00ag",
    "readings": [
      {
        "rod_id": 1,
        "secret": "AEAMS_SECRET_zhmaj9w00ag",
        "timestamp": "2025-09-08T12:00:00Z",
        "temperature": 25.5,
        "moisture": 65.0,
        "ph": 6.8,
        "conductivity": 1.4,
        "nitrogen": 22.0,
        "phosphorus": 12.0,
        "potassium": 18.0
      }
    ]
  }'
```

### 3. JavaScript (fetch)

```javascript
fetch('https://aeams-test-production.up.railway.app/api/rod/justintul', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    secret: "AEAMS_SECRET_zhmaj9w00ag",
    readings: [
      {
        rod_id: 1,
        secret: "AEAMS_SECRET_zhmaj9w00ag",
        timestamp: new Date().toISOString(),
        temperature: 25.5,
        moisture: 65.0,
        ph: 6.8,
        conductivity: 1.4,
        nitrogen: 22.0,
        phosphorus: 12.0,
        potassium: 18.0
      }
    ]
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 📊 Test Scenarios

See the individual JSON files in this folder for specific test cases:

1. **single-rod-basic.json** - Simple single sensor reading
2. **multiple-rods-batch.json** - Multiple sensors at once
3. **vegetative-growth.json** - High nitrogen for plant growth
4. **flowering-stage.json** - High phosphorus for flowering
5. **hydroponic-system.json** - High concentration nutrients
6. **greenhouse-monitoring.json** - Complete greenhouse setup

## ✅ Expected Response

**Success Response**:
```json
{
  "message": "Data received successfully",
  "farm_id": "cmeqgslzj0001k104enme45mg",
  "main_rod_id": "justintul",
  "processed_readings": 1,
  "readings": [
    {
      "rod_id": "1",
      "reading_id": "unique_reading_id",
      "status": "success"
    }
  ]
}
```

**Error Response**:
```json
{
  "error": "Invalid secret key"
}
```

## 🧪 Quick Health Check

Before testing with sensor data, verify the API is running:

**URL**: `GET https://aeams-test-production.up.railway.app/api/health`

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-09-08T12:00:00.000Z",
  "environment": {
    "hasDatabase": true,
    "hasNextAuthSecret": true
  }
}
```

## 🔧 Troubleshooting

- **404 Error**: Main rod ID doesn't exist (try "justintul")
- **401 Error**: Invalid secret key
- **400 Error**: Malformed JSON or missing required fields
- **500 Error**: Server error (check API health)

## 📱 Online Tools Recommendations

1. **Postman** - Professional API testing
2. **Insomnia** - Free alternative to Postman
3. **Hoppscotch** - Web-based API tester
4. **Thunder Client** - VS Code extension
5. **RESTful API Client** - Browser extensions
