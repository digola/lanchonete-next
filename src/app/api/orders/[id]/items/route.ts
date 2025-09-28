import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }

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

    // Verificar permissão (staff, admins ou o próprio cliente para seus pedidos)
    if (decoded.role !== UserRole.STAFF && decoded.role !== UserRole.ADMIN) {
      // Se for cliente, verificar se é o dono do pedido
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true }
      });
      
      if (!order || order.userId !== decoded.userId) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado: você só pode modificar seus próprios pedidos' },
          { status: 403 }
        );
      }
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de itens é obrigatória' },
        { status: 400 }
      );
    }

    // Verificar se o pedido existe e está em status válido para adicionar itens
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o pedido está em status que permite adicionar itens
    const validStatuses = ['PENDENTE', 'CONFIRMADO'];
    if (!validStatuses.includes(existingOrder.status)) {
      return NextResponse.json(
        { success: false, error: 'Não é possível adicionar itens a um pedido neste status' },
        { status: 400 }
      );
    }

    // Verificar se os produtos existem
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isAvailable: true
      }
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'Alguns produtos não foram encontrados ou estão inativos' },
        { status: 400 }
      );
    }

    // Adicionar os itens ao pedido
    const orderItems = items.map((item: any) => ({
      orderId,
      productId: item.productId,
      quantity: item.quantity || 1,
      price: products.find(p => p.id === item.productId)?.price || 0,
      notes: item.notes || null
    }));

    await prisma.orderItem.createMany({
      data: orderItems
    });

    // Recalcular o total do pedido
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (updatedOrder) {
      const newTotal = updatedOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      await prisma.order.update({
        where: { id: orderId },
        data: { total: newTotal }
      });

      // Retornar o pedido atualizado
      const finalOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          table: {
            select: {
              id: true,
              number: true,
              capacity: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: finalOrder,
        message: 'Itens adicionados ao pedido com sucesso',
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao atualizar o pedido',
    }, { status: 500 });

  } catch (error) {
    console.error('Erro ao adicionar itens ao pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

