"use client"

import { useState, useEffect } from "react"
import FarmCard from "@/components/FarmCard"
import CreateFarmModal from "@/components/CreateFarmModal"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

function SortableFarmCard({ farm, isEditMode }: { farm: Farm; isEditMode: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: farm.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`relative ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        {isEditMode && (
          <div
            {...listeners}
            className="absolute top-2 right-2 z-10 bg-gray-800 text-white p-1 rounded cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
          >
            ⋮⋮
          </div>
        )}
        <FarmCard farm={farm} isEditMode={isEditMode} />
      </div>
    </div>
  )
}

export default function FarmOverview() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [sortedFarms, setSortedFarms] = useState<Farm[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load farm order from localStorage
  const loadFarmOrder = (farmList: Farm[]) => {
    if (typeof window === 'undefined') return farmList
    
    const savedOrder = localStorage.getItem('farmGridOrder')
    if (!savedOrder) return farmList
    
    try {
      const orderMap = JSON.parse(savedOrder) as Record<string, number>
      return [...farmList].sort((a, b) => {
        const orderA = orderMap[a.id] ?? 999
        const orderB = orderMap[b.id] ?? 999
        return orderA - orderB
      })
    } catch {
      return farmList
    }
  }

  // Save farm order to localStorage
  const saveFarmOrder = (orderedFarms: Farm[]) => {
    if (typeof window === 'undefined') return
    
    const orderMap = orderedFarms.reduce((acc, farm, index) => {
      acc[farm.id] = index
      return acc
    }, {} as Record<string, number>)
    
    localStorage.setItem('farmGridOrder', JSON.stringify(orderMap))
  }

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
        const orderedFarms = loadFarmOrder(demoFarms)
        setFarms(demoFarms)
        setSortedFarms(orderedFarms)
      } else {
        // Normal API call for production
        const response = await fetch("/api/farms")
        if (response.ok) {
          const data = await response.json()
          const orderedFarms = loadFarmOrder(data.farms)
          setFarms(data.farms)
          setSortedFarms(orderedFarms)
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

  // Update sorted farms when farms change
  useEffect(() => {
    if (farms.length > 0) {
      const orderedFarms = loadFarmOrder(farms)
      setSortedFarms(orderedFarms)
    }
  }, [farms])

  const handleFarmCreated = () => {
    fetchFarms()
    setShowCreateModal(false)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedFarms.findIndex((farm) => farm.id === active.id)
      const newIndex = sortedFarms.findIndex((farm) => farm.id === over.id)

      const newOrder = arrayMove(sortedFarms, oldIndex, newIndex)
      setSortedFarms(newOrder)
      saveFarmOrder(newOrder)
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
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
        <div className="flex gap-3">
          {sortedFarms.length > 0 && (
            <button
              onClick={toggleEditMode}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                isEditMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isEditMode ? '✓ Done' : '✏️ Edit Layout'}
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            + Add Farm
          </button>
        </div>
      </div>

      {isEditMode && sortedFarms.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Edit Mode:</strong> Drag and drop farm cards to reorder them. Click &quot;Done&quot; when finished.
          </p>
        </div>
      )}

      {sortedFarms.length === 0 ? (
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortedFarms.map(farm => farm.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedFarms.map((farm) => (
                <SortableFarmCard key={farm.id} farm={farm} isEditMode={isEditMode} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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