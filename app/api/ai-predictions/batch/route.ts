import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PlantCareAI, type SensorReading } from "@/lib/ai-engine"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { farmId } = await request.json()

    if (!farmId) {
      return NextResponse.json(
        { error: "Farm ID required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get all secondary rods for the farm
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        userId: user.id
      },
      include: {
        mainRod: {
          include: {
            secondaryRods: {
              include: {
                readings: {
                  orderBy: { timestamp: 'desc' },
                  take: 50
                }
              }
            }
          }
        }
      }
    })

    if (!farm || !farm.mainRod) {
      return NextResponse.json(
        { error: "Farm not found or no main rod" },
        { status: 404 }
      )
    }

    // Generate predictions for all secondary rods
    const predictions = farm.mainRod.secondaryRods.map(rod => {
      const sensorReadings: SensorReading[] = rod.readings.map(reading => ({
        temperature: reading.temperature,
        moisture: reading.moisture,
        ph: reading.ph,
        conductivity: reading.conductivity,
        nitrogen: reading.nitrogen,
        phosphorus: reading.phosphorus,
        potassium: reading.potassium,
        timestamp: reading.timestamp
      }))

      const prediction = PlantCareAI.generateRecommendations(rod.rodId, sensorReadings)
      return {
        ...prediction,
        rodName: rod.name,
        rodLocation: rod.location,
        dataPoints: sensorReadings.length
      }
    })

    // Calculate farm-level statistics
    const averageHealth = predictions.length > 0 
      ? predictions.reduce((sum, p) => sum + p.healthScore, 0) / predictions.length 
      : 0
    
    const criticalAlerts = predictions.filter(p => 
      p.watering.urgency === 'critical' || p.fertilization.urgency === 'critical'
    ).length

    const highPriorityAlerts = predictions.filter(p => 
      p.watering.urgency === 'high' || p.fertilization.urgency === 'high'
    ).length

    return NextResponse.json({
      success: true,
      farmId,
      farmName: farm.name,
      predictions,
      statistics: {
        totalRods: predictions.length,
        averageHealthScore: Math.round(averageHealth),
        criticalAlerts,
        highPriorityAlerts,
        averageConfidence: predictions.length > 0 
          ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
          : 0
      },
      analysisTimestamp: new Date()
    })

  } catch (error) {
    console.error("🤖 Batch AI Prediction Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}