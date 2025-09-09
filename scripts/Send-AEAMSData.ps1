# ================================================================
# AEAMS Data Push Tool - Enhanced PowerShell Version
# Customizable sensor data submission with JSON configuration support
# ================================================================

param(
    [string]$ConfigFile = "",
    [string]$MainRodId = "",
    [int]$SecondaryRodId = 1,
    [int[]]$SecondaryRodIds = @(),
    [double]$Temperature = $null,
    [double]$Moisture = $null,
    [double]$Ph = $null,
    [double]$Conductivity = $null,
    [double]$Nitrogen = $null,
    [double]$Phosphorus = $null,
    [double]$Potassium = $null,
    [string]$ApiUrl = "",
    [string]$Secret = "",
    [switch]$Interactive,
    [switch]$BatchMode,
    [switch]$Help
)

# Colors for console output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Header = "Blue"
    Highlight = "Magenta"
}

function Write-ColoredOutput {
    param([string]$Type, [string]$Message)
    $Color = $Colors[$Type]
    
    # Detect if running from batch file and use simpler symbols
    $isBatchMode = $env:COMSPEC -and ($Host.Name -eq "ConsoleHost")
    
    if ($isBatchMode) {
        switch ($Type) {
            "Success" { Write-Host "[OK] $Message" -ForegroundColor $Color }
            "Error" { Write-Host "[ERROR] $Message" -ForegroundColor $Color }
            "Warning" { Write-Host "[WARN] $Message" -ForegroundColor $Color }
            "Info" { Write-Host "[INFO] $Message" -ForegroundColor $Color }
            "Header" { Write-Host "[AEAMS] $Message" -ForegroundColor $Color }
            "Highlight" { Write-Host "[CONFIG] $Message" -ForegroundColor $Color }
        }
    } else {
        switch ($Type) {
            "Success" { Write-Host "[OK] $Message" -ForegroundColor $Color }
            "Error" { Write-Host "[ERROR] $Message" -ForegroundColor $Color }
            "Warning" { Write-Host "[WARN] $Message" -ForegroundColor $Color }
            "Info" { Write-Host "[INFO] $Message" -ForegroundColor $Color }
            "Header" { Write-Host "[AEAMS] $Message" -ForegroundColor $Color }
            "Highlight" { Write-Host "[CONFIG] $Message" -ForegroundColor $Color }
        }
    }
}

function Show-Help {
    Write-Host ""
    Write-ColoredOutput "Header" "AEAMS Data Push Tool - Enhanced PowerShell Version"
    Write-Host "================================================================" -ForegroundColor Blue
    Write-Host ""
    Write-Host "USAGE EXAMPLES:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Use a configuration file:" -ForegroundColor White
    Write-Host "   .\Send-AEAMSData.ps1 -ConfigFile 'examples\greenhouse-config.json'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Interactive mode:" -ForegroundColor White
    Write-Host "   .\Send-AEAMSData.ps1 -Interactive" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Target specific rod numbers:" -ForegroundColor White
    Write-Host "   .\Send-AEAMSData.ps1 -MainRodId 'justintul' -SecondaryRodId 1 -Temperature 25.4" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Target multiple rod numbers (batch mode):" -ForegroundColor White
    Write-Host "   .\Send-AEAMSData.ps1 -MainRodId 'justintul' -SecondaryRodIds @(1,2,3) -BatchMode" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Send NPK values to specific rods:" -ForegroundColor White
    Write-Host "   .\Send-AEAMSData.ps1 -SecondaryRodId 2 -Nitrogen 25.0 -Phosphorus 10.0 -Potassium 15.0" -ForegroundColor Gray
    Write-Host ""
    Write-Host "PARAMETERS:" -ForegroundColor Yellow
    Write-Host "  -ConfigFile      Path to JSON configuration file" -ForegroundColor White
    Write-Host "  -MainRodId       Main rod identifier (farm controller)" -ForegroundColor White
    Write-Host "  -SecondaryRodId  Secondary rod number (1, 2, 3, etc.)" -ForegroundColor White
    Write-Host "  -SecondaryRodIds Array of secondary rod numbers for batch mode" -ForegroundColor White
    Write-Host "  -Temperature     Temperature in Celsius" -ForegroundColor White
    Write-Host "  -Moisture        Moisture percentage (0-100)" -ForegroundColor White
    Write-Host "  -Ph              pH level (0-14)" -ForegroundColor White
    Write-Host "  -Conductivity    Electrical conductivity (mS/cm)" -ForegroundColor White
    Write-Host "  -Nitrogen        Nitrogen content (ppm)" -ForegroundColor White
    Write-Host "  -Phosphorus      Phosphorus content (ppm)" -ForegroundColor White
    Write-Host "  -Potassium       Potassium content (ppm)" -ForegroundColor White
    Write-Host "  -ApiUrl          API base URL" -ForegroundColor White
    Write-Host "  -Secret          API secret key" -ForegroundColor White
    Write-Host "  -Interactive     Run in interactive mode" -ForegroundColor White
    Write-Host "  -BatchMode       Send data to multiple secondary rods" -ForegroundColor White
    Write-Host "  -Help            Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "CONFIGURATION FILE FORMAT:" -ForegroundColor Yellow
    Write-Host "  See examples folder for sample JSON configuration files:" -ForegroundColor White
    Write-Host "  - greenhouse-config.json (greenhouse setup)" -ForegroundColor Gray
    Write-Host "  - field-config.json (outdoor field setup)" -ForegroundColor Gray
    Write-Host "  - hydroponic-config.json (hydroponic system)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ABOUT THE SECRET KEY:" -ForegroundColor Yellow
    Write-Host "  The secret key authenticates your sensor data with the AEAMS API." -ForegroundColor White
    Write-Host "  Default: AEAMS_SECRET_zhmaj9w00ag (stored in the database)" -ForegroundColor Gray
    Write-Host "  - You can change it using the /api/setup-rod-secret endpoint" -ForegroundColor Gray  
    Write-Host "  - It prevents unauthorized sensors from sending fake data" -ForegroundColor Gray
    Write-Host "  - All rod readings must include this secret to be accepted" -ForegroundColor Gray
    Write-Host ""
    Write-Host "NPK NUTRIENT GUIDE:" -ForegroundColor Yellow
    Write-Host "  Nitrogen (N):   Leaf/stem growth | Vegetative: 20-30 ppm | Flowering: 10-20 ppm" -ForegroundColor White
    Write-Host "  Phosphorus (P): Root/flower dev | Vegetative: 5-15 ppm  | Flowering: 20-40 ppm" -ForegroundColor White  
    Write-Host "  Potassium (K):  Disease resist   | Vegetative: 10-20 ppm | Fruiting: 30-50 ppm" -ForegroundColor White
    Write-Host ""
}

function Read-Configuration {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-ColoredOutput "Error" "Configuration file not found: $FilePath"
        return $null
    }
    
    try {
        $ConfigContent = Get-Content $FilePath -Raw | ConvertFrom-Json
        Write-ColoredOutput "Success" "Configuration loaded from: $FilePath"
        return $ConfigContent
    }
    catch {
        Write-ColoredOutput "Error" "Failed to parse configuration file: $($_.Exception.Message)"
        return $null
    }
}

function Test-SensorData {
    param($Data)
    
    $ValidationRules = @{
        Temperature = @{ Min = -50; Max = 1000; Unit = "°C" }
        Moisture = @{ Min = 0; Max = 1000; Unit = "%" }
        Ph = @{ Min = 0; Max = 14; Unit = "" }
        Conductivity = @{ Min = 0; Max = 1000; Unit = "mS/cm" }
        Nitrogen = @{ Min = 0; Max = 1000; Unit = "ppm" }
        Phosphorus = @{ Min = 0; Max = 1000; Unit = "ppm" }
        Potassium = @{ Min = 0; Max = 1000; Unit = "ppm" }
    }
    
    $HasWarnings = $false
    
    foreach ($Property in $ValidationRules.Keys) {
        $Value = $Data.$Property
        $Rule = $ValidationRules[$Property]
        
        if ($Value -lt $Rule.Min -or $Value -gt $Rule.Max) {
            Write-ColoredOutput "Warning" "$Property ($Value$($Rule.Unit)) is outside typical range ($($Rule.Min)-$($Rule.Max)$($Rule.Unit))"
            $HasWarnings = $true
        }
    }
    
    if (-not $HasWarnings) {
        Write-ColoredOutput "Success" "All sensor values are within normal ranges"
    }
    
    return -not $HasWarnings
}

function Get-InteractiveInput {
    Write-Host ""
    Write-ColoredOutput "Header" "Interactive Configuration Mode"
    Write-Host "================================================================" -ForegroundColor Blue
    Write-Host ""
    
    # Rod Configuration
    Write-ColoredOutput "Highlight" "Rod Configuration"
    $MainRod = Read-Host "Main Rod ID (farm controller) [justintul]"
    if (-not $MainRod) { $MainRod = "justintul" }
    
    # Secondary Rod Selection with multiple options
    Write-Host ""
    Write-ColoredOutput "Info" "Secondary Rod Selection Options:"
    Write-Host "  1. Single rod (e.g., 1, 2, 3, etc.)"
    Write-Host "  2. Multiple rods (e.g., 1,2,3)"
    Write-Host "  3. Range of rods (e.g., 1-5)"
    Write-Host ""
    
    $SecondaryRodInput = Read-Host "Enter secondary rod(s) [1]"
    if (-not $SecondaryRodInput) { $SecondaryRodInput = "1" }
    
    # Parse secondary rod input
    $SecondaryRods = @()
    if ($SecondaryRodInput -match "(\d+)-(\d+)") {
        # Range input (e.g., 1-5)
        $start = [int]$matches[1]
        $end = [int]$matches[2]
        for ($i = $start; $i -le $end; $i++) {
            $SecondaryRods += $i
        }
        Write-ColoredOutput "Info" "Parsed range: $($SecondaryRods -join ', ')"
    } elseif ($SecondaryRodInput -contains ",") {
        # Comma-separated input (e.g., 1,2,3)
        $SecondaryRods = $SecondaryRodInput -split "," | ForEach-Object { [int]$_.Trim() }
        Write-ColoredOutput "Info" "Parsed multiple rods: $($SecondaryRods -join ', ')"
    } else {
        # Single rod input
        $SecondaryRods = @([int]$SecondaryRodInput)
        Write-ColoredOutput "Info" "Parsed single rod: $SecondaryRods"
    }
    
    # API Configuration
    Write-Host ""
    Write-ColoredOutput "Highlight" "API Configuration"
    $ApiUrl = Read-Host "API URL [https://aeams-test-production.up.railway.app]"
    if (-not $ApiUrl) { $ApiUrl = "https://aeams-test-production.up.railway.app" }
    
    $Secret = Read-Host "API Secret [AEAMS_SECRET_zhmaj9w00ag]"
    if (-not $Secret) { $Secret = "AEAMS_SECRET_zhmaj9w00ag" }
    
    # Sensor Data Configuration
    Write-Host ""
    Write-ColoredOutput "Highlight" "Environmental Sensor Data"
    
    $Temperature = Read-Host "Temperature (°C) [23.5]"
    if (-not $Temperature) { $Temperature = 23.5 } else { $Temperature = [double]$Temperature }
    
    $Moisture = Read-Host "Moisture (%) [45.2]"
    if (-not $Moisture) { $Moisture = 45.2 } else { $Moisture = [double]$Moisture }
    
    $Ph = Read-Host "pH Level (0-14) [6.8]"
    if (-not $Ph) { $Ph = 6.8 } else { $Ph = [double]$Ph }
    
    $Conductivity = Read-Host "Electrical Conductivity (mS/cm) [1.2]"
    if (-not $Conductivity) { $Conductivity = 1.2 } else { $Conductivity = [double]$Conductivity }
    
    # NPK Values (Nitrogen, Phosphorus, Potassium)
    Write-Host ""
    Write-ColoredOutput "Highlight" "NPK Nutrient Levels (Essential Plant Nutrients)"
    Write-Host "  Nitrogen (N):   Promotes leaf and stem growth"
    Write-Host "  Phosphorus (P): Essential for root development and flowering"
    Write-Host "  Potassium (K):  Improves disease resistance and water regulation"
    Write-Host ""
    
    $Nitrogen = Read-Host "Nitrogen (N) - ppm [12.5]"
    if (-not $Nitrogen) { $Nitrogen = 12.5 } else { $Nitrogen = [double]$Nitrogen }
    
    $Phosphorus = Read-Host "Phosphorus (P) - ppm [8.3]"
    if (-not $Phosphorus) { $Phosphorus = 8.3 } else { $Phosphorus = [double]$Phosphorus }
    
    $Potassium = Read-Host "Potassium (K) - ppm [15.7]"
    if (-not $Potassium) { $Potassium = 15.7 } else { $Potassium = [double]$Potassium }
    
    # Quick NPK presets
    Write-Host ""
    Write-ColoredOutput "Info" "Quick NPK Presets Available:"
    Write-Host "  Would you like to use a preset instead? (y/N): " -NoNewline
    $usePreset = Read-Host
    
    if ($usePreset -eq "y" -or $usePreset -eq "Y") {
        Write-Host ""
        Write-Host "Available Presets:"
        Write-Host "  1. Vegetative Growth (High N): N=25, P=10, K=15"
        Write-Host "  2. Flowering Stage (High P): N=15, P=30, K=25"
        Write-Host "  3. Fruiting Stage (High K): N=10, P=15, K=35"
        Write-Host "  4. Balanced Growth: N=20, P=20, K=20"
        Write-Host "  5. Hydroponic Mix: N=150, P=50, K=200"
        Write-Host ""
        
        $preset = Read-Host "Select preset (1-5) [keep current values]"
        
        switch ($preset) {
            "1" { $Nitrogen = 25; $Phosphorus = 10; $Potassium = 15; Write-ColoredOutput "Success" "Applied Vegetative Growth preset" }
            "2" { $Nitrogen = 15; $Phosphorus = 30; $Potassium = 25; Write-ColoredOutput "Success" "Applied Flowering Stage preset" }
            "3" { $Nitrogen = 10; $Phosphorus = 15; $Potassium = 35; Write-ColoredOutput "Success" "Applied Fruiting Stage preset" }
            "4" { $Nitrogen = 20; $Phosphorus = 20; $Potassium = 20; Write-ColoredOutput "Success" "Applied Balanced Growth preset" }
            "5" { $Nitrogen = 150; $Phosphorus = 50; $Potassium = 200; Write-ColoredOutput "Success" "Applied Hydroponic Mix preset" }
            default { Write-ColoredOutput "Info" "Keeping manually entered values" }
        }
    }
    
    return @{
        api = @{
            url = $ApiUrl
            secret = $Secret
        }
        farm = @{
            main_rod_id = $MainRod
            secondary_rod_id = $SecondaryRods[0]
            secondary_rod_ids = $SecondaryRods
        }
        sensor_data = @{
            temperature = $Temperature
            moisture = $Moisture
            ph = $Ph
            conductivity = $Conductivity
            nitrogen = $Nitrogen
            phosphorus = $Phosphorus
            potassium = $Potassium
        }
    }
}

function Send-SensorData {
    param($Config)
    
    # Handle multiple secondary rods or single rod
    $SecondaryRods = @()
    if ($Config.farm.secondary_rod_ids -and $Config.farm.secondary_rod_ids.Count -gt 0) {
        $SecondaryRods = $Config.farm.secondary_rod_ids
    } elseif ($Config.farm.secondary_rod_id) {
        $SecondaryRods = @($Config.farm.secondary_rod_id)
    } else {
        $SecondaryRods = @(1)  # Default to rod 1
    }
    
    # Generate timestamp
    $Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    # Build readings array for all secondary rods
    $Readings = @()
    foreach ($RodId in $SecondaryRods) {
        $Readings += @{
            rod_id = [int]$RodId
            secret = $Config.api.secret
            timestamp = $Timestamp
            temperature = $Config.sensor_data.temperature
            moisture = $Config.sensor_data.moisture
            ph = $Config.sensor_data.ph
            conductivity = $Config.sensor_data.conductivity
            nitrogen = $Config.sensor_data.nitrogen
            phosphorus = $Config.sensor_data.phosphorus
            potassium = $Config.sensor_data.potassium
        }
    }
    
    # Build JSON payload
    $Payload = @{
        secret = $Config.api.secret
        readings = $Readings
    } | ConvertTo-Json -Depth 3
    
    $ApiEndpoint = "$($Config.api.url)/api/rod/$($Config.farm.main_rod_id)"
    
    Write-ColoredOutput "Info" "Sending data to: $ApiEndpoint"
    Write-Host ""
    Write-Host "Payload:" -ForegroundColor Yellow
    Write-Host $Payload -ForegroundColor Gray
    Write-Host ""
    
    try {
        # Test API health first
        Write-ColoredOutput "Info" "Testing API health..."
        try {
            Invoke-RestMethod -Uri "$($Config.api.url)/api/health" -Method GET -ErrorAction Stop | Out-Null
            Write-ColoredOutput "Success" "API is responding"
        } catch {
            Write-ColoredOutput "Warning" "API health check failed: $($_.Exception.Message)"
        }
        
        # Send sensor data
        Write-ColoredOutput "Info" "Sending sensor data..."
        $Response = Invoke-RestMethod -Uri $ApiEndpoint -Method POST -Body $Payload -ContentType "application/json" -ErrorAction Stop
        
        Write-ColoredOutput "Success" "Data sent successfully!"
        Write-Host ""
        Write-Host "API Response:" -ForegroundColor Green
        Write-Host ($Response | ConvertTo-Json) -ForegroundColor White
        
    }
    catch {
        Write-ColoredOutput "Error" "Network error: $($_.Exception.Message)"
        if ($_.ErrorDetails.Message) {
            Write-Host ""
            Write-Host "Error Details:" -ForegroundColor Red
            Write-Host $_.ErrorDetails.Message -ForegroundColor White
        }
    }
}

# ================================================================
# MAIN SCRIPT EXECUTION
# ================================================================

# Show help if requested
if ($Help) {
    Show-Help
    return
}

Write-Host ""
Write-ColoredOutput "Header" "AEAMS Data Push Tool - Enhanced PowerShell Version"
Write-Host "================================================================" -ForegroundColor Blue
Write-Host ""

# Initialize configuration
$Config = @{
    api = @{
        url = "https://aeams-test-production.up.railway.app"
        secret = "AEAMS_SECRET_zhmaj9w00ag"
    }
    farm = @{
        main_rod_id = "justintul"
        secondary_rod_id = 1
        secondary_rod_ids = @(1)
    }
    sensor_data = @{
        temperature = 23.5
        moisture = 45.2
        ph = 6.8
        conductivity = 1.2
        nitrogen = 12.5
        phosphorus = 8.3
        potassium = 15.7
    }
}

# Load configuration file if specified
if ($ConfigFile) {
    $LoadedConfig = Read-Configuration $ConfigFile
    if ($LoadedConfig) {
        $Config = $LoadedConfig
    } else {
        Write-ColoredOutput "Error" "Failed to load configuration. Using defaults."
    }
}

# Interactive mode
if ($Interactive) {
    $Config = Get-InteractiveInput
}

# Override with command line parameters
if ($ApiUrl) { $Config.api.url = $ApiUrl }
if ($Secret) { $Config.api.secret = $Secret }
if ($MainRodId) { $Config.farm.main_rod_id = $MainRodId }

# Override sensor data with command line parameters
if ($Temperature -ne $null) { $Config.sensor_data.temperature = $Temperature }
if ($Moisture -ne $null) { $Config.sensor_data.moisture = $Moisture }
if ($Ph -ne $null) { $Config.sensor_data.ph = $Ph }
if ($Conductivity -ne $null) { $Config.sensor_data.conductivity = $Conductivity }
if ($Nitrogen -ne $null) { $Config.sensor_data.nitrogen = $Nitrogen }
if ($Phosphorus -ne $null) { $Config.sensor_data.phosphorus = $Phosphorus }
if ($Potassium -ne $null) { $Config.sensor_data.potassium = $Potassium }

# Handle secondary rod targeting
if ($SecondaryRodIds -and $SecondaryRodIds.Count -gt 0) {
    $Config.farm.secondary_rod_ids = $SecondaryRodIds
    Write-ColoredOutput "Info" "Targeting multiple secondary rods: $($SecondaryRodIds -join ', ')"
} elseif ($SecondaryRodId -gt 0) {
    $Config.farm.secondary_rod_id = $SecondaryRodId
    $Config.farm.secondary_rod_ids = @($SecondaryRodId)
    Write-ColoredOutput "Info" "Targeting single secondary rod: $SecondaryRodId"
}

# Display current configuration
Write-ColoredOutput "Highlight" "Current Rod Targeting Configuration:"
Write-Host "API URL:          $($Config.api.url)" -ForegroundColor White
Write-Host "Main Rod ID:      $($Config.farm.main_rod_id)" -ForegroundColor White
Write-Host "Secondary Rods:   $($Config.farm.secondary_rod_ids -join ', ')" -ForegroundColor White
Write-Host "Rod Count:        $($Config.farm.secondary_rod_ids.Count)" -ForegroundColor White
Write-Host ""
Write-Host "Sensor Data:" -ForegroundColor Yellow
Write-Host "  Temperature:    $($Config.sensor_data.temperature)°C" -ForegroundColor White
Write-Host "  Moisture:       $($Config.sensor_data.moisture)%" -ForegroundColor White
Write-Host "  pH:             $($Config.sensor_data.ph)" -ForegroundColor White
Write-Host "  Conductivity:   $($Config.sensor_data.conductivity) mS/cm" -ForegroundColor White
Write-Host "  Nitrogen:       $($Config.sensor_data.nitrogen) ppm" -ForegroundColor White
Write-Host "  Phosphorus:     $($Config.sensor_data.phosphorus) ppm" -ForegroundColor White
Write-Host "  Potassium:      $($Config.sensor_data.potassium) ppm" -ForegroundColor White
Write-Host ""

# Validate sensor data
Test-SensorData $Config.sensor_data

# Confirm before sending
if (-not $Interactive) {
    $Confirm = Read-Host "Send this data to AEAMS API? (Y/N) [Y]"
    if ($Confirm -and $Confirm.ToLower() -ne "y" -and $Confirm.ToLower() -ne "yes") {
        Write-ColoredOutput "Info" "Operation cancelled."
        return
    }
}

# Send the data
Send-SensorData $Config

Write-Host ""
Write-ColoredOutput "Success" "Script execution completed!"
Write-Host ""
