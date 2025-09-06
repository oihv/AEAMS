# 🔧 EAEMS Troubleshooting Guide

Common issues and solutions for EAEMS development.

## 🗄️ Database Issues

### "Database connection failed"
```bash
# Check if your database is running
npm run db:check
# or manually:
npx prisma db push
```

**Solutions:**
1. Verify `DATABASE_URL` in `.env`
2. For Supabase: Check project status in dashboard
3. For local PostgreSQL: Ensure service is running

### "Table doesn't exist"
```bash
# Reset and push schema
npx prisma db push --force-reset
```

### "Prisma client out of sync"
```bash
# Regenerate client
npx prisma generate
```

## 🔐 Authentication Issues

### "NextAuth session not working"
**Check:**
1. `NEXTAUTH_SECRET` is set in `.env`
2. `NEXTAUTH_URL` matches your domain
3. Clear browser cookies and try again

### "Credentials provider not working"
```bash
# Check auth configuration
node -e "console.log('NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET)"
```

## 📦 Dependency Issues

### "Module not found" errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### "Prisma binary issues"
```bash
# Regenerate Prisma client
npx prisma generate --force
```

## 🌐 Development Server Issues

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

### Turbopack issues
```bash
# Use standard webpack
npm run dev:webpack
# Add to package.json: "dev:webpack": "next dev"
```

## 🔍 Debugging Commands

```bash
# Check environment
npm run env:check

# Test database connection
npm run db:test

# Check authentication status
npm run auth:debug

# View logs
npm run dev -- --debug
```

## 📋 Health Check Script

Create these npm scripts in `package.json`:

```json
{
  "scripts": {
    "health": "node -e \"console.log('Node:', process.version); console.log('Env loaded:', !!process.env.DATABASE_URL)\"",
    "db:check": "npx prisma db push --dry-run",
    "env:check": "node -e \"console.log('Required vars:', {NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET, DATABASE_URL: !!process.env.DATABASE_URL})\""
  }
}
```

## 🆘 When All Else Fails

1. **Full reset:**
   ```bash
   rm -rf node_modules .next prisma/dev.db*
   npm install
   npx prisma generate
   npx prisma db push
   ```

2. **Check the logs:**
   - Browser console for client errors
   - Terminal for server errors
   - Vercel dashboard for deployment errors

3. **Environment verification:**
   ```bash
   cat .env  # Check your environment variables
   node --version  # Ensure Node.js 18+
   npm ls  # Check for dependency conflicts
   ```

## 📞 Getting Help

- **Issues**: [GitHub Issues](https://github.com/CodeNewb13/EAEMS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CodeNewb13/EAEMS/discussions)
- **Documentation**: Check README.md and DEPLOYMENT.md

---

💡 **Tip**: Always check the console logs first - they usually point to the exact problem!
