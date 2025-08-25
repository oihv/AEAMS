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
            console.log("❌ User not found or no password:", credentials.email)
            console.log("📊 Available users count:", await prisma.user.count())
            return null
          }

          console.log("👤 User found:", { id: user.id, email: user.email, hasPassword: !!user.password })

          const isPasswordValid = await bcryptjs.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            console.log("❌ Invalid password for:", credentials.email)
            return null
          }

          console.log("✅ Auth success for:", user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error: unknown) {
          const dbError = error as PrismaError
          console.error("💥 Supabase auth error:", {
            name: dbError.name,
            message: dbError.message,
            code: dbError.code,
            meta: dbError.meta
          })
          
          // Specific Supabase error handling
          if (dbError.code === 'P1001') {
            console.error("🚨 Cannot reach Supabase database - check network connection")
          } else if (dbError.code === 'P1008') {
            console.error("🚨 Supabase connection timeout")
          } else if (dbError.message?.includes('ENOTFOUND')) {
            console.error("🚨 DNS resolution failed for Supabase hostname")
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
