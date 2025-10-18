import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
import { createLogger, getOrCreateRequestId, withRequestIdHeader } from '@/lib/logger';

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.products.get', requestId);
  const json = (payload: any, status = 200) => {
    const res = NextResponse.json(payload, { status });
    return withRequestIdHeader(res, requestId);
  };
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const isAvailable = searchParams.get('isAvailable');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    log.debug('List params', { search, categoryId, isAvailable, limit, page, sortBy, sortOrder });

    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: sortOrder as 'asc' | 'desc' };

    const where: any = {};
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { description: { contains: term } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isAvailable !== null) {
      where.isAvailable = isAvailable === 'true';
    }

    const paramsKey = JSON.stringify({ where, orderBy, skip, limit });

    const listCached = unstable_cache(
      async () => {
        return prisma.product.findMany({
          where,
          include: { category: true },
          orderBy,
          skip,
          take: limit,
        });
      },
      ['products:list', paramsKey],
      { revalidate: 60 }
    );

    const countCached = unstable_cache(
      async () => prisma.product.count({ where }),
      ['products:count', paramsKey],
      { revalidate: 60 }
    );

    const [products, total] = await Promise.all([
      listCached(),
      countCached(),
    ]);

    log.info('List fetched', { count: products.length, total });
    return json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error fetching products', { error: msg });
    return json(
      { success: false, error: 'Erro interno do servidor' },
      500
    );
  }
}

// POST /api/products - Criar produto
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.products.post', requestId);
  const json = (payload: any, status = 200) => {
    const res = NextResponse.json(payload, { status });
    return withRequestIdHeader(res, requestId);
  };
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      log.warn('Missing auth token');
      return json(
        { success: false, error: 'Token de acesso necessário' },
        401
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      log.warn('Invalid token');
      return json(
        { success: false, error: 'Token inválido' },
        401
      );
    }

    // Verificar permissão
    if (!hasPermission(decoded.role, 'products:write')) {
      log.warn('Permission denied', { role: decoded.role });
      return json(
        { success: false, error: 'Permissão insuficiente' },
        403
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      imageUrl, 
      categoryId, 
      isAvailable = true,
      preparationTime = 15,
      allergens,
      
      // Campos de estoque
      stockQuantity = 0,
      minStockLevel = 5,
      maxStockLevel = 100,
      trackStock = false
    } = body;

    // Validações
    if (!name || !name.trim()) {
      return json(
        { success: false, error: 'Nome é obrigatório' },
        400
      );
    }

    if (!price || price <= 0) {
      return json(
        { success: false, error: 'Preço deve ser maior que zero' },
        400
      );
    }

    if (!categoryId) {
      return json(
        { success: false, error: 'Categoria é obrigatória' },
        400
      );
    }

    // Verificar se já existe produto com o mesmo nome
    const existingProduct = await prisma.product.findFirst({
      where: { name: name.trim() },
    });

    if (existingProduct) {
      return json(
        { success: false, error: 'Já existe um produto com este nome' },
        400
      );
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return json(
        { success: false, error: 'Categoria não encontrada' },
        400
      );
    }

    // Criar produto
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        price: Number(price),
        imageUrl: imageUrl?.trim(),
        categoryId,
        isAvailable,
        preparationTime: Number(preparationTime),
        allergens: allergens?.trim(),
        
        // Campos de estoque (garantir valores válidos)
        stockQuantity: Number.isFinite(Number(stockQuantity)) ? Number(stockQuantity) : 0,
        minStockLevel: Number.isFinite(Number(minStockLevel)) ? Number(minStockLevel) : 5,
        maxStockLevel: Number.isFinite(Number(maxStockLevel)) ? Number(maxStockLevel) : 100,
        trackStock,
      },
      include: {
        category: true,
      },
    });

    log.info('Product created', { productId: product.id });
    return json({
      success: true,
      data: product,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error creating product', { error: msg });
    return json(
      { success: false, error: 'Erro interno do servidor' },
      500
    );
  }
}