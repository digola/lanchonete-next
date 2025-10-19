import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth-server';
;
import { unstable_cache } from 'next/cache';
import { createLogger, getOrCreateRequestId, withRequestIdHeader } from '@/lib/logger';
import type { Prisma } from '@prisma/client';

// GET /api/categories - Listar categorias
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.categories.get', requestId);
  const json = (payload: any, status = 200) => {
    const res = NextResponse.json(payload, { status });
    return withRequestIdHeader(res, requestId);
  };
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');
    const includeProducts = searchParams.get('includeProducts') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    log.debug('List params', { search, categoryId, isActive, includeProducts, limit, page, sortBy, sortOrder });

    const skip = (page - 1) * limit;
    const orderBy: Prisma.CategoryOrderByWithRelationInput = { [sortBy]: sortOrder as 'asc' | 'desc' };

    const where: Prisma.CategoryWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) {
      where.id = categoryId;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const paramsKey = JSON.stringify({ where, includeProducts, orderBy, skip, limit });

    const listCached = unstable_cache(
      async () => {
        return prisma.category.findMany({
          where,
          ...(includeProducts && {
            include: {
              products: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  isAvailable: true,
                },
              },
            },
          }),
          orderBy,
          skip,
          take: limit,
        });
      },
      ['categories:list', paramsKey],
      { revalidate: 60 }
    );

    const countCached = unstable_cache(
      async () => prisma.category.count({ where }),
      ['categories:count', paramsKey],
      { revalidate: 60 }
    );

    const [categories, total] = await Promise.all([
      listCached(),
      countCached(),
    ]);

    log.info('List fetched', { count: categories.length, total });
    return json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error fetching categories', { error: msg });
    return json(
      { success: false, error: 'Erro interno do servidor' },
      500
    );
  }
}

// POST /api/categories - Criar categoria
export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.categories.post', requestId);
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

    const decoded = await verifyToken(token);
    if (!decoded) {
      log.warn('Invalid token');
      return json(
        { success: false, error: 'Token inválido' },
        401
      );
    }

    // Verificar permissão
    if (!hasPermission(decoded.role, 'categories:write')) {
      log.warn('Permission denied', { role: decoded.role });
      return json(
        { success: false, error: 'Permissão insuficiente' },
        403
      );
    }

    const body = await request.json();
    const { name, description, color, isActive = true } = body;

    // Validações
    if (!name || !name.trim()) {
      return json(
        { success: false, error: 'Nome é obrigatório' },
        400
      );
    }

    // Verificar se já existe categoria com o mesmo nome
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existingCategory) {
      return json(
        { success: false, error: 'Já existe uma categoria com este nome' },
        400
      );
    }

    // Validar cor hexadecimal se fornecida
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return json(
        { success: false, error: 'Cor deve ser um valor hexadecimal válido (#RRGGBB)' },
        400
      );
    }

    // Criar categoria
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        color: color?.trim(),
        isActive,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            isAvailable: true,
          },
        },
      },
    });

    log.info('Category created', { categoryId: category.id });
    return json({
      success: true,
      data: category,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error creating category', { error: msg });
    return json(
      { success: false, error: 'Erro interno do servidor' },
      500
    );
  }
}