import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createLogger, getOrCreateRequestId, withRequestIdHeader } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/home/data
// Busca dados da home diretamente do Supabase (categorias e produtos disponíveis)
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.home.data.get', requestId);
  
  const json = (payload: any, status = 200) => {
    const res = NextResponse.json(payload, { status });
    return withRequestIdHeader(res, requestId);
  };

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

    log.info('Buscando dados da home', { search, categoryId, limit, page });

    if (!supabase) {
      log.error('Supabase não configurado');
      return json({ 
        success: false, 
        error: 'Supabase não configurado. Verifique as variáveis de ambiente.' 
      }, 500);
    }

    // Buscar categorias ativas
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (categoriesError) {
      log.error('Erro ao buscar categorias', categoriesError);
      return json({ 
        success: false, 
        error: 'Erro ao buscar categorias' 
      }, 500);
    }

    // Preparar query para produtos
    let productsQuery = supabase
      .from('products')
      .select(`
        *,
        category:categories(name, color)
      `)
      .eq('isAvailable', true);

    // Aplicar filtros
    if (search.trim()) {
      productsQuery = productsQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      productsQuery = productsQuery.eq('categoryId', categoryId);
    }

    // Aplicar paginação
    const skip = (page - 1) * limit;
    productsQuery = productsQuery
      .order('name', { ascending: true })
      .range(skip, skip + limit - 1);

    const { data: products, error: productsError, count } = await productsQuery;

    if (productsError) {
      log.error('Erro ao buscar produtos', productsError);
      return json({ 
        success: false, 
        error: 'Erro ao buscar produtos' 
      }, 500);
    }

    // Buscar total de produtos para paginação
    const { count: total } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('isAvailable', true)
      .then(res => res);

    log.info('Dados da home buscados com sucesso', { 
      categoriesCount: categories?.length || 0,
      productsCount: products?.length || 0,
      totalProducts: total || 0 
    });

    return json({
      success: true,
      data: {
        categories: categories || [],
        products: products || [],
        pagination: {
          page,
          limit,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / limit),
        },
      },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Erro geral ao buscar dados da home', { error: msg });
    return json(
      { success: false, error: 'Erro interno do servidor' },
      500
    );
  }
}