"use client"

import { useState, useEffect } from "react"
import type { AISuggestion } from "@/lib/ai-suggestions"

export type RodCardProps = {
  id: string;
  rodId?: string; // Database ID for position persistence
  temperature: number;
  moisture: number;
  ph: number;
  conductivity: number;
  n: number;
  p: number;
  k: number;
  battery?: number; // Battery percentage (0-100)
  timestamp: Date | null;
  hasValidData?: boolean;
  isEditMode?: boolean;
};

export default function RodCard({ id, rodId, temperature, moisture, ph, conductivity, n, p, k, battery, timestamp, hasValidData = true, isEditMode = false }: RodCardProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  // Create a data signature to detect changes in sensor values
  const dataSignature = `${temperature}-${moisture}-${ph}-${conductivity}-${n}-${p}-${k}-${battery || 'null'}-${timestamp ? new Date(timestamp).getTime() : 'null'}`
  
  // Fetch AI suggestions when rod has valid data or when data changes
  useEffect(() => {
    if (hasValidData && rodId && !loadingSuggestions) {
      // Clear existing suggestions when data changes to force refresh
      if (suggestions) {
        setSuggestions(null)
      }
      fetchAISuggestions()
    }
  }, [hasValidData, rodId, dataSignature])

  const fetchAISuggestions = async () => {
    if (!rodId) return
    
    setLoadingSuggestions(true)
    try {
      // Add cache-busting parameter to force fresh suggestions
      const timestamp = Date.now()
      const response = await fetch(`/api/ai-suggestions/${rodId}?t=${timestamp}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const getStatusColor = (value: number, type: string) => {
    if (!hasValidData) return 'text-red-600'
    
    switch (type) {
      case 'moisture':
        if (value < 10) return 'text-red-600'
        if (value > 20) return 'text-blue-600'
        return 'text-green-600'
      case 'ph':
        if (value < 6.0 || value > 7.0) return 'text-yellow-600'
        return 'text-green-600'
      case 'temperature':
        if (value < 20 || value > 35) return 'text-orange-600'
        return 'text-green-600'
      case 'battery':
        if (value < 15) return 'text-red-600'  // Critical
        if (value < 25) return 'text-yellow-600'  // Medium warning
        if (value >= 75) return 'text-green-600'  // Good
        return 'text-gray-600'  // Default
      default:
        return 'text-gray-600'
    }
  }



  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isNaN(Number(id)) ? id : `Rod ${id}`}</h3>
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div className="cursor-grab active:cursor-grabbing">
              <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-400">
                <path fill="currentColor" d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z"/>
              </svg>
            </div>
          )}
          <div className={`w-3 h-3 rounded-full ${hasValidData ? 'bg-green-400' : 'bg-red-500'}`}></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Temperature:</span>
          <span className={`font-medium ${getStatusColor(temperature, 'temperature')}`}>
            {temperature.toFixed(1)}°C
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Moisture:</span>
          <span className={`font-medium ${getStatusColor(moisture, 'moisture')}`}>
            {moisture.toFixed(0)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">pH:</span>
          <span className={`font-medium ${getStatusColor(ph, 'ph')}`}>
            {ph.toFixed(1)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Conductivity:</span>
          <span className="font-medium text-gray-900">
            {conductivity.toFixed(1)} mS/cm
          </span>
        </div>

        {battery !== undefined && battery !== null && (
          <div className="flex justify-between">
            <span className="text-gray-600">Battery:</span>
            <span className={`font-medium ${getStatusColor(battery, 'battery')}`}>
              {battery.toFixed(0)}%
            </span>
          </div>
        )}
        
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-2">NPK Levels:</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="font-medium text-gray-900">{n}</div>
              <div className="text-gray-500">N</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{p}</div>
              <div className="text-gray-500">P</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900">{k}</div>
              <div className="text-gray-500">K</div>
            </div>
          </div>
        </div>
        
        {timestamp && (
          <div className="pt-3 mt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Last update: {new Date(timestamp).toLocaleString()}
            </div>
          </div>
        )}
        
        {!hasValidData && (
          <div className="pt-3 mt-3 border-t border-red-100">
            <div className="text-xs text-red-600 font-medium">
              ⚠️ Missing from latest update
            </div>
          </div>
        )}

        {/* AI Suggestions Section */}
        {hasValidData && rodId && (
          <div className="pt-3 mt-3 border-t border-blue-100">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="text-xs font-medium text-blue-700">
                🤖 AI Suggestions
              </div>
              <div className="text-blue-600">
                {showSuggestions ? '▼' : '▶'}
              </div>
            </button>
            
            {showSuggestions && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={fetchAISuggestions}
                    disabled={loadingSuggestions}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    🔄 Refresh
                  </button>
                </div>
                {loadingSuggestions ? (
                  <div className="text-xs text-gray-500 italic">Loading suggestions...</div>
                ) : suggestions ? (
                  <>
                    {/* Watering Suggestion */}
                    <div className="bg-blue-50 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-800">💧 Watering</span>
                        <span className={`text-xs px-1 rounded ${ 
                          suggestions.watering.urgency === 'high' ? 'bg-red-100 text-red-700' :
                          suggestions.watering.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {suggestions.watering.recommendation}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{suggestions.watering.reason}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {suggestions.watering.hoursUntilNext === 0 
                          ? "Water now" 
                          : `Water in: ${suggestions.watering.hoursUntilNext}h`}
                      </div>
                    </div>

                    {/* Fertilizing Suggestion */}
                    <div className="bg-green-50 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-green-800">🌱 Fertilizing</span>
                        <span className="text-xs px-1 rounded bg-green-100 text-green-700">
                          {suggestions.fertilizing.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{suggestions.fertilizing.reason}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {suggestions.fertilizing.daysUntilNext === 0 
                          ? "Fertilize now" 
                          : `Fertilize in: ${suggestions.fertilizing.daysUntilNext}d`}
                      </div>
                    </div>

                    {/* Plant Health Score */}
                    <div className="bg-gray-50 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-800">🌿 Plant Health</span>
                        <span className={`text-xs px-1 rounded ${
                          suggestions.plantHealth.score >= 80 ? 'bg-green-100 text-green-700' :
                          suggestions.plantHealth.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {suggestions.plantHealth.score}%
                        </span>
                      </div>
                      {suggestions.plantHealth.concerns.length > 0 && (
                        <div className="text-xs text-gray-600">
                          ⚠️ {suggestions.plantHealth.concerns.join(', ')}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-500">
                    Click to load AI suggestions
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

