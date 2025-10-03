import { NextRequest, NextResponse } from 'next/server';
import { OrderTableAPI } from '@/lib/order-table-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const { paymentSession, totalPaid } = body;

    console.log('🔍 API Payment Debug:', { orderId, paymentSession, totalPaid });

    if (!paymentSession || !paymentSession.payments || paymentSession.payments.length === 0) {
      return NextResponse.json(
        { message: 'Sessão de pagamento inválida' },
        { status: 400 }
      );
    }

    // Processar pagamento total (usar o primeiro método como principal)
    const primaryMethod = paymentSession.payments[0].method;
    const finalResult = await OrderTableAPI.processPayment(orderId, primaryMethod, totalPaid);

    if (finalResult.success) {
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