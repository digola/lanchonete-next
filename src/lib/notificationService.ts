import { prisma } from './prisma';
import { NotificationType, NotificationPriority } from '@/types';

/**
 * Parâmetros para criação de uma notificação.
 * userId ausente indica notificação global (visível para todos).
 */
export interface CreateNotificationParams {
  userId?: string; // null = notificação global
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  data?: any;
  expiresAt?: Date;
}

/**
 * Serviço de notificação baseado em Prisma.
 *
 * Responsável por criar notificações de diferentes tipos e prioridades,
 * além de utilitários para limpeza de expirações e estatísticas agregadas.
 */
export class NotificationService {
  /**
   * Cria uma nova notificação com suporte a:
   * - Escopo global (sem userId) ou por usuário
   * - Tipos e prioridades
   * - Payload adicional (data) serializado em JSON
   * - Expiração opcional (expiresAt)
   */
  static async create(params: CreateNotificationParams) {
    try {
      const clientAny = prisma as any;
      if (clientAny.notification && typeof clientAny.notification.create === 'function') {
        const notification = await clientAny.notification.create({
          data: {
            ...(params.userId && { userId: params.userId }),
            title: params.title,
            message: params.message,
            type: params.type,
            priority: params.priority || NotificationPriority.NORMAL,
            data: params.data ? JSON.stringify(params.data) : null,
            ...(params.expiresAt && { expiresAt: params.expiresAt })
          }
        });

        return notification;
      }

      console.warn('Modelo notification não disponível no schema atual. Simulando criação.');
      return {
        id: `stub-${Date.now()}`,
        title: params.title,
        message: params.message,
        type: params.type,
        priority: params.priority || NotificationPriority.NORMAL,
        isActive: true,
      } as any;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Notificação de novo pedido recebido.
   * Inclui mesa e/ou nome do cliente quando disponíveis.
   */
  static async notifyNewOrder(orderId: string, customerName?: string, tableNumber?: number) {
    const title = 'Novo Pedido Recebido';
    const message = tableNumber 
      ? `Pedido #${orderId} da Mesa ${tableNumber}${customerName ? ` (${customerName})` : ''}`
      : `Pedido #${orderId}${customerName ? ` de ${customerName}` : ''}`;

    return this.create({
      title,
      message,
      type: NotificationType.ORDER,
      priority: NotificationPriority.HIGH,
      data: { orderId, customerName, tableNumber }
    });
  }

  /**
   * Notificação de pedido pronto para entrega.
   */
  static async notifyOrderReady(orderId: string, tableNumber?: number) {
    const title = 'Pedido Pronto';
    const message = tableNumber 
      ? `Pedido #${orderId} da Mesa ${tableNumber} está pronto para entrega`
      : `Pedido #${orderId} está pronto para entrega`;

    return this.create({
      title,
      message,
      type: NotificationType.ORDER,
      priority: NotificationPriority.HIGH,
      data: { orderId, tableNumber }
    });
  }

  /**
   * (Removido) Notificações relacionadas a estoque.
   * As funcionalidades de estoque foram descontinuadas e removidas do sistema.
   */

  /**
   * Notificação de pagamento recebido.
   */
  static async notifyPaymentReceived(orderId: string, amount: number, method: string) {
    return this.create({
      title: 'Pagamento Recebido',
      message: `Pagamento de R$ ${amount.toFixed(2)} via ${method} recebido para o pedido #${orderId}`,
      type: NotificationType.PAYMENT,
      priority: NotificationPriority.NORMAL,
      data: { orderId, amount, method }
    });
  }

  /**
   * Notificação de novo usuário cadastrado.
   */
  static async notifyNewUser(userId: string, userName: string, userRole: string) {
    return this.create({
      title: 'Novo Usuário Cadastrado',
      message: `${userName} foi cadastrado como ${userRole}`,
      type: NotificationType.USER,
      priority: NotificationPriority.NORMAL,
      data: { userId, userName, userRole }
    });
  }

  /**
   * Notificação de mesa ocupada.
   */
  static async notifyTableOccupied(tableNumber: number, customerName?: string) {
    return this.create({
      title: 'Mesa Ocupada',
      message: `Mesa ${tableNumber} foi ocupada${customerName ? ` por ${customerName}` : ''}`,
      type: NotificationType.TABLE,
      priority: NotificationPriority.NORMAL,
      data: { tableNumber, customerName }
    });
  }

  /**
   * Notificação de mesa liberada e disponível.
   */
  static async notifyTableFreed(tableNumber: number) {
    return this.create({
      title: 'Mesa Liberada',
      message: `Mesa ${tableNumber} foi liberada e está disponível`,
      type: NotificationType.TABLE,
      priority: NotificationPriority.LOW,
      data: { tableNumber }
    });
  }

  /**
   * Notificação genérica do sistema com prioridade configurável.
   */
  static async notifySystem(message: string, priority: NotificationPriority = NotificationPriority.NORMAL) {
    return this.create({
      title: 'Notificação do Sistema',
      message,
      type: NotificationType.SYSTEM,
      priority
    });
  }

  /**
   * Marca como inativas as notificações que ultrapassaram a data de expiração.
   * Retorna a quantidade de registros afetados.
   */
  static async cleanExpiredNotifications() {
    try {
      const clientAny = prisma as any;
      if (clientAny.notification && typeof clientAny.notification.updateMany === 'function') {
        const result = await clientAny.notification.updateMany({
          where: {
            expiresAt: {
              lt: new Date()
            },
            isActive: true
          },
          data: {
            isActive: false
          }
        });

        if (result.count > 0) {
          console.log(`🧹 ${result.count} notificações expiradas foram removidas`);
        }

        return result.count;
      }

      console.warn('Modelo notification não disponível no schema atual. Nenhuma limpeza realizada.');
      return 0;
    } catch (error) {
      console.error('Erro ao limpar notificações expiradas:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de notificações ativas:
   * - total
   * - não lidas
   * - agrupamento por tipo
   * - agrupamento por prioridade
   */
  static async getNotificationStats() {
    try {
      const clientAny = prisma as any;
      if (
        clientAny.notification &&
        typeof clientAny.notification.count === 'function' &&
        typeof clientAny.notification.groupBy === 'function'
      ) {
        const [total, unread, byType, byPriority] = await Promise.all([
          clientAny.notification.count({
            where: { isActive: true }
          }),
          clientAny.notification.count({
            where: { isActive: true, isRead: false }
          }),
          clientAny.notification.groupBy({
            by: ['type'],
            where: { isActive: true },
            _count: { type: true }
          }),
          clientAny.notification.groupBy({
            by: ['priority'],
            where: { isActive: true },
            _count: { priority: true }
          })
        ]);

        return {
          total,
          unread,
          byType: byType.reduce((acc: Record<string, number>, item: { type: string; _count: { type: number } }) => {
            acc[item.type] = item._count.type;
            return acc;
          }, {} as Record<string, number>),
          byPriority: byPriority.reduce((acc: Record<string, number>, item: { priority: string; _count: { priority: number } }) => {
            acc[item.priority] = item._count.priority;
            return acc;
          }, {} as Record<string, number>)
        };
      }

      console.warn('Modelo notification não disponível no schema atual. Retornando estatísticas vazias.');
      return {
        total: 0,
        unread: 0,
        byType: {},
        byPriority: {},
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de notificações:', error);
      throw error;
    }
  }
}
