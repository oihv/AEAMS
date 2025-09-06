import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Basic health check - app is running",
    timestamp: new Date().toISOString(),
    env_check: {
      node_env: process.env.NODE_ENV || "undefined",
      has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      has_database_url: !!process.env.DATABASE_URL,
      nextauth_secret_length: process.env.NEXTAUTH_SECRET?.length || 0
    }
  })
}
