import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    // Check if secret already exists
    const existingSecret = await prisma.config.findUnique({
      where: { key: "rod_secret_key" }
    })

    if (existingSecret) {
      return NextResponse.json({
        message: "Rod secret key already exists",
        secret: existingSecret.value
      })
    }

    // Create new secret key
    const secretKey = "AEAMS_SECRET_" + Math.random().toString(36).substring(2, 15)
    
    const newSecret = await prisma.config.create({
      data: {
        key: "rod_secret_key",
        value: secretKey
      }
    })

    return NextResponse.json({
      message: "Rod secret key created successfully",
      secret: newSecret.value
    })

  } catch (error) {
    console.error("Error setting up rod secret:", error)
    return NextResponse.json(
      { error: "Failed to setup rod secret" },
      { status: 500 }
    )
  }
}

// Also allow GET to just retrieve the current secret
export async function GET() {
  try {
    const secret = await prisma.config.findUnique({
      where: { key: "rod_secret_key" }
    })

    if (!secret) {
      return NextResponse.json(
        { error: "Rod secret key not found. Use POST to create one." },
        { status: 404 }
      )
    }

    return NextResponse.json({
      secret: secret.value
    })

  } catch (error) {
    console.error("Error retrieving rod secret:", error)
    return NextResponse.json(
      { error: "Failed to retrieve rod secret" },
      { status: 500 }
    )
  }
}
