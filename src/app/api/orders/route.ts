import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { OrderStatus, UserRole } from '@/types';

// GET /api/orders - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;
    const orderBy = { [sortBy]: sortOrder as 'asc' | 'desc' };

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

    // Construir filtros baseado no role
    const where: any = {};
    
    if (decoded.role === UserRole.CLIENTE) {
      // Clientes só podem ver seus próprios pedidos
      where.userId = decoded.userId;
    } else if (decoded.role === UserRole.FUNCIONARIO) {
      // Funcionários podem ver todos os pedidos
      // Sem filtro adicional
    } else if (decoded.role === UserRole.ADMINISTRADOR) {
      // Administradores podem ver todos os pedidos
      // Sem filtro adicional
    }

    // Aplicar filtros adicionais
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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
          table: {
            select: {
              id: true,
              number: true,
              capacity: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Criar pedido
export async function POST(request: NextRequest) {
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

    // Verificar permissão
    if (!hasPermission(decoded.role, 'orders:create')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      items, 
      deliveryType = 'RETIRADA', 
      deliveryAddress, 
      paymentMethod = 'DINHEIRO',
      notes,
      tableId 
    } = body;

    // Validações
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Itens do pedido são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se todos os produtos existem e calcular total
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Produto ${item.productId} não encontrado` },
          { status: 400 }
        );
      }

      if (!product.isAvailable) {
        return NextResponse.json(
          { success: false, error: `Produto ${product.name} não está disponível` },
          { status: 400 }
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      total += itemTotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(product.price),
        notes: item.notes,
        customizations: item.customizations ? JSON.stringify(item.customizations) : null,
      });
    }

    // Verificar se a mesa existe (se fornecida)
    if (tableId) {
      const table = await prisma.table.findUnique({
        where: { id: tableId },
      });

      if (!table) {
        return NextResponse.json(
          { success: false, error: 'Mesa não encontrada' },
          { status: 400 }
        );
      }
    }

    // Criar pedido
    const order = await prisma.order.create({
      data: {
        userId: decoded.userId,
        status: OrderStatus.PENDENTE,
        total,
        deliveryType,
        deliveryAddress: deliveryAddress?.trim(),
        paymentMethod,
        notes: notes?.trim(),
        tableId,
        items: {
          create: validatedItems,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        table: {
          select: {
            id: true,
            number: true,
            capacity: true,
          },
        },
      },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'CREATE_ORDER',
    //     entityType: 'Order',
    //     entityId: order.id,
    //     details: JSON.stringify({
    //       total: order.total,
    //       deliveryType: order.deliveryType,
    //       paymentMethod: order.paymentMethod,
    //       itemsCount: order.items.length,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}