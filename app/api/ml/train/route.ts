import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getMLEngine } from "@/lib/ml-engine"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { epochs = 50 } = await request.json()

    const mlEngine = getMLEngine()
    
    if (mlEngine.isCurrentlyTraining()) {
      return NextResponse.json(
        { error: "Training already in progress" },
        { status: 409 }
      )
    }

    // Start training in background
    mlEngine.trainModels(undefined, epochs).catch(console.error)

    return NextResponse.json({
      success: true,
      message: "Training started",
      epochs,
      timestamp: new Date()
    })

  } catch (error) {
    console.error("🤖 ML Training Error:", error)
    return NextResponse.json(
      { error: "Training failed to start" },
      { status: 500 }
    )
  }
}

// Get training status and metrics
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const mlEngine = getMLEngine()
    const metrics = mlEngine.getTrainingMetrics()
    const isTraining = mlEngine.isCurrentlyTraining()
    const modelInfo = mlEngine.getModelInfo()

    return NextResponse.json({
      success: true,
      isTraining,
      metrics,
      modelInfo,
      lastTrainingEpoch: metrics.length > 0 ? metrics[metrics.length - 1].epoch : 0,
      totalParams: modelInfo.totalParams
    })

  } catch (error) {
    console.error("🤖 ML Status Error:", error)
    return NextResponse.json(
      { error: "Failed to get training status" },
      { status: 500 }
    )
  }
}