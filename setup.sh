#!/bin/bash

# EAEMS Setup Script
# This script helps set up the EAEMS authentication system

echo "🚀 Setting up EAEMS Authentication System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check for .env file
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️ Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo "⚠️  Please edit .env file and add your NEXTAUTH_SECRET"
    echo "   You can generate a secret with: openssl rand -base64 32"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo ""
echo "🗄️ Setting up database..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated"

# Initialize database
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi

echo "✅ Database initialized"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "To start Prisma Studio:"
echo "  npx prisma studio"
echo ""
echo "Your app will be available at:"
echo "  - Next.js App: http://localhost:3000"
echo "  - Prisma Studio: http://localhost:5555"
echo ""
echo "Happy coding! 🚀"
