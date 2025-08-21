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

    const { farmId, serialNumber } = await request.json()

    if (!farmId || !serialNumber) {
      return NextResponse.json(
        { error: "Farm ID and serial number are required" },
        { status: 400 }
      )
    }

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

    const existingRod = await prisma.mainRod.findUnique({
      where: { serialNumber }
    })

    // TODO: make it to check for rod availability in the RodInventory
    if (existingRod) {
      return NextResponse.json(
        { error: "Rod with this serial number is already registered" },
        { status: 400 }
      )
    }

    const mainRod = await prisma.mainRod.create({
      data: {
        serialNumber,
        farmId,
        isConnected: true,
        lastSeen: new Date(),
      },
      include: {
        farm: true
      }
    })

    return NextResponse.json({
      message: "Main rod connected successfully",
      mainRod
    })
  } catch (error) {
    console.error("📡 Error connecting main rod:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
