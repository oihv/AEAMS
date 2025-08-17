import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const startTime = Date.now()
  
  try {
    console.log("🏥 Supabase Health Check Started")
    
    // 1. Environment Variables Check
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV
    }
    
    console.log("🔧 Environment variables:", envCheck)
    
    // 2. Database URL Analysis
    let dbAnalysis = null
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL)
        dbAnalysis = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          database: url.pathname.slice(1),
          isSupabase: url.hostname.includes('supabase.com'),
          isPooler: url.hostname.includes('pooler'),
          region: url.hostname.includes('ap-southeast') ? 'ap-southeast' : 'unknown'
        }
        console.log("🗄️ Database URL analysis:", dbAnalysis)
      } catch (e) {
        console.error("❌ Failed to parse DATABASE_URL:", e)
        dbAnalysis = { error: "Invalid DATABASE_URL format" }
      }
    }
    
    // 3. Connection Speed Test
    console.log("⚡ Testing connection speed...")
    const connectionStart = Date.now()
    await prisma.$queryRaw`SELECT 1 as ping`
    const connectionTime = Date.now() - connectionStart
    console.log(`🚀 Connection time: ${connectionTime}ms`)
    
    // 4. Database Schema Check
    console.log("📋 Checking database schema...")
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log("📊 Available tables:", tables)
    
    // 5. User Table Health
    console.log("👥 Checking users table...")
    const userStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN password IS NOT NULL THEN 1 END) as users_with_passwords,
        COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_users
      FROM users
    `
    console.log("📊 User statistics:", userStats)
    
    // 6. Sessions/Accounts Check
    const sessionCount = await prisma.session.count()
    const accountCount = await prisma.account.count()
    
    console.log(`🔐 Auth data: ${sessionCount} sessions, ${accountCount} accounts`)
    
    const totalTime = Date.now() - startTime
    console.log(`✅ Health check completed in ${totalTime}ms`)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      performance: {
        totalTime: totalTime + 'ms',
        connectionTime: connectionTime + 'ms'
      },
      environment: envCheck,
      database: {
        analysis: dbAnalysis,
        tables,
        userStats,
        sessionCount,
        accountCount
      },
      status: 'HEALTHY'
    })
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime
    console.error("💥 Supabase health check failed:", error)
    
    // Enhanced error analysis
    let errorAnalysis: any = {
      type: error.constructor.name,
      message: error.message,
      code: error.code,
      meta: error.meta
    }
    
    // Common Supabase/PostgreSQL error patterns
    if (error.message?.includes('ENOTFOUND')) {
      errorAnalysis.likely_cause = 'DNS resolution failed - check DATABASE_URL hostname'
    } else if (error.message?.includes('ETIMEDOUT')) {
      errorAnalysis.likely_cause = 'Connection timeout - network or firewall issue'
    } else if (error.message?.includes('authentication failed')) {
      errorAnalysis.likely_cause = 'Invalid database credentials in DATABASE_URL'
    } else if (error.message?.includes('database') && error.message?.includes('does not exist')) {
      errorAnalysis.likely_cause = 'Database name in DATABASE_URL is incorrect'
    } else if (error.code === 'P1001') {
      errorAnalysis.likely_cause = 'Cannot reach database server - check network/firewall'
    } else if (error.code === 'P1008') {
      errorAnalysis.likely_cause = 'Database connection timeout'
    }
    
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        performance: {
          totalTime: totalTime + 'ms'
        },
        error: errorAnalysis,
        environment: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
          NODE_ENV: process.env.NODE_ENV
        },
        status: 'UNHEALTHY'
      },
      { status: 500 }
    )
  }
}
