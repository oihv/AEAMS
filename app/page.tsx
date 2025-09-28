import Link from "next/link";
import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center px-4">
      <main className="w-full max-w-md mx-auto">
        
        {/* Animated Title Section */}
        <div className="text-center mb-12 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_forwards]">
          <div className="mb-8">
            <div className="w-12 h-12 mx-auto mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-3">
              Welcome to <span className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AEAMS</span>
            </h1>
            <p className="text-gray-500 text-sm font-light leading-relaxed">
              Authentication Management System
            </p>
          </div>
        </div>

        {session?.user ? (
          /* Logged In State - Animated */
          <div className="text-center opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Welcome back
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                {session.user.name || session.user.email}
              </p>
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Continue to Dashboard
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          /* Login/Signup State - Animated */
          <div className="space-y-4 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_0.2s_forwards]">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-medium text-gray-900 text-center mb-6">
                Get Started
              </h2>
              
              <div className="space-y-3">
                <Link
                  href="/auth/signin"
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transform"
                >
                  Sign In
                </Link>
                
                <Link
                  href="/auth/signup"
                  className="w-full inline-flex items-center justify-center px-6 py-3.5 border border-gray-200 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 hover:-translate-y-0.5 transform"
                >
                  Create Account
                </Link>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  Secure • Fast • Reliable
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Animated Footer */}
        <div className="text-center mt-8 opacity-0 translate-y-8 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards]">
          <p className="text-xs text-gray-400">
            © 2025 AEAMS. Built for the future.
          </p>
        </div>
        
      </main>
    </div>
  );
}
