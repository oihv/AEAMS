import { auth } from "@/auth"
import { redirect } from "next/navigation"
import FarmOverview from "@/components/FarmOverview"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Farm Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, <strong>{session.user.email}</strong>
          </p>
        </div>
        
        <FarmOverview />
      </div>
    </div>
  )
}
