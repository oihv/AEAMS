"use client"

import { useState } from "react"

interface MainRodConnectionProps {
  farmId: string
  onClose: () => void
  onConnected: () => void
}

export default function MainRodConnection({ farmId, onClose, onConnected }: MainRodConnectionProps) {
  const [rodId, setRodId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/main-rods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmId,
          rodId: rodId.trim(),
        }),
      })

      if (response.ok) {
        onConnected()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to connect main rod")
      }
    } catch (error) {
      console.error("Rod connection error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Connect Main Rod</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-blue-400 text-xl mr-3">📡</div>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Setup Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Power on your main rod device</li>
                  <li>2. Connect it to your farm&apos;s WiFi network</li>
                  <li>3. Find the rod ID on the device label</li>
                  <li>4. Enter the rod ID below</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="rodId" className="block text-sm font-medium text-gray-900 mb-1">
              Rod ID *
            </label>
            <input
              id="rodId"
              type="text"
              value={rodId}
              onChange={(e) => setRodId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-gray-900 placeholder:text-gray-500"
              placeholder="e.g., MAIN-2024-001"
            />
            <p className="text-xs text-gray-500 mt-1">
              Rod ID is usually printed on a label on the device
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !rodId.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Connecting..." : "Connect Rod"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}