import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Verificar permissão (staff, admins ou o próprio cliente para seus pedidos)
    if (decoded.role !== UserRole.STAFF && decoded.role !== UserRole.ADMIN) {
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

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status é obrigatório' },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ['PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'PRONTO', 'ENTREGUE', 'CANCELADO'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
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

    // Atualizar o pedido
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };
    
    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    }

    console.log('🔍 Dados de atualização:', updateData);

    const updatedOrder = await prisma.order.update({
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

    console.log('✅ Pedido atualizado com sucesso:', { 
      orderId, 
      status: updatedOrder.status, 
      paymentMethod: updatedOrder.paymentMethod 
    });

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

    // Verificar permissão (staff, admins ou o próprio cliente para seus pedidos)
    if (decoded.role !== UserRole.STAFF && decoded.role !== UserRole.ADMIN) {
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