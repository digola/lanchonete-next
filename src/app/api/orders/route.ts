import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { OrderStatus, UserRole } from '@/types';
import { getCache, setCache, clearCachePattern, CACHE_DURATION } from '@/lib/cache';

// GET /api/orders - Listar pedidos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tableId = searchParams.get('tableId');
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const isPaid = searchParams.get('isPaid');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const includeItems = searchParams.get('includeItems') === 'true';
    const includeUser = searchParams.get('includeUser') === 'true';
    const includeTable = searchParams.get('includeTable') === 'true';
    const date = searchParams.get('date');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

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
    
          if (decoded.role === UserRole.CUSTOMER) {
            // Clientes só podem ver seus próprios pedidos
            where.userId = decoded.userId;
          } else if (decoded.role === UserRole.STAFF || decoded.role === UserRole.ADMIN) {
            // Staff e admins podem ver todos os pedidos do dia atual
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            where.createdAt = {
              gte: today
            };
          } else if (decoded.role === UserRole.MANAGER) {
            // Manager vê pedidos criados por STAFF ou por ele mesmo (MANAGER), apenas do dia atual
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            where.user = {
              role: {
                in: [UserRole.STAFF, UserRole.MANAGER]
              }
            };
            where.createdAt = {
              gte: today
            };
          }

    // Aplicar filtros adicionais
    if (userId) {
      where.userId = userId;
    }
    if (tableId) {
      where.tableId = tableId;
    }
    if (status) {
      // Se o status contém vírgula, significa que são múltiplos status
      if (status.includes(',')) {
        const statusArray = status.split(',').map(s => s.trim());
        where.status = {
          in: statusArray
        };
      } else {
        where.status = status;
      }
    }
    // Campo isActive não existe no schema atual; derive pelo status quando necessário.
    if (isPaid !== null) {
      where.isPaid = isPaid === 'true';
    }

    // Filtros de data
    if (date) {
      // Filtro por data específica (formato YYYY-MM-DD)
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
    } else if (dateFrom || dateTo) {
      // Filtro por período (dateFrom e/ou dateTo)
      const dateFilter: any = {};
      
      if (dateFrom) {
        const parts = dateFrom.split('-').map(Number);
        const yearNum = parts[0] || 0;
        const monthNum = parts[1] || 0;
        const dayNum = parts[2] || 0;
        dateFilter.gte = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0);
      }
      
      if (dateTo) {
        const parts = dateTo.split('-').map(Number);
        const yearNum = parts[0] || 0;
        const monthNum = parts[1] || 0;
        const dayNum = parts[2] || 0;
        dateFilter.lte = new Date(yearNum, monthNum - 1, dayNum, 23, 59, 59, 999);
      }
      
      where.createdAt = dateFilter;
    }

    // Verificar cache (baseado nos parâmetros da query)
    const cacheKey = `orders_${decoded.userId}_${JSON.stringify({ userId, tableId, status, isPaid, date, dateFrom, dateTo, page, limit, sortBy, sortOrder })}`;
    const lightweightQuery = !includeItems && !includeUser && !includeTable && limit <= 5;
    const cacheDuration = lightweightQuery ? CACHE_DURATION.MEDIUM : CACHE_DURATION.SHORT;
    const cachedData = getCache(cacheKey, cacheDuration);
    
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Construir include baseado nos parâmetros
    const include: any = {};
    
    if (includeUser) {
      include.user = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      };
    }
    
    if (includeItems) {
      include.items = {
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
      };
    }
    
    if (includeTable) {
      include.table = {
        select: {
          id: true,
          number: true,
          capacity: true,
          status: true,
        },
      };
    }

    // Garantir tipos seguros para evitar null/undefined em cenários sem pedidos
    let orders: any[] = [];
    let total: number = 0;

    try {
      // Query única otimizada - busca tudo de uma vez para evitar N+1
      const result = await prisma.$transaction([
        prisma.order.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      const rawOrders = Array.isArray(result?.[0]) ? result[0] : [];
      const rawTotal = typeof result?.[1] === 'number' ? result[1] : 0;

      // Compatibilidade: em ambientes SQLite de dev, o campo isPaid pode não existir.
      // Para manter o contrato esperado no frontend, derivamos isPaid a partir do status quando ausente.
      orders = rawOrders.map((o: any) => {
        const derivedIsPaid = ['FINALIZADO', 'ENTREGUE'].includes((o?.status || '').toUpperCase());
        return {
          ...o,
          isPaid: typeof o.isPaid === 'boolean' ? o.isPaid : derivedIsPaid,
        };
      });
      total = rawTotal;
      
      // Preparar resposta
      const responseData = {
        success: true,
        data: orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
      
      // Salvar no cache
      setCache(cacheKey, responseData);
      
      return NextResponse.json(responseData);
    } catch (queryError: any) {
      console.error('❌ Erro na query do Prisma:', queryError);
      return NextResponse.json(
        { success: false, error: 'Erro ao carregar pedidos', details: queryError.message },
        { status: 500 }
      );
    }
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
    console.log('📥 Dados recebidos na API:', body);
    const { 
      items, 
      deliveryType = 'RETIRADA', 
      deliveryAddress, 
      paymentMethod = 'DINHEIRO',
      notes,
      tableId 
    } = body;

    console.log('🔍 Parâmetros extraídos:', { 
      itemsCount: items?.length, 
      deliveryType, 
      deliveryAddress, 
      paymentMethod, 
      notes, 
      tableId 
    });

    // Validações
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Itens do pedido são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar produtos, coletar IDs de adicionais e calcular preços finais
    let total = 0;
    const collectedAdicionalIds: string[] = [];
    const preItems: Array<{
      productId: string;
      quantity: number;
      basePrice: number;
      notes?: string;
      adicionalIds: string[];
      customizationsRaw?: any;
    }> = [];

    for (const item of items) {
      // Sanitizar quantidade (fallback para 1 se inválida) e garantir inteiro
      const rawQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
      const qty = Number.isInteger(rawQty) ? rawQty : Math.max(1, Math.floor(rawQty));
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
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

      let adicionalIds: string[] = [];
      let customizationsRaw: any = item.customizations || undefined;
      try {
        const custom = typeof item.customizations === 'string'
          ? JSON.parse(item.customizations)
          : (item.customizations || {});
        if (Array.isArray(custom?.adicionaisIds)) {
          adicionalIds = custom.adicionaisIds as string[];
        } else if (Array.isArray(custom?.adicionais)) {
          adicionalIds = custom.adicionais as string[];
        } else if (Array.isArray(item.adicionaisIds)) {
          adicionalIds = item.adicionaisIds as string[];
        }
      } catch {}

      if (adicionalIds.length > 0) collectedAdicionalIds.push(...adicionalIds);
      preItems.push({
        productId: item.productId,
        quantity: qty,
        basePrice: Number(product.price),
        notes: item.notes,
        adicionalIds,
        customizationsRaw,
      });
    }

    let adicionalPriceMap: Record<string, number> = {};
    if (collectedAdicionalIds.length > 0) {
      const uniqueIds = [...new Set(collectedAdicionalIds)];
      const adicionais = await prisma.adicional.findMany({ where: { id: { in: uniqueIds } } });
      adicionais.forEach(a => { adicionalPriceMap[a.id] = a.price || 0; });
    }

    const validatedItems: Array<{
      productId: string;
      quantity: number;
      price: number;
      notes?: string;
      customizations?: string | null;
    }> = preItems.map(pi => {
      const adicionaisPrice = (pi.adicionalIds || []).reduce((sum, id) => sum + (adicionalPriceMap[id] || 0), 0);
      const finalUnitPrice = pi.basePrice + adicionaisPrice;
      total += finalUnitPrice * pi.quantity;
      const customizations = pi.adicionalIds && pi.adicionalIds.length > 0
        ? JSON.stringify({ adicionaisIds: pi.adicionalIds })
        : (pi.customizationsRaw ? JSON.stringify(pi.customizationsRaw) : null);
      const base = {
        productId: pi.productId,
        quantity: pi.quantity,
        price: finalUnitPrice,
        customizations,
      } as { productId: string; quantity: number; price: number; notes?: string; customizations?: string | null };
      if (typeof pi.notes === 'string' && pi.notes.trim() !== '') {
        base.notes = pi.notes;
      }
      return base;
    });

    // Garantir que total é um número válido
    if (!Number.isFinite(total) || Number.isNaN(total)) {
      total = validatedItems.reduce((acc, vi) => acc + vi.price * vi.quantity, 0);
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

    // Criar pedido e atualizar status da mesa em uma transação
    console.log('🔄 Iniciando transação para criar pedido...');
    // Reparo: utilizar `$transaction` com o cliente transacional `tx` em vez de
    // `prisma.transaction`. Em Prisma, o método correto é `$transaction` e, dentro
    // do callback, devemos usar o cliente `tx` para garantir que todas as operações
    // (create do pedido e update da mesa) ocorram na mesma transação.
    const result = await prisma.$transaction(async (tx) => {
      // Criar pedido
      console.log('📝 Criando pedido no banco...');
      const order = await tx.order.create({
        data: {
          userId: decoded.userId,
          status: OrderStatus.CONFIRMADO,
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

      // Atualizar status da mesa para OCUPADA se tableId foi fornecido
      if (tableId) {
        console.log('🪑 Atualizando status da mesa:', tableId);
        await tx.table.update({
          where: { id: tableId },
          data: { 
            status: 'OCUPADA',
            assignedTo: decoded.userId 
          },
        });
        console.log('✅ Status da mesa atualizado para OCUPADA');
      }

      console.log('✅ Pedido criado com sucesso na transação:', order.id);
      return order;
    });

    console.log('🎉 Transação concluída com sucesso!');
    
    // Criar notificação para o novo pedido
    try {
      const { NotificationService } = await import('@/lib/notificationService');
      await NotificationService.notifyNewOrder(
        result.id, 
        result.user?.name || 'Cliente', 
        result.table?.number
      );
    } catch (error) {
      console.error('Erro ao criar notificação de novo pedido:', error);
      // Não falha a criação do pedido se a notificação falhar
    }
    
    // Limpar cache de pedidos após criar novo
    clearCachePattern('orders_');

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
      data: result,
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
