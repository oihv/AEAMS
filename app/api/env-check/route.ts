import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Environment variables diagnostic...")
    
    const envDiagnostic = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_STARTS_WITH_POSTGRES: process.env.DATABASE_URL?.startsWith('postgresql://') || false,
      NEXTAUTH_SECRET_EXISTS: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_SECRET_LENGTH: process.env.NEXTAUTH_SECRET?.length || 0,
      NEXTAUTH_URL_EXISTS: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      // Partially show DATABASE_URL for debugging (hide credentials)
      DATABASE_URL_PREVIEW: process.env.DATABASE_URL 
        ? `${process.env.DATABASE_URL.substring(0, 20)}...${process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 20)}`
        : 'NOT_SET'
    }
    
    console.log("📊 Environment diagnostic:", envDiagnostic)
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envDiagnostic,
      message: "Environment variables check completed"
    })
    
  } catch (error: any) {
    console.error("💥 Environment check failed:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
