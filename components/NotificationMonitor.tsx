"use client";

import { useEffect, useRef } from 'react';
import { useNotifications } from './NotificationProvider';
import { PlantCareAI, type SensorReading } from '@/lib/ai-engine';

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

    // Rate limiting: only process once every 10 seconds
    const now = Date.now();
    if (now - lastProcessTime.current < 10000) {
      console.log('NotificationMonitor: Rate limited, skipping processing');
      return;
    }
    lastProcessTime.current = now;

    console.log('NotificationMonitor: Processing farms with AI:', farms.length);

    farms.forEach(farm => {
      console.log(`Processing farm: ${farm.name}`, farm);
      
      if (!farm.mainRod?.secondaryRods) {
        console.log(`Farm ${farm.name} has no secondary rods`);
        return;
      }

      farm.mainRod.secondaryRods.forEach(rod => {
        console.log(`Processing rod: ${rod.name || rod.rodId}`, rod);
        
        if (!rod.readings || rod.readings.length === 0) {
          console.log(`Rod ${rod.name || rod.rodId} has no readings`);
          return;
        }

        const rodName = rod.name || rod.rodId || 'Unknown Rod';
        
        // Convert readings to AI engine format
        const sensorReadings: SensorReading[] = rod.readings.map(reading => ({
          temperature: reading.temperature || null,
          moisture: reading.moisture || null,
          ph: reading.ph || null,
          conductivity: reading.conductivity || null,
          nitrogen: reading.nitrogen || null,
          phosphorus: reading.phosphorus || null,
          potassium: reading.potassium || null,
          timestamp: new Date(reading.timestamp)
        }));

        // Generate AI recommendations
        const aiRecommendation = PlantCareAI.generateRecommendations(rod.rodId, sensorReadings);
        console.log(`AI recommendations for ${rodName}:`, aiRecommendation);

        // Create unique alert IDs with timestamp
        const createAlertId = (type: string, value?: number) => 
          `${farm.id}-${rod.rodId}-${type}-${value?.toFixed(1) || 'unknown'}-${new Date().toISOString().slice(0, 13)}`;

        // AI-based watering alerts
        if (aiRecommendation.watering.urgency === 'critical') {
          const alertId = createAlertId('ai_watering_critical');
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'ai_watering',
              title: '🤖 AI Alert: Critical Watering Needed',
              message: `${rodName}: ${aiRecommendation.watering.reason}. ${aiRecommendation.watering.hoursUntilNext === 0 ? 'Water now!' : `Water in ${aiRecommendation.watering.hoursUntilNext} hours.`}`,
              severity: 'critical',
              rodId: rod.rodId,
              rodName: rodName,
            });
          }
        } else if (aiRecommendation.watering.urgency === 'high') {
          const alertId = createAlertId('ai_watering_high');
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'ai_watering',
              title: '🤖 AI Alert: Watering Soon',
              message: `${rodName}: ${aiRecommendation.watering.reason}. ${aiRecommendation.watering.hoursUntilNext === 0 ? 'Water now!' : `Water in ${aiRecommendation.watering.hoursUntilNext} hours.`}`,
              severity: 'high',
              rodId: rod.rodId,
              rodName: rodName,
            });
          }
        }

        // AI-based fertilization alerts
        if (aiRecommendation.fertilization.urgency === 'critical') {
          const alertId = createAlertId('ai_fertilizer_critical');
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'ai_fertilization',
              title: '🤖 AI Alert: Critical Fertilization Needed',
              message: `${rodName}: ${aiRecommendation.fertilization.reason}. ${aiRecommendation.fertilization.daysUntilNext === 0 ? 'Fertilize now!' : `Fertilize in ${aiRecommendation.fertilization.daysUntilNext} days.`} NPK: ${Math.round(aiRecommendation.fertilization.npkRatio.n)}-${Math.round(aiRecommendation.fertilization.npkRatio.p)}-${Math.round(aiRecommendation.fertilization.npkRatio.k)}`,
              severity: 'critical',
              rodId: rod.rodId,
              rodName: rodName,
            });
          }
        } else if (aiRecommendation.fertilization.urgency === 'high') {
          const alertId = createAlertId('ai_fertilizer_high');
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'ai_fertilization',
              title: '🤖 AI Alert: Fertilization Soon',
              message: `${rodName}: ${aiRecommendation.fertilization.reason}. ${aiRecommendation.fertilization.daysUntilNext === 0 ? 'Fertilize now!' : `Fertilize in ${aiRecommendation.fertilization.daysUntilNext} days.`}`,
              severity: 'high',
              rodId: rod.rodId,
              rodName: rodName,
            });
          }
        }

        // Low plant health alert
        if (aiRecommendation.healthScore < 40) {
          const alertId = createAlertId('ai_health_low', aiRecommendation.healthScore);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'ai_health',
              title: '🤖 AI Alert: Poor Plant Health',
              message: `${rodName} health score is low (${aiRecommendation.healthScore}%). Check environmental conditions.`,
              severity: 'high',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: aiRecommendation.healthScore,
              thresholdValue: 40,
            });
          }
        } else if (aiRecommendation.healthScore < 60) {
          const alertId = createAlertId('ai_health_medium', aiRecommendation.healthScore);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'ai_health',
              title: '🤖 AI Alert: Moderate Plant Health',
              message: `${rodName} health score is moderate (${aiRecommendation.healthScore}%). Monitor conditions closely.`,
              severity: 'medium',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: aiRecommendation.healthScore,
              thresholdValue: 60,
            });
          }
        }

        // Low confidence alert (data quality issues)
        if (aiRecommendation.confidence < 0.5) {
          const alertId = createAlertId('ai_confidence_low', aiRecommendation.confidence);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'data_quality',
              title: '🤖 AI Alert: Low Data Quality',
              message: `${rodName} AI confidence is low (${Math.round(aiRecommendation.confidence * 100)}%). Check sensor functionality.`,
              severity: 'medium',
              rodId: rod.rodId,
              rodName: rodName,
            });
          }
        }

        // Keep legacy alerts for immediate threshold violations
        const latestReading = rod.readings[0];
        
        // Legacy critical alerts for immediate action
        if (latestReading.moisture !== undefined && latestReading.moisture !== null && latestReading.moisture < 5) {
          const alertId = createAlertId('legacy_critical_moisture', latestReading.moisture);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'low_moisture',
              title: 'Critical: Extremely Low Moisture',
              message: `${rodName} moisture critically low (${latestReading.moisture.toFixed(1)}%). IMMEDIATE ACTION REQUIRED.`,
              severity: 'critical',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: latestReading.moisture,
              thresholdValue: 5,
            });
          }
        }

        if (latestReading.temperature !== undefined && latestReading.temperature !== null && latestReading.temperature > 40) {
          const alertId = createAlertId('legacy_critical_temp', latestReading.temperature);
          if (!processedAlerts.current.has(alertId)) {
            processedAlerts.current.add(alertId);
            addNotification({
              farmId: farm.id,
              farmName: farm.name,
              type: 'high_temperature',
              title: 'Critical: Dangerous Temperature',
              message: `${rodName} temperature dangerously high (${latestReading.temperature.toFixed(1)}°C). IMMEDIATE ACTION REQUIRED.`,
              severity: 'critical',
              rodId: rod.rodId,
              rodName: rodName,
              sensorValue: latestReading.temperature,
              thresholdValue: 40,
            });
          }
        }

        // Check for very old readings (older than 2 hours)
        if (latestReading.timestamp) {
          const readingTime = new Date(latestReading.timestamp);
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          
          if (readingTime < twoHoursAgo) {
            const alertId = createAlertId('rod_offline');
            if (!processedAlerts.current.has(alertId)) {
              processedAlerts.current.add(alertId);
              addNotification({
                farmId: farm.id,
                farmName: farm.name,
                type: 'rod_offline',
                title: 'Rod Offline',
                message: `${rodName} hasn't sent data for over 2 hours. Last reading: ${readingTime.toLocaleTimeString()}.`,
                severity: 'critical',
                rodId: rod.rodId,
                rodName: rodName,
              });
            }
          }
        }
      });
    });
  }, [farms, addNotification]);

  return null; // This component doesn't render anything
}