import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/auth';

// GET - Listar produtos com informações de estoque
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const user = await verifyToken(token);
    // Verificar se o usuário é algum tipo de administrador (flexível)
    const isAdmin = user && (
      user.role === 'ADMIN' || 
      user.role === 'ADMINISTRADOR' || 
      user.role === 'administrador' ||
      user.role === 'Administrador' ||
      user.role?.toLowerCase() === 'administrador' ||
      user.role?.toLowerCase().includes('admin')
    );

    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const categoryId = searchParams.get('categoryId');
    const trackStock = searchParams.get('trackStock');
    const lowStock = searchParams.get('lowStock') === 'true';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (trackStock !== null) {
      where.trackStock = trackStock === 'true';
    }
    
    if (lowStock) {
      where.trackStock = true;
      where.OR = [
        { stockQuantity: { lt: { minStockLevel: true } } },
        { 
          AND: [
            { stockQuantity: { not: null } },
            { minStockLevel: { not: null } },
            { stockQuantity: { lt: prisma.product.fields.minStockLevel } }
          ]
        }
      ];
    }

    // Construir ordenação
    const orderBy: any = {};
    if (sortBy === 'stockQuantity') {
      orderBy.stockQuantity = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'category') {
      orderBy.category = { name: sortOrder };
    } else {
      orderBy.name = 'asc';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          stockMovements: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              user: {
                select: { name: true }
              }
            }
          },
          _count: {
            select: {
              orderItems: {
                where: {
                  order: {
                    createdAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
                    }
                  }
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where })
    ]);

    // Calcular alertas de estoque baixo
    const productsWithAlerts = products.map(product => {
      let stockAlert = null;
      
      if (product.trackStock && product.stockQuantity !== null && product.minStockLevel !== null) {
        if (product.stockQuantity <= 0) {
          stockAlert = { type: 'out_of_stock', message: 'Produto esgotado' };
        } else if (product.stockQuantity <= product.minStockLevel) {
          stockAlert = { type: 'low_stock', message: `Estoque baixo (${product.stockQuantity}/${product.minStockLevel})` };
        }
      }
      
      return {
        ...product,
        stockAlert,
        salesLast30Days: product._count.orderItems
      };
    });

    return NextResponse.json({
      products: productsWithAlerts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar produtos do estoque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar ou ajustar estoque
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const user = await verifyToken(token);
    // Verificar se o usuário é algum tipo de administrador (flexível)
    const isAdmin = user && (
      user.role === 'ADMIN' || 
      user.role === 'ADMINISTRADOR' || 
      user.role === 'administrador' ||
      user.role === 'Administrador' ||
      user.role?.toLowerCase() === 'administrador' ||
      user.role?.toLowerCase().includes('admin')
    );

    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, type, quantity, reason, reference, notes } = body;

    if (!productId || !type || !quantity || !reason) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: productId, type, quantity, reason' },
        { status: 400 }
      );
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Calcular nova quantidade
    const currentStock = product.stockQuantity || 0;
    let newStock = currentStock;
    
    if (type === 'ENTRADA') {
      newStock = currentStock + quantity;
    } else if (type === 'SAIDA') {
      newStock = Math.max(0, currentStock - quantity);
    } else if (type === 'AJUSTE') {
      newStock = quantity;
    } else {
      return NextResponse.json({ error: 'Tipo de movimentação inválido' }, { status: 400 });
    }

    // Atualizar produto e criar movimentação em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar estoque do produto
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newStock },
        include: { category: true }
      });

      // Criar movimentação de estoque
      const stockMovement = await tx.stockMovement.create({
        data: {
          productId,
          type,
          quantity: type === 'AJUSTE' ? (newStock - currentStock) : quantity,
          reason,
          reference,
          userId: user.userId,
          notes
        },
        include: {
          user: {
            select: { name: true }
          }
        }
      });

      return { updatedProduct, stockMovement };
    });

    return NextResponse.json({
      message: 'Estoque atualizado com sucesso',
      product: result.updatedProduct,
      movement: result.stockMovement
    });

  } catch (error) {
    console.error('Erro ao atualizar estoque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

