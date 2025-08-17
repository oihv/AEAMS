import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()

  return (
    <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to your Dashboard!
        </h2>
        <p className="text-gray-600 mb-4">
          You are successfully logged in as <strong>{session?.user?.email}</strong>
        </p>
        <div className="bg-green-50 border border-green-200 rounded-md p-4 max-w-md mx-auto">
          <p className="text-green-800 text-sm">
            Authentication is working! This is a protected page that only authenticated users can see.
          </p>
        </div>
      </div>
    </div>
  )
}
