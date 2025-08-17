import { NextResponse } from "next/server"

export async function GET() {
  const envStatus = {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    isProduction: process.env.NODE_ENV === 'production',
    nextAuthUrl: process.env.NEXTAUTH_URL,
    secretPreview: process.env.NEXTAUTH_SECRET 
      ? `${process.env.NEXTAUTH_SECRET.substring(0, 8)}...${process.env.NEXTAUTH_SECRET.substring(-8)}`
      : 'NOT_SET'
  }

  console.log("🔐 NextAuth Secret Status:", envStatus)

  // Test JWT token generation capability
  let jwtTest = 'UNKNOWN'
  try {
    // This simulates what NextAuth does internally
    const crypto = require('crypto')
    if (process.env.NEXTAUTH_SECRET) {
      const testPayload = JSON.stringify({ test: 'data', iat: Math.floor(Date.now() / 1000) })
      const signature = crypto
        .createHmac('sha256', process.env.NEXTAUTH_SECRET)
        .update(testPayload)
        .digest('hex')
      jwtTest = signature ? 'CAN_SIGN_TOKENS' : 'CANNOT_SIGN_TOKENS'
    } else {
      jwtTest = 'NO_SECRET_CANNOT_SIGN'
    }
  } catch (error) {
    jwtTest = 'JWT_TEST_ERROR'
  }

  return NextResponse.json({
    success: true,
    environment: envStatus,
    jwtCapability: jwtTest,
    recommendations: {
      hasSecret: envStatus.hasNextAuthSecret,
      secretLength: envStatus.nextAuthSecretLength >= 32 ? 'ADEQUATE' : 'TOO_SHORT',
      productionReady: envStatus.hasNextAuthSecret && envStatus.nextAuthSecretLength >= 32
    }
  })
}
