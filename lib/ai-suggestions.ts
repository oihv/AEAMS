interface SensorReading {
  temperature?: number | null
  moisture?: number | null
  ph?: number | null
  conductivity?: number | null
  nitrogen?: number | null
  phosphorus?: number | null
  potassium?: number | null
  timestamp: Date
}

export interface AISuggestion {
  watering: {
    recommendation: 'now' | 'soon' | 'later' | 'not_needed'
    hoursUntilNext: number
    reason: string
    urgency: 'low' | 'medium' | 'high'
  }
  fertilizing: {
    recommendation: 'now' | 'soon' | 'later' | 'not_needed'
    daysUntilNext: number
    reason: string
    type: 'nitrogen' | 'phosphorus' | 'potassium' | 'balanced' | 'none'
    urgency: 'low' | 'medium' | 'high' | 'critical'
  }
  plantHealth: {
    score: number // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
    concerns: string[]
  }
}

import { OpenAI } from "openai"
import { prisma } from "./prisma"
import { cacheMonitor } from "./cache-monitor"

export class AISuggestionService {
  /**
   * Generate a hash of sensor data values for cache invalidation
   */
  private static generateDataHash(reading: SensorReading): string {
    const values = [
      reading.temperature,
      reading.moisture,
      reading.ph,
      reading.conductivity,
      reading.nitrogen,
      reading.phosphorus,
      reading.potassium
    ].map(v => v?.toString() || 'null').join('|')
    
    // Simple hash function
    let hash = 0
    for (let i = 0; i < values.length; i++) {
      const char = values.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  /**
   * Get cached or generate new AI suggestions
   */
  static async getOrCreateSuggestions(
    reading: SensorReading & { id: string },
    secondaryRodId: string,
    plantType: string = 'Unknown'
  ): Promise<AISuggestion & { cached: boolean }> {
    const startTime = Date.now()
    
    try {
      const dataHash = this.generateDataHash(reading)
      
      // Check for existing cached suggestion with matching data hash
      const existingSuggestion = await prisma.aISuggestion.findFirst({
        where: { 
          readingId: reading.id,
          // Check if the suggestion was generated recently with same data
          generatedAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes cache window
          }
        },
        orderBy: { generatedAt: 'desc' }
      })

      // Use cached suggestion if found within time window
      if (existingSuggestion) {
        const responseTime = Date.now() - startTime
        const modelType = existingSuggestion.model as 'rule_based' | 'deepseek'
        
        // Record cache hit
        cacheMonitor.recordCacheHit(responseTime, modelType, secondaryRodId, reading.id)
        
        return {
          ...JSON.parse(JSON.stringify(existingSuggestion.suggestion)) as AISuggestion,
          cached: true
        }
      }

      // Generate new suggestion
      const suggestion = await this.generateSuggestions(reading, plantType)
      const modelType = process.env.HF_TOKEN ? 'deepseek' : 'rule_based'
      
      // Delete old suggestions for this reading to prevent accumulation
      await prisma.aISuggestion.deleteMany({
        where: { readingId: reading.id }
      })
      
      // Cache the result with current timestamp
      await prisma.aISuggestion.create({
        data: {
          readingId: reading.id,
          secondaryRodId,
          plantType,
          model: modelType,
          suggestion: suggestion as any,
          generatedAt: new Date() // Explicit timestamp for cache validation
        }
      })

      const responseTime = Date.now() - startTime
      
      // Record cache miss (new suggestion generated)
      cacheMonitor.recordCacheMiss(responseTime, modelType, secondaryRodId, reading.id)

      return {
        ...suggestion,
        cached: false
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Categorize and record the error
      if (errorMessage.includes('Prisma') || errorMessage.includes('database')) {
        cacheMonitor.recordDbError(errorMessage, secondaryRodId, reading.id)
      } else if (errorMessage.includes('OpenAI') || errorMessage.includes('HuggingFace')) {
        cacheMonitor.recordAiError(responseTime, errorMessage, secondaryRodId, reading.id)
      } else {
        cacheMonitor.recordCacheError(errorMessage, secondaryRodId, reading.id)
      }
      
      throw error
    }
  }

  /**
   * Generate AI-powered suggestions using HuggingFace DeepSeek model
   */
  static async generateSuggestions(
    reading: SensorReading,
    plantType: string = 'Unknown'
  ): Promise<AISuggestion> {
    const hfToken = process.env.HF_TOKEN

    // Fallback to rule-based suggestions if no API key
    if (!hfToken) {
      console.warn('⚠️ HF_TOKEN not found, using rule-based suggestions')
      return this.getRuleBasedSuggestions(reading, plantType)
    }

    try {
      const client = new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: hfToken,
      })

      const prompt = this.buildPrompt(reading, plantType)
      
      const chatCompletion = await client.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V3.1-Terminus:novita",
        messages: [
          {
            role: "system",
            content: "You are an agricultural AI assistant specializing in precision farming. Provide concise, actionable advice based on sensor data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 400,
      })

      const content = chatCompletion.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from HuggingFace DeepSeek model')
      }

      return this.parseLLMResponse(content, reading, plantType)
    } catch (error) {
      console.error('🤖 AI Suggestion Error (HuggingFace):', error)
      // Fallback to rule-based suggestions
      return this.getRuleBasedSuggestions(reading, plantType)
    }
  }

  /**
   * Build a structured prompt for the LLM
   */
  private static buildPrompt(reading: SensorReading, plantType: string): string {
    const dataAge = reading.timestamp ? 
      Math.floor((Date.now() - new Date(reading.timestamp).getTime()) / (1000 * 60)) : 
      'unknown'

    return `
Analyze this agricultural sensor data and provide watering/fertilizing recommendations:

PLANT TYPE: ${plantType}
DATA AGE: ${dataAge} minutes old

SENSOR READINGS:
- Temperature: ${reading.temperature ?? 'N/A'}°C
- Soil Moisture: ${reading.moisture ?? 'N/A'}%
- pH Level: ${reading.ph ?? 'N/A'}
- Conductivity: ${reading.conductivity ?? 'N/A'} mS/cm
- Nitrogen (N): ${reading.nitrogen ?? 'N/A'} ppm
- Phosphorus (P): ${reading.phosphorus ?? 'N/A'} ppm
- Potassium (K): ${reading.potassium ?? 'N/A'} ppm

Please respond with EXACTLY this JSON format (no additional text):
{
  "watering": {
    "recommendation": "now|soon|later|not_needed",
     "hoursUntilNext": number (0 for "now", 1-4 for "soon", 6-24 for "later", 24-72 for "not_needed"),
    "reason": "brief explanation",
    "urgency": "low|medium|high"
  },
   "fertilizing": {
     "recommendation": "now|soon|later|not_needed", 
     "daysUntilNext": number (0 for "now", 1-3 for "soon", 3-14 for "later", 14+ for "not_needed"),
     "reason": "brief explanation (critical deficiency <5ppm P, <10ppm N, <30ppm K requires immediate action)",
     "type": "nitrogen|phosphorus|potassium|balanced|none"
   },
  "plantHealth": {
    "score": number_0_to_100,
    "status": "excellent|good|fair|poor|critical",
    "concerns": ["list", "of", "issues"]
  }
}
    `.trim()
  }

  /**
   * Validate fertilizing timing based on recommendation
   */
  private static validateFertilizingDays(recommendation: string, providedDays?: number): number {
    if (recommendation === 'now') {
      return 0
    } else if (recommendation === 'soon') {
      return providedDays && providedDays <= 3 ? providedDays : 2
    } else if (recommendation === 'later') {
      return providedDays && providedDays >= 3 && providedDays <= 14 ? providedDays : 7
    } else if (recommendation === 'not_needed') {
      return providedDays && providedDays >= 14 ? providedDays : 30
    }
    return 7 // default
  }

  /**
   * Parse and validate LLM response
   */
  private static parseLLMResponse(content: string, reading: SensorReading, plantType: string): AISuggestion {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? jsonMatch[0] : content
      
      const parsed = JSON.parse(jsonStr)
      
      // Validate the structure and ensure consistency
      const wateringRec = parsed.watering?.recommendation || 'later'
      const providedHours = parsed.watering?.hoursUntilNext
      
      // Validate and correct inconsistent timing
      let hoursUntilNext = 24 // default
      
      if (wateringRec === 'now') {
        hoursUntilNext = 0
      } else if (wateringRec === 'soon') {
        hoursUntilNext = providedHours && providedHours <= 4 ? providedHours : 2
      } else if (wateringRec === 'later') {
        hoursUntilNext = providedHours && providedHours >= 6 && providedHours <= 24 ? providedHours : 12
      } else if (wateringRec === 'not_needed') {
        hoursUntilNext = providedHours && providedHours >= 24 ? providedHours : 48
      }
      
      return {
        watering: {
          recommendation: wateringRec,
          hoursUntilNext: Math.max(0, hoursUntilNext),
          reason: parsed.watering?.reason || 'Based on current conditions',
          urgency: parsed.watering?.urgency || 'medium'
        },
        fertilizing: {
          recommendation: parsed.fertilizing?.recommendation || 'later',
          daysUntilNext: Math.max(0, this.validateFertilizingDays(
            parsed.fertilizing?.recommendation || 'later',
            parsed.fertilizing?.daysUntilNext
          )),
          reason: parsed.fertilizing?.reason || 'Nutrient levels stable',
          type: parsed.fertilizing?.type || 'balanced',
          urgency: parsed.fertilizing?.urgency || 'low'
        },
        plantHealth: {
          score: Math.min(100, Math.max(0, parsed.plantHealth?.score || 70)),
          status: parsed.plantHealth?.status || 'fair',
          concerns: Array.isArray(parsed.plantHealth?.concerns) ? parsed.plantHealth.concerns : []
        }
      }
    } catch (error) {
      console.error('🔧 Failed to parse LLM response:', error)
      // Fallback to rule-based suggestions
      return this.getRuleBasedSuggestions(reading, plantType)
    }
  }

  /**
   * Fallback rule-based suggestions when AI is unavailable
   */
  private static getRuleBasedSuggestions(reading: SensorReading, plantType: string): AISuggestion {
    // Watering logic
    let wateringRec: AISuggestion['watering'] = {
      recommendation: 'later',
      hoursUntilNext: 24,
      reason: 'Moisture level optimal',
      urgency: 'low'
    }

    if (reading.moisture !== null && reading.moisture !== undefined) {
      if (reading.moisture < 20) {
        wateringRec = {
          recommendation: 'now',
          hoursUntilNext: 0,
          reason: 'Soil moisture critically low',
          urgency: 'high'
        }
      } else if (reading.moisture < 40) {
        wateringRec = {
          recommendation: 'soon',
          hoursUntilNext: 2,
          reason: 'Soil moisture getting low',
          urgency: 'medium'
        }
      } else if (reading.moisture >= 40 && reading.moisture <= 70) {
        wateringRec = {
          recommendation: 'later',
          hoursUntilNext: 12,
          reason: 'Soil moisture is adequate',
          urgency: 'low'
        }
      } else if (reading.moisture > 70) {
        wateringRec = {
          recommendation: 'not_needed',
          hoursUntilNext: 48,
          reason: 'Soil is well hydrated',
          urgency: 'low'
        }
      }
    }

    // Fertilizing logic
    let fertilizingRec: AISuggestion['fertilizing'] = {
      recommendation: 'later',
      daysUntilNext: 14,
      reason: 'Nutrient levels adequate',
      type: 'balanced',
      urgency: 'low'
    }

    // Check NPK levels with severity-based thresholds
    const critically_lowN = reading.nitrogen !== null && reading.nitrogen !== undefined && reading.nitrogen < 10
    const lowN = reading.nitrogen !== null && reading.nitrogen !== undefined && reading.nitrogen < 20
    const critically_lowP = reading.phosphorus !== null && reading.phosphorus !== undefined && reading.phosphorus < 5
    const lowP = reading.phosphorus !== null && reading.phosphorus !== undefined && reading.phosphorus < 15  
    const critically_lowK = reading.potassium !== null && reading.potassium !== undefined && reading.potassium < 30
    const lowK = reading.potassium !== null && reading.potassium !== undefined && reading.potassium < 50

    // Handle critical deficiencies first
    if (critically_lowP) {
      fertilizingRec = {
        recommendation: 'now',
        daysUntilNext: 0,
        reason: 'Severe phosphorus deficiency detected',
        type: 'phosphorus',
        urgency: 'critical'
      }
    } else if (critically_lowN) {
      fertilizingRec = {
        recommendation: 'now',
        daysUntilNext: 0,
        reason: 'Severe nitrogen deficiency detected',
        type: 'nitrogen',
        urgency: 'critical'
      }
    } else if (critically_lowK) {
      fertilizingRec = {
        recommendation: 'soon',
        daysUntilNext: 1,
        reason: 'Severe potassium deficiency detected',
        type: 'potassium',
        urgency: 'critical'
      }
    }
    // Handle multiple nutrient deficiencies
    else if (lowN && lowP && lowK) {
      fertilizingRec = {
        recommendation: 'soon',
        daysUntilNext: 2,
        reason: 'Multiple nutrients are low',
        type: 'balanced',
        urgency: 'high'
      }
    } else if (lowN) {
      fertilizingRec = {
        recommendation: 'soon',
        daysUntilNext: 3,
        reason: 'Nitrogen levels are low',
        type: 'nitrogen',
        urgency: 'medium'
      }
    } else if (lowP) {
      fertilizingRec = {
        recommendation: 'soon',
        daysUntilNext: 3,
        reason: 'Phosphorus levels are low',
        type: 'phosphorus',
        urgency: 'medium'
      }
    } else if (lowK) {
      fertilizingRec = {
        recommendation: 'later',
        daysUntilNext: 5,
        reason: 'Potassium levels are low',
        type: 'potassium',
        urgency: 'low'
      }
    }

    // Plant health assessment
    let healthScore = 70
    const concerns: string[] = []

    // Temperature assessment
    if (reading.temperature !== null && reading.temperature !== undefined) {
      if (reading.temperature < 15 || reading.temperature > 35) {
        healthScore -= 20
        concerns.push('Temperature stress')
      } else if (reading.temperature >= 18 && reading.temperature <= 25) {
        healthScore += 10 // Bonus for optimal temperature
      }
    }

    // pH assessment  
    if (reading.ph !== null && reading.ph !== undefined) {
      if (reading.ph < 6.0 || reading.ph > 7.5) {
        healthScore -= 15
        concerns.push('pH imbalance')
      } else if (reading.ph >= 6.0 && reading.ph <= 7.0) {
        healthScore += 8 // Bonus for good pH
      }
    }

    // Moisture assessment
    if (reading.moisture !== null && reading.moisture !== undefined) {
      if (reading.moisture < 30) {
        healthScore -= 25
        concerns.push('Water stress')
      } else if (reading.moisture >= 50 && reading.moisture <= 70) {
        healthScore += 12 // Bonus for optimal moisture
      } else if (reading.moisture > 80) {
        healthScore -= 10
        concerns.push('Overwatering risk')
      }
    }

    // Nutrient level bonus
    if (!lowN && !lowP && !lowK) {
      healthScore += 8 // Bonus for adequate nutrients
    }

    const getHealthStatus = (score: number): AISuggestion['plantHealth']['status'] => {
      if (score >= 90) return 'excellent'
      if (score >= 75) return 'good'
      if (score >= 60) return 'fair'
      if (score >= 40) return 'poor'
      return 'critical'
    }

    return {
      watering: wateringRec,
      fertilizing: fertilizingRec,
      plantHealth: {
        score: Math.max(0, Math.min(100, healthScore)),
        status: getHealthStatus(healthScore),
        concerns
      }
    }
  }
}