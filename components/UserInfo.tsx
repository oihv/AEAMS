"use client"

import { useSession, signOut } from "next-auth/react"

export default function UserInfo() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Please sign in</div>
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">User Information</h3>
      <div className="space-y-2">
        <p><strong>Name:</strong> {session.user?.name || "Not provided"}</p>
        <p><strong>Email:</strong> {session.user?.email}</p>
        <p><strong>ID:</strong> {session.user?.id}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Sign Out
      </button>
    </div>
  )
}
