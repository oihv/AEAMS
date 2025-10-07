'use client'

import { useState, useEffect } from 'react'
import { PlantRecommendation } from '@/lib/ai-engine'

interface AIRecommendationsProps {
  farmId: string
}

interface BatchPrediction extends PlantRecommendation {
  rodName: string | null
  rodLocation: string | null
  dataPoints: number
}

interface BatchPredictionResponse {
  success: boolean
  farmId: string
  farmName: string
  predictions: BatchPrediction[]
  statistics: {
    totalRods: number
    averageHealthScore: number
    criticalAlerts: number
    highPriorityAlerts: number
    averageConfidence: number
  }
  analysisTimestamp: string
}

export default function AIRecommendations({ farmId }: AIRecommendationsProps) {
  const [predictions, setPredictions] = useState<BatchPredictionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-predictions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI predictions')
      }

      const data = await response.json()
      setPredictions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()
  }, [farmId])

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-black text-lg font-semibold mb-4">🤖 AI Plant Care Recommendations</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error || !predictions) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-black text-lg font-semibold mb-4">🤖 AI Plant Care Recommendations</h3>
        <div className="text-red-600 mb-4">{error || 'No data available'}</div>
        <button 
          onClick={fetchPredictions}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Analysis
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-black text-lg font-semibold">🤖 AI Plant Care Recommendations</h3>
        <button 
          onClick={fetchPredictions}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Farm Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-blue-600">{predictions.statistics.totalRods}</div>
          <div className="text-sm text-gray-600">Total Rods</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className={`text-2xl font-bold ${getHealthColor(predictions.statistics.averageHealthScore).split(' ')[0]}`}>
            {predictions.statistics.averageHealthScore}%
          </div>
          <div className="text-sm text-gray-600">Avg Health</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-red-600">{predictions.statistics.criticalAlerts}</div>
          <div className="text-sm text-gray-600">Critical Alerts</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-orange-600">{predictions.statistics.highPriorityAlerts}</div>
          <div className="text-sm text-gray-600">High Priority</div>
        </div>
      </div>

      {/* Individual Rod Predictions */}
      <div className="space-y-4">
        {predictions.predictions.map((prediction) => (
          <div key={prediction.rodId} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-gray-700 font-semibold">{prediction.rodName || prediction.rodId}</h4>
                {prediction.rodLocation && (
                  <p className="text-sm text-gray-600">{prediction.rodLocation}</p>
                )}
              </div>
              <div className="text-right">
                <div className={`inline-block px-2 py-1 rounded text-sm font-semibold ${getHealthColor(prediction.healthScore)}`}>
                  {prediction.healthScore}% Health
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(prediction.confidence * 100)}% confidence
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Watering Recommendations */}
              <div className="border-l-4 border-blue-500 pl-3">
                <h5 className="font-semibold text-blue-700 mb-1">💧 Watering</h5>
                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-1 ${getUrgencyColor(prediction.watering.urgency)}`}>
                  {prediction.watering.urgency.toUpperCase()}
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>
                    {prediction.watering.hoursUntilNext === 0 
                      ? "Water now" 
                      : `Next watering in: ${prediction.watering.hoursUntilNext}h`}
                  </strong>
                </p>
                <p className="text-xs text-gray-600">{prediction.watering.reason}</p>
              </div>

              {/* Fertilization Recommendations */}
              <div className="border-l-4 border-green-500 pl-3">
                <h5 className="font-semibold text-green-700 mb-1">🌱 Fertilization</h5>
                <div className={`inline-block px-2 py-1 rounded text-xs font-semibold mb-1 ${getUrgencyColor(prediction.fertilization.urgency)}`}>
                  {prediction.fertilization.urgency.toUpperCase()}
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  <strong>
                    {prediction.fertilization.daysUntilNext === 0 
                      ? "Fertilize now" 
                      : `Next fertilization in: ${prediction.fertilization.daysUntilNext}d`}
                  </strong>
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  NPK Ratio: N:{Math.round(prediction.fertilization.npkRatio.n)} P:{Math.round(prediction.fertilization.npkRatio.p)} K:{Math.round(prediction.fertilization.npkRatio.k)}
                </p>
                <p className="text-xs text-gray-600">{prediction.fertilization.reason}</p>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              Based on {prediction.dataPoints} sensor readings • Last updated: {new Date(prediction.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {predictions.predictions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sensor data available for AI analysis. 
          <br />
          Ensure your secondary rods are connected and sending data.
        </div>
      )}

      <div className="text-xs text-gray-400 mt-4 text-center">
        AI analysis completed at {new Date(predictions.analysisTimestamp).toLocaleString()}
      </div>
    </div>
  )
}
