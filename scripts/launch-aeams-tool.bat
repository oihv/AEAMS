@echo off
REM ================================================================
REM AEAMS Data Push Tool - Windows Batch Wrapper
REM Simple interface for the PowerShell script
REM ================================================================

echo.
echo ================================================================
echo            AEAMS Data Push Tool - Windows Launcher
echo ================================================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: PowerShell is not available on this system.
    echo Please install PowerShell or use the shell script on Linux/macOS.
    pause
    exit /b 1
)

echo Available options:
echo.
echo 1. Interactive Mode (guided input)
echo 2. Use Greenhouse Configuration
echo 3. Use Field Configuration  
echo 4. Use Hydroponic Configuration
echo 5. Command Line Mode
echo 6. Show Help
echo 7. Exit
echo.

set /p choice="Select option (1-7): "

if "%choice%"=="1" (
    echo.
    echo Starting interactive mode...
    powershell -ExecutionPolicy Bypass -File "Send-AEAMSData.ps1" -Interactive
) else if "%choice%"=="2" (
    echo.
    echo Using greenhouse configuration...
    powershell -ExecutionPolicy Bypass -File "Send-AEAMSData.ps1" -ConfigFile "examples\greenhouse-config.json"
) else if "%choice%"=="3" (
    echo.
    echo Using field configuration...
    powershell -ExecutionPolicy Bypass -File "Send-AEAMSData.ps1" -ConfigFile "examples\field-config.json"
) else if "%choice%"=="4" (
    echo.
    echo Using hydroponic configuration...
    powershell -ExecutionPolicy Bypass -File "Send-AEAMSData.ps1" -ConfigFile "examples\hydroponic-config.json"
) else if "%choice%"=="5" (
    echo.
    echo Enter sensor data (press Enter to skip):
    echo.
    set /p main_rod="Main Rod ID [justintul]: "
    set /p secondary_rod="Secondary Rod ID [test_sensor]: "
    set /p temperature="Temperature (C): "
    set /p moisture="Moisture (%%): "
    set /p ph="pH: "
    
    set cmd_args=
    if not "%main_rod%"=="" set cmd_args=%cmd_args% -MainRodId "%main_rod%"
    if not "%secondary_rod%"=="" set cmd_args=%cmd_args% -SecondaryRodId "%secondary_rod%"
    if not "%temperature%"=="" set cmd_args=%cmd_args% -Temperature %temperature%
    if not "%moisture%"=="" set cmd_args=%cmd_args% -Moisture %moisture%
    if not "%ph%"=="" set cmd_args=%cmd_args% -Ph %ph%
    
    echo.
    echo Running with parameters: %cmd_args%
    powershell -ExecutionPolicy Bypass -File "Send-AEAMSData.ps1" %cmd_args%
) else if "%choice%"=="6" (
    echo.
    powershell -ExecutionPolicy Bypass -File "Send-AEAMSData.ps1" -Help
) else if "%choice%"=="7" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice. Please select 1-7.
)

echo.
echo ================================================================
echo.
pause
