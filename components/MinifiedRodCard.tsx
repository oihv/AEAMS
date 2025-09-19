"use client";

import { useState, useRef } from 'react';
import { RodCardProps } from './RodCard';
import RodDetailPopup from './RodDetailPopup';

interface MinifiedRodCardProps extends RodCardProps {
  isEditMode?: boolean;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
}

export default function MinifiedRodCard({ 
  id, 
  temperature, 
  moisture, 
  ph, 
  conductivity,
  n,
  p,
  k,
  timestamp,
  hasValidData = true, 
  isEditMode = false,
  position = { x: 0, y: 0 }
}: MinifiedRodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isEditMode) return; // Don't show popup in edit mode
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsHovered(true);
    }, 300); // 300ms delay to prevent flickering
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHovered && !isEditMode) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  };
  const getOverallStatus = () => {
    return hasValidData ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <>
      <div 
        className={`
          bg-white rounded-lg border border-gray-200 p-2 
          hover:shadow-md transition-all duration-200
          ${isEditMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
          w-28 h-20 flex flex-col justify-between
          relative
        `}
        style={position ? {
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`
        } : {}}
        title={`${id} - Temp: ${temperature}°C, Moisture: ${moisture}%, pH: ${ph}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-900 truncate">
            {isNaN(Number(id)) ? id : `R${id}`}
          </span>
          <div className={`w-2 h-2 rounded-full ${getOverallStatus()}`}></div>
        </div>
        
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="text-center">
            <div className="text-gray-500">T</div>
            <div className="font-medium text-gray-500">{Math.round(temperature)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">M</div>
            <div className="font-medium text-gray-500">{Math.round(moisture)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-500">pH</div>
            <div className="font-medium text-gray-500">{ph.toFixed(1)}</div>
          </div>
        </div>
        
        {isEditMode && (
          <div className="absolute -top-1 -right-1">
            <svg width="12" height="12" viewBox="0 0 20 20" className="text-gray-400">
              <path fill="currentColor" d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z"/>
            </svg>
          </div>
        )}
      </div>

      <RodDetailPopup
        id={id}
        temperature={temperature}
        moisture={moisture}
        ph={ph}
        conductivity={conductivity || 0}
        n={n || 0}
        p={p || 0}
        k={k || 0}
        timestamp={timestamp}
        hasValidData={hasValidData}
        isVisible={isHovered}
        position={mousePosition}
      />
    </>
  );
}
