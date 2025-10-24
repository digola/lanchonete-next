import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth-server';
;
import { UserRole } from '@/types';
import { clearCachePattern } from '@/lib/cache';

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

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar permissão (staff, managers ou qualquer variação de admin; caso contrário, somente o dono do pedido)
    if (
      decoded.role !== UserRole.STAFF &&
      decoded.role !== UserRole.MANAGER &&
      decoded.role !== UserRole.ADMIN &&
      decoded.role !== UserRole.ADMINISTRADOR &&
      decoded.role !== UserRole.ADMINISTRADOR_LOWER &&
      decoded.role !== UserRole.ADMINISTRADOR_TITLE
    ) {
      // Se for cliente, verificar se é o dono do pedido
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { userId: true }
      });
      
      if (!order || order.userId !== decoded.userId) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado: você só pode atualizar seus próprios pedidos' },
          { status: 403 }
        );
      }
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { status, paymentMethod } = body;

    console.log('🔍 Atualizando pedido:', { orderId, status, paymentMethod });

    // Validar que pelo menos um campo foi fornecido
    if (!status && paymentMethod === undefined) {
      return NextResponse.json(
        { success: false, error: 'Pelo menos um campo deve ser fornecido para atualização' },
        { status: 400 }
      );
    }

    // Validar status se fornecido
    if (status) {
      // Incluir todos os status válidos conforme enum OrderStatus
      const validStatuses = ['PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'FINALIZADO', 'CANCELADO'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Status inválido: ${status}` },
          { status: 400 }
        );
      }
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

    // Atualizar o pedido
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (status) {
      updateData.status = status;
    }
    
    if (paymentMethod) {
      // Validar método de pagamento
      const validPaymentMethods = ['DINHEIRO', 'CARTAO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'DIVIDIDO'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        console.log('❌ Método de pagamento inválido:', paymentMethod);
        console.log('✅ Métodos válidos:', validPaymentMethods);
        return NextResponse.json(
          { success: false, error: `Método de pagamento inválido: ${paymentMethod}` },
          { status: 400 }
        );
      }
      updateData.paymentMethod = paymentMethod;
    }

    console.log('🔍 Dados de atualização:', updateData);

    // Verificar se precisa atualizar status da mesa
    const shouldUpdateTable = status && (status === 'CANCELADO' || status === 'ENTREGUE' || status === 'FINALIZADO');
    
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Criar logs de mudanças antes de atualizar
      const logsToCreate = [];
      
      if (status && status !== existingOrder.status) {
        logsToCreate.push({
          orderId,
          userId: decoded.userId,
          action: 'UPDATE_STATUS',
          field: 'status',
          oldValue: JSON.stringify({ status: existingOrder.status }),
          newValue: JSON.stringify({ status }),
          reason: `Status alterado de ${existingOrder.status} para ${status}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
        });
      }
      
      if (paymentMethod && paymentMethod !== existingOrder.paymentMethod) {
        logsToCreate.push({
          orderId,
          userId: decoded.userId,
          action: 'UPDATE_PAYMENT',
          field: 'paymentMethod',
          oldValue: JSON.stringify({ paymentMethod: existingOrder.paymentMethod }),
          newValue: JSON.stringify({ paymentMethod }),
          reason: `Método de pagamento alterado de ${existingOrder.paymentMethod} para ${paymentMethod}`,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
        });
      }
      


      // Criar logs se houver mudanças
      if (logsToCreate.length > 0) {
        // Persistência de logs desativada (modelo OrderLog não existe no schema atual)
        console.log('📝 Logs de alteração gerados (não persistidos):', logsToCreate.length);
      }

      // Atualizar pedido
      const order = await tx.order.update({
        where: { id: orderId },
        data: updateData,
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

      // Atualizar status da mesa se necessário
      if (shouldUpdateTable && existingOrder.tableId) {
        console.log('🪑 Verificando se precisa liberar mesa:', existingOrder.tableId);
        
        // Verificar se há outros pedidos ativos para esta mesa
        const activeOrdersCount = await tx.order.count({
          where: {
            tableId: existingOrder.tableId,
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

      // Atualizar estoque quando pedido for confirmado
      if (status === 'CONFIRMADO' && existingOrder.status !== 'CONFIRMADO') {
        console.log('📦 Pedido confirmado - sem lógica de estoque (removida)');
      }

      // Restaurar estoque quando pedido for cancelado
      if (status === 'CANCELADO' && existingOrder.status === 'CONFIRMADO') {
        console.log('❌ Pedido cancelado - sem lógica de estoque (removida)');
      }

      return order;
    });

    console.log('✅ Pedido atualizado com sucesso:', { 
      orderId, 
      status: updatedOrder.status, 
      paymentMethod: updatedOrder.paymentMethod 
    });

    // Limpar cache de pedidos após atualizar
    clearCachePattern('orders_');

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Status do pedido atualizado com sucesso',
    });

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
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

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Buscar o pedido
    const order = await prisma.order.findUnique({
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

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão (staff, managers ou qualquer variação de admin; caso contrário, somente o dono do pedido)
    if (
      decoded.role !== UserRole.STAFF &&
      decoded.role !== UserRole.MANAGER &&
      decoded.role !== UserRole.ADMIN &&
      decoded.role !== UserRole.ADMINISTRADOR &&
      decoded.role !== UserRole.ADMINISTRADOR_LOWER &&
      decoded.role !== UserRole.ADMINISTRADOR_TITLE
    ) {
      if (order.userId !== decoded.userId) {
        return NextResponse.json(
          { success: false, error: 'Acesso negado: você só pode visualizar seus próprios pedidos' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}