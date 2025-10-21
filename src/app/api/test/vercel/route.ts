import { NextRequest, NextResponse } from 'next/server'
import { 
  getVercelEnvironmentInfo, 
  testVercelConnectivity, 
  testVercelEdgeFunctions,
  getVercelPerformanceMetrics 
} from '@/lib/vercel'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Iniciando testes do Vercel...')
    
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('type') || 'all'

    const baseUrl = `${new URL(request.url).protocol}//${new URL(request.url).host}`

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: getVercelEnvironmentInfo(),
      tests: {}
    }

    console.log('📋 Ambiente detectado:', results.environment)

    // Teste de conectividade básica
    if (testType === 'all' || testType === 'connectivity') {
      console.log('🔍 Testando conectividade com Vercel...')
      try {
        results.tests.connectivity = await testVercelConnectivity(baseUrl)
        console.log('✅ Teste de conectividade concluído:', results.tests.connectivity.success)
      } catch (error) {
        console.error('❌ Erro no teste de conectividade:', error)
        results.tests.connectivity = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }
      }
    }

    // Teste de Edge Functions
    if (testType === 'all' || testType === 'edge') {
      console.log('⚡ Testando Edge Functions do Vercel...')
      try {
        results.tests.edgeFunctions = await testVercelEdgeFunctions()
        console.log('✅ Teste de Edge Functions concluído:', results.tests.edgeFunctions.success)
      } catch (error) {
        console.error('❌ Erro no teste de Edge Functions:', error)
        results.tests.edgeFunctions = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        }
      }
    }

    // Métricas de performance
    if (testType === 'all' || testType === 'performance') {
      console.log('📊 Coletando métricas de performance...')
      try {
        results.tests.performance = {
          success: true,
          message: 'Métricas coletadas com sucesso',
          timestamp: new Date().toISOString(),
          metrics: getVercelPerformanceMetrics()
        }
        console.log('✅ Métricas de performance coletadas')
      } catch (error) {
        console.error('❌ Erro ao coletar métricas:', error)
        results.tests.performance = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao coletar métricas',
          timestamp: new Date().toISOString()
        }
      }
    }

    // Informações do ambiente
    if (testType === 'all' || testType === 'environment') {
      console.log('🌍 Coletando informações do ambiente...')
      results.tests.environment = {
        success: true,
        message: 'Informações do ambiente coletadas',
        timestamp: new Date().toISOString(),
        details: {
          ...results.environment,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: Intl.DateTimeFormat().resolvedOptions().locale
        }
      }
    }

    // Resumo geral
    const allTests = Object.values(results.tests)
    const successfulTests = allTests.filter((test: any) => test.success).length
    const totalTests = allTests.length

    results.summary = {
      total: totalTests,
      successful: successfulTests,
      failed: totalTests - successfulTests,
      success: successfulTests === totalTests,
      percentage: totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0,
      isVercelEnvironment: results.environment.isVercel
    }

    // Headers específicos do Vercel
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }

    // Adiciona headers do Vercel se disponíveis
    if (results.environment.isVercel) {
      if (results.environment.region) {
        headers['X-Vercel-Region'] = results.environment.region
      }
      if (results.environment.deploymentUrl) {
        headers['X-Vercel-Deployment-URL'] = results.environment.deploymentUrl
      }
    }

    const statusCode = results.summary.success ? 200 : 500

    return NextResponse.json(results, { 
      status: statusCode,
      headers
    })

  } catch (error) {
    console.error('❌ Erro no teste de conectividade Vercel:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      environment: getVercelEnvironmentInfo(),
      tests: {},
      summary: {
        total: 0,
        successful: 0,
        failed: 1,
        success: false,
        percentage: 0,
        isVercelEnvironment: false
      }
    }, { status: 500 })
  }
}