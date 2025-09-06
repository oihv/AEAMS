# AEAMS Configuration Examples

This folder contains example JSON configuration files for different agricultural monitoring scenarios using the integer rod system.

## Available Configurations

### 🏠 `greenhouse-config.json`
**Use Case**: Indoor greenhouse monitoring  
**Secondary Rods**: 1, 2, 3  
**Environment**: Controlled climate with optimized growing conditions  
**Features**:
- Higher temperature (25.4°C)
- Good moisture levels (68.2%)
- Controlled pH (6.5)
- Enhanced nutrients for growth

### 🌾 `field-config.json` 
**Use Case**: Outdoor field crop monitoring  
**Secondary Rods**: 1, 2, 3, 4  
**Environment**: Open field agriculture with natural conditions  
**Features**:
- Moderate temperature (22.1°C)
- Variable moisture levels (45.8%)
- Natural soil pH (7.2)
- Standard field nutrient levels

### 💧 `hydroponic-config.json`
**Use Case**: Hydroponic/soilless growing systems  
**Secondary Rods**: 1, 2  
**Environment**: Water-based nutrient solution growing  
**Features**:
- Controlled temperature (24.8°C)
- High moisture (95.0%)
- Acidic nutrient solution pH (5.8)
- High conductivity and nutrients

## Usage

Use these configuration files with any of the AEAMS data push tools:

```bash
# PowerShell
.\scripts\Send-AEAMSData.ps1 -ConfigFile "examples\greenhouse-config.json"

# Shell Script  
./scripts/send-aeams-data.sh -c examples/greenhouse-config.json

# Windows Batch
.\scripts\send-aeams-data.bat -c examples\greenhouse-config.json
```

## Integer Rod System

All configurations use the new **integer-based secondary rod system**:
- Secondary rods are identified by simple numbers: 1, 2, 3, etc.
- No more complex string names like "greenhouse_sensor_001"
- Easy to scale and manage multiple sensors per farm

## Configuration Format

```json
{
  "api": {
    "url": "https://aeams-test-production.up.railway.app",
    "secret": "AEAMS_SECRET_zhmaj9w00ag"
  },
  "farm": {
    "main_rod_id": "your_farm_identifier", 
    "secondary_rod_ids": [1, 2, 3],
    "description": "Integer-based rod system"
  },
  "sensor_data": {
    "temperature": 25.0,
    "moisture": 50.0,
    "ph": 7.0,
    "conductivity": 1.5,
    "nitrogen": 15.0,
    "phosphorus": 10.0,
    "potassium": 20.0
  }
}
```
