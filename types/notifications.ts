export interface Notification {
  id: string;
  farmId: string;
  farmName: string;
  type: 'low_moisture' | 'high_temperature' | 'ph_alert' | 'rod_offline' | 'sensor_error' | 'ai_watering' | 'ai_fertilization' | 'ai_health' | 'data_quality';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  isRead: boolean;
  rodId?: string;
  rodName?: string;
  sensorValue?: number;
  thresholdValue?: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}