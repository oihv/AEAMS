@echo off
REM Build script for GitHub Pages - temporarily moves API folder
echo Building for GitHub Pages...

REM Move API folder temporarily outside the app directory
if exist "app\api" (
    echo Moving API folder temporarily...
    move "app\api" "api-backup" >nul
)

REM Set environment variable and build
set GITHUB_PAGES=true
npm run build

REM Move API folder back
if exist "api-backup" (
    echo Restoring API folder...
    move "api-backup" "app\api" >nul
)

echo GitHub Pages build complete!
