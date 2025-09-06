# Integer-Based Secondary Rod System - Implementation Summary

## Overview
The AEAMS system has been successfully updated to use integer-based secondary rod IDs (1, 2, 3, etc.) instead of string-based identifiers. This simplifies targeting and management of sensor units.

## Changes Made

### 1. PowerShell Script (`Send-AEAMSData.ps1`)
- **Updated Parameters**: 
  - `SecondaryRodId` now accepts integers instead of strings
  - Added `SecondaryRodIds` array parameter for batch targeting
  - Added `BatchMode` switch
- **New Features**:
  - Target single rod: `-SecondaryRodId 1`
  - Target multiple rods: `-SecondaryRodIds @(1,2,3) -BatchMode`
  - Automatic integer conversion in JSON payload

### 2. Shell Script (`send-aeams-data.sh`)
- **Updated Parameters**:
  - `-s` or `--secondary-rod` now accepts rod numbers
  - `-S` or `--secondary-rods` accepts comma-separated numbers (e.g., `1,2,3`)
- **Enhanced Features**:
  - Batch mode support with `-B` flag
  - Interactive mode updated to accept rod numbers
  - Proper integer handling in JSON payload

### 3. API Route (`app/api/rod/[rod_id]/route.ts`)
- **Updated Interface**: `rod_id` now accepts both `string | number`
- **Enhanced Processing**:
  - Automatic conversion of numeric rod IDs to strings
  - Improved naming for integer-based rods ("Sensor 1", "Sensor 2", etc.)
  - Backward compatibility with existing string-based rod IDs

### 4. Configuration Examples
- **Updated Files**:
  - `examples/greenhouse-config.json`
  - `examples/integer-rod-config.json` (new)
- **New Format**:
  ```json
  {
    "farm": {
      "main_rod_id": "justintul",
      "secondary_rod_ids": [1, 2, 3]
    }
  }
  ```

## Usage Examples

### PowerShell
```powershell
# Single rod targeting
.\Send-AEAMSData.ps1 -MainRodId 'justintul' -SecondaryRodId 1 -Temperature 25.5

# Multiple rod targeting
.\Send-AEAMSData.ps1 -MainRodId 'justintul' -SecondaryRodIds @(1,2,3) -BatchMode

# Using configuration file
.\Send-AEAMSData.ps1 -ConfigFile 'examples\integer-rod-config.json'
```

### Shell Script
```bash
# Single rod targeting
./send-aeams-data.sh -m justintul -s 1 -t 25.5

# Multiple rod targeting
./send-aeams-data.sh -m justintul -S 1,2,3 -B

# Interactive mode
./send-aeams-data.sh -i
```

## JSON Payload Structure
The new system generates clean integer-based payloads:

```json
{
  "secret": "AEAMS_SECRET_zhmaj9w00ag",
  "readings": [
    {
      "rod_id": 1,
      "secret": "AEAMS_SECRET_zhmaj9w00ag",
      "timestamp": "2025-09-07T02:21:41Z",
      "temperature": 25.5,
      "moisture": 60.0,
      "ph": 7.0,
      "conductivity": 1.5,
      "nitrogen": 15.0,
      "phosphorus": 10.0,
      "potassium": 20.0
    }
  ]
}
```

## Benefits
1. **Simplified Targeting**: Use simple numbers (1, 2, 3) instead of complex string IDs
2. **Easier Scaling**: Add new sensors by incrementing numbers
3. **Intuitive Management**: Rod numbers are more user-friendly
4. **Backward Compatibility**: Existing string-based rods still work
5. **Clean JSON**: Integer rod IDs produce cleaner API payloads

## Migration Notes
- Existing string-based rod IDs continue to work
- New installations should use integer-based rod IDs
- Configuration files support both formats
- API automatically handles both string and integer rod IDs
