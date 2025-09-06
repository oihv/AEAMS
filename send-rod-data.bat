@echo off
echo ?? AEAMS Rod Data Sender - Reliable Method
echo ==========================================

REM Create JSON data file
echo {> rod-payload.json
echo     "secret": "AEAMS_SECRET_zhmaj9w00ag",>> rod-payload.json
echo     "readings": [>> rod-payload.json
echo         {>> rod-payload.json
echo             "rod_id": "%1",>> rod-payload.json
echo             "secret": "AEAMS_SECRET_zhmaj9w00ag",>> rod-payload.json
echo             "timestamp": "%date:~10,4%-%date:~4,2%-%date:~7,2%T%time:~0,2%:%time:~3,2%:%time:~6,2%Z",>> rod-payload.json
echo             "temperature": %2,>> rod-payload.json
echo             "moisture": %3,>> rod-payload.json
echo             "ph": %4,>> rod-payload.json
echo             "conductivity": %5,>> rod-payload.json
echo             "nitrogen": %6,>> rod-payload.json
echo             "phosphorus": %7,>> rod-payload.json
echo             "potassium": %8>> rod-payload.json
echo         }>> rod-payload.json
echo     ]>> rod-payload.json
echo }>> rod-payload.json

echo ?? Sending data for Rod ID: %1
echo    Temperature: %2?C, Moisture: %3%%, pH: %4

curl.exe -X POST "https://aeams-test-production.up.railway.app/api/rod/justintul" -H "Content-Type: application/json" -d @rod-payload.json

REM Clean up
del rod-payload.json

echo.
echo ? Done! Check the response above.
echo.
echo Usage: send-rod-data.bat [rod_id] [temp] [moisture] [ph] [conductivity] [nitrogen] [phosphorus] [potassium]
echo Example: send-rod-data.bat sensor001 25.5 60.2 6.8 1.2 12.5 8.3 15.7
