import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getMLEngine, type SensorReading } from "@/lib/ml-engine"

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

    // Convert Prisma readings to ML engine format
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

    // Generate ML-based predictions
    const mlEngine = getMLEngine()
    const predictions = await mlEngine.generateMLPredictions(rodId, sensorReadings)

    return NextResponse.json({
      success: true,
      rod: {
        id: secondaryRod.rodId,
        name: secondaryRod.name,
        location: secondaryRod.location
      },
      predictions,
      dataPoints: sensorReadings.length,
      analysisTimestamp: new Date(),
      modelInfo: mlEngine.getModelInfo()
    })

  } catch (error) {
    console.error("🤖 ML Prediction Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}