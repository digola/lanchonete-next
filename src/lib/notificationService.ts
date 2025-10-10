import { prisma } from './prisma';
import { NotificationType, NotificationPriority } from '@/types';

export interface CreateNotificationParams {
  userId?: string; // null = notificação global
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  data?: any;
  expiresAt?: Date;
}

export class NotificationService {
  /**
   * Criar uma nova notificação
   */
  static async create(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
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
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  /**
   * Notificação de novo pedido
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
   * Notificação de pedido pronto
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
   * Notificação de estoque baixo
   */
  static async notifyLowStock(productId: string, productName: string, currentStock: number, minStock: number) {
    return this.create({
      title: 'Estoque Baixo',
      message: `${productName} está com estoque baixo (${currentStock} unidades, mínimo: ${minStock})`,
      type: NotificationType.STOCK,
      priority: NotificationPriority.HIGH,
      data: { productId, productName, currentStock, minStock }
    });
  }

  /**
   * Notificação de estoque zerado
   */
  static async notifyOutOfStock(productId: string, productName: string) {
    return this.create({
      title: 'Produto Sem Estoque',
      message: `${productName} está sem estoque e foi marcado como indisponível`,
      type: NotificationType.STOCK,
      priority: NotificationPriority.URGENT,
      data: { productId, productName }
    });
  }

  /**
   * Notificação de pagamento recebido
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
   * Notificação de novo usuário
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
   * Notificação de mesa ocupada
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
   * Notificação de mesa liberada
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
   * Notificação de sistema
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
   * Limpar notificações expiradas
   */
  static async cleanExpiredNotifications() {
    try {
      const result = await prisma.notification.updateMany({
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
    } catch (error) {
      console.error('Erro ao limpar notificações expiradas:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de notificações
   */
  static async getNotificationStats() {
    try {
      const [total, unread, byType, byPriority] = await Promise.all([
        prisma.notification.count({
          where: { isActive: true }
        }),
        prisma.notification.count({
          where: { isActive: true, isRead: false }
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { isActive: true },
          _count: { type: true }
        }),
        prisma.notification.groupBy({
          by: ['priority'],
          where: { isActive: true },
          _count: { priority: true }
        })
      ]);

      return {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority] = item._count.priority;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de notificações:', error);
      throw error;
    }
  }
}
