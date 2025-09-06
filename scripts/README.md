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

🎯 **Result:**
- **Clean, focused codebase** with no redundant files
- **Comprehensive documentation** for users
- **All integer rod functionality** preserved and working
- **Cross-platform support** maintained (PowerShell for Windows, Shell for Unix/Linux)
- **Real-world examples** for different agricultural scenarios

The repository is now **production-ready** with a clean, maintainable structure! 🚀

## Common Parameters

| Parameter | PowerShell | Shell | Description |
|-----------|------------|-------|-------------|
| Main Rod | `-MainRodId` | `-m` | Farm identifier |
| Single Rod | `-SecondaryRodId` | `-s` | Single rod number |
| Multiple Rods | `-SecondaryRodIds` | `-S` | Comma-separated rod numbers |
| Batch Mode | `-BatchMode` | `-B` | Enable multi-rod mode |
| Temperature | `-Temperature` | `-t` | Temperature in Celsius |
| Moisture | `-Moisture` | `-w` | Moisture percentage |
| pH | `-Ph` | `-p` | pH level (0-14) |
| Config File | `-ConfigFile` | `-c` | JSON configuration file |
| Interactive | `-Interactive` | `-i` | Interactive mode |
| Help | `-Help` | `-h` | Show help message |

## Requirements

- **PowerShell**: Windows PowerShell 5.1+ or PowerShell Core 6+
- **Shell Script**: Bash 4+, curl command
- **Network**: Internet connection to AEAMS API
- **Authentication**: Valid API secret key

## Platform Recommendations

- **Windows**: Use the PowerShell script directly (`.\scripts\Send-AEAMSData.ps1`)
- **Unix/Linux/macOS**: Use the shell script (`./scripts/send-aeams-data.sh`)
- **Cross-platform**: PowerShell Core works on all platforms

## API Integration

All scripts connect to the production AEAMS API:
- **Endpoint**: `https://aeams-test-production.up.railway.app`
- **Authentication**: Secret-based API authentication
- **Data Format**: JSON with integer rod IDs
- **Response**: Confirmation with reading IDs
