import { NextRequest, NextResponse } from 'next/server';
import { OrderTableAPI } from '@/lib/order-table-manager';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';

// Processa pagamento de um pedido específico
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: orderId } = params;

    // Tentar ler o corpo da requisição com segurança
    let body: any = null;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { message: 'Corpo da requisição inválido ou ausente' },
        { status: 400 }
      );
    }

    const { paymentSession, totalPaid } = body || {};

    console.log('🔍 API Payment Debug:', { orderId, paymentSession, totalPaid });

    let paymentMethod = 'DINHEIRO'; // Método padrão

    // Se há sessão de pagamento, usar o método da sessão
    if (paymentSession && paymentSession.payments && paymentSession.payments.length > 0) {
      paymentMethod = paymentSession.payments[0].method;
    }

    // Validar se temos o valor total
    if (typeof totalPaid !== 'number' || isNaN(totalPaid) || totalPaid <= 0) {
      return NextResponse.json(
        { message: 'Valor total inválido' },
        { status: 400 }
      );
    }

    // Verificar autenticação e papel
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Token de acesso necessário' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      );
    }

    const finalResult = await OrderTableAPI.processPayment(orderId, paymentMethod, totalPaid);

    if (finalResult.success) {
      // Criar notificação de pagamento recebido
      try {
        const { NotificationService } = await import('@/lib/notificationService');
        await NotificationService.notifyPaymentReceived(orderId, totalPaid, paymentMethod);
      } catch (error) {
        console.error('Erro ao criar notificação de pagamento:', error);
        // Não falha o pagamento se a notificação falhar
      }
      
      return NextResponse.json({
        message: 'Pagamento processado com sucesso',
        data: finalResult.data,
      });
    } else {
      return NextResponse.json(
        { message: finalResult.error ?? 'Falha ao processar pagamento' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
