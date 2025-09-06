# AEAMS GitHub Pages Deployment

This repository is configured for dual deployment:

## 🌐 Frontend (GitHub Pages)
- **URL**: https://codenewb13.github.io/AEAMSTEST/
- **Hosting**: GitHub Pages (Static Site)
- **Content**: Dashboard, UI, and static assets

## 🚀 API (Separate Hosting)
- **API Endpoints**: Deployed separately (Vercel/Railway/Render)
- **Database**: Same database connection maintained
- **Endpoints**: All `/api/*` routes

## Deployment Strategy

### GitHub Pages (Frontend)
1. Push to main branch
2. GitHub Actions automatically builds and deploys static site
3. Environment variable `GITHUB_PAGES=true` enables static export

### API Deployment Options

#### Option 1: Vercel (Recommended for China access)
```bash
# Deploy API only to Vercel
npx vercel --config vercel-api.json
```

#### Option 2: Railway
```bash
# Deploy to Railway
railway login
railway new
railway up
```

#### Option 3: Render
- Connect your GitHub repository to Render
- Deploy as a Web Service

## Environment Variables

### GitHub Pages (Frontend)
- `NEXT_PUBLIC_API_URL`: URL of your deployed API service

### API Service
- `DATABASE_URL`: Your database connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `NEXTAUTH_URL`: Your API service URL

## Testing Your Rod API

Once deployed, test your API endpoint:

```powershell
Invoke-WebRequest `
  -Uri "https://your-api-domain.com/api/rod/justintul" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{
    "secret": "AEAMS_SECRET_zhmaj9w00ag",
    "readings": [
      {
        "rod_id": "asdasdsa",
        "secret": "AEAMS_SECRET_zhmaj9w00ag",
        "timestamp": "2025-08-25T14:30:00Z",
        "temperature": 23.5,
        "moisture": 45.2,
        "ph": 6.8,
        "conductivity": 1.2,
        "nitrogen": 12.5,
        "phosphorus": 8.3,
        "potassium": 15.7
      }
    ]
  }'
```

## Benefits for China Access

1. **GitHub Pages**: Generally accessible in China
2. **API Flexibility**: Choose API hosting with better China connectivity
3. **Database**: Keep your existing database setup
4. **Same Functionality**: Full feature parity with original deployment

## Local Development

```bash
# Regular development (with API routes)
npm run dev

# Test static build (GitHub Pages simulation)
GITHUB_PAGES=true npm run build
npx serve out
```
