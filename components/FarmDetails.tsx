"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import MainRodConnection from "@/components/MainRodConnection"
import RodGrid from "@/components/RodGrid"
import AIRecommendations from "@/components/AIRecommendations"
import MLDashboard from "@/components/MLDashboard"
import { RodCardProps } from "@/components/RodCard"

interface FarmDetailsProps {
  initialFarm: {
    id: string
    name: string
    location?: string | null
    description?: string | null
    plantType?: string
    mainRod?: {
      id: string
      rodId: string
      isConnected: boolean
      lastSeen?: Date | string | null
      secondaryRods: Array<{
        id: string
        rodId: string
        name?: string | null
        location?: string | null
        positionX?: number | null
        positionY?: number | null
        isActive: boolean
        lastSeen?: Date | string | null
        readings: Array<{
          id: string
          temperature?: number | null
          moisture?: number | null
          ph?: number | null
          conductivity?: number | null
          nitrogen?: number | null
          phosphorus?: number | null
          potassium?: number | null
          timestamp: Date // Must be a date, not only string
        }>
      }>
    } | null
  }
}

export default function FarmDetails({ initialFarm }: FarmDetailsProps) {
  const [farm, setFarm] = useState(initialFarm)
  const [showMainRodConnection, setShowMainRodConnection] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const hasMainRod = !!farm.mainRod

  // Initialize lastUpdated on client side only to prevent hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date())
  }, [])

  // Function to fetch fresh farm data
  const refreshFarmData = async () => {
    if (isRefreshing) return // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/farms/${farm.id}`)
      if (response.ok) {
        const data = await response.json()
        setFarm(data.farm)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to refresh farm data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 1 minute when main rod is connected
  useEffect(() => {
    if (!hasMainRod) return

    const interval = setInterval(refreshFarmData, 60000) // 60 seconds
    return () => clearInterval(interval)
  }, [hasMainRod, farm.id])

  // Manual refresh function
  const handleManualRefresh = () => {
    refreshFarmData()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2 block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{farm.name}</h1>
          {farm.plantType && (
            <p className="text-green-700 mt-1 font-medium">🌱 {farm.plantType}</p>
          )}
          {farm.location && (
            <p className="text-gray-600 mt-1">📍 {farm.location}</p>
          )}
          {farm.description && (
            <p className="text-gray-600 mt-2">{farm.description}</p>
          )}
        </div>
        
        {hasMainRod && (
          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-gray-500">
              Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className={`${isRefreshing ? 'animate-spin' : ''}`}>🔄</span>
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Main Rod</h2>
          {!hasMainRod && (
            <button
              onClick={() => setShowMainRodConnection(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Connect Main Rod
            </button>
          )}
        </div>

        {hasMainRod ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{farm.mainRod?.rodId}</div>
              <div className="text-sm text-gray-600">Rod ID</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold ${
                farm.mainRod?.isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {farm.mainRod?.isConnected ? 'Connected' : 'Disconnected'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {farm.mainRod?.secondaryRods?.length || 0}
              </div>
              <div className="text-sm text-gray-600">All Rods</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📡</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Main Rod Connected</h3>
            <p className="text-gray-600 mb-6">Connect a main rod to start collecting data from your farm</p>
          </div>
        )}
      </div>

      {/* {hasMainRod && ( */}
      {/*   <div className="space-y-8 mb-8"> */}
      {/*     <MLDashboard farmId={farm.id} /> */}
      {/*     <AIRecommendations farmId={farm.id} /> */}
      {/*   </div> */}
      {/* )} */}

      {hasMainRod && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Rods</h2>
            <div className="text-sm text-gray-500">
              Auto-refreshing every minute
            </div>
          </div>

          {farm.mainRod?.secondaryRods && farm.mainRod.secondaryRods.length > 0 ? (
            (() => {
              // Find the newest timestamp across all rods (rounded to minutes)
              const allTimestamps = farm.mainRod.secondaryRods
                .map(rod => rod.readings?.[0]?.timestamp)
                .filter(timestamp => timestamp !== undefined)
                .map(timestamp => {
                  const date = new Date(timestamp)
                  // Round down to the minute (ignore seconds and milliseconds)
                  date.setSeconds(0, 0)
                  return date.getTime()
                })
              
               const newestTimestamp = allTimestamps.length > 0 ? Math.max(...allTimestamps) : 0
               
               const rodData: RodCardProps[] = farm.mainRod.secondaryRods.map((rod, index) => {
                const latestReading = rod.readings?.[0]
                const rodDisplayId = rod.rodId || rod.name || `Rod ${index + 1}`
                
                 // Check if rod has any sensor data
                 const hasSensorData = !!latestReading && (
                   latestReading.temperature !== null ||
                   latestReading.moisture !== null ||
                   latestReading.ph !== null ||
                   latestReading.conductivity !== null ||
                   latestReading.nitrogen !== null ||
                   latestReading.phosphorus !== null ||
                   latestReading.potassium !== null
                   || (latestReading as any).battery !== null 
                 )
                
                // Check if this rod has recent data (within 5 minutes of the newest timestamp)
                let rodTimestamp = 0
                if (latestReading?.timestamp) {
                  const date = new Date(latestReading.timestamp)
                  date.setSeconds(0, 0) // Round down to the minute
                  rodTimestamp = date.getTime()
                }
                
                // Consider data "recent" if it's within 5 minutes of the newest timestamp
                const fiveMinutesMs = 5 * 60 * 1000
                const hasRecentData = newestTimestamp > 0 && 
                  rodTimestamp > 0 && 
                  (newestTimestamp - rodTimestamp) <= fiveMinutesMs
                
                // Rod is valid if it has sensor data AND has recent data
                const hasValidData = hasSensorData && hasRecentData
                
                
                 return {
                   id: rodDisplayId,
                   rodId: rod.rodId, // Include database rodId for position persistence
                   positionX: rod.positionX, // Include position data
                   positionY: rod.positionY, // Include position data
                   temperature: latestReading?.temperature || 0,
                   moisture: latestReading?.moisture || 0,
                   ph: latestReading?.ph || 0,
                   conductivity: latestReading?.conductivity || 0,
                   n: latestReading?.nitrogen || 0,
                   p: latestReading?.phosphorus || 0,
                   k: latestReading?.potassium || 0,
                   battery: (rod as any).battery || (latestReading as any)?.battery || undefined, // Temporarily disabled until migration is run
                   timestamp: latestReading?.timestamp || null,
                   hasValidData: hasValidData
                 } as RodCardProps & { positionX?: number | null; positionY?: number | null }
              })
              
              return <RodGrid rods={rodData} />
            })()
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🌱</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Secondary Rods</h3>
              <p className="text-gray-600 mb-6">Secondary rods will appear here automatically when they connect to your main rod</p>
            </div>
          )}
        </div>
      )}

      {showMainRodConnection && (
        <MainRodConnection
          farmId={farm.id}
          onClose={() => setShowMainRodConnection(false)}
          onConnected={() => {
            setShowMainRodConnection(false)
            refreshFarmData() // Refresh instead of full page reload
          }}
        />
      )}
    </div>
  )
}
