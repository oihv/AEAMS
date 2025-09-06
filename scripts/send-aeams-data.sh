#!/bin/bash

# ================================================================
# AEAMS Data Push Tool - Enhanced Shell Script Version
# Customizable sensor data submission with JSON configuration support
# ================================================================

# Default values
CONFIG_FILE=""
INTERACTIVE_MODE=false
BATCH_MODE=false
SHOW_HELP=false

# API Configuration
API_URL="https://aeams-test-production.up.railway.app"
SECRET_KEY="AEAMS_SECRET_zhmaj9w00ag"

# Farm Configuration
MAIN_ROD_ID="justintul"
SECONDARY_ROD_ID="1"
SECONDARY_ROD_IDS=(1)

# Sensor Data (default values)
TEMPERATURE="23.5"
MOISTURE="45.2"
PH="6.8"
CONDUCTIVITY="1.2"
NITROGEN="12.5"
PHOSPHORUS="8.3"
POTASSIUM="15.7"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# ================================================================
# UTILITY FUNCTIONS
# ================================================================

print_colored() {
    case $1 in
        "success") echo -e "${GREEN}✅ $2${NC}" ;;
        "error") echo -e "${RED}❌ $2${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $2${NC}" ;;
        "info") echo -e "${CYAN}🔍 $2${NC}" ;;
        "header") echo -e "${BLUE}🌱 $2${NC}" ;;
        "highlight") echo -e "${MAGENTA}📋 $2${NC}" ;;
    esac
}

show_help() {
    echo
    print_colored "header" "AEAMS Data Push Tool - Enhanced Shell Script Version"
    echo "================================================================"
    echo
    echo -e "${YELLOW}USAGE EXAMPLES:${NC}"
    echo
    echo -e "${NC}1. Use a configuration file:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -c examples/greenhouse-config.json${NC}"
    echo
    echo -e "${NC}2. Interactive mode:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -i${NC}"
    echo
    echo -e "${NC}3. Target specific rod numbers:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -m farm_01 -s 1 -t 25.4 -w 60.2${NC}"
    echo
    echo -e "${NC}4. Target multiple rod numbers (batch mode):${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -m farm_01 -S 1,2,3 -B${NC}"
    echo
    echo -e "${YELLOW}PARAMETERS:${NC}"
    echo -e "  ${NC}-c, --config FILE      Path to JSON configuration file${NC}"
    echo -e "  ${NC}-m, --main-rod ID      Main rod identifier (farm controller)${NC}"
    echo -e "  ${NC}-s, --secondary-rod NUM Secondary rod number (1, 2, 3, etc.)${NC}"
    echo -e "  ${NC}-S, --secondary-rods   Comma-separated secondary rod numbers${NC}"
    echo -e "  ${NC}-t, --temperature VAL  Temperature in Celsius${NC}"
    echo -e "  ${NC}-w, --moisture VAL     Moisture percentage (0-100)${NC}"
    echo -e "  ${NC}-p, --ph VAL          pH level (0-14)${NC}"
    echo -e "  ${NC}-d, --conductivity VAL Electrical conductivity (mS/cm)${NC}"
    echo -e "  ${NC}-n, --nitrogen VAL     Nitrogen content (ppm)${NC}"
    echo -e "  ${NC}-f, --phosphorus VAL   Phosphorus content (ppm)${NC}"
    echo -e "  ${NC}-k, --potassium VAL    Potassium content (ppm)${NC}"
    echo -e "  ${NC}-u, --url URL         API base URL${NC}"
    echo -e "  ${NC}-r, --secret KEY      API secret key${NC}"
    echo -e "  ${NC}-i, --interactive     Run in interactive mode${NC}"
    echo -e "  ${NC}-B, --batch-mode      Send data to multiple secondary rods${NC}"
    echo -e "  ${NC}-h, --help           Show this help message${NC}"
    echo
    echo -e "${YELLOW}CONFIGURATION FILE FORMAT:${NC}"
    echo -e "  ${NC}See examples folder for sample JSON configuration files:${NC}"
    echo -e "  ${GREEN}- greenhouse-config.json (greenhouse setup)${NC}"
    echo -e "  ${GREEN}- field-config.json (outdoor field setup)${NC}"
    echo -e "  ${GREEN}- hydroponic-config.json (hydroponic system)${NC}"
    echo
}

check_dependencies() {
    local missing_deps=()
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    if ! command -v jq &> /dev/null; then
        print_colored "warning" "jq not found. JSON config files won't be supported."
        print_colored "info" "Install jq: apt-get install jq (Ubuntu/Debian) or yum install jq (CentOS/RHEL)"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_colored "error" "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install them and try again."
        exit 1
    fi
}

load_config_file() {
    local config_file="$1"
    
    if [ ! -f "$config_file" ]; then
        print_colored "error" "Configuration file not found: $config_file"
        return 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_colored "error" "jq is required to parse JSON configuration files"
        return 1
    fi
    
    if ! jq empty "$config_file" 2>/dev/null; then
        print_colored "error" "Invalid JSON in configuration file: $config_file"
        return 1
    fi
    
    # Load configuration values
    API_URL=$(jq -r '.api.url // "https://aeams-test-production.up.railway.app"' "$config_file")
    SECRET_KEY=$(jq -r '.api.secret // "AEAMS_SECRET_zhmaj9w00ag"' "$config_file")
    MAIN_ROD_ID=$(jq -r '.farm.main_rod_id // "justintul"' "$config_file")
    SECONDARY_ROD_ID=$(jq -r '.farm.secondary_rod_id // "test_sensor_001"' "$config_file")
    TEMPERATURE=$(jq -r '.sensor_data.temperature // 23.5' "$config_file")
    MOISTURE=$(jq -r '.sensor_data.moisture // 45.2' "$config_file")
    PH=$(jq -r '.sensor_data.ph // 6.8' "$config_file")
    CONDUCTIVITY=$(jq -r '.sensor_data.conductivity // 1.2' "$config_file")
    NITROGEN=$(jq -r '.sensor_data.nitrogen // 12.5' "$config_file")
    PHOSPHORUS=$(jq -r '.sensor_data.phosphorus // 8.3' "$config_file")
    POTASSIUM=$(jq -r '.sensor_data.potassium // 15.7' "$config_file")
    
    print_colored "success" "Configuration loaded from: $config_file"
    return 0
}

validate_sensor_data() {
    local warnings=0
    
    # Temperature validation (-50 to 100°C)
    if (( $(echo "$TEMPERATURE < -50 || $TEMPERATURE > 100" | bc -l 2>/dev/null || echo "0") )); then
        print_colored "warning" "Temperature (${TEMPERATURE}°C) is outside typical range (-50 to 100°C)"
        ((warnings++))
    fi
    
    # Moisture validation (0 to 100%)
    if (( $(echo "$MOISTURE < 0 || $MOISTURE > 100" | bc -l 2>/dev/null || echo "0") )); then
        print_colored "warning" "Moisture (${MOISTURE}%) is outside valid range (0-100%)"
        ((warnings++))
    fi
    
    # pH validation (0 to 14)
    if (( $(echo "$PH < 0 || $PH > 14" | bc -l 2>/dev/null || echo "0") )); then
        print_colored "warning" "pH ($PH) is outside valid range (0-14)"
        ((warnings++))
    fi
    
    if [ $warnings -eq 0 ]; then
        print_colored "success" "All sensor values are within normal ranges"
    fi
    
    return $warnings
}

get_interactive_input() {
    echo
    print_colored "header" "Interactive Configuration Mode"
    echo "================================================================"
    echo
    
    read -p "API URL [$API_URL]: " input
    [ -n "$input" ] && API_URL="$input"
    
    read -p "API Secret [$SECRET_KEY]: " input
    [ -n "$input" ] && SECRET_KEY="$input"
    
    read -p "Main Rod ID [$MAIN_ROD_ID]: " input
    [ -n "$input" ] && MAIN_ROD_ID="$input"
    
    read -p "Secondary Rod Numbers (comma-separated, e.g., 1,2,3) [$SECONDARY_ROD_ID]: " input
    if [ -n "$input" ]; then
        IFS=',' read -ra SECONDARY_ROD_IDS <<< "$input"
        # Trim whitespace and convert to array
        temp_array=()
        for rod in "${SECONDARY_ROD_IDS[@]}"; do
            rod=$(echo "$rod" | xargs)  # trim whitespace
            temp_array+=("$rod")
        done
        SECONDARY_ROD_IDS=("${temp_array[@]}")
    else
        SECONDARY_ROD_IDS=("$SECONDARY_ROD_ID")
    fi
    
    echo
    echo "Enter sensor readings (press Enter for random values):"
    
    read -p "Temperature (°C) [random 20-30]: " input
    if [ -n "$input" ]; then
        TEMPERATURE="$input"
    else
        TEMPERATURE=$(echo "scale=1; $RANDOM % 100 / 10 + 20" | bc)
    fi
    
    read -p "Moisture (%) [random 40-70]: " input
    if [ -n "$input" ]; then
        MOISTURE="$input"
    else
        MOISTURE=$(echo "scale=1; $RANDOM % 300 / 10 + 40" | bc)
    fi
    
    read -p "pH [random 6.0-7.5]: " input
    if [ -n "$input" ]; then
        PH="$input"
    else
        PH=$(echo "scale=1; $RANDOM % 15 / 10 + 6" | bc)
    fi
    
    read -p "Conductivity (mS/cm) [random 0.8-2.0]: " input
    if [ -n "$input" ]; then
        CONDUCTIVITY="$input"
    else
        CONDUCTIVITY=$(echo "scale=1; $RANDOM % 12 / 10 + 0.8" | bc)
    fi
    
    read -p "Nitrogen (ppm) [random 10-25]: " input
    if [ -n "$input" ]; then
        NITROGEN="$input"
    else
        NITROGEN=$(echo "scale=1; $RANDOM % 150 / 10 + 10" | bc)
    fi
    
    read -p "Phosphorus (ppm) [random 5-15]: " input
    if [ -n "$input" ]; then
        PHOSPHORUS="$input"
    else
        PHOSPHORUS=$(echo "scale=1; $RANDOM % 100 / 10 + 5" | bc)
    fi
    
    read -p "Potassium (ppm) [random 15-30]: " input
    if [ -n "$input" ]; then
        POTASSIUM="$input"
    else
        POTASSIUM=$(echo "scale=1; $RANDOM % 150 / 10 + 15" | bc)
    fi
}

send_sensor_data() {
    # Generate timestamp
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Handle multiple secondary rods or single rod
    local target_rods=()
    if [ ${#SECONDARY_ROD_IDS[@]} -gt 0 ]; then
        target_rods=("${SECONDARY_ROD_IDS[@]}")
    else
        target_rods=("$SECONDARY_ROD_ID")
    fi
    
    # Build readings array for all secondary rods
    local readings_array=""
    local rod_count=0
    
    for secondary_rod_id in "${target_rods[@]}"; do
        if [ $rod_count -gt 0 ]; then
            readings_array="$readings_array,"
        fi
        
        readings_array="$readings_array
        {
            \"rod_id\": $secondary_rod_id,
            \"secret\": \"$SECRET_KEY\",
            \"timestamp\": \"$timestamp\",
            \"temperature\": $TEMPERATURE,
            \"moisture\": $MOISTURE,
            \"ph\": $PH,
            \"conductivity\": $CONDUCTIVITY,
            \"nitrogen\": $NITROGEN,
            \"phosphorus\": $PHOSPHORUS,
            \"potassium\": $POTASSIUM
        }"
        
        ((rod_count++))
    done
    
    # Build JSON payload
    local json_payload=$(cat <<EOF
{
    "secret": "$SECRET_KEY",
    "readings": [$readings_array
    ]
}
EOF
)
    
    local api_endpoint="$API_URL/api/rod/$MAIN_ROD_ID"
    
    print_colored "info" "Sending data to Main Rod: $MAIN_ROD_ID"
    print_colored "info" "Targeting Secondary Rods: $(IFS=', '; echo "${target_rods[*]}")"
    echo
    echo -e "${YELLOW}Payload:${NC}"
    echo "$json_payload"
    echo
    
    # Test API health first
    print_colored "info" "Testing API health..."
    local health_response=$(curl -s -X GET "$API_URL/api/health" 2>/dev/null)
    
    if [[ "$health_response" == *"OK"* ]] || [[ "$health_response" == *"success"* ]]; then
        print_colored "success" "API is responding"
    else
        print_colored "warning" "API health check returned: $health_response"
    fi
    
    # Send sensor data
    print_colored "info" "Sending sensor data..."
    local response=$(curl -s -X POST "$api_endpoint" \
        -H "Content-Type: application/json" \
        -d "$json_payload" 2>/dev/null)
    
    if [[ "$response" == *"Data received successfully"* ]] || [[ "$response" == *"success"* ]]; then
        print_colored "success" "Data sent successfully!"
        echo
        echo -e "${GREEN}API Response:${NC}"
        echo "$response"
    else
        print_colored "error" "Failed to send data"
        echo
        echo -e "${RED}API Response:${NC}"
        echo "$response"
        return 1
    fi
    
    return 0
}

# ================================================================
# ARGUMENT PARSING
# ================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -m|--main-rod)
            MAIN_ROD_ID="$2"
            shift 2
            ;;
        -s|--secondary-rod)
            SECONDARY_ROD_ID="$2"
            SECONDARY_ROD_IDS=("$2")
            shift 2
            ;;
        -S|--secondary-rods)
            IFS=',' read -ra SECONDARY_ROD_IDS <<< "$2"
            # Trim whitespace from each element
            temp_array=()
            for rod in "${SECONDARY_ROD_IDS[@]}"; do
                rod=$(echo "$rod" | xargs)  # trim whitespace
                temp_array+=("$rod")
            done
            SECONDARY_ROD_IDS=("${temp_array[@]}")
            shift 2
            ;;
        -B|--batch-mode)
            BATCH_MODE=true
            shift
            ;;
        -t|--temperature)
            TEMPERATURE="$2"
            shift 2
            ;;
        -w|--moisture)
            MOISTURE="$2"
            shift 2
            ;;
        -p|--ph)
            PH="$2"
            shift 2
            ;;
        -d|--conductivity)
            CONDUCTIVITY="$2"
            shift 2
            ;;
        -n|--nitrogen)
            NITROGEN="$2"
            shift 2
            ;;
        -f|--phosphorus)
            PHOSPHORUS="$2"
            shift 2
            ;;
        -k|--potassium)
            POTASSIUM="$2"
            shift 2
            ;;
        -u|--url)
            API_URL="$2"
            shift 2
            ;;
        -r|--secret)
            SECRET_KEY="$2"
            shift 2
            ;;
        -i|--interactive)
            INTERACTIVE_MODE=true
            shift
            ;;
        -h|--help)
            SHOW_HELP=true
            shift
            ;;
        *)
            echo "Unknown parameter: $1"
            show_help
            exit 1
            ;;
    esac
done

# ================================================================
# MAIN SCRIPT EXECUTION
# ================================================================

# Show help if requested
if [ "$SHOW_HELP" = true ]; then
    show_help
    exit 0
fi

echo
print_colored "header" "AEAMS Data Push Tool - Enhanced Shell Script Version"
echo "================================================================"
echo

# Check dependencies
check_dependencies

# Load configuration file if specified
if [ -n "$CONFIG_FILE" ]; then
    if ! load_config_file "$CONFIG_FILE"; then
        print_colored "error" "Failed to load configuration. Using defaults."
    fi
fi

# Interactive mode
if [ "$INTERACTIVE_MODE" = true ]; then
    get_interactive_input
fi

# Display current configuration
print_colored "highlight" "Current Rod Targeting Configuration:"
echo "API URL:          $API_URL"
echo "Main Rod ID:      $MAIN_ROD_ID"
echo "Secondary Rods:   $(IFS=', '; echo "${SECONDARY_ROD_IDS[*]}")"
echo "Rod Count:        ${#SECONDARY_ROD_IDS[@]}"
echo
echo -e "${YELLOW}Sensor Data:${NC}"
echo "  Temperature:    ${TEMPERATURE}°C"
echo "  Moisture:       ${MOISTURE}%"
echo "  pH:             $PH"
echo "  Conductivity:   $CONDUCTIVITY mS/cm"
echo "  Nitrogen:       $NITROGEN ppm"
echo "  Phosphorus:     $PHOSPHORUS ppm"
echo "  Potassium:      $POTASSIUM ppm"
echo

# Validate sensor data
validate_sensor_data

# Confirm before sending (unless interactive mode)
if [ "$INTERACTIVE_MODE" != true ]; then
    echo
    read -p "Send this data to AEAMS API? (Y/n): " confirm
    confirm=${confirm:-Y}
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        print_colored "info" "Operation cancelled."
        exit 0
    fi
fi

# Send the data
echo
echo "================================================================"
echo "Sending Data to AEAMS API"
echo "================================================================"

if send_sensor_data; then
    echo
    print_colored "success" "Script execution completed successfully!"
else
    echo
    print_colored "error" "Script execution failed!"
    exit 1
fi

echo
