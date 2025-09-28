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

    // Find the secondary rod and verify user access
    const secondaryRod = await prisma.secondaryRod.findUnique({
      where: { rodId },
      include: {
        mainRod: {
          include: {
            farm: {
              include: {
                user: true
              }
            }
          }
        },
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 50 // Get recent readings for analysis
        }
      }
    })

    if (!secondaryRod) {
      return NextResponse.json(
        { error: "Rod not found" },
        { status: 404 }
      )
    }

    // Verify user owns this rod through farm ownership
    const userEmail = session.user.email
    if (!secondaryRod.mainRod?.farm?.user || secondaryRod.mainRod.farm.user.email !== userEmail) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
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