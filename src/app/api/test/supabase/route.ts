import { NextRequest, NextResponse } from 'next/server'
import { testSupabaseConnection, testSupabaseAuth, getSupabaseProjectInfo } from '@/lib/supabase'
import { SUPABASE_REST_URL, SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/supabase'

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

    // Teste REST direto (PostgREST) usando ANON KEY
    if (testType === 'all' || testType === 'rest') {
      console.log('🌐 Testando REST do Supabase...')
      try {
        if (!SUPABASE_REST_URL || !SUPABASE_ANON_KEY) {
          results.tests.rest = {
            success: false,
            error: 'SUPABASE_REST_URL ou ANON KEY ausente',
            details: { hasRestUrl: !!SUPABASE_REST_URL, hasAnonKey: !!SUPABASE_ANON_KEY }
          }
        } else {
          const url = `${SUPABASE_REST_URL}/categories?select=id&limit=1`
          const res = await fetch(url, {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          })
          const body = await res.json().catch(() => null)
          results.tests.rest = {
            success: res.ok,
            status: res.status,
            statusText: res.statusText,
            body,
            restUrl: SUPABASE_REST_URL,
            supabaseUrl: SUPABASE_URL,
          }
        }
      } catch (error) {
        console.error('❌ Erro ao testar REST:', error)
        results.tests.rest = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }

    // Teste JS com SERVICE KEY (servidor) para isolar problemas de RLS
    if ((testType === 'all' || testType === 'service-js') && SUPABASE_SERVICE_KEY) {
      console.log('🔧 Testando supabase-js com SERVICE KEY...')
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseService = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
        const tablesToProbe = ['categories', 'products', 'tables']
        const probe: Record<string, { ok: boolean; count?: number; error?: any }> = {}
        let jsOk = false
        for (const t of tablesToProbe) {
          const { data, error } = await supabaseService
            .from(t)
            .select('id')
            .limit(1)
          if (error) {
            probe[t] = { ok: false, error: error?.message || error }
          } else {
            probe[t] = { ok: true, count: data?.length || 0 }
            jsOk = true
            break
          }
        }
        results.tests.serviceJs = { success: jsOk, probe }
      } catch (error) {
        results.tests.serviceJs = {
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }

    // Teste REST com SERVICE KEY (servidor) para isolar RLS
    if ((testType === 'all' || testType === 'service-rest') && SUPABASE_SERVICE_KEY) {
      console.log('🔧 Testando REST do Supabase com SERVICE KEY...')
      try {
        if (!SUPABASE_REST_URL || !SUPABASE_SERVICE_KEY) {
          results.tests.restService = {
            success: false,
            error: 'SUPABASE_REST_URL ou SERVICE KEY ausente',
            details: { hasRestUrl: !!SUPABASE_REST_URL, hasServiceKey: !!SUPABASE_SERVICE_KEY }
          }
        } else {
          const url = `${SUPABASE_REST_URL}/categories?select=id&limit=1`
          const res = await fetch(url, {
            headers: {
              apikey: SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
          })
          const body = await res.json().catch(() => null)
          results.tests.restService = {
            success: res.ok,
            status: res.status,
            statusText: res.statusText,
            body,
            restUrl: SUPABASE_REST_URL,
            supabaseUrl: SUPABASE_URL,
          }
        }
      } catch (error) {
        console.error('❌ Erro ao testar REST com SERVICE KEY:', error)
        results.tests.restService = {
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

    // Teste com credenciais customizadas (tabelas conhecidas)
    const { createClient } = await import('@supabase/supabase-js')
    const customClient = createClient(url, key)

    const tablesToProbe = ['categories', 'products', 'tables']
    let ok = false
    const details: Record<string, any> = {}

    for (const t of tablesToProbe) {
      const { data, error } = await customClient
        .from(t)
        .select('id')
        .limit(1)
      if (!error) {
        ok = true
        details[t] = { ok: true, count: data?.length || 0 }
        break
      } else {
        details[t] = { ok: false, error: error?.message || error }
      }
    }

    const result = {
      success: ok,
      message: ok ? 'Conexão testada com sucesso' : 'Falha ao consultar tabelas de teste',
      timestamp: new Date().toISOString(),
      config: {
        url,
        hasKey: !!key
      },
      probe: details
    }

    return NextResponse.json(result, { 
      status: 200 
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao testar credenciais customizadas',
      timestamp: new Date().toISOString()
    }, { status: 200 })
  }
}