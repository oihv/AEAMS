"use client"

import { useState, useEffect } from "react"
import FarmCard from "@/components/FarmCard"
import CreateFarmModal from "@/components/CreateFarmModal"

interface Farm {
  id: string
  name: string
  location?: string
  description?: string
  mainRod?: {
    id: string
    rodId: string
    isConnected: boolean
    lastSeen?: string
    secondaryRods: Array<{
      id: string
      rodId: string
      name?: string
      location?: string
      readings: Array<{
        temperature?: number
        moisture?: number
        ph?: number
        conductivity?: number
        nitrogen?: number
        phosphorus?: number
        potassium?: number
        timestamp: string
      }>
    }>
  }
}

export default function FarmOverview() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchFarms = async () => {
    try {
      // Check if we're in GitHub Pages mode (no API routes available)
      const isGitHubPages = typeof window !== 'undefined' && 
        (window.location.hostname === 'codenewb13.github.io' || process.env.GITHUB_PAGES === 'true')
      
      if (isGitHubPages) {
        // For GitHub Pages, show demo data
        const demoFarms: Farm[] = [
          {
            id: 'demo-farm-1',
            name: 'Demo Greenhouse Farm',
            location: 'Virtual Location',
            description: 'This is a demonstration farm for GitHub Pages',
            mainRod: {
              id: 'demo-main-rod-1',
              rodId: 'justintul',
              isConnected: true,
              lastSeen: new Date().toISOString(),
              secondaryRods: [
                {
                  id: 'demo-secondary-1',
                  rodId: 'asdasdsa',
                  name: 'Greenhouse Sensor 1',
                  location: 'North Section',
                  readings: [
                    {
                      temperature: 23.5,
                      moisture: 45.2,
                      ph: 6.8,
                      conductivity: 1.2,
                      nitrogen: 12.5,
                      phosphorus: 8.3,
                      potassium: 15.7,
                      timestamp: new Date().toISOString()
                    }
                  ]
                },
                {
                  id: 'demo-secondary-2',
                  rodId: 'greenhouse_sensor_01',
                  name: 'Greenhouse Sensor 2',
                  location: 'South Section',
                  readings: [
                    {
                      temperature: 25.1,
                      moisture: 48.7,
                      ph: 7.1,
                      conductivity: 1.4,
                      nitrogen: 14.2,
                      phosphorus: 9.8,
                      potassium: 17.3,
                      timestamp: new Date().toISOString()
                    }
                  ]
                }
              ]
            }
          }
        ]
        setFarms(demoFarms)
      } else {
        // Normal API call for production
        const response = await fetch("/api/farms")
        if (response.ok) {
          const data = await response.json()
          setFarms(data.farms)
        }
      }
    } catch (error) {
      console.error("Error fetching farms:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFarms()
  }, [])

  const handleFarmCreated = () => {
    fetchFarms()
    setShowCreateModal(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading farms...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your Farms</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
        >
          + Add Farm
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🚜</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No farms yet</h3>
          <p className="text-gray-600 mb-6">Create your first farm to start monitoring your crops</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Create Your First Farm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateFarmModal
          onClose={() => setShowCreateModal(false)}
          onFarmCreated={handleFarmCreated}
        />
      )}
    </div>
  )
}