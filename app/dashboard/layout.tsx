import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { NotificationProvider } from "@/components/NotificationProvider"
import DashboardNavbar from "@/components/DashboardNavbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Dashboard Navigation */}
        <DashboardNavbar 
          userName={session.user.name || session.user.email || 'User'} 
        />

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {children}
          </div>
        </main>
      </div>
    </NotificationProvider>
  )
}
