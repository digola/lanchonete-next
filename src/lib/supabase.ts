import { createClient } from '@supabase/supabase-js'

// Configurações do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cliente do Supabase (só cria se as variáveis estiverem configuradas)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Função para testar conectividade com Supabase
export async function testSupabaseConnection() {
  try {
    // Verifica se as variáveis de ambiente estão configuradas
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

    // Testa conectividade usando uma consulta simples na tabela de usuários
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1)

    if (error) {
      return {
        success: false,
        error: 'Erro ao conectar com Supabase',
        details: error
      }
    }

    return {
      success: true,
      message: 'Conectado com sucesso ao Supabase',
      data: { connectionTest: 'OK', recordsFound: data?.length || 0 }
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

    // Tenta fazer uma consulta simples para verificar se a API está funcionando
    const { data, error } = await supabase
      .from('User')
      .select('id')
      .limit(1)
    
    return {
      success: !error,
      message: error ? error.message : 'API REST funcionando',
      url: supabaseUrl,
      hasData: !!data && data.length > 0,
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