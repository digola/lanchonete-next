import { createClient } from '@supabase/supabase-js'

// Normalização básica para evitar valores com crases/aspas e espaços
const normalize = (v?: string) => (v ?? '').trim().replace(/^['"`]+|['"`]+$/g, '')

// Configurações do Supabase (client-side)
const supabaseUrl = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL)
const supabaseAnonKey = normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_CLIENT_API_KEY)

// Configurações do Supabase (server-side, apenas uso administrativo)
const supabaseServiceKey = normalize(
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_KEY
)

// Detecta ambiente server
const isServer = typeof window === 'undefined'

// Cliente do Supabase (ANON) — use em componentes/client
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Cliente do Supabase (SERVICE) — use APENAS em rotas/server
export const supabaseService = (isServer && supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Exporte as constantes para uso em outros pontos do app
export const SUPABASE_URL = supabaseUrl
export const SUPABASE_ANON_KEY = supabaseAnonKey
export const SUPABASE_KEY = supabaseAnonKey // alias solicitado
export const SUPABASE_CLIENT_API_KEY = supabaseAnonKey // alias solicitado
export const SUPABASE_SERVICE_KEY = supabaseServiceKey // alias solicitado
export const SUPABASE_REST_URL = supabaseUrl ? `${supabaseUrl}/rest/v1` : ''

// Função para testar conectividade com Supabase
export async function testSupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseAnonKey || !supabase) {
      return {
        success: false,
        error: 'Variáveis de ambiente do Supabase não configuradas',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          hasClient: !!supabase
        }
      }
    }

    // Testa conectividade em tabelas conhecidas do projeto
    const tablesToProbe = ['categories', 'products', 'tables']
    const errors: Record<string, any> = {}

    for (const t of tablesToProbe) {
      const { data, error } = await supabase
        .from(t)
        .select('id')
        .limit(1)

      if (!error) {
        return {
          success: true,
          message: `Conectado com sucesso ao Supabase (tabela ${t})`,
          data: { table: t, recordsFound: data?.length || 0 }
        }
      }
      errors[t] = error?.message || error
    }

    return {
      success: false,
      error: 'Erro ao conectar com Supabase nas tabelas de teste',
      details: errors
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error
    }
  }
}

// Função para testar autenticação do Supabase
export async function testSupabaseAuth() {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Cliente Supabase não configurado',
        hasSession: false,
        timestamp: new Date().toISOString()
      }
    }

    const { data, error } = await supabase.auth.getSession()
    
    return {
      success: !error,
      message: error ? error.message : 'Serviço de autenticação funcionando',
      hasSession: !!data.session,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao testar autenticação',
      details: error
    }
  }
}

// Função para obter informações do projeto Supabase
export async function getSupabaseProjectInfo() {
  try {
    if (!supabase) {
      return {
        success: false,
        error: 'Cliente Supabase não configurado',
        url: supabaseUrl,
        timestamp: new Date().toISOString()
      }
    }

    const tablesToProbe = ['categories', 'products', 'tables']
    const results: Record<string, { ok: boolean; count?: number; error?: any }> = {}

    for (const t of tablesToProbe) {
      const { data, error } = await supabase
        .from(t)
        .select('id')
        .limit(1)
      results[t] = error
        ? { ok: false, error: error?.message || error }
        : { ok: true, count: data?.length || 0 }
    }

    const anyOk = Object.values(results).some(r => r.ok)
    return {
      success: anyOk,
      message: anyOk ? 'API REST funcionando para ao menos uma tabela' : 'Falha na API REST para tabelas consultadas',
      url: supabaseUrl,
      probe: results,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao obter informações do projeto',
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    }
  }
}

// Retorna array de categorias diretamente do Supabase
export async function getSupabaseCategories(options: { useService?: boolean } = {}) {
  const { useService = false } = options
  const client = (useService && supabaseService) ? supabaseService : supabase

  if (!client) {
    throw new Error('Cliente Supabase não configurado (verifique variáveis de ambiente)')
  }

  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    throw new Error(error.message || 'Erro ao buscar categorias no Supabase')
  }

  return data ?? []
}