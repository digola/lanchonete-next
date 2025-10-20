import { NextRequest, NextResponse } from 'next/server'
import { testSupabaseConnection, testSupabaseAuth, getSupabaseProjectInfo } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando testes do Supabase...')
    
    const { searchParams } = new URL(request.url)
    const testType = searchParams.get('type') || 'all'

    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {}
    }

    // Teste de conectividade básica
    if (testType === 'all' || testType === 'connection') {
      console.log('🔍 Testando conectividade com Supabase...')
      try {
        results.tests.connection = await testSupabaseConnection()
        console.log('✅ Teste de conectividade concluído:', results.tests.connection.success)
      } catch (error) {
        console.error('❌ Erro no teste de conectividade:', error)
        results.tests.connection = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }

    // Teste de autenticação
    if (testType === 'all' || testType === 'auth') {
      console.log('🔐 Testando autenticação do Supabase...')
      try {
        results.tests.auth = await testSupabaseAuth()
        console.log('✅ Teste de autenticação concluído:', results.tests.auth.success)
      } catch (error) {
        console.error('❌ Erro no teste de autenticação:', error)
        results.tests.auth = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }

    // Informações do projeto
    if (testType === 'all' || testType === 'info') {
      console.log('ℹ️ Obtendo informações do projeto Supabase...')
      try {
        results.tests.projectInfo = await getSupabaseProjectInfo()
        console.log('✅ Informações do projeto obtidas:', results.tests.projectInfo.success)
      } catch (error) {
        console.error('❌ Erro ao obter informações do projeto:', error)
        results.tests.projectInfo = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
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
      percentage: totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0
    }

    console.log('📊 Resumo dos testes:', results.summary)

    // Sempre retorna 200 para evitar erro 500 no frontend
    return NextResponse.json(results, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('❌ Erro geral no teste de conectividade Supabase:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        total: 0,
        successful: 0,
        failed: 1,
        success: false,
        percentage: 0
      }
    }, { status: 200 }) // Mudado para 200 para evitar erro no frontend
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, key } = body

    if (!url || !key) {
      return NextResponse.json({
        success: false,
        error: 'URL e chave do Supabase são obrigatórias',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Teste com credenciais customizadas
    const { createClient } = await import('@supabase/supabase-js')
    const customClient = createClient(url, key)

    const { data, error } = await customClient
      .from('User')
      .select('id')
      .limit(1)

    const result = {
      success: !error,
      message: error ? error.message : 'Conexão testada com sucesso',
      timestamp: new Date().toISOString(),
      config: {
        url,
        hasKey: !!key
      }
    }

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao testar credenciais customizadas',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}