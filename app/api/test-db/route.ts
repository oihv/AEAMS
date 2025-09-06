import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔍 Testing Supabase database connection...")
    console.log("📍 DATABASE_URL exists:", !!process.env.DATABASE_URL)
    console.log("🔐 NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET)
    console.log("🌐 Environment:", process.env.NODE_ENV)
    
    // Parse DATABASE_URL to check connection details
    if (process.env.DATABASE_URL) {
      try {
        const dbUrl = new URL(process.env.DATABASE_URL)
        console.log("🗄️ Supabase connection details:", {
          protocol: dbUrl.protocol,
          hostname: dbUrl.hostname,
          port: dbUrl.port,
          database: dbUrl.pathname?.slice(1),
          hasUsername: !!dbUrl.username,
          hasPassword: !!dbUrl.password
        })
      } catch (parseError) {
        console.error("❌ Failed to parse DATABASE_URL:", parseError)
      }
    }
    
    // Test Prisma client initialization
    console.log("⚙️ Testing Prisma client...")
    
    // Test basic connection with timeout
    const connectionTest = await Promise.race([
      prisma.$queryRaw`SELECT 1 as test`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 10000)
      )
    ])
    
    console.log("✅ Raw query test passed:", connectionTest)
    
    // Test user table access
    console.log("👥 Testing user table access...")
    const userCount = await prisma.user.count()
    console.log("📊 User count:", userCount)
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        password: true, // Check if passwords exist
      }
    })

    console.log("📝 Users found:", users.map((u: { id: string; name: string; email: string; createdAt: Date; password: string | null }) => ({
      ...u,
      hasPassword: !!u.password,
      password: u.password ? '[HIDDEN]' : null
    })))

    return NextResponse.json({
      success: true,
      message: `Supabase database connected successfully`,
      supabaseInfo: {
        userCount,
        users: users.map((u: { id: string; name: string; email: string; createdAt: Date; password: string | null }) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          hasPassword: !!u.password
        })),
        connectionTest: 'PASSED'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
        dbUrlLength: process.env.DATABASE_URL?.length || 0
      }
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Database connection failed", 
        details: error instanceof Error ? error.message : "Unknown error",
        databasePath: process.env.DATABASE_URL
      },
      { status: 500 }
    )
  }
}
