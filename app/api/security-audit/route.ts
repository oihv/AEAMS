import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Basic security headers check
    const url = new URL(request.url)
    const protocol = url.protocol
    const hostname = url.hostname
    
    const securityAnalysis = {
      domain: {
        hostname,
        protocol,
        isHttps: protocol === 'https:',
        isVercelDomain: hostname.includes('vercel.app'),
        isCustomDomain: !hostname.includes('vercel.app')
      },
      headers: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        host: request.headers.get('host')
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }
    
    // Check for common security issues
    const securityIssues = []
    
    if (!securityAnalysis.domain.isHttps) {
      securityIssues.push('NOT_HTTPS')
    }
    
    if (securityAnalysis.domain.isVercelDomain) {
      securityIssues.push('VERCEL_SUBDOMAIN')
    }
    
    // Recommendations based on analysis
    const recommendations = []
    
    if (securityAnalysis.domain.isVercelDomain) {
      recommendations.push('Consider using a custom domain')
      recommendations.push('Add security headers')
      recommendations.push('Submit to Google Search Console')
    }
    
    recommendations.push('Add robots.txt file')
    recommendations.push('Add security.txt file')
    recommendations.push('Implement Content Security Policy')
    
    return NextResponse.json({
      success: true,
      security: securityAnalysis,
      potentialIssues: securityIssues,
      recommendations,
      googleSafetyTips: [
        'Report false positive to Google Safe Browsing',
        'Use Google Search Console to monitor security issues',
        'Implement proper meta tags and descriptions',
        'Add legitimate contact information',
        'Use HTTPS with proper certificates'
      ]
    })
    
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}
