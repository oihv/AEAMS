import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AISuggestionService } from "@/lib/ai-suggestions"

export async function GET(
  request: NextRequest,
  { params }: { params: { rodId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { rodId } = params

    // Find the secondary rod and its farm
    const secondaryRod = await prisma.secondaryRod.findUnique({
      where: { rodId },
      include: {
        readings: {
          orderBy: { timestamp: 'desc' },
          take: 1 // Get only the latest reading
        },
        mainRod: {
          include: {
            farm: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!secondaryRod) {
      return NextResponse.json(
        { error: "Rod not found" },
        { status: 404 }
      )
    }

    // Verify user ownership
    if (secondaryRod.mainRod?.farm?.user?.email !== session.user.email) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Get latest reading
    const latestReading = secondaryRod.readings[0]
    if (!latestReading) {
      return NextResponse.json(
        { error: "No sensor data available for this rod" },
        { status: 404 }
      )
    }

    // Get plant type from farm
    const plantType = secondaryRod.mainRod?.farm?.plantType || 'Unknown'

    // Get cached or generate AI suggestions
    const result = await AISuggestionService.getOrCreateSuggestions(
      {
        id: latestReading.id,
        temperature: latestReading.temperature,
        moisture: latestReading.moisture,
        ph: latestReading.ph,
        conductivity: latestReading.conductivity,
        nitrogen: latestReading.nitrogen,
        phosphorus: latestReading.phosphorus,
        potassium: latestReading.potassium,
        timestamp: latestReading.timestamp
      },
      secondaryRod.id,
      plantType
    )

    const { cached, ...suggestions } = result

    return NextResponse.json({
      rodId,
      rodName: secondaryRod.name,
      plantType,
      lastUpdate: latestReading.timestamp,
      cached,
      suggestions
    })
  } catch (error) {
    console.error("🤖 AI Suggestions Error:", error)
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    )
  }
}