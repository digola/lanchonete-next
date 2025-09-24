import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { OrderStatus, UserRole } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/orders/[id] - Buscar pedido específico
export async function GET(request: NextRequest, { params }: RouteParams) {
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
    if (!hasPermission(decoded.role, 'orders:read')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar pedidos' },
        { status: 403 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
            status: true,
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
                preparationTime: true,
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

    // Clientes só podem ver seus próprios pedidos
    if (decoded.role === UserRole.CLIENTE && order.userId !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
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

// PUT /api/orders/[id] - Atualizar pedido
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
    if (!hasPermission(decoded.role, 'orders:write')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar pedidos' },
        { status: 403 }
      );
    }

    // Verificar se o pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { status, deliveryAddress, notes } = body;

    // Validações
    if (status && !Object.values(OrderStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Atualizar pedido
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(deliveryAddress !== undefined && { deliveryAddress: deliveryAddress?.trim() }),
        ...(notes !== undefined && { notes: notes?.trim() }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
            status: true,
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
                preparationTime: true,
              },
            },
          },
        },
      },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'UPDATE_ORDER',
    //     entityType: 'Order',
    //     entityId: id,
    //     details: JSON.stringify({
    //       oldStatus: existingOrder.status,
    //       newStatus: status,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}