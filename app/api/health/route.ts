import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic functionality
    const timestamp = new Date().toISOString()
    
    // Test environment variables
    const hasDatabase = !!process.env.DATABASE_URL
    const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
    const hasNextAuthUrl = !!process.env.NEXTAUTH_URL
    
    return NextResponse.json({
      status: 'ok',
      timestamp,
      environment: {
        hasDatabase,
        hasNextAuthSecret,
        hasNextAuthUrl,
        databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Missing',
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
