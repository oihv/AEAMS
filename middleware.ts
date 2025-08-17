import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  console.log("🛡️ Middleware triggered for:", request.nextUrl.pathname)
  console.log("🌐 Request URL:", request.url)
  console.log("🏠 Request hostname:", request.nextUrl.hostname)
  
  // Debug cookies in detail
  const cookies = request.cookies.getAll()
  console.log("🍪 Total cookies count:", cookies.length)
  console.log("🍪 All cookies:", cookies.map(c => ({ 
    name: c.name, 
    hasValue: !!c.value,
    valueLength: c.value?.length || 0
  })))
  
  // Check for NextAuth cookies specifically
  const nextAuthCookies = cookies.filter(c => 
    c.name.includes('next-auth') || 
    c.name.includes('__Secure-next-auth') ||
    c.name.includes('__Host-next-auth') ||
    c.name.startsWith('next-auth.')
  )
  console.log("🔐 NextAuth cookies found:", nextAuthCookies.length)
  console.log("🔐 NextAuth cookie details:", nextAuthCookies.map(c => ({ 
    name: c.name, 
    hasValue: !!c.value,
    valueLength: c.value?.length || 0,
    startsWithJWT: c.value?.startsWith('eyJ') || false
  })))
  
  // Use getToken with detailed debugging
  console.log("🔍 Attempting to get token...")
  console.log("🔐 NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET)
  console.log("🔗 NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
  
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'
  })
  
  console.log("🔑 Token exists:", !!token)
  if (token) {
    console.log("🎫 Token details:", { 
      email: token.email, 
      id: token.id, 
      exp: token.exp,
      expDate: new Date((token.exp as number) * 1000).toISOString()
    })
  } else {
    console.log("❌ No token found - debugging details:")
    console.log("   - NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET)
    console.log("   - NEXTAUTH_SECRET length:", process.env.NEXTAUTH_SECRET?.length || 0)
    console.log("   - NEXTAUTH_URL:", process.env.NEXTAUTH_URL)
    console.log("   - Request domain:", request.nextUrl.hostname)
    console.log("   - Cookie domain matches:", request.nextUrl.hostname.includes(process.env.NEXTAUTH_URL?.replace('https://', '') || ''))
    
    // Try alternative cookie names
    console.log("🔍 Trying alternative token extraction...")
    const altToken = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: 'next-auth.session-token'
    })
    console.log("🔄 Alternative token found:", !!altToken)
  }
  
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
    console.log("🔄 Redirect URL:", new URL('/auth/signin', request.url).toString())
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
