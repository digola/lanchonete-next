import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';
import { clearCachePattern } from '@/lib/cache';

// PUT /api/orders/[id]/receive - Marcar pedido como recebido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    
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

    // Verificar se o pedido existe
    const existingOrder = await prisma.order.findUnique({
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

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já foi recebido
    if (existingOrder.isReceived) {
      return NextResponse.json(
        { success: false, error: 'Pedido já foi recebido' },
        { status: 400 }
      );
    }

    console.log('📦 Marcando pedido como recebido:', orderId);

    // Atualizar pedido: marcar como recebido e inativo
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Atualizar pedido
      const order = await tx.order.update({
        where: { id: orderId },
        data: {
          isReceived: true,
          isActive: false, // Marcar como inativo quando recebido
          updatedAt: new Date(),
        },
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

      // Verificar se precisa liberar mesa
      if (existingOrder.tableId) {
        console.log('🪑 Verificando se precisa liberar mesa:', existingOrder.tableId);
        
        // Verificar se há outros pedidos ativos para esta mesa
        const activeOrdersCount = await tx.order.count({
          where: {
            tableId: existingOrder.tableId,
            isActive: true,
            status: {
              notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
            }
          }
        });

        console.log('📊 Pedidos ativos na mesa:', activeOrdersCount);

        if (activeOrdersCount === 0) {
          // Liberar mesa se não há pedidos ativos
          console.log('🆓 Liberando mesa:', existingOrder.tableId);
          await tx.table.update({
            where: { id: existingOrder.tableId },
            data: { 
              status: 'LIVRE',
              assignedTo: null
            },
          });
          console.log('✅ Mesa liberada com sucesso');
        } else {
          console.log('🔒 Mesa mantida ocupada - há pedidos ativos');
        }
      }

      return order;
    });

    console.log('✅ Pedido marcado como recebido:', updatedOrder);

    // Limpar cache de pedidos após atualização
    clearCachePattern('orders_');

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Pedido marcado como recebido com sucesso',
    });

  } catch (error) {
    console.error('Erro ao marcar pedido como recebido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

