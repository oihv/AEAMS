import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables that NextAuth uses
    const envVars = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "✅ Set" : "❌ Missing",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "✅ Set" : "❌ Missing",
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      NODE_ENV: process.env.NODE_ENV || "❌ Missing"
    }

    // Check if NEXTAUTH_SECRET has the right format
    let secretStatus = "❌ Invalid"
    if (process.env.NEXTAUTH_SECRET) {
      const secret = process.env.NEXTAUTH_SECRET
      if (secret.length >= 32) {
        secretStatus = "✅ Valid length"
      } else {
        secretStatus = `❌ Too short (${secret.length} chars, need 32+)`
      }
    }

    // Check if DATABASE_URL has the right format  
    let dbStatus = "❌ Invalid"
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL
      if (dbUrl.startsWith('postgresql://')) {
        dbStatus = "✅ Valid PostgreSQL format"
      } else {
        dbStatus = `❌ Invalid format (starts with: ${dbUrl.substring(0, 10)}...)`
      }
    }

    return NextResponse.json({
      message: "Environment variable check",
      variables: envVars,
      details: {
        nextauth_secret: secretStatus,
        database_url: dbStatus
      },
      potential_issues: [
        "Check for escaped quotes in environment variables",
        "Ensure NEXTAUTH_SECRET is 32+ characters",
        "Verify DATABASE_URL format",
        "Check for trailing spaces or newlines"
      ]
    })

  } catch (error) {
    console.error("Environment check error:", error)
    return NextResponse.json(
      { error: "Failed to check environment variables" },
      { status: 500 }
    )
  }
}
