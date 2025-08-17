import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getToken } from "next-auth/jwt"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug auth endpoint called")
    
    // Check server-side session
    const session = await auth()
    
    // Check JWT token (used by middleware)
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    // Environment check
    const envCheck = {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
      authUrl: process.env.NEXTAUTH_URL,
    }
    
    console.log("🔐 Auth debug results:", {
      hasSession: !!session,
      hasToken: !!token,
      envCheck
    })
    
    return NextResponse.json({
      success: true,
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      token: token ? {
        email: token.email,
        id: token.id,
        exp: token.exp
      } : null,
      environment: envCheck,
      cookies: request.cookies.getAll().map(cookie => ({
        name: cookie.name,
        hasValue: !!cookie.value
      }))
    })
    
  } catch (error) {
    console.error("💥 Auth debug error:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Auth debug failed", 
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
