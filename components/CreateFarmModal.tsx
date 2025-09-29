"use client"

import { useState } from "react"

interface CreateFarmModalProps {
  onClose: () => void
  onFarmCreated: () => void
}

export default function CreateFarmModal({ onClose, onFarmCreated }: CreateFarmModalProps) {
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")
  const [plantType, setPlantType] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Common plant types for agriculture
  const plantTypes = [
    "Tomatoes",
    "Lettuce",
    "Carrots",
    "Peppers",
    "Cucumbers",
    "Spinach",
    "Potatoes",
    "Onions",
    "Beans",
    "Corn",
    "Strawberries",
    "Herbs",
    "Other"
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/farms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          location: location || null,
          description: description || null,
          plantType,
        }),
      })

      if (response.ok) {
        onFarmCreated()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create farm")
      }
    } catch (error) {
      console.error("Farm creation error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Farm</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-1">
              Farm Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
              placeholder="Enter farm name"
            />
          </div>

          <div>
            <label htmlFor="plantType" className="block text-sm font-medium text-gray-900 mb-1">
              Plant Type *
            </label>
            <select
              id="plantType"
              value={plantType}
              onChange={(e) => setPlantType(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
            >
              <option value="">Select plant type</option>
              {plantTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-900 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
              placeholder="Enter location (optional)"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder:text-gray-500"
              placeholder="Enter description (optional)"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
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
              disabled={isLoading || !name.trim() || !plantType}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Creating..." : "Create Farm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}