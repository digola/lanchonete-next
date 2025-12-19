import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';

// GET /api/categories - Listar categorias
export async function GET(request: NextRequest) {
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

    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: sortOrder as 'asc' | 'desc' };

    const where: any = {};
    if (search && search.trim()) {
      const term = search.trim();
      where.name = { contains: term };
    }
    if (categoryId) {
      where.id = categoryId;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const categories = await prisma.category.findMany({
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

    const total = await prisma.category.count({ where });

    return NextResponse.json({
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
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Criar categoria
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de acesso necessário' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!hasPermission(decoded.role, 'categories:write')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, color, isActive = true } = body;

    // Validações
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe categoria com o mesmo nome
    const existingCategory = await prisma.category.findUnique({
      where: { name: name.trim() },
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }

    // Validar cor hexadecimal se fornecida
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { success: false, error: 'Cor deve ser um valor hexadecimal válido (#RRGGBB)' },
        { status: 400 }
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

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'CREATE_CATEGORY',
    //     entityType: 'Category',
    //     entityId: category.id,
    //     details: JSON.stringify({
    //       name: category.name,
    //       description: category.description,
    //       color: category.color,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
