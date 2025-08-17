@echo off
REM EAEMS Setup Script for Windows
REM This script helps set up the EAEMS authentication system on Windows

echo 🚀 Setting up EAEMS Authentication System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo ✅ Node.js found:
node --version

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available. Please install npm first.
    pause
    exit /b 1
)

echo ✅ npm found:
npm --version

REM Install dependencies
echo.
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check for .env file
if not exist ".env" (
    echo.
    echo ⚙️ Creating .env file...
    copy .env.example .env >nul
    echo ✅ .env file created from .env.example
    echo ⚠️  Please edit .env file and add your NEXTAUTH_SECRET
    echo    You can generate a secret with: openssl rand -base64 32
    echo    Or use an online generator if openssl is not available
) else (
    echo ✅ .env file already exists
)

REM Generate Prisma client
echo.
echo 🗄️ Setting up database...
npx prisma generate

if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo ✅ Prisma client generated

REM Initialize database
npx prisma db push

if %errorlevel% neq 0 (
    echo ❌ Failed to initialize database
    pause
    exit /b 1
)

echo ✅ Database initialized

echo.
echo 🎉 Setup complete!
echo.
echo To start the development server:
echo   npm run dev
echo.
echo To start Prisma Studio:
echo   npx prisma studio
echo.
echo Your app will be available at:
echo   - Next.js App: http://localhost:3000
echo   - Prisma Studio: http://localhost:5555
echo.
echo Happy coding! 🚀
echo.
pause
