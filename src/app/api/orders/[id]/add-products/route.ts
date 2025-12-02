import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { OrderTableAPI } from '@/lib/order-table-manager';

interface RouteParams {
  params: { id: string };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: orderId } = params;
    const body = await request.json();
    const { products } = body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { message: 'Produtos são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o pedido para obter o tableId
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { tableId: true }
    });

    if (!order || !order.tableId) {
      return NextResponse.json(
        { message: 'Pedido não encontrado ou sem mesa associada' },
        { status: 404 }
      );
    }

    // Usar o algoritmo para adicionar produtos
    const result = await OrderTableAPI.addProductsToOrder(order.tableId, products);

    if (result.success) {
      return NextResponse.json({ 
        message: 'Produtos adicionados com sucesso',
        data: result.data
           });
         
    } else {
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
        
      );
    
    }

  } catch (error) {
    console.error('Erro ao adicionar produtos ao pedido:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

