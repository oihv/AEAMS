import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { positions } = await request.json()

    if (!Array.isArray(positions)) {
      return NextResponse.json(
        { error: "Positions must be an array" },
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

    // Update all rod positions in a transaction
    const updates = await prisma.$transaction(
      positions.map(({ rodId, x, y }) => 
        prisma.secondaryRod.updateMany({
          where: {
            rodId: rodId,
            mainRod: {
              farm: {
                userId: user.id
              }
            }
          },
          data: {
            positionX: x,
            positionY: y
          }
        })
      )
    )

    return NextResponse.json({ 
      success: true, 
      updatedCount: updates.reduce((sum, update) => sum + update.count, 0)
    })

  } catch (error) {
    console.error("🔴 Error updating rod positions:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}