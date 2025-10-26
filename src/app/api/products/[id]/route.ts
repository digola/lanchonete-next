import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/products/[id] - Buscar produto específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Atualizar produto
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

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
        { success: false, error: 'Sem permissão para editar produtos' },
        { status: 403 }
      );
    }

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      description, 
      price, 
      imageUrl, 
      categoryId, 
      isAvailable, 
      preparationTime, 
      allergens,
      
      // Campos de estoque
      stockQuantity,
      minStockLevel,
      maxStockLevel,
      trackStock
    } = body;

    // Validações
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      return NextResponse.json(
        { success: false, error: 'Preço deve ser um número positivo' },
        { status: 400 }
      );
    }

    // Verificar se a categoria existe (se fornecida)
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { success: false, error: 'Categoria não encontrada' },
          { status: 400 }
        );
      }
    }

    // Atualizar produto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(price !== undefined && { price: Number(price) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(preparationTime !== undefined && { preparationTime: Number(preparationTime) }),
        ...(allergens !== undefined && { allergens: allergens?.trim() }),
        
        // Campos de estoque
        ...(stockQuantity !== undefined && { stockQuantity: Number(stockQuantity) }),
        ...(minStockLevel !== undefined && { minStockLevel: Number(minStockLevel) }),
        ...(maxStockLevel !== undefined && { maxStockLevel: Number(maxStockLevel) }),
        ...(trackStock !== undefined && { trackStock }),
      },
      include: {
        category: true,
      },
    });

    // Verificar estoque baixo e criar notificação se necessário
    if (updatedProduct.trackStock && 
        stockQuantity !== undefined && 
        minStockLevel !== undefined &&
        Number(stockQuantity) <= Number(minStockLevel)) {
      try {
        const { NotificationService } = await import('@/lib/notificationService');
        await NotificationService.notifyLowStock(
          updatedProduct.id,
          updatedProduct.name,
          Number(stockQuantity),
          Number(minStockLevel)
        );
      } catch (error) {
        console.error('Erro ao criar notificação de estoque baixo:', error);
        // Não falha a atualização do produto se a notificação falhar
      }
    }

    // Verificar se estoque zerou e marcar como indisponível
    if (updatedProduct.trackStock && 
        stockQuantity !== undefined && 
        Number(stockQuantity) <= 0 &&
        updatedProduct.isAvailable) {
      try {
        await prisma.product.update({
          where: { id },
          data: { isAvailable: false }
        });
        
        const { NotificationService } = await import('@/lib/notificationService');
        await NotificationService.notifyOutOfStock(
          updatedProduct.id,
          updatedProduct.name
        );
      } catch (error) {
        console.error('Erro ao marcar produto como indisponível:', error);
      }
    }

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'UPDATE_PRODUCT',
    //     entityType: 'Product',
    //     entityId: id,
    //     details: JSON.stringify({
    //       oldData: existingProduct,
    //       newData: updatedProduct,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Deletar produto
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

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
    if (!hasPermission(decoded.role, 'products:delete')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar produtos' },
        { status: 403 }
      );
    }

    // Verificar se o produto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o produto tem pedidos
    const ordersCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível deletar produto que possui pedidos. Desative o produto ao invés de deletá-lo.' 
        },
        { status: 400 }
      );
    }

    // Deletar produto
    await prisma.product.delete({
      where: { id },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'DELETE_PRODUCT',
    //     entityType: 'Product',
    //     entityId: id,
    //     details: JSON.stringify({
    //       name: existingProduct.name,
    //       categoryId: existingProduct.categoryId,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Produto deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}