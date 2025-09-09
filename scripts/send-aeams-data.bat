@echo off
REM ================================================================
REM AEAMS Data Push Tool - Enhanced Windows Batch Wrapper
REM Comprehensive parameter support for all sensor and rod options
REM ================================================================

echo.
echo AEAMS Data Push Tool - Enhanced Windows Batch Wrapper
echo ================================================================
echo.

REM Show help if requested
if "%1"=="-h" goto :show_help
if "%1"=="--help" goto :show_help
if "%1"=="-Help" goto :show_help
if "%1"=="/?" goto :show_help

REM Check if PowerShell is available
powershell -Command "Write-Output 'PowerShell is available'" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is not available on this system
    echo Please install PowerShell or use the shell script directly
    pause
    exit /b 1
)

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Define the PowerShell script path
set "PS_SCRIPT=%SCRIPT_DIR%Send-AEAMSData.ps1"

REM Check if the PowerShell script exists
if not exist "%PS_SCRIPT%" (
    echo ERROR: PowerShell script not found at: %PS_SCRIPT%
    echo Please ensure Send-AEAMSData.ps1 is in the same directory as this batch file
    pause
    exit /b 1
)

echo Calling PowerShell script: %PS_SCRIPT%
echo.

REM Run the PowerShell script with all passed arguments
REM Using proper encoding and console settings for compatibility
powershell -NoProfile -ExecutionPolicy Bypass -Command "& { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; & '%PS_SCRIPT%' %* }"

REM Check the exit code from PowerShell
if errorlevel 1 (
    echo.
    echo ERROR: PowerShell script execution failed
    pause
    exit /b 1
) else (
    echo.
    echo PowerShell script completed successfully
)

REM Pause only if the script was run directly (not from command line with parameters)
if "%~1"=="" (
    echo.
    pause
)

goto :eof

:show_help
echo.
echo AEAMS Data Push Tool - Enhanced Windows Batch Wrapper
echo ================================================================
echo.
echo This batch file is a wrapper for the PowerShell script and supports
echo all the same parameters. All arguments are passed directly to PowerShell.
echo.
echo USAGE EXAMPLES:
echo.
echo 1. Interactive mode:
echo    send-aeams-data.bat -Interactive
echo.
echo 2. Single rod with all sensor parameters:
echo    send-aeams-data.bat -SecondaryRodId 2 -Temperature 25.0 -Moisture 60.0 -Ph 6.8 -Conductivity 1.5 -Nitrogen 20.0 -Phosphorus 10.0 -Potassium 15.0
echo.
echo 3. Multiple rods (batch mode):
echo    send-aeams-data.bat -SecondaryRodIds 1,2,3 -BatchMode -Temperature 24.0
echo.
echo 4. Custom main rod and API settings:
echo    send-aeams-data.bat -MainRodId "greenhouse_01" -SecondaryRodId 1 -ApiUrl "https://your-api.com" -Secret "your_secret"
echo.
echo 5. Use configuration file:
echo    send-aeams-data.bat -ConfigFile "examples\greenhouse-config.json"
echo.
echo AVAILABLE PARAMETERS:
echo   -ConfigFile       Path to JSON configuration file
echo   -MainRodId        Main rod identifier (farm controller)
echo   -SecondaryRodId   Single secondary rod number (1, 2, 3, etc.)
echo   -SecondaryRodIds  Multiple secondary rod numbers (comma-separated)
echo   -Temperature      Temperature in Celsius
echo   -Moisture         Moisture percentage (0-100)
echo   -Ph               pH level (0-14)
echo   -Conductivity     Electrical conductivity (mS/cm)
echo   -Nitrogen         Nitrogen content (ppm)
echo   -Phosphorus       Phosphorus content (ppm)
echo   -Potassium        Potassium content (ppm)
echo   -ApiUrl           API base URL
echo   -Secret           API secret key
echo   -Interactive      Run in interactive mode
echo   -BatchMode        Send data to multiple secondary rods
echo   -Help             Show PowerShell help (more detailed)
echo.
echo NPK NUTRIENT QUICK REFERENCE:
echo   Nitrogen (N):   Leaf/stem growth - Vegetative: 20-30 ppm, Flowering: 10-20 ppm
echo   Phosphorus (P): Root/flower dev  - Vegetative: 5-15 ppm,  Flowering: 20-40 ppm
echo   Potassium (K):  Disease resist   - Vegetative: 10-20 ppm, Fruiting: 30-50 ppm
echo.
echo For detailed help and more examples, run: send-aeams-data.bat -Help
echo.
pause