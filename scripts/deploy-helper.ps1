# AEAMS Deployment Helper (PowerShell)
Write-Host "🚀 AEAMS Deployment Helper" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the AEAMS root directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Choose deployment option:"
Write-Host "1) Deploy Frontend to GitHub Pages"
Write-Host "2) Deploy API to Railway"
Write-Host "3) Deploy API to Vercel"
Write-Host "4) Build and test locally"
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    1 {
        Write-Host "🌐 Deploying Frontend to GitHub Pages..." -ForegroundColor Blue
        Write-Host "Setting environment for static export..."
        $env:GITHUB_PAGES = "true"
        npm run build:github
        Write-Host "✅ Frontend built for GitHub Pages" -ForegroundColor Green
        Write-Host "📝 Push to GitHub to trigger deployment:" -ForegroundColor Yellow
        Write-Host "   git add ."
        Write-Host "   git commit -m 'Deploy to GitHub Pages'"
        Write-Host "   git push origin main"
    }
    2 {
        Write-Host "🚂 Deploying API to Railway..." -ForegroundColor Blue
        if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Railway CLI..."
            npm install -g @railway/cli
        }
        Write-Host "Please ensure you've set up Railway project and environment variables"
        railway up
    }
    3 {
        Write-Host "▲ Deploying API to Vercel..." -ForegroundColor Blue
        if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Vercel CLI..."
            npm install -g vercel
        }
        vercel --config vercel-api.json
    }
    4 {
        Write-Host "🔧 Building and testing locally..." -ForegroundColor Blue
        Write-Host "Building regular version..."
        npm run build
        Write-Host "Building GitHub Pages version..."
        $env:GITHUB_PAGES = "true"
        npm run build:github
        Write-Host "✅ Both builds completed" -ForegroundColor Green
        Write-Host "To test GitHub Pages build locally:" -ForegroundColor Yellow
        Write-Host "   npx serve out"
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}
