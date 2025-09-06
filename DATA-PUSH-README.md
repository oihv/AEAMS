# AEAMS Data Push Tools - User Guide

This folder contains enhanced tools for sending sensor data to the AEAMS API. The tools support multiple configuration methods and are designed to be flexible and user-friendly.

## 📁 File Structure

```
AEAMS/
├── Send-AEAMSData.ps1          # Enhanced PowerShell script
├── send-aeams-data.sh          # Enhanced shell script
├── examples/                   # Configuration examples
│   ├── greenhouse-config.json  # Greenhouse setup
│   ├── field-config.json      # Outdoor field setup
│   └── hydroponic-config.json  # Hydroponic system
└── DATA-PUSH-README.md         # This file
```

## 🚀 Quick Start

### PowerShell (Windows)

```powershell
# 1. Interactive mode
.\Send-AEAMSData.ps1 -Interactive

# 2. Use configuration file
.\Send-AEAMSData.ps1 -ConfigFile "examples\greenhouse-config.json"

# 3. Command line parameters
.\Send-AEAMSData.ps1 -MainRodId "farm_01" -SecondaryRodId "sensor_01" -Temperature 25.4
```

### Shell Script (Linux/macOS)

```bash
# Make script executable
chmod +x send-aeams-data.sh

# 1. Interactive mode
./send-aeams-data.sh -i

# 2. Use configuration file
./send-aeams-data.sh -c examples/greenhouse-config.json

# 3. Command line parameters
./send-aeams-data.sh -m farm_01 -s sensor_01 -t 25.4
```

## 🔧 Configuration Methods

### Method 1: Configuration Files (Recommended)

Create a JSON file with your settings:

```json
{
  "api": {
    "url": "https://aeams-test-production.up.railway.app",
    "secret": "AEAMS_SECRET_zhmaj9w00ag",
    "timeout": 30
  },
  "farm": {
    "main_rod_id": "your_main_rod_id",
    "secondary_rod_id": "your_sensor_id",
    "location": "Greenhouse A - Section 1"
  },
  "sensor_data": {
    "temperature": 25.4,
    "moisture": 68.2,
    "ph": 6.5,
    "conductivity": 1.4,
    "nitrogen": 18.7,
    "phosphorus": 12.3,
    "potassium": 24.1
  }
}
```

**Advantages:**
- Reusable configurations
- Version control friendly
- Easy to share between systems
- Supports all options

### Method 2: Interactive Mode

Run the script with `-Interactive` (PowerShell) or `-i` (shell) to be prompted for all values:

```bash
./send-aeams-data.sh -i
```

**Advantages:**
- Guided input with defaults
- Random value generation option
- Good for testing and learning

### Method 3: Command Line Parameters

Pass values directly as command line arguments:

```bash
./send-aeams-data.sh -m "farm_01" -s "sensor_01" -t 25.4 -w 60.2 -p 6.8
```

**Advantages:**
- Scriptable and automatable
- Can override config file values
- Fast for single-value changes

## 📊 Sensor Parameters

| Parameter | Unit | Typical Range | Description |
|-----------|------|---------------|-------------|
| Temperature | °C | -50 to 100 | Air/soil temperature |
| Moisture | % | 0 to 100 | Soil moisture percentage |
| pH | - | 0 to 14 | Soil pH level |
| Conductivity | mS/cm | 0 to 10 | Electrical conductivity |
| Nitrogen | ppm | 0 to 1000 | Nitrogen content |
| Phosphorus | ppm | 0 to 1000 | Phosphorus content |
| Potassium | ppm | 0 to 1000 | Potassium content |

## 🏗️ Setup Instructions

### PowerShell Setup (Windows)

1. **No additional setup required** - PowerShell is built into Windows
2. **Download the script** to your AEAMS folder
3. **Run in PowerShell** (not Command Prompt)

```powershell
# Navigate to AEAMS folder
cd "C:\path\to\AEAMS"

# Run the script
.\Send-AEAMSData.ps1 -Help
```

### Shell Script Setup (Linux/macOS)

1. **Install required dependencies:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install curl jq bc

# CentOS/RHEL
sudo yum install curl jq bc

# macOS (with Homebrew)
brew install curl jq bc
```

2. **Make script executable:**

```bash
chmod +x send-aeams-data.sh
```

3. **Run the script:**

```bash
./send-aeams-data.sh --help
```

## 💡 Usage Examples

### Example 1: Greenhouse Monitoring

```bash
# Create custom config
cp examples/greenhouse-config.json my-greenhouse.json

# Edit values in my-greenhouse.json
# Then run:
./send-aeams-data.sh -c my-greenhouse.json
```

### Example 2: Field Testing with Random Data

```bash
# Interactive mode with random values
./send-aeams-data.sh -i
# Press Enter for all prompts to use random values
```

### Example 3: Automated Data Collection

```bash
# Script that runs every hour
#!/bin/bash
cd /path/to/aeams
./send-aeams-data.sh -c field-config.json -t $(get_temperature) -w $(get_moisture)
```

### Example 4: Override Specific Values

```bash
# Use config file but override temperature and moisture
./send-aeams-data.sh -c greenhouse-config.json -t 28.5 -w 75.2
```

## 🔍 Troubleshooting

### Common Issues

**1. "curl not found"**
- **Solution:** Install curl package for your system

**2. "Permission denied"**
- **Solution:** Make script executable: `chmod +x send-aeams-data.sh`

**3. "jq not found"**
- **Solution:** Install jq for JSON parsing, or use interactive/command line mode

**4. "Invalid secret key"**
- **Solution:** Verify your API secret key in the configuration

**5. "Main rod not found"**
- **Solution:** Check that your main rod ID exists in the AEAMS database

### Debug Commands

```bash
# Test API health
curl -X GET "https://aeams-test-production.up.railway.app/api/health"

# Check main rods
curl -X GET "https://aeams-test-production.up.railway.app/api/admin/seed-rods"

# Test with verbose output
./send-aeams-data.sh -c config.json --verbose
```

## 🔐 Security Notes

1. **Keep API secrets secure** - Don't commit them to version control
2. **Use environment variables** for sensitive data in production
3. **Restrict file permissions** on configuration files containing secrets
4. **Use HTTPS only** - Never send data over unencrypted connections

## 📝 Customization

### Adding New Sensor Types

To add new sensor parameters, modify the scripts to include:

1. **Parameter definition** in the configuration section
2. **Command line argument parsing** for the new parameter
3. **JSON payload building** to include the new field
4. **Validation rules** for the new parameter range

### Creating Custom Presets

Create multiple configuration files for different scenarios:

```
configs/
├── greenhouse-morning.json
├── greenhouse-evening.json
├── field-summer.json
├── field-winter.json
└── hydroponic-maintenance.json
```

## 📈 Integration Examples

### Cron Job (Linux)

```bash
# Edit crontab
crontab -e

# Add line to run every 15 minutes
*/15 * * * * /path/to/aeams/send-aeams-data.sh -c /path/to/config.json
```

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., every 15 minutes)
4. Set action: `powershell.exe -File "C:\path\to\Send-AEAMSData.ps1" -ConfigFile "config.json"`

### Python Integration

```python
import subprocess
import json

# Load config
with open('sensor-config.json') as f:
    config = json.load(f)

# Get real sensor data
temperature = read_temperature_sensor()
moisture = read_moisture_sensor()

# Update config
config['sensor_data']['temperature'] = temperature
config['sensor_data']['moisture'] = moisture

# Save and run
with open('current-config.json', 'w') as f:
    json.dump(config, f)

subprocess.run(['./send-aeams-data.sh', '-c', 'current-config.json'])
```

## 🆘 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Verify API connectivity** with health check
3. **Test with known good configuration** from examples
4. **Check AEAMS logs** for error details
5. **Contact system administrator** for API access issues

## 📄 License

These tools are part of the AEAMS project. Use according to your project license terms.
