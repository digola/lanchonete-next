import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth-server';

export const runtime = 'nodejs';

// GET /api/categories
// Lista categorias com paginação, ordenação e filtros via query params
// Aceita aliases usados no admin: search, sortOrder e includeProducts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const pageParam = searchParams.get('page') ?? '1';
    const limitParam = searchParams.get('limit') ?? '20';
    const sortBy = searchParams.get('sortBy') ?? 'name'; // name | createdAt | updatedAt
    const orderParam = (searchParams.get('order') ?? searchParams.get('sortOrder') ?? 'asc').toLowerCase(); // asc | desc
    const isActiveParam = searchParams.get('isActive'); // 'true' | 'false' | null
    const q = (searchParams.get('q') ?? searchParams.get('search') ?? '').trim();
    const includeProducts = (searchParams.get('includeProducts') ?? 'false').toLowerCase() === 'true';

    const page = Math.max(1, parseInt(pageParam, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 20));
    const skip = (page - 1) * limit;

    // Valida sort/ordem
    const validSortFields = new Set(['name', 'createdAt', 'updatedAt']);
    const sortField = validSortFields.has(sortBy) ? sortBy : 'name';
    const sortOrder = orderParam === 'desc' ? 'desc' : 'asc';

    // Monta filtro
    const where: any = {};

    if (typeof isActiveParam === 'string') {
      if (isActiveParam === 'true') where.isActive = true;
      else if (isActiveParam === 'false') where.isActive = false;
    }

    if (q) {
      where.name = { contains: q, mode: 'insensitive' };
    }

    // Busca total para paginação
    const total = await prisma.category.count({ where });

    // Busca categorias
    const categories = await prisma.category.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit,
      include: includeProducts
        ? {
            products: {
              select: {
                id: true,
                name: true,
                price: true,
                isAvailable: true,
                imageUrl: true,
              },
            },
          }
        : undefined,
    });

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        sortBy: sortField,
        sortOrder,
        filters: {
          isActive: typeof where.isActive === 'boolean' ? where.isActive : null,
          search: q || null,
        },
      },
    });
  } catch (error: any) {
    console.error('[GET /api/categories] Erro:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST /api/categories
// Cria uma nova categoria (requer autenticação e permissão manage_categories)
export async function POST(request: NextRequest) {
  try {
    // Autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Token de autenticação não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido ou expirado' }, { status: 401 });
    }

    // Autorização
    if (!hasPermission(decoded.role, 'manage_categories')) {
      return NextResponse.json({ success: false, error: 'Sem permissão para criar categorias' }, { status: 403 });
    }

    // Corpo
    const body = await request.json();
    const { name, description, imageUrl, color, isActive } = body as {
      name?: string;
      description?: string;
      imageUrl?: string;
      color?: string;
      isActive?: boolean;
    };

    // Validações
    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório' }, { status: 400 });
    }
    if (name.trim().length > 50) {
      return NextResponse.json({ success: false, error: 'Nome deve ter no máximo 50 caracteres' }, { status: 400 });
    }

    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json({ success: false, error: 'Cor inválida. Use hexadecimal (ex: #FF5733)' }, { status: 400 });
    }

    // Verifica duplicidade por nome
    const existingByName = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existingByName) {
      return NextResponse.json({ success: false, error: 'Já existe uma categoria com este nome' }, { status: 400 });
    }

    // Cria categoria
    const created = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        color: (color ?? '#3B82F6').trim(),
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/categories] Erro:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 });
  }
}
