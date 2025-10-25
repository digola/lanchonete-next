import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // Only available in development/test environments
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Debug endpoint not available in production' },
        { status: 404 }
      )
    }

    // Check for debug authorization
    const authHeader = request.headers.get('authorization')
    const debugKey = request.headers.get('x-debug-key')
    
    if (!authHeader && !debugKey) {
      return NextResponse.json(
        { success: false, error: 'Debug access requires authentication' },
        { status: 401 }
      )
    }

    // Verify token if provided
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const decoded = await verifyToken(token)
      
      if (!decoded) {
        return NextResponse.json(
          { success: false, error: 'Invalid authentication token' },
          { status: 401 }
        )
      }
    }

    // Collect debug information
    const debugInfo = {
      success: true,
      data: {
        environment: {
          nodeEnv: process.env.NODE_ENV,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime()
        },
        request: {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
          timestamp: new Date().toISOString()
        },
        database: {
          url: process.env.DATABASE_URL ? 'configured' : 'not configured',
          directUrl: process.env.DIRECT_URL ? 'configured' : 'not configured'
        },
        supabase: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'not configured',
          anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'not configured'
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      }
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}