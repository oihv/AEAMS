#!/bin/bash

# ================================================================
# AEAMS Data Push Tool - Enhanced Shell Script Version
# Comprehensive parameter support for all sensor and rod options
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
    echo -e "${NC}1. Interactive mode:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -i${NC}"
    echo
    echo -e "${NC}2. Single rod with all sensor parameters:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -s 2 -t 25.0 -w 60.0 -p 6.8 -d 1.5 -n 20.0 -f 10.0 -k 15.0${NC}"
    echo
    echo -e "${NC}3. Multiple rods (batch mode):${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -S 1,2,3 -B -t 24.0 -w 55.0${NC}"
    echo
    echo -e "${NC}4. Custom main rod and API settings:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -m greenhouse_01 -s 1 -u https://your-api.com -r your_secret${NC}"
    echo
    echo -e "${NC}5. Use configuration file:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -c examples/greenhouse-config.json${NC}"
    echo
    echo -e "${NC}6. NPK vegetative growth preset:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -s 1 -n 25 -f 10 -k 15 -t 26.0${NC}"
    echo
    echo -e "${NC}7. Range of rods:${NC}"
    echo -e "   ${GREEN}./send-aeams-data.sh -S 1-5 -B -t 23.0${NC}"
    echo
    echo -e "${YELLOW}PARAMETERS:${NC}"
    echo -e "  ${NC}-c, --config FILE       Path to JSON configuration file${NC}"
    echo -e "  ${NC}-m, --main-rod ID       Main rod identifier (farm controller)${NC}"
    echo -e "  ${NC}-s, --secondary-rod NUM Single secondary rod number (1, 2, 3, etc.)${NC}"
    echo -e "  ${NC}-S, --secondary-rods    Comma-separated or range (1,2,3 or 1-5)${NC}"
    echo -e "  ${NC}-t, --temperature VAL   Temperature in Celsius${NC}"
    echo -e "  ${NC}-w, --moisture VAL      Moisture percentage (0-100)${NC}"
    echo -e "  ${NC}-p, --ph VAL           pH level (0-14)${NC}"
    echo -e "  ${NC}-d, --conductivity VAL  Electrical conductivity (mS/cm)${NC}"
    echo -e "  ${NC}-n, --nitrogen VAL      Nitrogen content (ppm)${NC}"
    echo -e "  ${NC}-f, --phosphorus VAL    Phosphorus content (ppm)${NC}"
    echo -e "  ${NC}-k, --potassium VAL     Potassium content (ppm)${NC}"
    echo -e "  ${NC}-u, --url URL          API base URL${NC}"
    echo -e "  ${NC}-r, --secret KEY       API secret key${NC}"
    echo -e "  ${NC}-i, --interactive      Run in interactive mode${NC}"
    echo -e "  ${NC}-B, --batch-mode       Send data to multiple secondary rods${NC}"
    echo -e "  ${NC}-h, --help            Show this help message${NC}"
    echo
    echo -e "${YELLOW}NPK NUTRIENT GUIDE:${NC}"
    echo -e "  ${NC}Nitrogen (N):   Leaf/stem growth - Vegetative: 20-30 ppm, Flowering: 10-20 ppm${NC}"
    echo -e "  ${NC}Phosphorus (P): Root/flower dev  - Vegetative: 5-15 ppm,  Flowering: 20-40 ppm${NC}"
    echo -e "  ${NC}Potassium (K):  Disease resist   - Vegetative: 10-20 ppm, Fruiting: 30-50 ppm${NC}"
    echo
    echo -e "${YELLOW}CONFIGURATION FILE FORMAT:${NC}"
    echo -e "  ${NC}See examples folder for sample JSON configuration files:${NC}"
    echo -e "  ${GREEN}- greenhouse-config.json (greenhouse setup)${NC}"
    echo -e "  ${GREEN}- field-config.json (outdoor field setup)${NC}"
    echo -e "  ${GREEN}- hydroponic-config.json (hydroponic system)${NC}"
    echo
    echo -e "${YELLOW}ABOUT THE SECRET KEY:${NC}"
    echo -e "  ${NC}The secret key authenticates your sensor data with the AEAMS API.${NC}"
    echo -e "  ${NC}Default: AEAMS_SECRET_zhmaj9w00ag (stored in the database)${NC}"
    echo -e "  ${NC}- You can change it using the /api/setup-rod-secret endpoint${NC}"
    echo -e "  ${NC}- It prevents unauthorized sensors from sending fake data${NC}"
    echo -e "  ${NC}- All rod readings must include this secret to be accepted${NC}"
    echo
}

get_interactive_input() {
    echo
    print_colored "header" "Interactive Configuration Mode"
    echo "================================================================"
    echo
    
    # Rod Configuration
    print_colored "highlight" "Rod Configuration"
    read -p "Main Rod ID (farm controller) [justintul]: " input_main_rod
    MAIN_ROD_ID=${input_main_rod:-justintul}
    
    echo
    print_colored "info" "Secondary Rod Selection Options:"
    echo "  1. Single rod (e.g., 1, 2, 3, etc.)"
    echo "  2. Multiple rods (e.g., 1,2,3)"
    echo "  3. Range of rods (e.g., 1-5)"
    echo
    
    read -p "Enter secondary rod(s) [1]: " input_secondary_rods
    input_secondary_rods=${input_secondary_rods:-1}
    
    # Parse secondary rod input
    if [[ "$input_secondary_rods" =~ ([0-9]+)-([0-9]+) ]]; then
        # Range input (e.g., 1-5)
        start=${BASH_REMATCH[1]}
        end=${BASH_REMATCH[2]}
        SECONDARY_ROD_IDS=()
        for ((i=start; i<=end; i++)); do
            SECONDARY_ROD_IDS+=($i)
        done
        BATCH_MODE=true
        print_colored "info" "Parsed range: ${SECONDARY_ROD_IDS[*]}"
    elif [[ "$input_secondary_rods" == *","* ]]; then
        # Comma-separated input (e.g., 1,2,3)
        IFS=',' read -ra SECONDARY_ROD_IDS <<< "$input_secondary_rods"
        # Trim whitespace from each element
        temp_array=()
        for rod in "${SECONDARY_ROD_IDS[@]}"; do
            rod=$(echo "$rod" | xargs)  # trim whitespace
            temp_array+=("$rod")
        done
        SECONDARY_ROD_IDS=("${temp_array[@]}")
        BATCH_MODE=true
        print_colored "info" "Parsed multiple rods: ${SECONDARY_ROD_IDS[*]}"
    else
        # Single rod input
        SECONDARY_ROD_ID="$input_secondary_rods"
        SECONDARY_ROD_IDS=("$input_secondary_rods")
        print_colored "info" "Parsed single rod: $SECONDARY_ROD_ID"
    fi
    
    # API Configuration
    echo
    print_colored "highlight" "API Configuration"
    read -p "API URL [https://aeams-test-production.up.railway.app]: " input_api_url
    API_URL=${input_api_url:-https://aeams-test-production.up.railway.app}
    
    read -p "API Secret [AEAMS_SECRET_zhmaj9w00ag]: " input_secret
    SECRET_KEY=${input_secret:-AEAMS_SECRET_zhmaj9w00ag}
    
    # Environmental Sensor Data
    echo
    print_colored "highlight" "Environmental Sensor Data"
    
    read -p "Temperature (°C) [23.5]: " input_temp
    TEMPERATURE=${input_temp:-23.5}
    
    read -p "Moisture (%) [45.2]: " input_moisture
    MOISTURE=${input_moisture:-45.2}
    
    read -p "pH Level (0-14) [6.8]: " input_ph
    PH=${input_ph:-6.8}
    
    read -p "Electrical Conductivity (mS/cm) [1.2]: " input_conductivity
    CONDUCTIVITY=${input_conductivity:-1.2}
    
    # NPK Values
    echo
    print_colored "highlight" "NPK Nutrient Levels (Essential Plant Nutrients)"
    echo "  Nitrogen (N):   Promotes leaf and stem growth"
    echo "  Phosphorus (P): Essential for root development and flowering"
    echo "  Potassium (K):  Improves disease resistance and water regulation"
    echo
    
    read -p "Nitrogen (N) - ppm [12.5]: " input_nitrogen
    NITROGEN=${input_nitrogen:-12.5}
    
    read -p "Phosphorus (P) - ppm [8.3]: " input_phosphorus
    PHOSPHORUS=${input_phosphorus:-8.3}
    
    read -p "Potassium (K) - ppm [15.7]: " input_potassium
    POTASSIUM=${input_potassium:-15.7}
    
    # Quick NPK presets
    echo
    print_colored "info" "Quick NPK Presets Available:"
    read -p "Would you like to use a preset instead? (y/N): " use_preset
    
    if [[ "$use_preset" == "y" ]] || [[ "$use_preset" == "Y" ]]; then
        echo
        echo "Available Presets:"
        echo "  1. Vegetative Growth (High N): N=25, P=10, K=15"
        echo "  2. Flowering Stage (High P): N=15, P=30, K=25"
        echo "  3. Fruiting Stage (High K): N=10, P=15, K=35"
        echo "  4. Balanced Growth: N=20, P=20, K=20"
        echo "  5. Hydroponic Mix: N=150, P=50, K=200"
        echo
        
        read -p "Select preset (1-5) [keep current values]: " preset
        
        case $preset in
            1) NITROGEN=25; PHOSPHORUS=10; POTASSIUM=15; print_colored "success" "Applied Vegetative Growth preset" ;;
            2) NITROGEN=15; PHOSPHORUS=30; POTASSIUM=25; print_colored "success" "Applied Flowering Stage preset" ;;
            3) NITROGEN=10; PHOSPHORUS=15; POTASSIUM=35; print_colored "success" "Applied Fruiting Stage preset" ;;
            4) NITROGEN=20; PHOSPHORUS=20; POTASSIUM=20; print_colored "success" "Applied Balanced Growth preset" ;;
            5) NITROGEN=150; PHOSPHORUS=50; POTASSIUM=200; print_colored "success" "Applied Hydroponic Mix preset" ;;
            *) print_colored "info" "Keeping manually entered values" ;;
        esac
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
            input_rods="$2"
            if [[ "$input_rods" =~ ([0-9]+)-([0-9]+) ]]; then
                # Range input (e.g., 1-5)
                start=${BASH_REMATCH[1]}
                end=${BASH_REMATCH[2]}
                SECONDARY_ROD_IDS=()
                for ((i=start; i<=end; i++)); do
                    SECONDARY_ROD_IDS+=($i)
                done
                BATCH_MODE=true
            else
                # Comma-separated input (e.g., 1,2,3)
                IFS=',' read -ra SECONDARY_ROD_IDS <<< "$input_rods"
                # Trim whitespace from each element
                temp_array=()
                for rod in "${SECONDARY_ROD_IDS[@]}"; do
                    rod=$(echo "$rod" | xargs)  # trim whitespace
                    temp_array+=("$rod")
                done
                SECONDARY_ROD_IDS=("${temp_array[@]}")
            fi
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

# Run interactive mode if requested
if [ "$INTERACTIVE_MODE" = true ]; then
    get_interactive_input
fi

echo
print_colored "header" "AEAMS Data Push Tool - Enhanced Shell Script Version"
echo "================================================================"
echo

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

# Confirm before sending
echo
read -p "Send this data to AEAMS API? (Y/n): " confirm
confirm=${confirm:-Y}
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    print_colored "info" "Operation cancelled."
    exit 0
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