# EAEMS - Enterprise Authentication Management System

A Next.js application with a complete user authentication system using NextAuth.js v5, Prisma, and SQLite.

## Features

- 🔐 **Secure Authentication**: NextAuth.js v5 with credentials provider
- 👤 **User Registration**: Complete signup flow with password hashing
- 🗄️ **Database Integration**: Prisma ORM with SQLite database
- 🔒 **Protected Routes**: Middleware-based route protection
- 🎨 **Modern UI**: Tailwind CSS styling
- 📱 **Responsive Design**: Mobile-friendly authentication forms
- ⚡ **Session Management**: JWT-based sessions

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Copy `.env.local` and update the values:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
DATABASE_URL="file:./prisma/dev.db"
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication Flow

1. **Sign Up**: Navigate to `/auth/signup` to create a new account
2. **Sign In**: Navigate to `/auth/signin` to login
3. **Dashboard**: Access the protected dashboard at `/dashboard`
4. **Sign Out**: Use the sign out button to end your session

### API Endpoints

- `GET/POST /api/auth/[...nextauth]` - NextAuth.js authentication endpoints
- `POST /api/auth/register` - User registration endpoint

### Protected Routes

Routes that require authentication:
- `/dashboard` - User dashboard (automatically redirects to signin if not authenticated)

### Authentication Components

- `SignInForm` - Login form component
- `SignUpForm` - Registration form component  
- `AuthProvider` - Session provider wrapper
- `UserInfo` - Display user information and logout

## Database Schema

The application uses SQLite with the following main tables:

- `users` - User accounts with email, password (hashed), name
- `accounts` - OAuth account links (for future OAuth providers)
- `sessions` - User sessions
- `verificationtokens` - Email verification tokens

## Development

### Adding New Authentication Providers

To add OAuth providers (Google, GitHub, etc.), update `auth.ts`:

```typescript
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({...}),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  // ... rest of config
})
```

### Database Management

View your database:
```bash
npx prisma studio
```

Reset database:
```bash
npx prisma db push --force-reset
```

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ CSRF protection
- ✅ Secure session management
- ✅ Environment variable protection
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS protection (React JSX)

## Deployment

For production deployment:

1. Update `NEXTAUTH_SECRET` with a secure random string
2. Use a production database (PostgreSQL recommended)
3. Update `NEXTAUTH_URL` to your production domain
4. Set up proper SSL certificates

## License

MIT License
