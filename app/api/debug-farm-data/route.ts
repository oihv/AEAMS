import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// @ts-nocheck
export async function GET() {
  try {
    // Get a sample farm with full data structure
    const farm = await prisma.farm.findFirst({
      include: {
        user: {
          select: { name: true, email: true }
        },
        mainRod: {
          include: {
            secondaryRods: {
              include: {
                readings: {
                  orderBy: { timestamp: 'desc' },
                  take: 3
                }
              }
            }
          }
        }
      }
    })

    if (!farm) {
      return NextResponse.json({ message: "No farms found" })
    }

    // Return the exact structure to understand the data
    return NextResponse.json({
      message: "Farm data structure for debugging",
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        description: farm.description,
        user: farm.user,
        mainRod: farm.mainRod ? {
          id: farm.mainRod.id,
          rodId: farm.mainRod.rodId,
          isConnected: farm.mainRod.isConnected,
          lastSeen: farm.mainRod.lastSeen,
          secondaryRods: farm.mainRod.secondaryRods.map(rod => ({
            id: rod.id,
            rodId: rod.rodId,
            name: rod.name,
            location: rod.location,
            isActive: rod.isActive,
            lastSeen: rod.lastSeen,
            readingsCount: rod.readings.length,
            latestReading: rod.readings[0] || null
          }))
        } : null
      }
    })
  } catch (error) {
    console.error("Debug farm data error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
