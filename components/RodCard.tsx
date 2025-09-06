export type RodCardProps = {
  id: string;
  temperature: number;
  moisture: number;
  ph: number;
  conductivity: number;
  n: number;
  p: number;
  k: number;
};

export default function RodCard({ id, temperature, moisture, ph, conductivity, n, p, k }: RodCardProps) {
  const getStatusColor = (value: number, type: string) => {
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{id}</h3>
        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
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
      </div>
    </div>
  );
}

