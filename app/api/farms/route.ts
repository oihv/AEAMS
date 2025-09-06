import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    const farms = await prisma.farm.findMany({
      where: { userId: user.id },
      include: {
        mainRod: {
          include: {
            secondaryRods: {
              include: {
                readings: {
                  orderBy: { timestamp: 'desc' },
                  take: 5 // Get latest 5 readings per secondary rod
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ farms })
  } catch (error) {
    console.error("🚜 Error fetching farms:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      console.error("User not found in database:", session.user.email)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Get request data
    const { name, location, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: "Farm name is required" },
        { status: 400 }
      )
    }

    // Create the farm
    const farm = await prisma.farm.create({
      data: {
        name,
        location,
        description,
        userId: user.id,
      }
    })

    console.log("✅ Farm created:", { farmId: farm.id, name: farm.name, userId: user.id })
    return NextResponse.json({
      message: "Farm created successfully",
      farm
    })
  } catch (error) {
    console.error("🚜 Error creating farm:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}