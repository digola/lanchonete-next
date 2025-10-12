import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const isAvailable = searchParams.get('isAvailable');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: sortOrder as 'asc' | 'desc' };

    const where: any = {};
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isAvailable !== null) {
      where.isAvailable = isAvailable === 'true';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
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
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/products - Criar produto
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
    if (!hasPermission(decoded.role, 'products:write')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
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
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Preço deve ser maior que zero' },
        { status: 400 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Categoria é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se já existe produto com o mesmo nome
    const existingProduct = await prisma.product.findFirst({
      where: { name: name.trim() },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Já existe um produto com este nome' },
        { status: 400 }
      );
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
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
        
        // Campos de estoque
        stockQuantity: Number(stockQuantity),
        minStockLevel: Number(minStockLevel),
        maxStockLevel: Number(maxStockLevel),
        trackStock,
      },
      include: {
        category: true,
      },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'CREATE_PRODUCT',
    //     entityType: 'Product',
    //     entityId: product.id,
    //     details: JSON.stringify({
    //       name: product.name,
    //       price: product.price,
    //       categoryId: product.categoryId,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}