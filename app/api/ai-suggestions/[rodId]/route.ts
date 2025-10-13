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
                      take: 1 // Get only the latest reading
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

    // Get latest reading
    const latestReading = secondaryRod.readings[0]
    if (!latestReading) {
      return NextResponse.json(
        { error: "No sensor data available for this rod" },
        { status: 404 }
      )
    }

    // Get plant type from farm
    const plantType = farm.plantType || 'Unknown'

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