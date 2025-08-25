import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // Only log important security events in production
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    console.log("�️ Middleware:", request.nextUrl.pathname)
  }
  
  // Get authentication token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'
  })
  
  if (isDev && !token) {
    console.log("❌ No auth token found")
  }
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // If trying to access a protected route without authentication
  if (isProtectedRoute && !token) {
    if (isDev) {
      console.log("❌ Redirecting to signin - no token for protected route")
    }
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // If authenticated user tries to access auth pages, redirect to dashboard
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  if (isAuthRoute && token) {
    if (isDev) {
      console.log("✅ Redirecting authenticated user to dashboard")
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api/auth (auth API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
