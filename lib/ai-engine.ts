// AI Engine for Plant Care Recommendations
// Analyzes NPK, humidity, and environmental data to predict optimal fertilization and watering

export interface SensorReading {
  temperature: number | null
  moisture: number | null
  ph: number | null
  conductivity: number | null
  nitrogen: number | null // N
  phosphorus: number | null // P
  potassium: number | null // K
  timestamp: Date
}

export interface PlantRecommendation {
  rodId: string
  healthScore: number // 0-100
  watering: {
    hoursUntilNext: number
    urgency: 'low' | 'medium' | 'high' | 'critical'
    reason: string
  }
  fertilization: {
    daysUntilNext: number
    npkRatio: { n: number; p: number; k: number }
    urgency: 'low' | 'medium' | 'high' | 'critical'
    reason: string
  }
  confidence: number // 0-1
  lastUpdated: Date
}

class PlantCareAI {
  // Optimal ranges for different plant metrics
  private static OPTIMAL_RANGES = {
    temperature: { min: 18, max: 26 }, // Celsius
    moisture: { min: 40, max: 70 }, // Percentage
    ph: { min: 6.0, max: 7.5 },
    conductivity: { min: 1.2, max: 2.0 }, // mS/cm
    nitrogen: { min: 20, max: 200 }, // ppm
    phosphorus: { min: 10, max: 50 }, // ppm
    potassium: { min: 150, max: 300 } // ppm
  }

  // Calculate health score based on sensor readings
  static calculateHealthScore(readings: SensorReading[]): number {
    if (readings.length === 0) return 0

    const latest = readings[0] // Most recent reading
    const score = 100
    let penalties = 0

    // Temperature penalty
    if (latest.temperature !== null) {
      const temp = latest.temperature
      if (temp < this.OPTIMAL_RANGES.temperature.min || temp > this.OPTIMAL_RANGES.temperature.max) {
        const deviation = Math.min(
          Math.abs(temp - this.OPTIMAL_RANGES.temperature.min),
          Math.abs(temp - this.OPTIMAL_RANGES.temperature.max)
        )
        penalties += Math.min(30, deviation * 2)
      }
    }

    // Moisture penalty
    if (latest.moisture !== null) {
      const moisture = latest.moisture
      if (moisture < this.OPTIMAL_RANGES.moisture.min) {
        penalties += Math.min(25, (this.OPTIMAL_RANGES.moisture.min - moisture))
      } else if (moisture > this.OPTIMAL_RANGES.moisture.max) {
        penalties += Math.min(15, (moisture - this.OPTIMAL_RANGES.moisture.max) * 0.5)
      }
    }

    // pH penalty
    if (latest.ph !== null) {
      const ph = latest.ph
      if (ph < this.OPTIMAL_RANGES.ph.min || ph > this.OPTIMAL_RANGES.ph.max) {
        const deviation = Math.min(
          Math.abs(ph - this.OPTIMAL_RANGES.ph.min),
          Math.abs(ph - this.OPTIMAL_RANGES.ph.max)
        )
        penalties += Math.min(20, deviation * 10)
      }
    }

    // NPK penalties
    const npkPenalties = this.calculateNPKPenalties(latest)
    penalties += npkPenalties

    return Math.max(0, score - penalties)
  }

  private static calculateNPKPenalties(reading: SensorReading): number {
    let penalty = 0

    if (reading.nitrogen !== null && reading.nitrogen < this.OPTIMAL_RANGES.nitrogen.min) {
      penalty += Math.min(15, (this.OPTIMAL_RANGES.nitrogen.min - reading.nitrogen) * 0.1)
    }

    if (reading.phosphorus !== null && reading.phosphorus < this.OPTIMAL_RANGES.phosphorus.min) {
      penalty += Math.min(10, (this.OPTIMAL_RANGES.phosphorus.min - reading.phosphorus) * 0.2)
    }

    if (reading.potassium !== null && reading.potassium < this.OPTIMAL_RANGES.potassium.min) {
      penalty += Math.min(15, (this.OPTIMAL_RANGES.potassium.min - reading.potassium) * 0.05)
    }

    return penalty
  }

  // Predict optimal watering timing
  static predictWateringNeeds(readings: SensorReading[]): PlantRecommendation['watering'] {
    if (readings.length === 0) {
      return { hoursUntilNext: 24, urgency: 'medium', reason: 'No data available' }
    }

    const latest = readings[0]
    const moisture = latest.moisture || 50

    // Calculate watering urgency based on moisture levels
    if (moisture < 20) {
      return { hoursUntilNext: 1, urgency: 'critical', reason: 'Critically low moisture' }
    } else if (moisture < 30) {
      return { hoursUntilNext: 6, urgency: 'high', reason: 'Low moisture levels' }
    } else if (moisture < 40) {
      return { hoursUntilNext: 12, urgency: 'medium', reason: 'Moisture approaching low threshold' }
    } else if (moisture < 60) {
      return { hoursUntilNext: 24, urgency: 'low', reason: 'Moisture levels adequate' }
    } else {
      return { hoursUntilNext: 48, urgency: 'low', reason: 'High moisture levels' }
    }
  }

  // Predict optimal fertilization timing and NPK ratios
  static predictFertilizationNeeds(readings: SensorReading[]): PlantRecommendation['fertilization'] {
    if (readings.length === 0) {
      return { 
        daysUntilNext: 7, 
        npkRatio: { n: 10, p: 10, k: 10 }, 
        urgency: 'medium', 
        reason: 'No data available' 
      }
    }

    const latest = readings[0]
    const n = latest.nitrogen || 100
    const p = latest.phosphorus || 25
    const k = latest.potassium || 200

    // Calculate NPK deficiencies
    const nDeficit = Math.max(0, this.OPTIMAL_RANGES.nitrogen.min - n)
    const pDeficit = Math.max(0, this.OPTIMAL_RANGES.phosphorus.min - p)
    const kDeficit = Math.max(0, this.OPTIMAL_RANGES.potassium.min - k)

    const totalDeficit = nDeficit + pDeficit + kDeficit

    let urgency: 'low' | 'medium' | 'high' | 'critical'
    let daysUntilNext: number
    let reason: string

    if (totalDeficit > 100) {
      urgency = 'critical'
      daysUntilNext = 1
      reason = 'Severe nutrient deficiency detected'
    } else if (totalDeficit > 50) {
      urgency = 'high'
      daysUntilNext = 2
      reason = 'Multiple nutrient deficiencies'
    } else if (totalDeficit > 20) {
      urgency = 'medium'
      daysUntilNext = 5
      reason = 'Moderate nutrient needs'
    } else {
      urgency = 'low'
      daysUntilNext = 10
      reason = 'Nutrient levels adequate'
    }

    // Calculate recommended NPK ratios based on deficits
    const baseRatio = 10
    const npkRatio = {
      n: baseRatio + Math.min(20, nDeficit * 0.2),
      p: baseRatio + Math.min(15, pDeficit * 0.4),
      k: baseRatio + Math.min(25, kDeficit * 0.1)
    }

    return { daysUntilNext, npkRatio, urgency, reason }
  }

  // Calculate prediction confidence based on data quality
  static calculateConfidence(readings: SensorReading[]): number {
    if (readings.length === 0) return 0

    let confidence = 1.0
    const latest = readings[0]

    // Reduce confidence for missing sensor data
    const sensorCount = [
      latest.temperature, latest.moisture, latest.ph, 
      latest.conductivity, latest.nitrogen, 
      latest.phosphorus, latest.potassium
    ].filter(val => val !== null).length

    confidence *= sensorCount / 7 // Penalize missing sensors

    // Reduce confidence for stale data
    const hoursOld = (Date.now() - latest.timestamp.getTime()) / (1000 * 60 * 60)
    if (hoursOld > 24) confidence *= 0.5
    else if (hoursOld > 12) confidence *= 0.8

    // Increase confidence with more historical data
    const dataPoints = Math.min(readings.length, 10)
    confidence *= (0.5 + (dataPoints / 20))

    return Math.max(0.1, Math.min(1.0, confidence))
  }

  // Main prediction function
  static generateRecommendations(rodId: string, readings: SensorReading[]): PlantRecommendation {
    const healthScore = this.calculateHealthScore(readings)
    const watering = this.predictWateringNeeds(readings)
    const fertilization = this.predictFertilizationNeeds(readings)
    const confidence = this.calculateConfidence(readings)

    return {
      rodId,
      healthScore,
      watering,
      fertilization,
      confidence,
      lastUpdated: new Date()
    }
  }
}

export { PlantCareAI }