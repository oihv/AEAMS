import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '***SET***' : 'MISSING',
    DATABASE_URL: process.env.DATABASE_URL ? '***SET***' : 'MISSING',
    HF_TOKEN: process.env.HF_TOKEN ? '***SET***' : 'MISSING',
  }

  return NextResponse.json(envVars)
}