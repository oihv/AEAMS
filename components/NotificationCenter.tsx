"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from './NotificationProvider';
import { Notification } from '@/types/notifications';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedNotification(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '📢';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    router.push(`/dashboard/farm/${notification.farmId}`);
    setIsOpen(false);
  };

  const handleDetailView = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNotification(notification);
    markAsRead(notification.id);
  };

  const handleClearNotification = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotification(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-800 rounded-md"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Red dot indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {selectedNotification ? (
            /* Detailed Notification View */
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
                <button
                  onClick={(e) => handleClearNotification(selectedNotification.id, e)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Clear
                </button>
              </div>
              
              <div className={`p-4 rounded-lg border ${getSeverityColor(selectedNotification.severity)}`}>
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{getSeverityIcon(selectedNotification.severity)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{selectedNotification.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{selectedNotification.message}</p>
                    
                    <div className="mt-3 space-y-1 text-xs text-gray-600">
                      <div><strong>Farm:</strong> {selectedNotification.farmName}</div>
                      {selectedNotification.rodName && (
                        <div><strong>Rod:</strong> {selectedNotification.rodName}</div>
                      )}
                      {selectedNotification.sensorValue !== undefined && (
                        <div><strong>Current Value:</strong> {selectedNotification.sensorValue}</div>
                      )}
                      {selectedNotification.thresholdValue !== undefined && (
                        <div><strong>Threshold:</strong> {selectedNotification.thresholdValue}</div>
                      )}
                      <div><strong>Time:</strong> {selectedNotification.timestamp.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleNotificationClick(selectedNotification)}
                className="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                View Farm
              </button>
            </div>
          ) : (
            /* Notification List */
            <div>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                  {notifications.length > 0 && (
                    <div className="flex space-x-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={clearAllNotifications}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="text-4xl mb-2">🔔</div>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">{getSeverityIcon(notification.severity)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 truncate">{notification.message}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">{notification.farmName}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(notification.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={(e) => handleDetailView(notification, e)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Details
                        </button>
                        <button
                          onClick={(e) => handleClearNotification(notification.id, e)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}