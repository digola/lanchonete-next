import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';

// POST /api/products/bulk - Operações em lote
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar permissão
    if (!hasPermission(decoded.role, 'products:write')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para operações em lote' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, productIds, data } = body;

    if (!action || !productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { success: false, error: 'Ação e IDs dos produtos são obrigatórios' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isAvailable: true },
        });
        break;

      case 'deactivate':
        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { isAvailable: false },
        });
        break;

      case 'delete':
        // Verificar se algum produto está sendo usado em pedidos
        const orderItemsCount = await prisma.orderItem.count({
          where: { productId: { in: productIds } },
        });

        if (orderItemsCount > 0) {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Alguns produtos estão sendo usados em pedidos e não podem ser deletados' 
            },
            { status: 400 }
          );
        }

        result = await prisma.product.deleteMany({
          where: { id: { in: productIds } },
        });
        break;

      case 'updateCategory':
        if (!data?.categoryId) {
          return NextResponse.json(
            { success: false, error: 'ID da categoria é obrigatório' },
            { status: 400 }
          );
        }

        // Verificar se a categoria existe
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId },
        });

        if (!category) {
          return NextResponse.json(
            { success: false, error: 'Categoria não encontrada' },
            { status: 404 }
          );
        }

        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { categoryId: data.categoryId },
        });
        break;

      case 'updatePrice':
        if (!data?.price || data.price < 0) {
          return NextResponse.json(
            { success: false, error: 'Preço válido é obrigatório' },
            { status: 400 }
          );
        }

        result = await prisma.product.updateMany({
          where: { id: { in: productIds } },
          data: { price: parseFloat(data.price) },
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: `BULK_${action.toUpperCase()}_PRODUCTS`,
    //     entityType: 'Product',
    //     entityId: productIds.join(','),
    //     details: JSON.stringify({
    //       action,
    //       productIds,
    //       data,
    //       affectedCount: result.count,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: {
        action,
        affectedCount: result.count,
        productIds,
      },
    });
  } catch (error) {
    console.error('Erro na operação em lote:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}