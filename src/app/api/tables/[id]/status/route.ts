import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { UserRole } from '@/types';
import { clearCachePattern } from '@/lib/cache';

// PUT /api/tables/[id]/status - Atualizar status da mesa baseado em pedidos
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params;
    
    if (!tableId) {
      return NextResponse.json(
        { success: false, error: 'ID da mesa é obrigatório' },
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

    // Verificar permissão
    if (!hasPermission(decoded.role, 'tables:write')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    // Verificar se a mesa existe
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }

    console.log('🪑 Atualizando status da mesa:', tableId);

    // Verificar pedidos ativos para esta mesa (não inativos e não finalizados)
    const activeOrders = await prisma.order.findMany({
      where: {
        tableId: tableId,
        isActive: true,
        status: {
          notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
        }
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('📊 Pedidos ativos encontrados:', activeOrders.length);

    // Determinar novo status da mesa
    let newStatus = 'LIVRE';
    let assignedTo = null;

    if (activeOrders.length > 0) {
      newStatus = 'OCUPADA';
      // Atribuir ao usuário do pedido mais recente
      const firstOrder = activeOrders[0];
      if (firstOrder && firstOrder.user) {
        assignedTo = firstOrder.user.id;
      }
    }

    console.log('🔄 Novo status da mesa:', { newStatus, assignedTo });

    // Atualizar mesa
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        status: newStatus,
        assignedTo: assignedTo,
        updatedAt: new Date(),
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('✅ Status da mesa atualizado:', updatedTable);

    // Limpar cache de mesas
    clearCachePattern('tables_');

    return NextResponse.json({
      success: true,
      data: {
        table: updatedTable,
        activeOrders: activeOrders,
        statusChanged: table.status !== newStatus,
      },
      message: `Mesa ${newStatus === 'OCUPADA' ? 'ocupada' : 'liberada'} com sucesso`,
    });

  } catch (error) {
    console.error('Erro ao atualizar status da mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/tables/[id]/status - Verificar status da mesa e pedidos ativos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tableId } = await params;
    
    if (!tableId) {
      return NextResponse.json(
        { success: false, error: 'ID da mesa é obrigatório' },
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

    // Buscar mesa e pedidos ativos
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar pedidos ativos para esta mesa (não inativos e não finalizados)
    const activeOrders = await prisma.order.findMany({
      where: {
        tableId: tableId,
        isActive: true,
        status: {
          notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        table,
        activeOrders,
        shouldBeOccupied: activeOrders.length > 0,
        statusMatches: (activeOrders.length > 0) === (table.status === 'OCUPADA'),
      },
    });

  } catch (error) {
    console.error('Erro ao verificar status da mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
