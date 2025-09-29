import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { cacheMonitor } from "@/lib/cache-monitor"

export async function GET(request: NextRequest) {
  try {
    // Basic auth check - in production, this should have proper admin authorization
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    
    if (format === 'report') {
      // Return human-readable text report
      const report = cacheMonitor.getSummaryReport()
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/plain',
        },
      })
    } else {
      // Return JSON metrics
      const metrics = cacheMonitor.getMetrics()
      const recentEvents = cacheMonitor.getRecentEvents(20)
      
      return NextResponse.json({
        metrics,
        recentEvents,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error("Cache metrics error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve cache metrics" },
      { status: 500 }
    )
  }
}

// Reset metrics (for testing/maintenance)
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    cacheMonitor.resetMetrics()
    
    return NextResponse.json({
      message: "Cache metrics reset successfully",
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Cache metrics reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset cache metrics" },
      { status: 500 }
    )
  }
}