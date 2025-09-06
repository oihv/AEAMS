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
    switch ($Type) {
        "Success" { Write-Host "✅ $Message" -ForegroundColor $Color }
        "Error" { Write-Host "❌ $Message" -ForegroundColor $Color }
        "Warning" { Write-Host "⚠️  $Message" -ForegroundColor $Color }
        "Info" { Write-Host "🔍 $Message" -ForegroundColor $Color }
        "Header" { Write-Host "🌱 $Message" -ForegroundColor $Color }
        "Highlight" { Write-Host "📋 $Message" -ForegroundColor $Color }
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
    Write-Host "   .\Send-AEAMSData.ps1 -MainRodId 'farm_01' -SecondaryRodId 1 -Temperature 25.4" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Target multiple rod numbers (batch mode):" -ForegroundColor White
    Write-Host "   .\Send-AEAMSData.ps1 -MainRodId 'farm_01' -SecondaryRodIds @(1,2,3) -BatchMode" -ForegroundColor Gray
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
}

function Load-Configuration {
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

function Validate-SensorData {
    param($Data)
    
    $ValidationRules = @{
        Temperature = @{ Min = -50; Max = 100; Unit = "°C" }
        Moisture = @{ Min = 0; Max = 100; Unit = "%" }
        Ph = @{ Min = 0; Max = 14; Unit = "" }
        Conductivity = @{ Min = 0; Max = 10; Unit = "mS/cm" }
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
    
    $Config = @{
        api = @{
            url = Read-Host "API URL [https://aeams-test-production.up.railway.app]"
            secret = Read-Host "API Secret [AEAMS_SECRET_zhmaj9w00ag]"
        }
        farm = @{
            main_rod_id = Read-Host "Main Rod ID [justintul]"
            secondary_rod_id = Read-Host "Secondary Rod ID [sensor_01]"
        }
        sensor_data = @{}
    }
    
    # Set defaults if empty
    if (-not $Config.api.url) { $Config.api.url = "https://aeams-test-production.up.railway.app" }
    if (-not $Config.api.secret) { $Config.api.secret = "AEAMS_SECRET_zhmaj9w00ag" }
    if (-not $Config.farm.main_rod_id) { $Config.farm.main_rod_id = "justintul" }
    if (-not $Config.farm.secondary_rod_id) { $Config.farm.secondary_rod_id = "sensor_01" }
    
    Write-Host ""
    Write-Host "Enter sensor readings (press Enter for random values):" -ForegroundColor Yellow
    
    $TempInput = Read-Host "Temperature (°C) [random 20-30]"
    $Config.sensor_data.temperature = if ($TempInput) { [double]$TempInput } else { Get-Random -Minimum 20 -Maximum 30 }
    
    $MoistInput = Read-Host "Moisture (%) [random 40-70]"
    $Config.sensor_data.moisture = if ($MoistInput) { [double]$MoistInput } else { Get-Random -Minimum 40 -Maximum 70 }
    
    $PhInput = Read-Host "pH [random 6.0-7.5]"
    $Config.sensor_data.ph = if ($PhInput) { [double]$PhInput } else { (Get-Random -Minimum 60 -Maximum 75) / 10 }
    
    $CondInput = Read-Host "Conductivity (mS/cm) [random 0.8-2.0]"
    $Config.sensor_data.conductivity = if ($CondInput) { [double]$CondInput } else { (Get-Random -Minimum 8 -Maximum 20) / 10 }
    
    $NInput = Read-Host "Nitrogen (ppm) [random 10-25]"
    $Config.sensor_data.nitrogen = if ($NInput) { [double]$NInput } else { Get-Random -Minimum 10 -Maximum 25 }
    
    $PInput = Read-Host "Phosphorus (ppm) [random 5-15]"
    $Config.sensor_data.phosphorus = if ($PInput) { [double]$PInput } else { Get-Random -Minimum 5 -Maximum 15 }
    
    $KInput = Read-Host "Potassium (ppm) [random 15-30]"
    $Config.sensor_data.potassium = if ($KInput) { [double]$KInput } else { Get-Random -Minimum 15 -Maximum 30 }
    
    return $Config
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
        $HealthResponse = curl.exe -X GET "$($Config.api.url)/api/health" 2>$null
        
        if ($HealthResponse -like "*OK*" -or $HealthResponse -like "*success*") {
            Write-ColoredOutput "Success" "API is responding"
        } else {
            Write-ColoredOutput "Warning" "API health check returned: $HealthResponse"
        }
        
        # Send sensor data
        Write-ColoredOutput "Info" "Sending sensor data..."
        $Response = curl.exe -X POST $ApiEndpoint -H "Content-Type: application/json" -d $Payload 2>$null
        
        if ($Response -like "*Data received successfully*" -or $Response -like "*success*") {
            Write-ColoredOutput "Success" "Data sent successfully!"
            Write-Host ""
            Write-Host "API Response:" -ForegroundColor Green
            Write-Host $Response -ForegroundColor White
        } else {
            Write-ColoredOutput "Error" "Failed to send data"
            Write-Host ""
            Write-Host "API Response:" -ForegroundColor Red
            Write-Host $Response -ForegroundColor White
        }
        
    }
    catch {
        Write-ColoredOutput "Error" "Network error: $($_.Exception.Message)"
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
    $LoadedConfig = Load-Configuration $ConfigFile
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

# Handle secondary rod targeting
if ($SecondaryRodIds -and $SecondaryRodIds.Count -gt 0) {
    $Config.farm.secondary_rod_ids = $SecondaryRodIds
    Write-ColoredOutput "Info" "Targeting multiple secondary rods: $($SecondaryRodIds -join ', ')"
} elseif ($SecondaryRodId -gt 0) {
    $Config.farm.secondary_rod_id = $SecondaryRodId
    $Config.farm.secondary_rod_ids = @($SecondaryRodId)
    Write-ColoredOutput "Info" "Targeting single secondary rod: $SecondaryRodId"
}
if ($null -ne $Temperature) { $Config.sensor_data.temperature = $Temperature }
if ($null -ne $Moisture) { $Config.sensor_data.moisture = $Moisture }
if ($null -ne $Ph) { $Config.sensor_data.ph = $Ph }
if ($null -ne $Conductivity) { $Config.sensor_data.conductivity = $Conductivity }
if ($null -ne $Nitrogen) { $Config.sensor_data.nitrogen = $Nitrogen }
if ($null -ne $Phosphorus) { $Config.sensor_data.phosphorus = $Phosphorus }
if ($null -ne $Potassium) { $Config.sensor_data.potassium = $Potassium }

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
Validate-SensorData $Config.sensor_data

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
