import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { OrderStatus, UserRole } from '@/types';

// POST /api/orders/finalize - Finalizar pedido completo da mesa
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

    // Verificar permissão (apenas staff e admin podem finalizar pedidos)
    if (decoded.role !== UserRole.STAFF && decoded.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: 'Apenas funcionários podem finalizar pedidos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      tableId,
      items, 
      deliveryType = 'PICKUP', 
      deliveryAddress, 
      paymentMethod = 'DINHEIRO',
      notes,
      customerInfo 
    } = body;

    // Validações obrigatórias
    if (!tableId) {
      return NextResponse.json(
        { success: false, error: 'ID da mesa é obrigatório' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Itens do pedido são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a mesa existe e está ocupada
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe um pedido ativo para esta mesa
    const existingOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: {
          in: [OrderStatus.PENDENTE, OrderStatus.CONFIRMADO, OrderStatus.PREPARANDO, OrderStatus.PRONTO]
        }
      }
    });

    if (existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Já existe um pedido ativo para esta mesa' },
        { status: 400 }
      );
    }

    // Usar o funcionário que está fazendo o pedido como cliente da mesa
    // Isso é mais apropriado para pedidos feitos pelo staff
    const customerId = decoded.userId;

    // Validar produtos e calcular total
    let total = 0;
    const validatedItems: any[] = [];

    // Validação extra: verificar se há itens
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pelo menos um item é obrigatório' },
        { status: 400 }
      );
    }

    for (const item of items) {
      // Validação de estrutura do item
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: 'Item inválido: productId e quantity são obrigatórios' },
          { status: 400 }
        );
      }

      console.log('🔍 Validando produto:', item.productId);
      
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        console.log('❌ Produto não encontrado:', item.productId);
        return NextResponse.json(
          { success: false, error: `Produto ${item.productId} não encontrado` },
          { status: 400 }
        );
      }

      console.log('✅ Produto encontrado:', {
        id: product.id,
        name: product.name,
        isAvailable: product.isAvailable,
        price: product.price
      });

      if (!product.isAvailable) {
        console.log('❌ Produto não disponível:', product.name);
        return NextResponse.json(
          { success: false, error: `Produto ${product.name} não está disponível` },
          { status: 400 }
        );
      }

      // Validação de preço
      if (!product.price || Number(product.price) <= 0) {
        console.log('❌ Preço inválido:', product.name, product.price);
        return NextResponse.json(
          { success: false, error: `Produto ${product.name} tem preço inválido` },
          { status: 400 }
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      total += itemTotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: Number(product.price),
        notes: item.notes || null,
      });
    }

    // Validação de total mínimo
    if (total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Total do pedido deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Criar pedido completo
    console.log('🔍 Criando pedido com dados:', {
      userId: customerId,
      status: OrderStatus.PENDENTE,
      total,
      deliveryType,
      paymentMethod,
      tableId,
      itemsCount: validatedItems.length,
      validatedItems: validatedItems
    });

    let order;
    try {
      // Usar transação para garantir consistência
      order = await prisma.$transaction(async (tx) => {
        // Criar o pedido com todos os itens em uma única operação
        const newOrder = await tx.order.create({
          data: {
            userId: customerId,
            status: OrderStatus.PENDENTE,
            total,
            deliveryType,
            deliveryAddress: deliveryAddress?.trim() || null,
            paymentMethod,
            notes: notes?.trim() || null,
            tableId,
            finalizedBy: decoded.userId, // Funcionário que finalizou o pedido
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
                  },
                },
              },
            },
            table: {
              select: {
                id: true,
                number: true,
              },
            },
            finalizedByUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        console.log('✅ Pedido criado com ID:', newOrder.id);
        console.log('✅ Itens adicionados:', newOrder.items.length);

        return newOrder;
      });
    } catch (createError) {
      console.error('❌ Erro ao criar pedido:', createError);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar pedido', details: createError instanceof Error ? createError.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }

    // Atualizar status da mesa para ocupada se não estiver
    if (table.status !== 'OCUPADA') {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCUPADA' }
      });
    }

    console.log('✅ Pedido finalizado com sucesso:', {
      orderId: order.id,
      tableNumber: order.table?.number,
      total: order.total,
      itemsCount: order.items.length,
      finalizedBy: decoded.userId
    });

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Pedido finalizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao finalizar pedido:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
