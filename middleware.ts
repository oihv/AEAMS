import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  console.log("🛡️ Middleware triggered for:", request.nextUrl.pathname)
  
  // Use getToken instead of auth() to avoid Edge Runtime issues
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  console.log("🔑 Token exists:", !!token)
  console.log("🔐 NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET)
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  console.log("🛡️ Is protected route:", isProtectedRoute)
  
  // If trying to access a protected route without authentication
  if (isProtectedRoute && !token) {
    console.log("❌ Redirecting to signin - no token for protected route")
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }
  
  // If authenticated user tries to access auth pages, redirect to dashboard
  const authRoutes = ['/auth/signin', '/auth/signup']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  console.log("🔐 Is auth route:", isAuthRoute)
  
  if (isAuthRoute && token) {
    console.log("✅ Redirecting authenticated user to dashboard")
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  console.log("✅ Middleware allowing request to continue")
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
