// app/dashboard/RodGrid.tsx
"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import SortableRodCard from "./SortableRodCard";
import DraggableMinifiedRodCard from "./DraggableMinifiedRodCard";
import { RodCardProps } from "./RodCard";

export default function RodGrid({ rods }: { rods: RodCardProps[] }) {
  const [cols, setCols] = useState(3);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [orderedRods, setOrderedRods] = useState<RodCardProps[]>([]);
  const [rodPositions, setRodPositions] = useState<Record<string, { x: number; y: number }>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize column count from localStorage
  useEffect(() => {
    const savedCols = localStorage.getItem('rodGridColumns');
    if (savedCols) {
      try {
        const colCount = parseInt(savedCols, 10);
        if (colCount >= 1 && colCount <= 6) {
          setCols(colCount);
        }
      } catch {
        // Keep default value if parsing fails
      }
    }
  }, []);

  // Save column count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('rodGridColumns', cols.toString());
  }, [cols]);

  // Initialize view mode from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('rodViewMode');
    if (savedViewMode === 'list' || savedViewMode === 'map') {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode to localStorage
  useEffect(() => {
    localStorage.setItem('rodViewMode', viewMode);
  }, [viewMode]);

  // Initialize rod positions from database (via props) and localStorage fallback
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    
    // Load positions from database (through the API data)
    rods.forEach(rod => {
      // Look for position data in the rod
      const rodWithPosition = rod as RodCardProps & { positionX?: number | null; positionY?: number | null };
      if (rodWithPosition.positionX !== null && rodWithPosition.positionY !== null && 
          rodWithPosition.positionX !== undefined && rodWithPosition.positionY !== undefined) {
        positions[rod.id] = {
          x: rodWithPosition.positionX,
          y: rodWithPosition.positionY
        };
      }
    });
    
    // Fallback to localStorage for any missing positions
    const savedPositions = localStorage.getItem('rodPositions');
    if (savedPositions) {
      try {
        const localPositions = JSON.parse(savedPositions);
        // Only use localStorage positions for rods that don't have database positions
        Object.keys(localPositions).forEach(rodId => {
          if (!positions[rodId]) {
            positions[rodId] = localPositions[rodId];
          }
        });
      } catch {
        // Keep positions from database
      }
    }
    
    setRodPositions(positions);
  }, [rods]);

  // Save rod positions to localStorage
  useEffect(() => {
    localStorage.setItem('rodPositions', JSON.stringify(rodPositions));
  }, [rodPositions]);

  // Initialize ordered rods from localStorage or default order
  useEffect(() => {
    const savedOrder = localStorage.getItem('rodOrder');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        const ordered = orderIds
          .map((id: string) => rods.find(rod => rod.id === id))
          .filter(Boolean);
        
        // Add any new rods that weren't in the saved order
        const newRods = rods.filter(rod => !orderIds.includes(rod.id));
        setOrderedRods([...ordered, ...newRods]);
      } catch {
        setOrderedRods(rods);
      }
    } else {
      setOrderedRods(rods);
    }
  }, [rods]);

  // Save order to localStorage whenever it changes
  useEffect(() => {
    if (orderedRods.length > 0) {
      const orderIds = orderedRods.map(rod => rod.id);
      localStorage.setItem('rodOrder', JSON.stringify(orderIds));
    }
  }, [orderedRods]);

  const handlePositionChange = async (rodId: string, position: { x: number; y: number }) => {
    // Update local state immediately for responsive UI
    setRodPositions(prev => ({
      ...prev,
      [rodId]: position
    }));
    
    // Find the rod's database ID
    const rod = rods.find(r => r.id === rodId);
    if (rod?.rodId) {
      try {
        // Save to database
        await fetch(`/api/rod/${rod.rodId}/position`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ x: position.x, y: position.y }),
        });
      } catch (error) {
        console.error('Failed to save rod position to database:', error);
        // Position is still saved in local state and localStorage as fallback
      }
    }
  };

  const generateAutoLayout = (rodsCount: number) => {
    const positions: Record<string, { x: number; y: number }> = {};
    const gridSize = 150; // 150px spacing
    const cols = Math.ceil(Math.sqrt(rodsCount));
    
    orderedRods.forEach((rod, index) => {
      if (!rodPositions[rod.id]) {
        const row = Math.floor(index / cols);
        const col = index % cols;
        positions[rod.id] = {
          x: col * gridSize + 20,
          y: row * gridSize + 20
        };
      }
    });
    
    return positions;
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedRods((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleMapDragEnd(event: DragEndEvent) {
    const { active, delta } = event;
    
    if (delta) {
      const rodId = active.id as string;
      const currentPosition = rodPositions[rodId] || { x: 0, y: 0 };
      const newPosition = {
        x: Math.max(0, currentPosition.x + delta.x),
        y: Math.max(0, currentPosition.y + delta.y)
      };
      
      handlePositionChange(rodId, newPosition);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-800 rounded-xl p-2 flex items-center gap-2">
            <label className="text-white text-sm">Columns: {cols}</label>
            <input 
              type="range" 
              min="1" 
              max="6" 
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-20"
              disabled={viewMode === 'map'}
            />
          </div>
          
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEditMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEditMode ? 'Done Editing' : 'Edit Layout'}
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="List View"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Map View"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conditional rendering based on view mode */}
      {viewMode === 'list' ? (
        // List view implementation
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedRods.map(rod => rod.id)} strategy={rectSortingStrategy}>
            <div 
              className={`flex flex-wrap bg-gray-300 gap-2 p-4 rounded-lg ${isEditMode ? 'bg-blue-50' : ''}`}
            >
              {orderedRods.map((rod) => (
                <div
                  key={rod.id}
                  className="flex-shrink-0"
                  style={{
                    width: `calc((100% - ${(cols - 1) * 8}px) / ${cols})`,
                    minWidth: '250px'
                  }}
                >
                  <SortableRodCard {...rod} isEditMode={isEditMode} />
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        // Map view implementation
        <div className={`relative bg-gray-100 min-h-96 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden ${isEditMode ? 'bg-blue-50' : ''}`}>
          {/* Grid background */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #6b7280 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
          
          <DndContext
            sensors={sensors}
            onDragEnd={handleMapDragEnd}
          >
            {/* Render cards directly without SortableContext for map view */}
            {orderedRods.map((rod) => {
              const autoPositions = generateAutoLayout(orderedRods.length);
              const position = rodPositions[rod.id] || autoPositions[rod.id] || { x: 20, y: 20 };
              
              return (
                <DraggableMinifiedRodCard
                  key={rod.id}
                  {...rod}
                  isEditMode={isEditMode}
                  position={position}
                  onPositionChange={(newPosition) => handlePositionChange(rod.id, newPosition)}
                />
              );
            })}
          </DndContext>
          
          {orderedRods.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <p>No rods to display in map view</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

