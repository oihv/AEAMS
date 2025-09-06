import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RodDataRequest {
  secret: string
  readings: Array<{
    rod_id: string | number
    secret: string
    timestamp: string
    temperature?: number
    moisture?: number
    ph?: number
    conductivity?: number
    nitrogen?: number
    phosphorus?: number
    potassium?: number
  }>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ rod_id: string }> }
) {
  try {
    const { rod_id } = await params
    const data: RodDataRequest = await request.json()

    // 1. Get the global secret key from config
    const secretConfig = await prisma.config.findUnique({
      where: { key: "rod_secret_key" }
    })

    if (!secretConfig) {
      return NextResponse.json(
        { error: "System configuration error" },
        { status: 500 }
      )
    }

    // 2. Verify the secret key
    if (data.secret !== secretConfig.value) {
      return NextResponse.json(
        { error: "Invalid secret key" },
        { status: 401 }
      )
    }

    // 3. Find the main rod and verify it exists
    const mainRod = await prisma.mainRod.findUnique({
      where: { rodId: rod_id },
      include: { farm: true }
    })

    if (!mainRod) {
      return NextResponse.json(
        { error: "Main rod not found" },
        { status: 404 }
      )
    }

    // 4. Check if main rod is bound to a farm
    if (!mainRod.farmId || !mainRod.farm) {
      return NextResponse.json(
        { error: "Main rod not bound to any farm" },
        { status: 400 }
      )
    }

    // 5. Update main rod last seen
    await prisma.mainRod.update({
      where: { id: mainRod.id },
      data: { 
        lastSeen: new Date(),
        isConnected: true
      }
    })

    // 6. Process each secondary rod reading
    const processedReadings = []
    
    for (const reading of data.readings) {
      // Convert rod_id to string for consistency with database
      const rodId = String(reading.rod_id)
      
      // Verify secondary rod secret key too
      if (reading.secret !== secretConfig.value) {
        console.error(`Invalid secret for rod ${rodId}`)
        continue // Skip this reading
      }

      // Find or create secondary rod
      let secondaryRod = await prisma.secondaryRod.findUnique({
        where: { rodId: rodId }
      })

      if (!secondaryRod) {
        // First time seeing this secondary rod - create it
        // Generate a meaningful name from the rod ID
        const generateRodName = (rodId: string) => {
          // For integer rod IDs, create a simple name
          if (/^\d+$/.test(rodId)) {
            return `Sensor ${rodId}`
          }
          // Convert snake_case or camelCase to readable format
          return rodId
            .replace(/[_-]/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
        }

        secondaryRod = await prisma.secondaryRod.create({
          data: {
            rodId: rodId,
            name: generateRodName(rodId),
            mainRodId: mainRod.id,
            lastSeen: new Date()
          }
        })
      } else {
        // Verify it belongs to this main rod
        if (secondaryRod.mainRodId !== mainRod.id) {
          console.error(`Rod ${rodId} belongs to different main rod`)
          continue // Skip this reading
        }

        // Update last seen
        await prisma.secondaryRod.update({
          where: { id: secondaryRod.id },
          data: { lastSeen: new Date() }
        })
      }

      // Create the reading record
      const newReading = await prisma.reading.create({
        data: {
          secondaryRodId: secondaryRod.id,
          temperature: reading.temperature,
          moisture: reading.moisture,
          ph: reading.ph,
          conductivity: reading.conductivity,
          nitrogen: reading.nitrogen,
          phosphorus: reading.phosphorus,
          potassium: reading.potassium,
          timestamp: new Date(reading.timestamp)
        }
      })

      processedReadings.push({
        rod_id: rodId,
        reading_id: newReading.id,
        status: 'success'
      })
    }

    return NextResponse.json({
      message: "Data received successfully",
      farm_id: mainRod.farmId,
      main_rod_id: rod_id,
      processed_readings: processedReadings.length,
      readings: processedReadings
    })

  } catch (error) {
    console.error("🔴 Error processing rod data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}