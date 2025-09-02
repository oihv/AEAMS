import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"

interface PrismaError extends Error {
  code?: string
  meta?: unknown
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "Enter your email" 
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password"
        }
      },
      async authorize(credentials) {
        console.log("🔐 Auth attempt for:", credentials?.email) // Debug log
        console.log("🗄️ Database connection status check...")

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        try {
          // Test Supabase connection first
          console.log("🚀 Testing Supabase connection...")
          await prisma.$queryRaw`SELECT 1`
          console.log("✅ Supabase connection successful")

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email as string
            }
          })

          if (!user || !user.password) {
            console.log("❌ User not found or no password set")
            return null
          }

          console.log("🔍 User found, verifying password...")
          
          // Verify password
          const isValidPassword = await bcryptjs.compare(
            credentials.password as string,
            user.password
          )

          if (!isValidPassword) {
            console.log("❌ Invalid password")
            return null
          }

          console.log("✅ Authentication successful for:", user.email)
          
          // Return user object - this becomes the JWT token payload
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.email, // Using email as name for now
          }
        } catch (error: unknown) {
          const e = error as PrismaError
          console.error("🚨 Auth error:", {
            message: e.message,
            code: e.code,
            meta: e.meta
          })
          
          if (e.code === 'P1001') {
            console.error("🔌 Database connection failed - check your DATABASE_URL")
          }
          
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }

      if (process.env.NODE_ENV === 'development') {
        console.log("🎫 JWT token updated:", { id: token.id, email: token.email })
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }

      if (process.env.NODE_ENV === 'development') {
        console.log("🔐 Session updated:", {
          user: session.user ? { id: session.user.id, email: session.user.email } : null
        })
      }
      return session
    }
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error: (error: Error) => {
      console.error("🚨 NextAuth Error:", error)
    },
    warn: (code: string) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn("⚠️ NextAuth Warning:", code)
      }
    },
    debug: (code: string, metadata?: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔍 NextAuth Debug:", code, metadata)
      }
    }
  }
})
