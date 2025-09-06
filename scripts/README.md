# AEAMS Scripts

This folder contains the data push tools for the AEAMS agricultural monitoring system with integer rod support.

## Available Scripts

### 🚀 `Send-AEAMSData.ps1` (PowerShell)
**Primary script** for Windows PowerShell environments  
**Features**:
- Integer-based secondary rod targeting
- Batch mode for multiple rods
- Interactive configuration mode  
- JSON configuration file support
- Comprehensive sensor data validation
- Full error handling and colored output

**Usage Examples**:
```powershell
# Single rod
.\Send-AEAMSData.ps1 -SecondaryRodId 1 -Temperature 25.4

# Multiple rods (batch mode)
.\Send-AEAMSData.ps1 -SecondaryRodIds @(1,2,3) -BatchMode

# Using config file
.\Send-AEAMSData.ps1 -ConfigFile "examples\greenhouse-config.json"

# Interactive mode
.\Send-AEAMSData.ps1 -Interactive
```

### 🐧 `send-aeams-data.sh` (Shell Script)
**Cross-platform script** for Unix/Linux/macOS environments  
**Features**:
- Same functionality as PowerShell version
- Unix line endings for proper compatibility
- Colored terminal output
- Integer rod system support

**Usage Examples**:
```bash
# Single rod
./send-aeams-data.sh -s 1 -t 25.4 -w 60.0

# Multiple rods
./send-aeams-data.sh -S 1,2,3 -B

# Using config file  
./send-aeams-data.sh -c examples/greenhouse-config.json
```

### 🪟 `send-aeams-data.bat` (Windows Batch)
**Windows wrapper** for the PowerShell script  
**Features**:
- Native Windows batch file interface
- Passes parameters to PowerShell script
- Error handling and user feedback
- Help system

**Usage Examples**:
```cmd
REM Single rod
send-aeams-data.bat -s 1 -t 25.4

REM Multiple rods
send-aeams-data.bat -S 1,2,3 -B

REM Help
send-aeams-data.bat -h
```

### 🔧 `test-nextauth.ps1` (Utility)
**Authentication testing tool**  
**Purpose**: Validate NextAuth environment configuration  
**Usage**: `.\test-nextauth.ps1`

## Integer Rod System

All scripts support the new **integer-based secondary rod system**:

- **Secondary Rods**: Use simple integers (1, 2, 3, etc.)
- **Main Rods**: Still use string identifiers (farm names)
- **Batch Targeting**: Send data to multiple rods simultaneously
- **Individual Targeting**: Send unique data to specific rods

## Common Parameters

| Parameter | PowerShell | Shell | Batch | Description |
|-----------|------------|-------|-------|-------------|
| Main Rod | `-MainRodId` | `-m` | `-m` | Farm identifier |
| Single Rod | `-SecondaryRodId` | `-s` | `-s` | Single rod number |
| Multiple Rods | `-SecondaryRodIds` | `-S` | `-S` | Comma-separated rod numbers |
| Batch Mode | `-BatchMode` | `-B` | `-B` | Enable multi-rod mode |
| Temperature | `-Temperature` | `-t` | `-t` | Temperature in Celsius |
| Moisture | `-Moisture` | `-w` | `-w` | Moisture percentage |
| pH | `-Ph` | `-p` | `-p` | pH level (0-14) |
| Config File | `-ConfigFile` | `-c` | `-c` | JSON configuration file |
| Interactive | `-Interactive` | `-i` | `-i` | Interactive mode |
| Help | `-Help` | `-h` | `-h` | Show help message |

## Requirements

- **PowerShell**: Windows PowerShell 5.1+ or PowerShell Core 6+
- **Shell Script**: Bash 4+, curl command
- **Batch File**: Windows with PowerShell available
- **Network**: Internet connection to AEAMS API
- **Authentication**: Valid API secret key

## API Integration

All scripts connect to the production AEAMS API:
- **Endpoint**: `https://aeams-test-production.up.railway.app`
- **Authentication**: Secret-based API authentication
- **Data Format**: JSON with integer rod IDs
- **Response**: Confirmation with reading IDs
