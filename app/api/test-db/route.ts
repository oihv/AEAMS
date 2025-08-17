import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("🔍 Testing database connection...")
    console.log("📍 DATABASE_URL exists:", !!process.env.DATABASE_URL)
    console.log("🔐 NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET)
    
    // Test database connection by counting users
    const userCount = await prisma.user.count()
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Database connected successfully`,
      userCount,
      users,
      environment: process.env.NODE_ENV,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
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
