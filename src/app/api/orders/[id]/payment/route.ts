import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verificar autenticação
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar permissões (apenas MANAGER)
    if (decoded.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const body = await request.json();
    const { paymentMethod, paymentAmount, splitPayment, splitValue } = body;

    // Buscar o pedido
    const order = await prisma.order.findUnique({
      where: { id },
      include: { table: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Atualizar o pedido com informações de pagamento
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'FINALIZADO', // Marcar como FINALIZADO após pagamento
        paymentMethod,
        paymentProcessedAt: new Date(),
        paymentAmount: paymentAmount || order.total,
        isPaid: true,
        updatedAt: new Date()
      }
    });

    // Se o pedido tem mesa, atualizar status da mesa
    if (order.table) {
      await prisma.table.update({
        where: { id: order.table.id },
        data: {
          status: 'OCUPADA',
          assignedTo: decoded.userId
        }
      });
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Pagamento processado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
