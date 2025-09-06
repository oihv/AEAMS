@echo off
REM ================================================================
REM AEAMS Data Push Tool - Enhanced Windows Batch Version
REM Wrapper for PowerShell script with integer rod support
REM ================================================================

setlocal enabledelayedexpansion

REM Check if PowerShell is available
where powershell >nul 2>&1
if errorlevel 1 (
    echo Error: PowerShell is not available. Please install PowerShell.
    pause
    exit /b 1
)

REM Default values
set "CONFIG_FILE="
set "MAIN_ROD_ID="
set "SECONDARY_ROD_ID=1"
set "SECONDARY_ROD_IDS="
set "TEMPERATURE="
set "MOISTURE="
set "PH="
set "CONDUCTIVITY="
set "NITROGEN="
set "PHOSPHORUS="
set "POTASSIUM="
set "API_URL="
set "SECRET="
set "INTERACTIVE=false"
set "BATCH_MODE=false"
set "SHOW_HELP=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :done_parsing
if /i "%~1"=="--help" set "SHOW_HELP=true" & shift & goto :parse_args
if /i "%~1"=="-h" set "SHOW_HELP=true" & shift & goto :parse_args
if /i "%~1"=="--config" set "CONFIG_FILE=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-c" set "CONFIG_FILE=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--main-rod" set "MAIN_ROD_ID=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-m" set "MAIN_ROD_ID=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--secondary-rod" set "SECONDARY_ROD_ID=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-s" set "SECONDARY_ROD_ID=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--secondary-rods" set "SECONDARY_ROD_IDS=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-S" set "SECONDARY_ROD_IDS=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--batch-mode" set "BATCH_MODE=true" & shift & goto :parse_args
if /i "%~1"=="-B" set "BATCH_MODE=true" & shift & goto :parse_args
if /i "%~1"=="--temperature" set "TEMPERATURE=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-t" set "TEMPERATURE=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--moisture" set "MOISTURE=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-w" set "MOISTURE=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--ph" set "PH=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-p" set "PH=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--conductivity" set "CONDUCTIVITY=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-d" set "CONDUCTIVITY=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--nitrogen" set "NITROGEN=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-n" set "NITROGEN=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--phosphorus" set "PHOSPHORUS=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-f" set "PHOSPHORUS=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--potassium" set "POTASSIUM=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-k" set "POTASSIUM=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--url" set "API_URL=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-u" set "API_URL=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--secret" set "SECRET=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="-r" set "SECRET=%~2" & shift & shift & goto :parse_args
if /i "%~1"=="--interactive" set "INTERACTIVE=true" & shift & goto :parse_args
if /i "%~1"=="-i" set "INTERACTIVE=true" & shift & goto :parse_args

echo Unknown parameter: %~1
goto :show_help

:done_parsing

REM Show help if requested
if /i "%SHOW_HELP%"=="true" goto :show_help

echo.
echo 🌱 AEAMS Data Push Tool - Enhanced Windows Batch Version
echo ================================================================
echo.

REM Build PowerShell command
set "PS_CMD=& '.\scripts\Send-AEAMSData.ps1'"

if not "%CONFIG_FILE%"=="" set "PS_CMD=!PS_CMD! -ConfigFile '%CONFIG_FILE%'"
if not "%MAIN_ROD_ID%"=="" set "PS_CMD=!PS_CMD! -MainRodId '%MAIN_ROD_ID%'"
if not "%SECONDARY_ROD_ID%"=="" set "PS_CMD=!PS_CMD! -SecondaryRodId %SECONDARY_ROD_ID%"
if not "%SECONDARY_ROD_IDS%"=="" set "PS_CMD=!PS_CMD! -SecondaryRodIds @(%SECONDARY_ROD_IDS%)"
if not "%TEMPERATURE%"=="" set "PS_CMD=!PS_CMD! -Temperature %TEMPERATURE%"
if not "%MOISTURE%"=="" set "PS_CMD=!PS_CMD! -Moisture %MOISTURE%"
if not "%PH%"=="" set "PS_CMD=!PS_CMD! -Ph %PH%"
if not "%CONDUCTIVITY%"=="" set "PS_CMD=!PS_CMD! -Conductivity %CONDUCTIVITY%"
if not "%NITROGEN%"=="" set "PS_CMD=!PS_CMD! -Nitrogen %NITROGEN%"
if not "%PHOSPHORUS%"=="" set "PS_CMD=!PS_CMD! -Phosphorus %PHOSPHORUS%"
if not "%POTASSIUM%"=="" set "PS_CMD=!PS_CMD! -Potassium %POTASSIUM%"
if not "%API_URL%"=="" set "PS_CMD=!PS_CMD! -ApiUrl '%API_URL%'"
if not "%SECRET%"=="" set "PS_CMD=!PS_CMD! -Secret '%SECRET%'"
if /i "%INTERACTIVE%"=="true" set "PS_CMD=!PS_CMD! -Interactive"
if /i "%BATCH_MODE%"=="true" set "PS_CMD=!PS_CMD! -BatchMode"

echo Executing PowerShell command...
echo Command: !PS_CMD!
echo.

REM Execute PowerShell script
powershell -ExecutionPolicy Bypass -Command "!PS_CMD!"

if errorlevel 1 (
    echo.
    echo ❌ Script execution failed!
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Script execution completed successfully!
    pause
    exit /b 0
)

:show_help
echo.
echo 🌱 AEAMS Data Push Tool - Enhanced Windows Batch Version
echo ================================================================
echo.
echo USAGE EXAMPLES:
echo.
echo 1. Use a configuration file:
echo    send-aeams-data.bat -c examples\greenhouse-config.json
echo.
echo 2. Interactive mode:
echo    send-aeams-data.bat -i
echo.
echo 3. Target specific rod numbers:
echo    send-aeams-data.bat -m farm_01 -s 1 -t 25.4 -w 60.2
echo.
echo 4. Target multiple rod numbers (batch mode):
echo    send-aeams-data.bat -m farm_01 -S 1,2,3 -B
echo.
echo PARAMETERS:
echo   -c, --config FILE      Path to JSON configuration file
echo   -m, --main-rod ID      Main rod identifier (farm controller)
echo   -s, --secondary-rod NUM Secondary rod number (1, 2, 3, etc.)
echo   -S, --secondary-rods   Comma-separated secondary rod numbers
echo   -t, --temperature VAL  Temperature in Celsius
echo   -w, --moisture VAL     Moisture percentage (0-100)
echo   -p, --ph VAL          pH level (0-14)
echo   -d, --conductivity VAL Electrical conductivity (mS/cm)
echo   -n, --nitrogen VAL     Nitrogen content (ppm)
echo   -f, --phosphorus VAL   Phosphorus content (ppm)
echo   -k, --potassium VAL    Potassium content (ppm)
echo   -u, --url URL         API base URL
echo   -r, --secret KEY      API secret key
echo   -i, --interactive     Run in interactive mode
echo   -B, --batch-mode      Send data to multiple secondary rods
echo   -h, --help           Show this help message
echo.
echo CONFIGURATION FILE FORMAT:
echo   See examples folder for sample JSON configuration files:
echo   - greenhouse-config.json (greenhouse setup)
echo   - field-config.json (outdoor field setup)
echo   - hydroponic-config.json (hydroponic system)
echo.
pause
exit /b 0
