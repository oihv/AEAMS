"use client";

import { RodCardProps } from './RodCard';

interface RodDetailPopupProps extends RodCardProps {
  isVisible: boolean;
  position: { x: number; y: number };
}

export default function RodDetailPopup({ 
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
  isVisible,
  position
}: RodDetailPopupProps) {
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
      default:
        return 'text-gray-600'
    }
  }

  if (!isVisible) return null;

  // Calculate popup positioning to prevent off-screen display
  const popupWidth = 320; // w-80 = 320px
  const popupHeight = 240; // approximate height
  const offset = 10;
  
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  
  let left = position.x + offset;
  let top = position.y - popupHeight - offset;
  
  // Adjust horizontal position if popup would go off-screen
  if (left + popupWidth > windowWidth) {
    left = position.x - popupWidth - offset;
  }
  
  // Adjust vertical position if popup would go off-screen
  if (top < 0) {
    top = position.y + offset;
  }

  return (
    <div 
      className="fixed z-[2000] bg-white rounded-lg border border-gray-200 shadow-lg p-4 w-80 pointer-events-none"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {isNaN(Number(id)) ? id : `Rod ${id}`}
        </h3>
        <div className={`w-3 h-3 rounded-full ${hasValidData ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="space-y-2 text-sm">
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
        
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">NPK Levels:</div>
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
          <div className="pt-2 mt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Last update: {new Date(timestamp).toLocaleString()}
            </div>
          </div>
        )}
        
        {!hasValidData && (
          <div className="pt-2 mt-2 border-t border-red-100">
            <div className="text-xs text-red-600 font-medium">
              ⚠️ Missing from latest update
            </div>
          </div>
        )}
      </div>
    </div>
  );
}