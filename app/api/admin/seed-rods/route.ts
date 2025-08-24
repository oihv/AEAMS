import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// This is for testing purposes - to seed rods into the database
// In production, you'd have a proper admin interface

export async function POST(request: NextRequest) {
  try {
    const { rods } = await request.json()

    if (!rods || !Array.isArray(rods)) {
      return NextResponse.json(
        { error: "Invalid rods array" },
        { status: 400 }
      )
    }

    const createdRods = []

    for (const rod of rods) {
      const { rodId, type } = rod
      
      if (!rodId || !type) {
        continue // Skip invalid entries
      }

      try {
        if (type === "main") {
          const mainRod = await prisma.mainRod.create({
            data: {
              rodId: rodId,
            }
          })
          createdRods.push({ type: "main", rodId: mainRod.rodId, id: mainRod.id })
        } else if (type === "secondary") {
          // For now, we'll create secondary rods without a main rod
          // They'll be automatically assigned when they first send data
          createdRods.push({ type: "secondary", rodId: rodId, note: "Will be created on first data submission" })
        }
      } catch (error) {
        console.error(`Failed to create rod ${rodId}:`, error)
        createdRods.push({ type, rodId, error: "Failed to create - likely duplicate" })
      }
    }

    return NextResponse.json({
      message: "Rod seeding completed",
      created: createdRods.length,
      rods: createdRods
    })

  } catch (error) {
    console.error("🌱 Error seeding rods:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to list all rods in system
export async function GET() {
  try {
    const mainRods = await prisma.mainRod.findMany({
      include: {
        farm: {
          select: { id: true, name: true }
        },
        secondaryRods: {
          select: { rodId: true, isActive: true }
        }
      }
    })

    const secondaryRods = await prisma.secondaryRod.findMany({
      include: {
        mainRod: {
          select: { rodId: true }
        }
      }
    })

    return NextResponse.json({
      main_rods: mainRods.map(rod => ({
        rodId: rod.rodId,
        farmId: rod.farmId,
        farmName: rod.farm?.name || null,
        isConnected: rod.isConnected,
        lastSeen: rod.lastSeen,
        secondaryRodCount: rod.secondaryRods.length
      })),
      secondary_rods: secondaryRods.map(rod => ({
        rodId: rod.rodId,
        mainRodId: rod.mainRod.rodId,
        isActive: rod.isActive,
        lastSeen: rod.lastSeen
      })),
      summary: {
        total_main_rods: mainRods.length,
        connected_main_rods: mainRods.filter(r => r.isConnected).length,
        unbound_main_rods: mainRods.filter(r => !r.farmId).length,
        total_secondary_rods: secondaryRods.length
      }
    })
  } catch (error) {
    console.error("🔍 Error fetching rod inventory:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}