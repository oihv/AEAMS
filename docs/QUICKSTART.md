# ⚡ EAEMS Quick Start

Get EAEMS running in 5 minutes!

## 🚀 One-Command Setup

**Windows:**
```bash
git clone https://github.com/CodeNewb13/EAEMS.git && cd EAEMS && setup.bat
```

**Mac/Linux:**
```bash
git clone https://github.com/CodeNewb13/EAEMS.git && cd EAEMS && chmod +x setup.sh && ./setup.sh
```

## 🔧 Manual Setup (if script fails)

```bash
# 1. Clone and install
git clone https://github.com/CodeNewb13/EAEMS.git
cd EAEMS
npm install

# 2. Environment setup
cp .env.example .env
# Edit .env and add your NEXTAUTH_SECRET

# 3. Database setup
npx prisma generate
npx prisma db push

# 4. Run
npm run dev
```

## 🎯 Access Points

- **App**: http://localhost:3000
- **Database**: http://localhost:5555 (run `npx prisma studio`)

## 🔑 Essential Environment Variables

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
```

## 🐛 Common Issues

**Database connection failed?**
- Check your DATABASE_URL is correct
- For local dev, ensure your PostgreSQL/Supabase is running

**Authentication not working?**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain

**Build failing?**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

---

📖 **Need detailed docs?** See [README.md](./README.md)
