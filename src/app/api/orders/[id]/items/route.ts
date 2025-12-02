import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, hasMinimumRole } from '@/lib/auth';
import { UserRole } from '@/types';

interface RouteParams {
  params: { id: string };
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: orderId } = params;
    console.log('aqui');
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

    // Verificar permissão (permitir STAFF ou superior; caso contrário, somente o dono do pedido)
    if (!hasMinimumRole(decoded.role as UserRole, UserRole.STAFF)) {
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
    // STAFF e MANAGER podem adicionar em qualquer status ativo
    // CUSTOMER só pode adicionar em PENDENTE ou CONFIRMADO
    const isStaffOrManager = hasMinimumRole(decoded.role as UserRole, UserRole.STAFF);
    
    if (isStaffOrManager) {
      // Staff e Manager podem adicionar itens em qualquer status, exceto ENTREGUE e CANCELADO
      const invalidStatuses = ['ENTREGUE', 'CANCELADO'];
      if (invalidStatuses.includes(existingOrder.status)) {
        return NextResponse.json(
          { success: false, error: 'Não é possível adicionar itens a um pedido finalizado ou cancelado' },
          { status: 400 }
        );
      }
    } else {
      // Clientes só podem adicionar em status iniciais
      const validStatusesForCustomer = ['PENDENTE', 'CONFIRMADO'];
      if (!validStatusesForCustomer.includes(existingOrder.status)) {
        return NextResponse.json(
          { success: false, error: 'Não é possível adicionar itens a um pedido em preparo ou pronto' },
          { status: 400 }
        );
      }
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

    // Buscar adicionais para calcular preços corretos
    const allAdicionalIds = items
      .flatMap((item: any) => item.adicionaisIds || [])
      .filter((id: string) => id);
    
    const adicionais = allAdicionalIds.length > 0
      ? await prisma.adicional.findMany({
          where: { id: { in: allAdicionalIds } }
        })
      : [];

    // Adicionar os itens ao pedido, calculando preço final por item (base + adicionais)
    const orderItems = items.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      const basePrice = product?.price || 0;
      
      // Calcular preço dos adicionais
      const adicionaisPrice = (item.adicionaisIds || [])
        .reduce((sum: number, adicionalId: string) => {
          const adicional = adicionais.find(a => a.id === adicionalId);
          return sum + (adicional?.price || 0);
        }, 0);
      
      const finalPrice = basePrice + adicionaisPrice;
      
      // Criar JSON de customizations com adicionaisIds
      const customizations = item.adicionaisIds && item.adicionaisIds.length > 0
        ? JSON.stringify({ adicionaisIds: item.adicionaisIds })
        : null;
      
      return {
        orderId,
        productId: item.productId,
        quantity: item.quantity || 1,
        price: finalPrice,
        notes: item.notes || null,
        customizations
      };
    });
    
    await prisma.orderItem.createMany({
      data: orderItems,
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

