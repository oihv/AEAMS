"use client"

import { useState } from "react"
import Link from "next/link"
import MainRodConnection from "@/components/MainRodConnection"
import RodCard from "@/components/RodCard"

interface FarmDetailsProps {
  farm: {
    id: string
    name: string
    location?: string | null
    description?: string | null
    mainRod?: {
      id: string
      serialNumber: string
      isConnected: boolean
      lastSeen?: Date | null
      secondaryRods: Array<{
        id: string
        name?: string | null
        location?: string | null
        isActive: boolean
        lastSeen?: Date | null
        readings: Array<{
          id: string
          temperature?: number | null
          moisture?: number | null
          ph?: number | null
          conductivity?: number | null
          nitrogen?: number | null
          phosphorus?: number | null
          potassium?: number | null
          timestamp: Date
        }>
      }>
    } | null
  }
}

export default function FarmDetails({ farm }: FarmDetailsProps) {
  const [showMainRodConnection, setShowMainRodConnection] = useState(false)
  const hasMainRod = !!farm.mainRod

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
          {farm.location && (
            <p className="text-gray-600 mt-1">📍 {farm.location}</p>
          )}
          {farm.description && (
            <p className="text-gray-600 mt-2">{farm.description}</p>
          )}
        </div>
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
              <div className="text-2xl font-bold text-gray-900">{farm.mainRod?.serialNumber}</div>
              <div className="text-sm text-gray-600">Serial Number</div>
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
              <div className="text-sm text-gray-600">Secondary Rods</div>
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

      {hasMainRod && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Secondary Rods</h2>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors">
              + Add Rod
            </button>
          </div>

          {farm.mainRod?.secondaryRods && farm.mainRod.secondaryRods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {farm.mainRod.secondaryRods.map((rod) => {
                const latestReading = rod.readings[0]
                return (
                  <RodCard
                    key={rod.id}
                    id={parseInt(rod.id)}
                    temperature={latestReading?.temperature || 0}
                    moisture={latestReading?.moisture || 0}
                    ph={latestReading?.ph || 0}
                    conductivity={latestReading?.conductivity || 0}
                    n={latestReading?.nitrogen || 0}
                    p={latestReading?.phosphorus || 0}
                    k={latestReading?.potassium || 0}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🌱</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Secondary Rods</h3>
              <p className="text-gray-600 mb-6">Add secondary rods to monitor different areas of your farm</p>
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
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}