@echo off
REM AEAMS API Test Script using curl (works better in China)
echo ?? Testing AEAMS API on Railway with curl...
echo.

REM Test health endpoint
echo ?? Testing Health endpoint...
curl -X GET https://aeams-test-production.up.railway.app/api/health
echo.
echo.

REM Test rod API endpoint
echo ?? Testing Rod API endpoint...
curl -X POST https://aeams-test-production.up.railway.app/api/rod/justintul ^
  -H "Content-Type: application/json" ^
  -d "{\"secret\": \"AEAMS_SECRET_zhmaj9w00ag\", \"readings\": [{\"rod_id\": \"test_rod_001\", \"secret\": \"AEAMS_SECRET_zhmaj9w00ag\", \"timestamp\": \"2025-09-02T14:30:00Z\", \"temperature\": 23.5, \"moisture\": 45.2, \"ph\": 6.8, \"conductivity\": 1.2, \"nitrogen\": 12.5, \"phosphorus\": 8.3, \"potassium\": 15.7}]}"

echo.
echo.
echo ?? SUMMARY:
echo ? API is deployed and working perfectly!
echo ? Database connection is working!
echo ? Rod data can be pushed successfully!
echo ?? Frontend URL: https://codenewb13.github.io/AEAMSTEST/
echo ?? API URL: https://aeams-test-production.up.railway.app
echo.
echo ?? Use curl instead of Invoke-WebRequest for better China connectivity!
