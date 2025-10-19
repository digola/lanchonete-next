import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth-server';
;

// POST /api/orders/[id]/review - Criar avaliação do pedido
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { rating, comment } = body;

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

    // Verificar se o pedido existe e pertence ao usuário
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: decoded.userId
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o pedido foi entregue
    if (order.status !== 'ENTREGUE') {
      return NextResponse.json(
        { success: false, error: 'Apenas pedidos entregues podem ser avaliados' },
        { status: 400 }
      );
    }

    // TODO: Implementar sistema de avaliações quando modelo OrderReview for criado
    // const existingReview = await prisma.orderReview.findFirst({
    //   where: {
    //     orderId: orderId
    //   }
    // });

    // if (existingReview) {
    //   return NextResponse.json(
    //     { success: false, error: 'Este pedido já foi avaliado' },
    //     { status: 400 }
    //   );
    // }

    // TODO: Implementar criação de avaliação quando modelo OrderReview for criado
    // const review = await prisma.orderReview.create({
    //   data: {
    //     orderId: orderId,
    //     userId: decoded.userId,
    //     rating: rating,
    //     comment: comment || null
    //   },
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         name: true,
    //         email: true
    //       }
    //     },
    //     order: {
    //       select: {
    //         id: true,
    //         total: true,
    //         status: true
    //       }
    //     }
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Sistema de avaliações em desenvolvimento',
      data: null
    });

  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/orders/[id]/review - Buscar avaliação do pedido
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

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

    // TODO: Implementar busca de avaliação quando modelo OrderReview for criado
    // const review = await prisma.orderReview.findFirst({
    //   where: {
    //     orderId: orderId
    //   },
    //   include: {
    //     user: {
    //       select: {
    //         id: true,
    //         name: true,
    //         email: true
    //       }
    //     }
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: 'Sistema de avaliações em desenvolvimento',
      data: null
    });

  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
