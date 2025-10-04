import { NextRequest, NextResponse } from 'next/server';
import { OrderTableAPI } from '@/lib/order-table-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { paymentSession, totalPaid } = body;

    console.log('🔍 API Payment Debug:', { orderId, paymentSession, totalPaid });

    let paymentMethod = 'DINHEIRO'; // Método padrão

    // Se há sessão de pagamento, usar o método da sessão
    if (paymentSession && paymentSession.payments && paymentSession.payments.length > 0) {
      paymentMethod = paymentSession.payments[0].method;
    }

    // Validar se temos o valor total
    if (!totalPaid || totalPaid <= 0) {
      return NextResponse.json(
        { message: 'Valor total inválido' },
        { status: 400 }
      );
    }

    // Processar pagamento
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
        data: finalResult.data 
      });
    } else {
      return NextResponse.json(
        { message: finalResult.error },
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