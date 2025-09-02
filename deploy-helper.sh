#!/bin/bash

echo "🚀 AEAMS Deployment Helper"
echo "========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the AEAMS root directory"
    exit 1
fi

echo ""
echo "Choose deployment option:"
echo "1) Deploy Frontend to GitHub Pages"
echo "2) Deploy API to Railway"
echo "3) Deploy API to Vercel"
echo "4) Build and test locally"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🌐 Deploying Frontend to GitHub Pages..."
        echo "Setting environment for static export..."
        export GITHUB_PAGES=true
        npm run build:github
        echo "✅ Frontend built for GitHub Pages"
        echo "📝 Push to GitHub to trigger deployment:"
        echo "   git add ."
        echo "   git commit -m 'Deploy to GitHub Pages'"
        echo "   git push origin main"
        ;;
    2)
        echo "🚂 Deploying API to Railway..."
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        echo "Please ensure you've set up Railway project and environment variables"
        railway up
        ;;
    3)
        echo "▲ Deploying API to Vercel..."
        if ! command -v vercel &> /dev/null; then
            echo "Installing Vercel CLI..."
            npm install -g vercel
        fi
        vercel --config vercel-api.json
        ;;
    4)
        echo "🔧 Building and testing locally..."
        echo "Building regular version..."
        npm run build
        echo "Building GitHub Pages version..."
        export GITHUB_PAGES=true
        npm run build:github
        echo "✅ Both builds completed"
        echo "To test GitHub Pages build locally:"
        echo "   npx serve out"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
