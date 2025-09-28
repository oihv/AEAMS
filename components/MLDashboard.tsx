'use client'

import { useState, useEffect, useCallback } from 'react'
import { MLPrediction, ModelMetrics } from '@/lib/ml-engine'

interface MLDashboardProps {
  farmId: string
}

interface TrainingStatus {
  isTraining: boolean
  metrics: ModelMetrics[]
  modelInfo: {
    healthModel: { params: number; layers: number }
    wateringModel: { params: number; layers: number }
    fertilizationModel: { params: number; layers: number }
    timeSeriesModel: { params: number; layers: number }
    totalParams: number
  }
  lastTrainingEpoch: number
}

interface MLBatchPredictions {
  success: boolean
  farmId: string
  predictions: (MLPrediction & { rodName: string | null; rodLocation: string | null })[]
  statistics: {
    totalRods: number
    averageHealthScore: number
    averageConfidence: number
    averageAccuracy: number
  }
}

export default function MLDashboard({ farmId }: MLDashboardProps) {
  const [predictions, setPredictions] = useState<MLBatchPredictions | null>(null)
  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState(false)
  const [epochs, setEpochs] = useState(50)
  const [error, setError] = useState<string | null>(null)

  const fetchTrainingStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ml/train')
      if (response.ok) {
        const data = await response.json()
        setTrainingStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch training status:', err)
    }
  }, [])

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/ai-predictions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch ML predictions')
      }

      const data = await response.json()
      setPredictions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [farmId])

  const startTraining = async () => {
    try {
      setTraining(true)
      const response = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epochs })
      })

      if (!response.ok) {
        throw new Error('Failed to start training')
      }

      // Poll for training status
      const pollInterval = setInterval(fetchTrainingStatus, 2000)
      
      setTimeout(() => {
        clearInterval(pollInterval)
        setTraining(false)
        fetchPredictions()
      }, epochs * 1000) // Rough estimate

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed')
      setTraining(false)
    }
  }

  useEffect(() => {
    fetchTrainingStatus()
    fetchPredictions()
  }, [fetchTrainingStatus, fetchPredictions])

  useEffect(() => {
    if (trainingStatus?.isTraining) {
      const interval = setInterval(fetchTrainingStatus, 2000)
      return () => clearInterval(interval)
    }
  }, [trainingStatus?.isTraining, fetchTrainingStatus])

  const getUrgencyColor = (urgency: number) => {
    if (urgency > 0.8) return 'text-red-600 bg-red-100'
    if (urgency > 0.6) return 'text-orange-600 bg-orange-100'
    if (urgency > 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const latestMetrics = trainingStatus?.metrics[trainingStatus.metrics.length - 1]

  if (loading && !predictions) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mr-3 flex items-center justify-center">
            <span className="text-white font-bold">🧠</span>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Neural Network AI Dashboard
          </h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full mr-4 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Neural Network AI Dashboard</h2>
              <p className="text-purple-100">Advanced Machine Learning Plant Care</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{trainingStatus?.modelInfo.totalParams.toLocaleString()}</div>
            <div className="text-sm text-purple-100">Total Parameters</div>
          </div>
        </div>
      </div>

      {/* Model Architecture & Training */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Architecture */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg text-black font-bold mb-4 flex items-center">
            <span className="w-6 h-6 bg-blue-500 rounded mr-2 flex items-center justify-center text-white text-xs">⚡</span>
            Model Architecture
          </h3>
          {trainingStatus && (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <span className="text-gray-800 font-medium">Health Prediction</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{trainingStatus.modelInfo.healthModel.layers} layers</div>
                  <div className="text-xs text-gray-500">{trainingStatus.modelInfo.healthModel.params.toLocaleString()} params</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <span className="text-gray-800 font-medium">Watering Urgency</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{trainingStatus.modelInfo.wateringModel.layers} layers</div>
                  <div className="text-xs text-gray-500">{trainingStatus.modelInfo.wateringModel.params.toLocaleString()} params</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                <span className="text-gray-800 font-medium">Fertilization</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{trainingStatus.modelInfo.fertilizationModel.layers} layers</div>
                  <div className="text-xs text-gray-500">{trainingStatus.modelInfo.fertilizationModel.params.toLocaleString()} params</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                <span className="text-gray-800 font-medium">Time Series (LSTM)</span>
                <div className="text-right">
                  <div className="text-sm text-gray-600">{trainingStatus.modelInfo.timeSeriesModel.layers} layers</div>
                  <div className="text-xs text-gray-500">{trainingStatus.modelInfo.timeSeriesModel.params.toLocaleString()} params</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Training Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-black text-lg font-bold mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-500 rounded mr-2 flex items-center justify-center text-white text-xs">🎯</span>
            Training Control
          </h3>
          
          {trainingStatus?.isTraining || training ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-gray-700 font-medium">Training in progress...</span>
              </div>
              {latestMetrics && (
                <div className="bg-gray-50 p-4 rounded">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Epoch</div>
                      <div className="font-bold text-lg text-gray-500">{latestMetrics.epoch}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Accuracy</div>
                      <div className="font-bold text-lg text-green-600">{(latestMetrics.accuracy * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Loss</div>
                      <div className="font-bold text-lg text-red-600">{latestMetrics.loss.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Val Accuracy</div>
                      <div className="font-bold text-lg text-blue-600">{(latestMetrics.valAccuracy * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Training Epochs
                </label>
                <input
                  type="number"
                  value={epochs}
                  onChange={(e) => setEpochs(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 text-gray-700 rounded-md"
                  min="10"
                  max="200"
                />
              </div>
              <button
                onClick={startTraining}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all transform hover:scale-105"
              >
                🚀 Start Neural Network Training
              </button>
              {trainingStatus && trainingStatus.lastTrainingEpoch > 0 && (
                <div className="text-sm text-gray-600 text-center">
                  Last trained: {trainingStatus.lastTrainingEpoch} epochs
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Training Metrics Visualization */}
      {trainingStatus && trainingStatus.metrics.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-black text-lg font-bold mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-500 rounded mr-2 flex items-center justify-center text-white text-xs">📊</span>
            Training Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Accuracy Over Time</h4>
              <div className="h-32 bg-gradient-to-r from-green-50 to-blue-50 rounded p-4 flex items-end space-x-1">
                {trainingStatus.metrics.slice(-20).map((metric, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                    style={{
                      height: `${metric.accuracy * 100}%`,
                      width: `${100 / Math.min(20, trainingStatus.metrics.length)}%`
                    }}
                    title={`Epoch ${metric.epoch}: ${(metric.accuracy * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Loss Over Time</h4>
              <div className="h-32 bg-gradient-to-r from-red-50 to-orange-50 rounded p-4 flex items-end space-x-1">
                {trainingStatus.metrics.slice(-20).map((metric, index) => {
                  const maxLoss = Math.max(...trainingStatus.metrics.map(m => m.loss))
                  return (
                    <div
                      key={index}
                      className="bg-gradient-to-t from-red-500 to-red-400 rounded-t"
                      style={{
                        height: `${(metric.loss / maxLoss) * 100}%`,
                        width: `${100 / Math.min(20, trainingStatus.metrics.length)}%`
                      }}
                      title={`Epoch ${metric.epoch}: ${metric.loss.toFixed(4)}`}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ML Predictions */}
      {predictions && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-black text-lg font-bold flex items-center">
              <span className="w-6 h-6 bg-indigo-500 rounded mr-2 flex items-center justify-center text-white text-xs">🔮</span>
              Neural Network Predictions
            </h3>
            <button 
              onClick={fetchPredictions}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
            >
              🔄 Refresh Predictions
            </button>
          </div>

          {/* Farm Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{predictions.statistics.totalRods}</div>
              <div className="text-sm text-blue-700">Neural Nodes</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className={`text-2xl font-bold ${getHealthColor(predictions.statistics.averageHealthScore).split(' ')[0]}`}>
                {predictions.statistics.averageHealthScore}%
              </div>
              <div className="text-sm text-green-700">Avg Health</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{(predictions.statistics.averageConfidence * 100).toFixed(0)}%</div>
              <div className="text-sm text-purple-700">Confidence</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{(predictions.statistics.averageAccuracy * 100).toFixed(0)}%</div>
              <div className="text-sm text-orange-700">Model Accuracy</div>
            </div>
          </div>

          {/* Individual Predictions */}
          <div className="space-y-4">
            {predictions.predictions.map((prediction) => (
              <div key={prediction.rodId} className="text-gray-700 border-2 border-gray-100 rounded-lg p-4 hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{prediction.rodName || prediction.rodId}</h4>
                    {prediction.rodLocation && (
                      <p className="text-sm text-gray-600">{prediction.rodLocation}</p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getHealthColor(prediction.healthScore)}`}>
                      {prediction.healthScore.toFixed(0)}% Health
                    </div>
                    <div className="text-xs text-gray-500">
                      {(prediction.confidence * 100).toFixed(0)}% confidence | {(prediction.modelAccuracy * 100).toFixed(0)}% accuracy
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Watering */}
                  <div className="border-l-4 border-blue-500 pl-3 bg-blue-50 p-3 rounded">
                    <h5 className="font-semibold text-blue-700 mb-2">💧 Watering Neural Prediction</h5>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${getUrgencyColor(prediction.wateringUrgency)}`}>
                      {(prediction.wateringUrgency * 100).toFixed(0)}% URGENCY
                    </div>
                     <div className="text-sm text-gray-700">
                       Predicted 24h moisture: <strong>{prediction.predictedMoisture24h?.toFixed(0) ?? 'N/A'}%</strong>
                     </div>
                  </div>

                  {/* Fertilization */}
                  <div className="border-l-4 border-green-500 pl-3 bg-green-50 p-3 rounded">
                    <h5 className="font-semibold text-green-700 mb-2">🌱 Fertilization AI</h5>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${getUrgencyColor(prediction.fertilizationUrgency)}`}>
                      {(prediction.fertilizationUrgency * 100).toFixed(0)}% URGENCY
                    </div>
                     <div className="text-xs text-gray-600">
                       Predicted NPK: N:{prediction.predictedNPK?.n?.toFixed(0) ?? 'N/A'} P:{prediction.predictedNPK?.p?.toFixed(0) ?? 'N/A'} K:{prediction.predictedNPK?.k?.toFixed(0) ?? 'N/A'}
                     </div>
                  </div>

                  {/* Model Performance */}
                  <div className="border-l-4 border-purple-500 pl-3 bg-purple-50 p-3 rounded">
                    <h5 className="font-semibold text-purple-700 mb-2">🧠 Model Stats</h5>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-gray-600">Accuracy:</span> 
                        <span className="font-bold text-purple-600 ml-1">{(prediction.modelAccuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Confidence:</span> 
                        <span className="font-bold text-purple-600 ml-1">{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 mt-3 text-center">
                  Neural prediction generated at {new Date(prediction.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>

          {predictions.predictions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🤖</div>
              <div className="text-lg font-medium mb-2">No Neural Network Data Available</div>
              <div className="text-sm">Connect your sensors to start training the AI models</div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="text-red-700 font-medium">{error}</div>
          <button 
            onClick={() => {
              setError(null)
              fetchPredictions()
            }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
