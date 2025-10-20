import { NextRequest, NextResponse } from 'next/server'
import { getVercelEnvironmentInfo, getVercelPerformanceMetrics } from '@/lib/vercel'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const environment = getVercelEnvironmentInfo()
    const performance = getVercelPerformanceMetrics()
    const responseTime = Date.now() - startTime

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime,
      environment: {
        isVercel: environment.isVercel,
        region: environment.region,
        deploymentUrl: environment.deploymentUrl,
        environment: environment.environment,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      performance: {
        ...performance,
        responseTime
      },
      headers: {
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer')
      }
    }

    // Headers de resposta
    const responseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Check': 'true',
      'X-Response-Time': responseTime.toString()
    }

    // Adiciona headers específicos do Vercel
    if (environment.isVercel) {
      if (environment.region) {
        responseHeaders['X-Vercel-Region'] = environment.region
      }
      if (environment.deploymentUrl) {
        responseHeaders['X-Vercel-Deployment-URL'] = environment.deploymentUrl
      }
      if (environment.buildId) {
        responseHeaders['X-Vercel-Build-ID'] = environment.buildId
      }
    }

    return NextResponse.json(healthData, {
      status: 200,
      headers: responseHeaders
    })

  } catch (error) {
    console.error('❌ Erro no health check:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      environment: getVercelEnvironmentInfo()
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Check': 'true',
        'X-Health-Status': 'unhealthy'
      }
    })
  }
}

// Suporte para outros métodos HTTP para testes mais abrangentes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const startTime = Date.now()
    
    const response = {
      status: 'healthy',
      method: 'POST',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      receivedData: body,
      environment: getVercelEnvironmentInfo()
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      method: 'POST',
      error: error instanceof Error ? error.message : 'Erro no POST',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    method: 'PUT',
    timestamp: new Date().toISOString(),
    message: 'Endpoint PUT funcionando corretamente'
  }, { status: 200 })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    method: 'DELETE',
    timestamp: new Date().toISOString(),
    message: 'Endpoint DELETE funcionando corretamente'
  }, { status: 200 })
}