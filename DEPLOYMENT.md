# Production Deployment Guide

## 🚀 Vercel Deployment

### Prerequisites for Production

Since Vercel is a serverless platform, SQLite databases don't persist between deployments. You'll need to use a cloud database for production.

### Recommended Cloud Databases (Free Tiers Available):

#### 1. **Supabase PostgreSQL (Recommended)**
1. Go to [supabase.com](https://supabase.com) and create a project
2. Get your database URL from Settings > Database
3. Set environment variables in Vercel:
   ```env
   DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
   NEXTAUTH_URL="https://your-app.vercel.app"
   NEXTAUTH_SECRET="your-production-secret"
   ```

#### 2. **PlanetScale MySQL**
1. Go to [planetscale.com](https://planetscale.com) and create a database
2. Get your connection string
3. Set environment variables in Vercel:
   ```env
   DATABASE_URL="mysql://username:password@host:3306/database?sslaccept=strict"
   ```

#### 3. **Railway PostgreSQL**
1. Go to [railway.app](https://railway.app) and create a PostgreSQL database
2. Copy the connection string
3. Set environment variables in Vercel

### Deployment Steps:

1. **Update your schema.prisma for production database:**
   ```prisma
   datasource db {
     provider = "postgresql"  // or "mysql" for PlanetScale
     url      = env("DATABASE_URL")
   }
   ```

2. **Push changes to GitHub:**
   ```bash
   git add .
   git commit -m "feat: add production database support"
   git push origin main
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - Go to your Vercel project settings
   - Add these environment variables:
     - `DATABASE_URL` (your cloud database URL)
     - `NEXTAUTH_URL` (your deployed app URL)
     - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)

4. **Deploy:**
   Vercel will automatically deploy from your GitHub repository.

### Database Migration for Production:

After setting up your cloud database, run:
```bash
npx prisma db push
```

This will create all the necessary tables in your production database.

## 🔧 Local Development with Production Database

If you want to test with the production database locally:

1. Copy your production DATABASE_URL to your local `.env`
2. Run `npx prisma db push`
3. Run `npm run dev`

## 📝 Environment Variables Summary:

### Local Development (.env):
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_local_secret
DATABASE_URL="file:./prisma/dev.db"
```

### Production (Vercel Dashboard):
```env
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_production_secret
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
```

## ⚡ Quick Fix for Current Deployment:

For immediate deployment, you can temporarily use:
1. Create a free Supabase account
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Add it as DATABASE_URL in Vercel environment variables
6. Redeploy your app

The app will then work in production with a persistent database!
