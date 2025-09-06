// @ts-nocheck
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Helper function to generate readable names from rod IDs
function generateRodName(rodId: string): string {
  // Convert snake_case, kebab-case, or camelCase to readable format
  return rodId
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export async function POST() {
  try {
    // Get all secondary rods with null names
    const rodsWithoutNames = await prisma.secondaryRod.findMany({
      where: {
        OR: [
          { name: null },
          { name: "" }
        ]
      }
    })

    const updates = []

    for (const rod of rodsWithoutNames) {
      const newName = generateRodName(rod.rodId)
      
      await prisma.secondaryRod.update({
        where: { id: rod.id },
        data: { name: newName }
      })

      updates.push({
        rodId: rod.rodId,
        oldName: rod.name,
        newName: newName
      })
    }

    return NextResponse.json({
      message: "Secondary rod names updated successfully",
      updatedCount: updates.length,
      updates: updates
    })

  } catch (error) {
    console.error("Error updating secondary rod names:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get all secondary rods with their current names
    const allRods = await prisma.secondaryRod.findMany({
      select: {
        id: true,
        rodId: true,
        name: true,
        mainRod: {
          select: {
            rodId: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Current secondary rod names",
      count: allRods.length,
      rods: allRods.map(rod => ({
        rodId: rod.rodId,
        name: rod.name,
        mainRodId: rod.mainRod.rodId,
        suggestedName: generateRodName(rod.rodId)
      }))
    })

  } catch (error) {
    console.error("Error fetching secondary rod names:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
