"use client";

import { useEffect, useRef } from 'react';
import { useNotifications } from './NotificationProvider';

interface Farm {
  id: string;
  name: string;
  location?: string;
  description?: string;
  mainRod?: {
    id: string;
    rodId: string;
    isConnected: boolean;
    lastSeen?: string;
    secondaryRods: Array<{
      id: string;
      rodId: string;
      name?: string;
      location?: string;
      readings: Array<{
        temperature?: number;
        moisture?: number;
        ph?: number;
        conductivity?: number;
        nitrogen?: number;
        phosphorus?: number;
        potassium?: number;
        timestamp: string;
      }>;
    }>;
  };
}

interface NotificationMonitorProps {
  farms: Farm[];
}

export default function NotificationMonitor({ farms }: NotificationMonitorProps) {
  const { addNotification } = useNotifications();
  const processedAlerts = useRef(new Set<string>());
  const lastProcessTime = useRef<number>(0);

  useEffect(() => {
    if (!farms || farms.length === 0) return;

    // Rate limiting: only process once every 5 seconds
    const now = Date.now();
    if (now - lastProcessTime.current < 5000) {
      console.log('NotificationMonitor: Rate limited, skipping processing');
      return;
    }
    lastProcessTime.current = now;

    console.log('NotificationMonitor: Processing farms:', farms.length);

    farms.forEach(farm => {
      console.log(`Processing farm: ${farm.name}`, farm);
      
      if (!farm.mainRod?.secondaryRods) {
        console.log(`Farm ${farm.name} has no secondary rods`);
        return;
      }

      farm.mainRod.secondaryRods.forEach(rod => {
        console.log(`Processing rod: ${rod.name || rod.rodId}`, rod);
        
        const latestReading = rod.readings?.[0];
        if (!latestReading) {
          console.log(`Rod ${rod.name || rod.rodId} has no readings`);
          return;
        }

        console.log(`Latest reading for ${rod.name || rod.rodId}:`, latestReading);
        
        const rodName = rod.name || rod.rodId || 'Unknown Rod';
        
        // Create unique alert IDs with timestamp to prevent duplicates but allow new alerts for same conditions
        const createAlertId = (type: string, value?: number) => 
          `${farm.id}-${rod.rodId}-${type}-${value?.toFixed(1) || 'unknown'}-${new Date(latestReading.timestamp).toISOString().slice(0, 13)}`; // Include hour for uniqueness

        // Check for low moisture (below 10%)
        if (latestReading.moisture !== undefined && latestReading.moisture !== null && latestReading.moisture < 10) {
          const alertId = createAlertId('low_moisture', latestReading.moisture);
          console.log(`LOW MOISTURE ALERT: ${rodName} - ${latestReading.moisture}% (Alert ID: ${alertId})`);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            console.log('Adding low moisture notification');
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'low_moisture',
              title: 'Low Moisture Alert',
              message: `${rodName} has low moisture level (${latestReading.moisture.toFixed(1)}%). Immediate attention required.`,
              severity: 'high',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: latestReading.moisture,
              thresholdValue: 10,
            });
          } else {
            console.log('Low moisture alert already processed');
          }
        } else {
          console.log(`Moisture OK: ${latestReading.moisture}%`);
        }

        // Check for high temperature (above 35°C)
        if (latestReading.temperature !== undefined && latestReading.temperature !== null && latestReading.temperature > 35) {
          const alertId = createAlertId('high_temp', latestReading.temperature);
          console.log(`HIGH TEMPERATURE ALERT: ${rodName} - ${latestReading.temperature}°C (Alert ID: ${alertId})`);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            console.log('Adding high temperature notification');
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'high_temperature',
              title: 'High Temperature Alert',
              message: `${rodName} temperature is too high (${latestReading.temperature.toFixed(1)}°C). Check cooling systems.`,
              severity: 'high',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: latestReading.temperature,
              thresholdValue: 35,
            });
          } else {
            console.log('High temperature alert already processed');
          }
        } else {
          console.log(`Temperature OK: ${latestReading.temperature}°C`);
        }

        // Check for very low temperature (below 15°C)
        if (latestReading.temperature !== undefined && latestReading.temperature !== null && latestReading.temperature < 15) {
          const alertId = createAlertId('low_temp', latestReading.temperature);
          console.log(`LOW TEMPERATURE ALERT: ${rodName} - ${latestReading.temperature}°C (Alert ID: ${alertId})`);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            console.log('Adding low temperature notification');
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'high_temperature', // Using same type for temperature issues
              title: 'Low Temperature Alert',
              message: `${rodName} temperature is too low (${latestReading.temperature.toFixed(1)}°C). Check heating systems.`,
              severity: 'medium',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: latestReading.temperature,
              thresholdValue: 15,
            });
          } else {
            console.log('Low temperature alert already processed');
          }
        }

        // Check for pH out of range (not between 6.0-7.0)
        if (latestReading.ph !== undefined && latestReading.ph !== null && (latestReading.ph < 6.0 || latestReading.ph > 7.0)) {
          const alertId = createAlertId('ph_alert', latestReading.ph);
          console.log(`PH ALERT: ${rodName} - ${latestReading.ph} (Alert ID: ${alertId})`);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            console.log('Adding pH notification');
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'ph_alert',
              title: 'pH Level Alert',
              message: `${rodName} pH is out of optimal range (${latestReading.ph.toFixed(1)}). Optimal range: 6.0-7.0.`,
              severity: 'medium',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: latestReading.ph,
              thresholdValue: latestReading.ph < 6.0 ? 6.0 : 7.0,
            });
          } else {
            console.log('pH alert already processed');
          }
        } else {
          console.log(`pH OK: ${latestReading.ph}`);
        }

        // Check for very high moisture (above 25%)
        if (latestReading.moisture !== undefined && latestReading.moisture !== null && latestReading.moisture > 25) {
          const alertId = createAlertId('high_moisture', latestReading.moisture);
          console.log(`HIGH MOISTURE ALERT: ${rodName} - ${latestReading.moisture}% (Alert ID: ${alertId})`);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            console.log('Adding high moisture notification');
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'low_moisture', // Using same type for moisture issues
              title: 'High Moisture Alert',
              message: `${rodName} has high moisture level (${latestReading.moisture.toFixed(1)}%). Check drainage systems.`,
              severity: 'medium',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: latestReading.moisture,
              thresholdValue: 25,
            });
          } else {
            console.log('High moisture alert already processed');
          }
        }

        // Check for very old readings (older than 1 hour)
        if (latestReading.timestamp) {
          const readingTime = new Date(latestReading.timestamp);
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
          
          if (readingTime < oneHourAgo) {
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'rod_offline',
              title: 'Rod Offline',
              message: `${rodName} hasn't sent data for over an hour. Last reading: ${readingTime.toLocaleTimeString()}.`,
              severity: 'critical',
              rodId: rod.rodId,
              rodName: rodName,
            });
          }
        }
      });
    });
  }, [farms, addNotification]);

  return null; // This component doesn't render anything
}