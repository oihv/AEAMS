import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
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
      databasePath: process.env.DATABASE_URL
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
