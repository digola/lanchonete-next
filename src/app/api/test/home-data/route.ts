import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLogger, getOrCreateRequestId, withRequestIdHeader } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/test/home-data
// Endpoint de teste para verificar dados da home do Supabase
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.test.home-data.get', requestId);
  
  const json = (payload: any, status = 200) => {
    const res = NextResponse.json(payload, { status });
    return withRequestIdHeader(res, requestId);
  };

  try {
    log.info('Iniciando teste de dados da home');

    if (!supabase) {
      const error = 'Supabase não configurado';
      log.error(error);
      return json({ 
        success: false, 
        error,
        debug: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'URL configurada' : 'URL não configurada',
          key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Key configurada' : 'Key não configurada'
        }
      }, 500);
    }

    // Testar conexão básica
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(3);

    if (categoriesError) {
      log.error('Erro ao buscar categorias', categoriesError);
      return json({ 
        success: false, 
        error: 'Erro ao buscar categorias',
        details: categoriesError.message 
      }, 500);
    }

    // Testar produtos com categoria
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name, color)
      `)
      .eq('isAvailable', true)
      .limit(3);

    if (productsError) {
      log.error('Erro ao buscar produtos', productsError);
      return json({ 
        success: false, 
        error: 'Erro ao buscar produtos',
        details: productsError.message 
      }, 500);
    }

    // Estatísticas gerais
    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: availableProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('isAvailable', true);

    const result = {
      success: true,
      data: {
        categories: {
          sample: categories,
          total: totalCategories,
          active: categories?.filter(c => c.isActive).length || 0
        },
        products: {
          sample: products,
          total: totalProducts,
          available: availableProducts
        }
      },
      timestamp: new Date().toISOString(),
      debug: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada'
      }
    };

    log.info('Teste de dados da home concluído com sucesso', result);
    return json(result);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Erro geral no teste de dados da home', { error: msg });
    return json(
      { success: false, error: 'Erro interno do servidor', details: msg },
      500
    );
  }
}