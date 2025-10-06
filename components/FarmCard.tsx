import Link from "next/link"

interface FarmCardProps {
  farm: {
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
  isEditMode?: boolean
}

export default function FarmCard({ farm, isEditMode = false }: FarmCardProps) {
  const hasMainRod = !!farm.mainRod
  const secondaryRodCount = farm.mainRod?.secondaryRods?.length || 0
  
  const getLatestReadings = () => {
    if (!farm.mainRod?.secondaryRods) return null
    
    // Get the latest reading from each rod and find the most recent ones
    const latestReadings = farm.mainRod.secondaryRods
      .map(rod => rod.readings?.[0]) // Get latest reading from each rod
      .filter(reading => reading && (
        reading.temperature !== null ||
        reading.moisture !== null ||
        reading.ph !== null ||
        reading.conductivity !== null ||
        reading.nitrogen !== null ||
        reading.phosphorus !== null ||
        reading.potassium !== null
      ))
    
    if (latestReadings.length === 0) return null
    
    // Find the most recent timestamp to identify the latest data batch
    const timestamps = latestReadings
      .map(r => new Date(r.timestamp).getTime())
      .filter(t => !isNaN(t))
    
    if (timestamps.length === 0) return null
    
    const newestTimestamp = Math.max(...timestamps)
    const fiveMinutesMs = 5 * 60 * 1000
    
    // Only include readings from the most recent batch (within 5 minutes of newest)
    const recentReadings = latestReadings.filter(reading => {
      const readingTime = new Date(reading.timestamp).getTime()
      return (newestTimestamp - readingTime) <= fiveMinutesMs
    })
    
    if (recentReadings.length === 0) return null
    
    // Calculate averages from the most recent readings only
    const avgTemp = recentReadings.reduce((sum, r) => sum + (r.temperature || 0), 0) / recentReadings.length
    const avgMoisture = recentReadings.reduce((sum, r) => sum + (r.moisture || 0), 0) / recentReadings.length
    const avgPh = recentReadings.reduce((sum, r) => sum + (r.ph || 0), 0) / recentReadings.length
    
    return { avgTemp, avgMoisture, avgPh }
  }

  const readings = getLatestReadings()

  return (
    <Link href={`/dashboard/farm/${farm.id}`} className={isEditMode ? 'pointer-events-none' : ''}>
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{farm.name}</h3>
            {farm.location && (
              <p className="text-sm text-gray-600">📍 {farm.location}</p>
            )}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            hasMainRod && farm.mainRod?.isConnected 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {hasMainRod && farm.mainRod?.isConnected ? 'Connected' : 'Not Connected'}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Main Rod:</span>
            <span className="font-semibold text-gray-800">
              {hasMainRod ? farm.mainRod?.rodId : 'Not connected'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">All Rods:</span>
            <span className="font-semibold text-gray-800">{secondaryRodCount}</span>
          </div>

          {readings && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-700 font-medium mb-2">Latest Readings:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-black">{readings.avgTemp.toFixed(1)}°C</div>
                  <div className="text-gray-600">Temp</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-black">{readings.avgMoisture.toFixed(0)}%</div>
                  <div className="text-gray-600">Moisture</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-black">{readings.avgPh.toFixed(1)}</div>
                  <div className="text-gray-600">pH</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
