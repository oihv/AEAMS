# EAEMS - Next.js Authentication System

A modern full-stack authentication system built with Next.js 15, NextAuth.js v5, Prisma ORM, and PostgreSQL database.

## 📚 Quick Navigation

- 🚀 [Quick Start](./QUICKSTART.md) - Get running in 5 minutes
- 🔧 [Troubleshooting](./TROUBLESHOOTING.md) - Common issues & solutions  
- 📤 [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- 🤝 [Contributing](./CONTRIBUTING.md) - How to contribute

## 🚀 Features

- **🔐 Complete Authentication System**: Sign up, sign in, sign out functionality
- **🎨 Modern UI/UX**: Minimalist design with TailwindCSS and smooth animations
- **🛡️ Secure**: Password hashing with bcryptjs, JWT sessions with NextAuth.js v5
- **📊 Database Management**: PostgreSQL database with Prisma ORM and Supabase hosting
- **🔒 Protected Routes**: Middleware-based route protection
- **⚡ Fast Development**: Built with Next.js 15 and Turbopack

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Authentication**: NextAuth.js v5 (beta)
- **Database**: PostgreSQL with Prisma ORM (Supabase recommended)
- **Styling**: TailwindCSS v4
- **Language**: TypeScript
- **Security**: bcryptjs for password hashing

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (version 18.0 or later)
- **npm** or **yarn** or **pnpm**
- **Git**

## ⚙️ Installation & Setup

### 🚀 Quick Setup (Recommended)

For the fastest setup, use our automated setup scripts:

#### **Windows Users:**
```bash
git clone https://github.com/CodeNewb13/EAEMS.git
cd EAEMS
setup.bat
```

#### **Mac/Linux Users:**
```bash
git clone https://github.com/CodeNewb13/EAEMS.git
cd EAEMS
chmod +x setup.sh
./setup.sh
```

The setup script will automatically:
- ✅ Check for Node.js and npm
- ✅ Install all dependencies
- ✅ Create `.env` file from template
- ✅ Set up the database
- ✅ Generate Prisma client

### 🛠️ Manual Setup (Alternative)

If you prefer to set up manually or the automated script doesn't work:

#### 1. Clone the Repository

```bash
git clone https://github.com/CodeNewb13/EAEMS.git
cd EAEMS
```

#### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

#### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_super_secret_key_here_make_it_long_and_random

# Database Configuration
DATABASE_URL="file:./prisma/dev.db"
```

> **Important**: Replace `your_super_secret_key_here_make_it_long_and_random` with a secure random string. You can generate one using:
> ```bash
> openssl rand -base64 32
> ```

#### 4. Database Setup

Initialize the database and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Create and sync the database
npx prisma db push
```

#### 5. Start the Development Servers

#### Start the Next.js Application
```bash
npm run dev
```
The application will be available at: **http://localhost:3000**

#### Start Prisma Studio (Database Interface)
Open a new terminal and run:
```bash
npx prisma studio
```
Prisma Studio will be available at: **http://localhost:5555**

## 🗂️ Project Structure

```
EAEMS/
├── 📁 app/                    # Next.js App Router
│   ├── 🔐 auth/              # Authentication pages
│   │   ├── signin/           # Sign in page
│   │   └── signup/           # Sign up page
│   ├── 📊 dashboard/         # Protected dashboard
│   ├── 🔌 api/               # API routes
│   │   ├── auth/             # NextAuth.js endpoints
│   │   ├── health/           # Health check
│   │   ├── test-db/          # Database test
│   │   └── ...               # Other API routes
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── 🧩 components/            # Reusable React components
│   ├── auth/                 # Authentication components
│   └── UserInfo.tsx          # User information display
├── 📚 lib/                   # Utility libraries
│   └── prisma.ts             # Database client
├── 🗄️ prisma/                # Database schema & config
│   └── schema.prisma         # Prisma schema
├── 🎨 types/                 # TypeScript type definitions
│   └── next-auth.d.ts        # NextAuth.js types
├── ⚙️ auth.ts                # Authentication configuration
├── 🛡️ middleware.ts          # Route protection middleware
├── 📋 package.json           # Dependencies & scripts
├── 🔧 setup.bat/.sh          # Automated setup scripts
├── 📖 README.md              # This file
├── 🚀 QUICKSTART.md          # Quick setup guide
├── 🔧 TROUBLESHOOTING.md     # Common issues & solutions
├── 📤 DEPLOYMENT.md          # Production deployment guide
└── 🤝 CONTRIBUTING.md        # Contribution guidelines
```

## 🔧 Configuration Details

### Database Schema

The application uses the following database models:

- **User**: Store user information (id, name, email, password)
- **Account**: OAuth account information
- **Session**: User session management
- **VerificationToken**: Email verification tokens

### Authentication Flow

1. **Registration**: Users can create accounts with email/password
2. **Login**: Secure authentication with hashed passwords
3. **Session Management**: JWT-based sessions with NextAuth.js
4. **Route Protection**: Middleware protects authenticated routes

### Protected Routes

- `/dashboard` - Requires authentication
- `/auth/*` - Redirects authenticated users to dashboard

## 🚨 Troubleshooting

### Database Issues

If you encounter database connection errors:

```bash
# Stop all Node processes
taskkill /F /IM node.exe

# Remove existing database
rm prisma/dev.db

# Recreate database
npx prisma db push

# Restart servers
npm run dev
npx prisma studio
```

### Port Conflicts

If ports 3000 or 5555 are in use:

```bash
# For Next.js on different port
npm run dev -- -p 3001

# For Prisma Studio on different port
npx prisma studio --port 5556
```

## 📝 Available Scripts

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🎯 Usage

### Creating a User Account

1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Fill in your details (name, email, password)
4. Submit the form
5. You'll be redirected to the dashboard upon successful registration

### Viewing Database

1. Open Prisma Studio at http://localhost:5555
2. Browse the `User` table to see registered users
3. View other tables for session and account data

### Accessing Protected Routes

- Visit `/dashboard` - requires authentication
- If not logged in, you'll be redirected to sign-in page
- After authentication, you'll have access to protected content

## 🔒 Security Features

- **Password Hashing**: Uses bcryptjs with salt rounds
- **JWT Sessions**: Secure session management
- **CSRF Protection**: Built-in NextAuth.js protection
- **Environment Variables**: Sensitive data in `.env`
- **Route Protection**: Middleware-based access control

## 🚀 Deployment

## 🚀 Deployment

**Note**: SQLite doesn't work on serverless platforms like Vercel. For production deployment, you need a cloud database.

### Quick Vercel Deployment:

1. **Set up a cloud database** (Supabase PostgreSQL recommended)
2. **Update environment variables** in Vercel dashboard:
   ```env
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your_production_secret_key
   DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
   ```
3. **Update schema.prisma** for PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

📖 **Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Build Commands

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **CodeNewb13** - *Initial work* - [GitHub](https://github.com/CodeNewb13)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- NextAuth.js for authentication solutions
- Prisma for the excellent ORM
- TailwindCSS for styling capabilities

---

**Happy Coding! 🎉**
