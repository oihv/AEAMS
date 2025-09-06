#!/bin/bash

# ================================================================
# AEAMS All-In-One Data Push Tool - Linux Version
# Modify sensor data and push directly to API
# ================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo
echo "================================================================"
echo "               AEAMS All-In-One Data Push Tool"
echo "================================================================"
echo

# ================================================================
# CONFIGURATION SECTION - MODIFY THESE VALUES
# ================================================================

# Main Rod Configuration (the farm controller)
MAIN_ROD_ID="justintul"

# Secondary Rod Configuration (the sensor unit)
SECONDARY_ROD_ID="asdasdsa"

# API Configuration
API_URL="https://aeams-test-production.up.railway.app"
SECRET_KEY="AEAMS_SECRET_zhmaj9w00ag"

# Sensor Data - MODIFY THESE VALUES
TEMPERATURE="23.5"
MOISTURE="45.2"
PH="6.8"
CONDUCTIVITY="1.2"
NITROGEN="12.5"
PHOSPHORUS="8.3"
POTASSIUM="15.7"

# ================================================================
# PREVIOUS ROD EXAMPLES (uncomment to use)
# ================================================================

# Example 1: Original test setup
# MAIN_ROD_ID="justintul"
# SECONDARY_ROD_ID="asdasdsa"

# Example 2: Test rod setup
# MAIN_ROD_ID="justintul"
# SECONDARY_ROD_ID="test_rod_001"

# Example 3: Greenhouse setup
# MAIN_ROD_ID="farm_greenhouse"
# SECONDARY_ROD_ID="greenhouse_sensor_01"

# Example 4: Field setup
# MAIN_ROD_ID="farm_field_a"
# SECONDARY_ROD_ID="sensor_north"

# Example 5: Research plot setup
# MAIN_ROD_ID="research_plot"
# SECONDARY_ROD_ID="npk_analyzer_01"

# ================================================================
# QUICK SENSOR PRESETS (uncomment to use)
# ================================================================

# Preset 1: Hot greenhouse conditions
# TEMPERATURE="28.5"
# MOISTURE="65.3"
# PH="6.5"
# CONDUCTIVITY="1.8"
# NITROGEN="18.2"
# PHOSPHORUS="11.4"
# POTASSIUM="22.7"

# Preset 2: Outdoor field conditions
# TEMPERATURE="22.1"
# MOISTURE="38.7"
# PH="7.1"
# CONDUCTIVITY="0.9"
# NITROGEN="15.8"
# PHOSPHORUS="9.2"
# POTASSIUM="19.3"

# Preset 3: Hydroponic setup
# TEMPERATURE="24.8"
# MOISTURE="95.0"
# PH="5.8"
# CONDUCTIVITY="2.1"
# NITROGEN="25.4"
# PHOSPHORUS="15.7"
# POTASSIUM="28.9"

# Preset 4: Dry conditions
# TEMPERATURE="26.3"
# MOISTURE="25.1"
# PH="7.8"
# CONDUCTIVITY="0.6"
# NITROGEN="8.9"
# PHOSPHORUS="5.4"
# POTASSIUM="12.1"

# ================================================================
# FUNCTIONS
# ================================================================

# Function to print colored output
print_status() {
    case $1 in
        "success") echo -e "${GREEN}✅ $2${NC}" ;;
        "error") echo -e "${RED}❌ $2${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $2${NC}" ;;
        "info") echo -e "${CYAN}🔍 $2${NC}" ;;
        "header") echo -e "${BLUE}$2${NC}" ;;
    esac
}

# Function to check if curl is installed
check_curl() {
    if ! command -v curl &> /dev/null; then
        print_status "error" "curl is not installed. Please install curl first."
        echo "On Ubuntu/Debian: sudo apt-get install curl"
        echo "On CentOS/RHEL: sudo yum install curl"
        echo "On Fedora: sudo dnf install curl"
        echo "On macOS: curl is usually pre-installed"
        exit 1
    fi
}

# Function to generate ISO 8601 timestamp
generate_timestamp() {
    if command -v date &> /dev/null; then
        TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    else
        print_status "error" "date command not found"
        exit 1
    fi
}

# Function to validate sensor values
validate_values() {
    # Temperature validation (-50 to 100°C)
    if (( $(echo "$TEMPERATURE < -50 || $TEMPERATURE > 100" | bc -l) )); then
        print_status "warning" "Temperature ($TEMPERATURE°C) is outside typical range (-50 to 100°C)"
    fi
    
    # Moisture validation (0 to 100%)
    if (( $(echo "$MOISTURE < 0 || $MOISTURE > 100" | bc -l) )); then
        print_status "warning" "Moisture ($MOISTURE%) is outside valid range (0-100%)"
    fi
    
    # pH validation (0 to 14)
    if (( $(echo "$PH < 0 || $PH > 14" | bc -l) )); then
        print_status "warning" "pH ($PH) is outside valid range (0-14)"
    fi
}

# Function to edit values interactively
edit_values() {
    echo
    echo "================================================================"
    echo "                    EDIT VALUES"
    echo "================================================================"
    echo
    
    echo "Enter new values (press Enter to keep current value):"
    echo
    
    read -p "Main Rod ID [$MAIN_ROD_ID]: " NEW_MAIN_ROD
    if [[ -n "$NEW_MAIN_ROD" ]]; then
        MAIN_ROD_ID="$NEW_MAIN_ROD"
    fi
    
    read -p "Secondary Rod ID [$SECONDARY_ROD_ID]: " NEW_SECONDARY_ROD
    if [[ -n "$NEW_SECONDARY_ROD" ]]; then
        SECONDARY_ROD_ID="$NEW_SECONDARY_ROD"
    fi
    
    read -p "Temperature [$TEMPERATURE]: " NEW_TEMP
    if [[ -n "$NEW_TEMP" ]]; then
        TEMPERATURE="$NEW_TEMP"
    fi
    
    read -p "Moisture [$MOISTURE]: " NEW_MOISTURE
    if [[ -n "$NEW_MOISTURE" ]]; then
        MOISTURE="$NEW_MOISTURE"
    fi
    
    read -p "pH [$PH]: " NEW_PH
    if [[ -n "$NEW_PH" ]]; then
        PH="$NEW_PH"
    fi
    
    read -p "Conductivity [$CONDUCTIVITY]: " NEW_CONDUCTIVITY
    if [[ -n "$NEW_CONDUCTIVITY" ]]; then
        CONDUCTIVITY="$NEW_CONDUCTIVITY"
    fi
    
    read -p "Nitrogen [$NITROGEN]: " NEW_NITROGEN
    if [[ -n "$NEW_NITROGEN" ]]; then
        NITROGEN="$NEW_NITROGEN"
    fi
    
    read -p "Phosphorus [$PHOSPHORUS]: " NEW_PHOSPHORUS
    if [[ -n "$NEW_PHOSPHORUS" ]]; then
        PHOSPHORUS="$NEW_PHOSPHORUS"
    fi
    
    read -p "Potassium [$POTASSIUM]: " NEW_POTASSIUM
    if [[ -n "$NEW_POTASSIUM" ]]; then
        POTASSIUM="$NEW_POTASSIUM"
    fi
    
    echo
    echo "Updated values:"
    echo "  Main Rod ID:      $MAIN_ROD_ID"
    echo "  Secondary Rod ID: $SECONDARY_ROD_ID"
    echo "  Temperature:      ${TEMPERATURE}°C"
    echo "  Moisture:         ${MOISTURE}%"
    echo "  pH:               $PH"
    echo "  Conductivity:     $CONDUCTIVITY mS/cm"
    echo "  Nitrogen (N):     $NITROGEN ppm"
    echo "  Phosphorus (P):   $PHOSPHORUS ppm"
    echo "  Potassium (K):    $POTASSIUM ppm"
    echo
    
    read -p "Continue with these values? (Y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
}

# Function to show troubleshooting info
show_troubleshooting() {
    echo
    echo "================================================================"
    echo "                    TROUBLESHOOTING"
    echo "================================================================"
    echo
    echo "Common issues and solutions:"
    echo
    echo "1. \"Main rod not found\" - Check if main rod ID exists in database"
    echo "2. \"Invalid secret key\" - Verify secret key is correct"
    echo "3. \"Main rod not bound to farm\" - Bind the rod to a farm first"
    echo "4. Network timeout - Check internet connection"
    echo
    echo "Quick debug commands:"
    echo
    echo "Test API health:"
    echo "  curl -X GET \"$API_URL/api/health\""
    echo
    echo "Test database connection:"
    echo "  curl -X GET \"$API_URL/api/test-db\""
    echo
    echo "Check main rods:"
    echo "  curl -X GET \"$API_URL/api/main-rods\""
    echo
    echo "Current configuration used:"
    echo "  Main Rod ID: $MAIN_ROD_ID"
    echo "  Secondary Rod ID: $SECONDARY_ROD_ID"
    echo "  Secret Key: $SECRET_KEY"
    echo
}

# ================================================================
# MAIN SCRIPT EXECUTION
# ================================================================

# Check prerequisites
check_curl

# Validate bc is available for math operations
if ! command -v bc &> /dev/null; then
    print_status "warning" "bc (calculator) not found. Sensor validation will be skipped."
    echo "To install bc: sudo apt-get install bc (Ubuntu/Debian) or sudo yum install bc (CentOS/RHEL)"
fi

# ================================================================
# DISPLAY CURRENT CONFIGURATION
# ================================================================

echo "Current Configuration:"
echo "----------------------"
echo "Main Rod ID:      $MAIN_ROD_ID"
echo "Secondary Rod ID: $SECONDARY_ROD_ID"
echo "API URL:          $API_URL"
echo
echo "Sensor Data:"
echo "  Temperature:    ${TEMPERATURE}°C"
echo "  Moisture:       ${MOISTURE}%"
echo "  pH:             $PH"
echo "  Conductivity:   $CONDUCTIVITY mS/cm"
echo "  Nitrogen (N):   $NITROGEN ppm"
echo "  Phosphorus (P): $PHOSPHORUS ppm"
echo "  Potassium (K):  $POTASSIUM ppm"
echo

# Generate timestamp
generate_timestamp
echo "Timestamp:        $TIMESTAMP"
echo

# Validate sensor values if bc is available
if command -v bc &> /dev/null; then
    validate_values
fi

# ================================================================
# CONFIRMATION
# ================================================================

echo "Ready to push data to AEAMS API!"
echo
read -p "Press Y to continue, N to cancel, or E to edit values: " CONFIRM

case "$CONFIRM" in
    [Nn]*)
        echo "Operation cancelled."
        exit 0
        ;;
    [Ee]*)
        edit_values
        # Regenerate timestamp after editing
        generate_timestamp
        ;;
    [Yy]*)
        ;;
    *)
        echo "Invalid input. Operation cancelled."
        exit 0
        ;;
esac

# ================================================================
# API HEALTH CHECK
# ================================================================

echo
echo "================================================================"
echo "Step 1: Testing API Health..."
echo "================================================================"

HTTP_STATUS=$(curl -s -o /tmp/health_response.json -w "%{http_code}" -X GET "$API_URL/api/health")

if [[ "$HTTP_STATUS" == "200" ]]; then
    print_status "success" "API is responding!"
    if [[ -f /tmp/health_response.json ]]; then
        echo "Response: $(cat /tmp/health_response.json)"
        rm -f /tmp/health_response.json
    fi
else
    print_status "error" "API Health check failed! HTTP Status: $HTTP_STATUS"
    echo "Please check your internet connection and try again."
    exit 1
fi

echo

# ================================================================
# BUILD JSON PAYLOAD
# ================================================================

echo "================================================================"
echo "Step 2: Building JSON payload..."
echo "================================================================"

JSON_PAYLOAD="{\"secret\":\"$SECRET_KEY\",\"readings\":[{\"rod_id\":\"$SECONDARY_ROD_ID\",\"secret\":\"$SECRET_KEY\",\"timestamp\":\"$TIMESTAMP\",\"temperature\":$TEMPERATURE,\"moisture\":$MOISTURE,\"ph\":$PH,\"conductivity\":$CONDUCTIVITY,\"nitrogen\":$NITROGEN,\"phosphorus\":$PHOSPHORUS,\"potassium\":$POTASSIUM}]}"

echo "JSON Payload:"
echo "$JSON_PAYLOAD"
echo

# ================================================================
# PUSH DATA TO API
# ================================================================

echo "================================================================"
echo "Step 3: Pushing data to API..."
echo "================================================================"

echo "Sending to: $API_URL/api/rod/$MAIN_ROD_ID"
echo

HTTP_STATUS=$(curl -s -o /tmp/api_response.json -w "%{http_code}" \
    -X POST "$API_URL/api/rod/$MAIN_ROD_ID" \
    -H "Content-Type: application/json" \
    -d "$JSON_PAYLOAD")

if [[ "$HTTP_STATUS" == "200" ]]; then
    print_status "success" "Data push completed!"
    if [[ -f /tmp/api_response.json ]]; then
        echo "Response: $(cat /tmp/api_response.json)"
        rm -f /tmp/api_response.json
    fi
else
    print_status "error" "Data push failed! HTTP Status: $HTTP_STATUS"
    if [[ -f /tmp/api_response.json ]]; then
        echo "Error details: $(cat /tmp/api_response.json)"
        rm -f /tmp/api_response.json
    fi
    show_troubleshooting
    exit 1
fi

# ================================================================
# COMPLETION
# ================================================================

echo
echo "================================================================"
echo "                    OPERATION COMPLETE"
echo "================================================================"
echo
echo "Data has been sent to the AEAMS API."
echo
echo "Summary:"
echo "  Main Rod:       $MAIN_ROD_ID"
echo "  Secondary Rod:  $SECONDARY_ROD_ID"
echo "  Temperature:    ${TEMPERATURE}°C"
echo "  Moisture:       ${MOISTURE}%"
echo "  pH:             $PH"
echo "  NPK:            N:$NITROGEN P:$PHOSPHORUS K:$POTASSIUM"
echo "  Timestamp:      $TIMESTAMP"
echo
echo "Check the API response above to confirm successful data storage."
echo

# Clean up temporary files
rm -f /tmp/health_response.json /tmp/api_response.json

echo "Press Enter to exit..."
read
