import Link from "next/link";
import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to EAEMS
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Enterprise Application with Authentication Management System
          </p>
        </div>

        {session?.user ? (
          <div className="text-center">
            <p className="text-green-600 mb-4">
              Welcome back, {session.user.name || session.user.email}!
            </p>
            <Link
              href="/dashboard"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-indigo-600 text-white gap-2 hover:bg-indigo-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 items-center flex-col sm:flex-row">
            <Link
              href="/auth/signin"
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-indigo-600 text-white gap-2 hover:bg-indigo-700 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full border border-solid border-gray-300 transition-colors flex items-center justify-center hover:bg-gray-50 font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            >
              Sign Up
            </Link>
          </div>
        )}

        <div className="max-w-2xl text-center">
          <h2 className="text-2xl font-semibold mb-4">Features</h2>
          <ul className="text-left space-y-2 text-gray-600">
            <li>✅ Secure user authentication with NextAuth.js</li>
            <li>✅ User registration and login</li>
            <li>✅ Protected routes and pages</li>
            <li>✅ Session management</li>
            <li>✅ Password hashing with bcrypt</li>
            <li>✅ SQLite database with Prisma ORM</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
