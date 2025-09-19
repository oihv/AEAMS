import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ rod_id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { rod_id } = await params
    const { x, y } = await request.json()

    if (typeof x !== 'number' || typeof y !== 'number') {
      return NextResponse.json(
        { error: "Invalid position coordinates" },
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

    // Find the secondary rod and verify user owns it through farm
    const rod = await prisma.secondaryRod.findFirst({
      where: {
        rodId: rod_id,
        mainRod: {
          farm: {
            userId: user.id
          }
        }
      }
    })

    if (!rod) {
      return NextResponse.json(
        { error: "Rod not found or unauthorized" },
        { status: 404 }
      )
    }

    // Update the rod position
    const updatedRod = await prisma.secondaryRod.update({
      where: { id: rod.id },
      data: {
        positionX: x,
        positionY: y
      }
    })

    return NextResponse.json({ 
      success: true, 
      rod: updatedRod 
    })

  } catch (error) {
    console.error("🔴 Error updating rod position:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}