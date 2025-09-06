import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const secondaryRods = await prisma.secondaryRod.findMany({
      select: {
        id: true,
        rodId: true,
        name: true,
        location: true,
        isActive: true,
        lastSeen: true,
        mainRod: {
          select: {
            rodId: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Secondary rods debug data",
      count: secondaryRods.length,
      rods: secondaryRods
    })

  } catch (error) {
    console.error("🔴 Error fetching secondary rods:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
