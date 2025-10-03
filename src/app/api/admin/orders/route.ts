import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { UserRole } from '@/types';

// GET /api/admin/orders - Listar pedidos com filtros para admin
export async function GET(request: NextRequest) {
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

    // Verificar permissão de admin
    if (!hasPermission(decoded.role, 'orders:read')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';

    // Construir filtros
    const where: any = {};

    // Filtro por status
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filtro por data
    if (date) {
      const parts = date.split('-').map(Number);
      const yearNum = parts[0] || 0;
      const monthNum = parts[1] || 0;
      const dayNum = parts[2] || 0;
      const startDate = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0);
      const endDate = new Date(yearNum, monthNum - 1, dayNum, 23, 59, 59, 999);
      
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    // Filtro por busca (ID do pedido ou nome do usuário)
    if (search) {
      where.OR = [
        {
          id: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Construir ordenação
    const orderBy: any = {};
    if (sortBy === 'total') {
      orderBy.total = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Buscar pedidos
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          table: {
            select: {
              id: true,
              number: true,
              capacity: true
            }
          }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    // Calcular paginação
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search,
        status,
        date,
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders - Ação em massa nos pedidos
export async function PUT(request: NextRequest) {
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

    // Verificar permissão de admin
    if (!hasPermission(decoded.role, 'orders:update')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderIds, action, status, notes } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'IDs dos pedidos são obrigatórios' },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Ação é obrigatória' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    // Executar ação em cada pedido
    for (const orderId of orderIds) {
      try {
        let updateData: any = {};

        switch (action) {
          case 'update_status':
            if (!status) {
              throw new Error('Status é obrigatório para atualização');
            }
            updateData.status = status;
            break;

          case 'cancel':
            updateData.status = 'CANCELADO';
            break;

          case 'confirm':
            updateData.status = 'CONFIRMADO';
            break;

          case 'mark_preparing':
            updateData.status = 'PREPARANDO';
            break;

          case 'mark_ready':
            updateData.status = 'PRONTO';
            break;

          case 'mark_delivered':
            updateData.status = 'ENTREGUE';
            break;

          default:
            throw new Error(`Ação não suportada: ${action}`);
        }

        // Adicionar notas se fornecidas
        if (notes) {
          updateData.adminNotes = notes;
        }

        // Adicionar timestamp da atualização
        updateData.updatedAt = new Date();

        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: updateData,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            table: {
              select: {
                number: true
              }
            }
          }
        });

        results.push({
          orderId,
          success: true,
          data: updatedOrder
        });

      } catch (error) {
        console.error(`Erro ao processar pedido ${orderId}:`, error);
        errors.push({
          orderId,
          error: error.message || 'Erro desconhecido'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.length} pedidos processados com sucesso`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: orderIds.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Erro na ação em massa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
