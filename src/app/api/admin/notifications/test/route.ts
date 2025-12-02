import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/auth';
import { NotificationService } from '@/lib/notificationService';
import { NotificationType, NotificationPriority } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'all' } = body;

    const notifications = [];

    if (type === 'all' || type === 'order') {
      // Notificação de novo pedido
      notifications.push(
        await NotificationService.notifyNewOrder('12345', 'João Silva', 5)
      );

      // Notificação de pedido pronto
      notifications.push(
        await NotificationService.notifyOrderReady('12346', 3)
      );
    }

    // Removido: notificações de estoque foram descontinuadas

    if (type === 'all' || type === 'payment') {
      // Notificação de pagamento
      notifications.push(
        await NotificationService.notifyPaymentReceived('12347', 45.50, 'PIX')
      );
    }

    if (type === 'all' || type === 'user') {
      // Notificação de novo usuário
      notifications.push(
        await NotificationService.notifyNewUser('user-1', 'Maria Santos', 'STAFF')
      );
    }

    if (type === 'all' || type === 'table') {
      // Notificação de mesa ocupada
      notifications.push(
        await NotificationService.notifyTableOccupied(8, 'Ana Costa')
      );

      // Notificação de mesa liberada
      notifications.push(
        await NotificationService.notifyTableFreed(4)
      );
    }

    if (type === 'all' || type === 'system') {
      // Notificação de sistema
      notifications.push(
        await NotificationService.notifySystem(
          'Backup automático realizado com sucesso',
          NotificationPriority.LOW
        )
      );

      // Notificação urgente do sistema
      notifications.push(
        await NotificationService.notifySystem(
          'Sistema será reiniciado em 5 minutos para manutenção',
          NotificationPriority.URGENT
        )
      );
    }

    return NextResponse.json({
      success: true,
      message: `${notifications.length} notificações de teste criadas`,
      count: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        type: n.type,
        priority: n.priority
      }))
    });

  } catch (error) {
    console.error('Erro ao criar notificações de teste:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
