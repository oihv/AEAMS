import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PlantCareAI, type SensorReading } from "@/lib/ai-engine"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ rodId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { rodId } = await params

    // Find the secondary rod through user's farms (since rodId is no longer globally unique)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        farms: {
          include: {
            mainRod: {
              include: {
                secondaryRods: {
                  where: { rodId },
                  include: {
                    readings: {
                      orderBy: { timestamp: 'desc' },
                      take: 50 // Get recent readings for analysis
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Find the secondary rod across all user's farms
    let secondaryRod = null
    let farm = null
    for (const userFarm of user.farms) {
      if (userFarm.mainRod?.secondaryRods) {
        const foundRod = userFarm.mainRod.secondaryRods.find(rod => rod.rodId === rodId)
        if (foundRod) {
          secondaryRod = foundRod
          farm = userFarm
          break
        }
      }
    }

    if (!secondaryRod || !farm) {
      return NextResponse.json(
        { error: "Rod not found" },
        { status: 404 }
      )
    }

    // Convert Prisma readings to AI engine format
    const sensorReadings: SensorReading[] = secondaryRod.readings.map(reading => ({
      temperature: reading.temperature,
      moisture: reading.moisture,
      ph: reading.ph,
      conductivity: reading.conductivity,
      nitrogen: reading.nitrogen,
      phosphorus: reading.phosphorus,
      potassium: reading.potassium,
      timestamp: reading.timestamp
    }))

    // Generate AI recommendations
    const recommendations = PlantCareAI.generateRecommendations(rodId, sensorReadings)

    return NextResponse.json({
      success: true,
      rod: {
        id: secondaryRod.rodId,
        name: secondaryRod.name,
        location: secondaryRod.location
      },
      recommendations,
      dataPoints: sensorReadings.length,
      analysisTimestamp: new Date()
    })

  } catch (error) {
    console.error("🤖 AI Prediction Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Batch predictions for all rods in a farm
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

      return PlantCareAI.generateRecommendations(rod.rodId, sensorReadings)
    })

    // Calculate farm-level statistics
    const averageHealth = predictions.reduce((sum, p) => sum + p.healthScore, 0) / predictions.length
    const criticalAlerts = predictions.filter(p => 
      p.watering.urgency === 'critical' || p.fertilization.urgency === 'critical'
    ).length

    return NextResponse.json({
      success: true,
      farmId,
      predictions,
      statistics: {
        totalRods: predictions.length,
        averageHealthScore: Math.round(averageHealth),
        criticalAlerts,
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
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