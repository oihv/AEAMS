@echo off
REM ================================================================
REM AEAMS All-In-One Data Push Tool
REM Modify sensor data and push directly to API
REM ================================================================

echo.
echo ================================================================
echo               AEAMS All-In-One Data Push Tool
echo ================================================================
echo.

REM ================================================================
REM CONFIGURATION SECTION - MODIFY THESE VALUES
REM ================================================================

REM Main Rod Configuration (the farm controller)
set MAIN_ROD_ID=justintul

REM Secondary Rod Configuration (the sensor unit)
set SECONDARY_ROD_ID=asdasdsa

REM API Configuration
set API_URL=https://aeams-test-production.up.railway.app
set SECRET_KEY=AEAMS_SECRET_zhmaj9w00ag

REM Sensor Data - MODIFY THESE VALUES
set TEMPERATURE=0
set MOISTURE=0
set PH=0
set CONDUCTIVITY=0
set NITROGEN=0
set PHOSPHORUS=0
set POTASSIUM=0

REM ================================================================
REM PREVIOUS ROD EXAMPLES (uncomment to use)
REM ================================================================

REM Example 1: Original test setup
REM set MAIN_ROD_ID=justintul
REM set SECONDARY_ROD_ID=asdasdsa

REM Example 2: Test rod setup
REM set MAIN_ROD_ID=justintul
REM set SECONDARY_ROD_ID=test_rod_001

REM Example 3: Greenhouse setup
REM set MAIN_ROD_ID=farm_greenhouse
REM set SECONDARY_ROD_ID=greenhouse_sensor_01

REM Example 4: Field setup
REM set MAIN_ROD_ID=farm_field_a
REM set SECONDARY_ROD_ID=sensor_north

REM Example 5: Research plot setup
REM set MAIN_ROD_ID=research_plot
REM set SECONDARY_ROD_ID=npk_analyzer_01

REM ================================================================
REM QUICK SENSOR PRESETS (uncomment to use)
REM ================================================================

REM Preset 1: Hot greenhouse conditions
REM set TEMPERATURE=28.5
REM set MOISTURE=65.3
REM set PH=6.5
REM set CONDUCTIVITY=1.8
REM set NITROGEN=18.2
REM set PHOSPHORUS=11.4
REM set POTASSIUM=22.7

REM Preset 2: Outdoor field conditions
REM set TEMPERATURE=22.1
REM set MOISTURE=38.7
REM set PH=7.1
REM set CONDUCTIVITY=0.9
REM set NITROGEN=15.8
REM set PHOSPHORUS=9.2
REM set POTASSIUM=19.3

REM Preset 3: Hydroponic setup
REM set TEMPERATURE=24.8
REM set MOISTURE=95.0
REM set PH=5.8
REM set CONDUCTIVITY=2.1
REM set NITROGEN=25.4
REM set PHOSPHORUS=15.7
REM set POTASSIUM=28.9

REM Preset 4: Dry conditions
REM set TEMPERATURE=26.3
REM set MOISTURE=25.1
REM set PH=7.8
REM set CONDUCTIVITY=0.6
REM set NITROGEN=8.9
REM set PHOSPHORUS=5.4
REM set POTASSIUM=12.1

REM ================================================================
REM DISPLAY CURRENT CONFIGURATION
REM ================================================================

echo Current Configuration:
echo ----------------------
echo Main Rod ID:      %MAIN_ROD_ID%
echo Secondary Rod ID: %SECONDARY_ROD_ID%
echo API URL:          %API_URL%
echo.
echo Sensor Data:
echo   Temperature:    %TEMPERATURE%°C
echo   Moisture:       %MOISTURE%%%
echo   pH:             %PH%
echo   Conductivity:   %CONDUCTIVITY% mS/cm
echo   Nitrogen (N):   %NITROGEN% ppm
echo   Phosphorus (P): %PHOSPHORUS% ppm
echo   Potassium (K):  %POTASSIUM% ppm
echo.

REM ================================================================
REM GENERATE TIMESTAMP
REM ================================================================

REM Get current timestamp in ISO 8601 format
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "SS=%dt:~12,2%"
set "TIMESTAMP=%YYYY%-%MM%-%DD%T%HH%:%Min%:%SS%Z"

echo Timestamp:        %TIMESTAMP%
echo.

REM ================================================================
REM CONFIRMATION
REM ================================================================

echo Ready to push data to AEAMS API!
echo.
set /p CONFIRM="Press Y to continue, N to cancel, or E to edit values: "

if /i "%CONFIRM%"=="N" (
    echo Operation cancelled.
    pause
    exit /b 0
)

if /i "%CONFIRM%"=="E" (
    goto :EDIT_VALUES
)

if /i not "%CONFIRM%"=="Y" (
    echo Invalid input. Operation cancelled.
    pause
    exit /b 0
)

REM ================================================================
REM API HEALTH CHECK
REM ================================================================

echo ================================================================
echo Step 1: Testing API Health...
echo ================================================================

curl.exe -X GET "%API_URL%/api/health" -w "\nHTTP Status: %%{http_code}\n"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ API Health check failed!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo ✅ API is responding!
echo.

REM ================================================================
REM BUILD JSON PAYLOAD
REM ================================================================

echo ================================================================
echo Step 2: Building JSON payload...
echo ================================================================

set "JSON_PAYLOAD={\"secret\":\"%SECRET_KEY%\",\"readings\":[{\"rod_id\":\"%SECONDARY_ROD_ID%\",\"secret\":\"%SECRET_KEY%\",\"timestamp\":\"%TIMESTAMP%\",\"temperature\":%TEMPERATURE%,\"moisture\":%MOISTURE%,\"ph\":%PH%,\"conductivity\":%CONDUCTIVITY%,\"nitrogen\":%NITROGEN%,\"phosphorus\":%PHOSPHORUS%,\"potassium\":%POTASSIUM%}]}"

echo JSON Payload:
echo %JSON_PAYLOAD%
echo.

REM ================================================================
REM PUSH DATA TO API
REM ================================================================

echo ================================================================
echo Step 3: Pushing data to API...
echo ================================================================

echo Sending to: %API_URL%/api/rod/%MAIN_ROD_ID%
echo.

curl.exe -X POST "%API_URL%/api/rod/%MAIN_ROD_ID%" ^
  -H "Content-Type: application/json" ^
  -d "%JSON_PAYLOAD%" ^
  -w "\nHTTP Status: %%{http_code}\n"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Data push failed!
    echo Check the error message above for details.
    goto :TROUBLESHOOT
) else (
    echo.
    echo ✅ Data push completed!
)

REM ================================================================
REM COMPLETION
REM ================================================================

echo.
echo ================================================================
echo                    OPERATION COMPLETE
echo ================================================================
echo.
echo Data has been sent to the AEAMS API.
echo.
echo Summary:
echo   Main Rod:       %MAIN_ROD_ID%
echo   Secondary Rod:  %SECONDARY_ROD_ID%
echo   Temperature:    %TEMPERATURE%°C
echo   Moisture:       %MOISTURE%%%
echo   pH:             %PH%
echo   NPK:            N:%NITROGEN% P:%PHOSPHORUS% K:%POTASSIUM%
echo   Timestamp:      %TIMESTAMP%
echo.
echo Check the API response above to confirm successful data storage.
echo.
pause
exit /b 0

REM ================================================================
REM EDIT VALUES SECTION
REM ================================================================

:EDIT_VALUES
echo.
echo ================================================================
echo                    EDIT VALUES
echo ================================================================
echo.

echo Enter new values (press Enter to keep current value):
echo.

set /p NEW_MAIN_ROD="Main Rod ID [%MAIN_ROD_ID%]: "
if not "%NEW_MAIN_ROD%"=="" set MAIN_ROD_ID=%NEW_MAIN_ROD%

set /p NEW_SECONDARY_ROD="Secondary Rod ID [%SECONDARY_ROD_ID%]: "
if not "%NEW_SECONDARY_ROD%"=="" set SECONDARY_ROD_ID=%NEW_SECONDARY_ROD%

set /p NEW_TEMP="Temperature [%TEMPERATURE%]: "
if not "%NEW_TEMP%"=="" set TEMPERATURE=%NEW_TEMP%

set /p NEW_MOISTURE="Moisture [%MOISTURE%]: "
if not "%NEW_MOISTURE%"=="" set MOISTURE=%NEW_MOISTURE%

set /p NEW_PH="pH [%PH%]: "
if not "%NEW_PH%"=="" set PH=%NEW_PH%

set /p NEW_CONDUCTIVITY="Conductivity [%CONDUCTIVITY%]: "
if not "%NEW_CONDUCTIVITY%"=="" set CONDUCTIVITY=%NEW_CONDUCTIVITY%

set /p NEW_NITROGEN="Nitrogen [%NITROGEN%]: "
if not "%NEW_NITROGEN%"=="" set NITROGEN=%NEW_NITROGEN%

set /p NEW_PHOSPHORUS="Phosphorus [%PHOSPHORUS%]: "
if not "%NEW_PHOSPHORUS%"=="" set PHOSPHORUS=%NEW_PHOSPHORUS%

set /p NEW_POTASSIUM="Potassium [%POTASSIUM%]: "
if not "%NEW_POTASSIUM%"=="" set POTASSIUM=%NEW_POTASSIUM%

echo.
echo Updated values:
echo   Main Rod ID:      %MAIN_ROD_ID%
echo   Secondary Rod ID: %SECONDARY_ROD_ID%
echo   Temperature:      %TEMPERATURE%°C
echo   Moisture:         %MOISTURE%%%
echo   pH:               %PH%
echo   Conductivity:     %CONDUCTIVITY% mS/cm
echo   Nitrogen (N):     %NITROGEN% ppm
echo   Phosphorus (P):   %PHOSPHORUS% ppm
echo   Potassium (K):    %POTASSIUM% ppm
echo.

set /p CONTINUE="Continue with these values? (Y/N): "
if /i "%CONTINUE%"=="Y" (
    goto :MAIN_FLOW
) else (
    echo Operation cancelled.
    pause
    exit /b 0
)

:MAIN_FLOW
REM Continue with the main flow after editing
goto :AFTER_CONFIRMATION

:AFTER_CONFIRMATION
REM ================================================================
REM API HEALTH CHECK (continued from edit flow)
REM ================================================================

echo ================================================================
echo Step 1: Testing API Health...
echo ================================================================

curl.exe -X GET "%API_URL%/api/health" -w "\nHTTP Status: %%{http_code}\n"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ API Health check failed!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)

echo ✅ API is responding!
echo.

REM Generate fresh timestamp for edited values
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "SS=%dt:~12,2%"
set "TIMESTAMP=%YYYY%-%MM%-%DD%T%HH%:%Min%:%SS%Z"

REM Continue with the rest of the main flow...
echo ================================================================
echo Step 2: Building JSON payload...
echo ================================================================

set "JSON_PAYLOAD={\"secret\":\"%SECRET_KEY%\",\"readings\":[{\"rod_id\":\"%SECONDARY_ROD_ID%\",\"secret\":\"%SECRET_KEY%\",\"timestamp\":\"%TIMESTAMP%\",\"temperature\":%TEMPERATURE%,\"moisture\":%MOISTURE%,\"ph\":%PH%,\"conductivity\":%CONDUCTIVITY%,\"nitrogen\":%NITROGEN%,\"phosphorus\":%PHOSPHORUS%,\"potassium\":%POTASSIUM%}]}"

echo JSON Payload:
echo %JSON_PAYLOAD%
echo.

echo ================================================================
echo Step 3: Pushing data to API...
echo ================================================================

echo Sending to: %API_URL%/api/rod/%MAIN_ROD_ID%
echo.

curl.exe -X POST "%API_URL%/api/rod/%MAIN_ROD_ID%" ^
  -H "Content-Type: application/json" ^
  -d "%JSON_PAYLOAD%" ^
  -w "\nHTTP Status: %%{http_code}\n"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Data push failed!
    echo Check the error message above for details.
    goto :TROUBLESHOOT
) else (
    echo.
    echo ✅ Data push completed!
)

echo.
echo ================================================================
echo                    OPERATION COMPLETE
echo ================================================================
echo.
echo Data has been sent to the AEAMS API.
echo.
echo Summary:
echo   Main Rod:       %MAIN_ROD_ID%
echo   Secondary Rod:  %SECONDARY_ROD_ID%
echo   Temperature:    %TEMPERATURE%°C
echo   Moisture:       %MOISTURE%%%
echo   pH:             %PH%
echo   NPK:            N:%NITROGEN% P:%PHOSPHORUS% K:%POTASSIUM%
echo   Timestamp:      %TIMESTAMP%
echo.
echo Check the API response above to confirm successful data storage.
echo.
pause
exit /b 0

REM ================================================================
REM TROUBLESHOOTING SECTION
REM ================================================================

:TROUBLESHOOT
echo.
echo ================================================================
echo                    TROUBLESHOOTING
echo ================================================================
echo.
echo Common issues and solutions:
echo.
echo 1. "Main rod not found" - Check if main rod ID exists in database
echo 2. "Invalid secret key" - Verify secret key is correct
echo 3. "Main rod not bound to farm" - Bind the rod to a farm first
echo 4. Network timeout - Check internet connection
echo.
echo Quick debug commands:
echo.
echo Test API health:
echo   curl.exe -X GET "%API_URL%/api/health"
echo.
echo Test database connection:
echo   curl.exe -X GET "%API_URL%/api/test-db"
echo.
echo Check main rods:
echo   curl.exe -X GET "%API_URL%/api/main-rods"
echo.
echo Current configuration used:
echo   Main Rod ID: %MAIN_ROD_ID%
echo   Secondary Rod ID: %SECONDARY_ROD_ID%
echo   Secret Key: %SECRET_KEY%
echo.
pause
exit /b 1

REM ================================================================
REM END OF SCRIPT
REM ================================================================
