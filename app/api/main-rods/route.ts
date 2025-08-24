import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { farmId, rodId } = await request.json()

    if (!farmId || !rodId) {
      return NextResponse.json(
        { error: "Farm ID and rod ID are required" },
        { status: 400 }
      )
    }

    // 1. Check if farm exists and belongs to user
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: { user: true, mainRod: true }
    })

    if (!farm || farm.user.email !== session.user.email) {
      return NextResponse.json(
        { error: "Farm not found or unauthorized" },
        { status: 404 }
      )
    }

    if (farm.mainRod) {
      return NextResponse.json(
        { error: "Farm already has a main rod connected" },
        { status: 400 }
      )
    }

    // 2. Check if the rod exists in our production database
    const mainRod = await prisma.mainRod.findUnique({
      where: { rodId: rodId }
    })

    if (!mainRod) {
      return NextResponse.json(
        { error: "Rod ID not found in our system. Please check the rod ID." },
        { status: 404 }
      )
    }

    // 3. Check if rod is already bound to another farm
    if (mainRod.farmId) {
      return NextResponse.json(
        { error: "This rod is already connected to another farm" },
        { status: 400 }
      )
    }

    // 4. Bind the rod to the farm
    const updatedMainRod = await prisma.mainRod.update({
      where: { rodId: rodId },
      data: {
        farmId: farmId,
        isConnected: true,
        lastSeen: new Date(),
      },
      include: {
        farm: true
      }
    })

    return NextResponse.json({
      message: "Main rod connected successfully",
      mainRod: {
        id: updatedMainRod.id,
        rodId: updatedMainRod.rodId,
        farmId: updatedMainRod.farmId,
        isConnected: updatedMainRod.isConnected
      }
    })
  } catch (error) {
    console.error("📡 Error connecting main rod:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
