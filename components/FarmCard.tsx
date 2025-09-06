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
}

export default function FarmCard({ farm }: FarmCardProps) {
  const hasMainRod = !!farm.mainRod
  const secondaryRodCount = farm.mainRod?.secondaryRods?.length || 0
  
  const getLatestReadings = () => {
    if (!farm.mainRod?.secondaryRods) return null
    
    const allReadings = farm.mainRod.secondaryRods
      .flatMap(rod => rod.readings)
      .filter(reading => reading)
    
    if (allReadings.length === 0) return null
    
    const avgTemp = allReadings.reduce((sum, r) => sum + (r.temperature || 0), 0) / allReadings.length
    const avgMoisture = allReadings.reduce((sum, r) => sum + (r.moisture || 0), 0) / allReadings.length
    const avgPh = allReadings.reduce((sum, r) => sum + (r.ph || 0), 0) / allReadings.length
    
    return { avgTemp, avgMoisture, avgPh }
  }

  const readings = getLatestReadings()

  return (
    <Link href={`/dashboard/farm/${farm.id}`}>
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
            <span className="font-medium text-gray-600">
              {hasMainRod ? farm.mainRod?.rodId : 'Not connected'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Secondary Rods:</span>
            <span className="font-medium text-gray-600">{secondaryRodCount}</span>
          </div>

          {readings && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">Latest Averages:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{readings.avgTemp.toFixed(1)}°C</div>
                  <div className="text-gray-500">Temp</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{readings.avgMoisture.toFixed(0)}%</div>
                  <div className="text-gray-500">Moisture</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{readings.avgPh.toFixed(1)}</div>
                  <div className="text-gray-500">pH</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
