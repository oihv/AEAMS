import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"

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
        } catch (error: any) {
          console.error("💥 Supabase auth error:", {
            name: error.name,
            message: error.message,
            code: error.code,
            meta: error.meta
          })
          
          // Specific Supabase error handling
          if (error.code === 'P1001') {
            console.error("🚨 Cannot reach Supabase database - check network connection")
          } else if (error.code === 'P1008') {
            console.error("🚨 Supabase connection timeout")
          } else if (error.message?.includes('ENOTFOUND')) {
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
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("🎫 JWT callback - token exists:", !!token)
      console.log("🎫 JWT callback - user exists:", !!user)
      
      if (user) {
        console.log("👤 Adding user to token:", { id: user.id, email: user.email })
        token.id = user.id
      }
      
      console.log("🎫 Final token:", { id: token.id, email: token.email, exp: token.exp })
      return token
    },
    async session({ session, token }) {
      console.log("🔐 Session callback - session exists:", !!session)
      console.log("🔐 Session callback - token exists:", !!token)
      
      if (session.user && token) {
        console.log("👤 Adding token ID to session:", token.id)
        session.user.id = token.id as string
      }
      
      console.log("🔐 Final session:", { 
        user: session.user ? { id: session.user.id, email: session.user.email } : null,
        expires: session.expires 
      })
      return session
    }
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error: (error: Error) => {
      console.error("🚨 NextAuth Error:", error)
    },
    warn: (code: string) => {
      console.warn("⚠️ NextAuth Warning:", code)
    },
    debug: (code: string, metadata?: any) => {
      console.log("🔍 NextAuth Debug:", code, metadata)
    }
  }
})
