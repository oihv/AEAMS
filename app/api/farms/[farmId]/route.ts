import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { farmId } = await params

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        userId: user.id
      },
      include: {
        mainRod: {
          include: {
            secondaryRods: {
              include: {
                readings: {
                  orderBy: { timestamp: 'desc' },
                  take: 10
                }
              }
            }
          }
        }
      }
    })

    if (!farm) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ farm })

  } catch (error) {
    console.error("🔴 Error fetching farm:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}