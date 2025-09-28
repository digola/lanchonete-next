'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiAuth } from './useApiAuth';

export interface Notification {
  id: string;
  type: 'order_update' | 'order_new' | 'system';
  title: string;
  message: string;
  orderId?: string;
  timestamp: Date;
  isRead: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
}

const NOTIFICATION_STORAGE_KEY = 'lanchonete-notifications';

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
  });
  
  const { user, isAuthenticated } = useApiAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOrderCountRef = useRef<number>(0);

  // Carregar notificações do localStorage
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadNotifications();
    }
  }, [isAuthenticated, user?.id]);

  // Monitorar mudanças nos pedidos
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      startOrderMonitoring();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, user?.id]);

  const loadNotifications = useCallback(() => {
    try {
      const saved = localStorage.getItem(`${NOTIFICATION_STORAGE_KEY}-${user?.id}`);
      if (saved) {
        const data = JSON.parse(saved);
        const notifications = data.notifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        
        setState({
          notifications,
          unreadCount: notifications.filter((n: Notification) => !n.isRead).length,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  }, [user?.id]);

  const saveNotifications = useCallback((notifications: Notification[]) => {
    if (!user?.id) return;
    
    try {
      localStorage.setItem(
        `${NOTIFICATION_STORAGE_KEY}-${user.id}`,
        JSON.stringify({ notifications })
      );
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
    }
  }, [user?.id]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
    };

    setState(prev => {
      const updated = [newNotification, ...prev.notifications];
      saveNotifications(updated);
      
      return {
        ...prev,
        notifications: updated,
        unreadCount: updated.filter(n => !n.isRead).length,
      };
    });
  }, [saveNotifications]);

  const markAsRead = useCallback((notificationId: string) => {
    setState(prev => {
      const updated = prev.notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      saveNotifications(updated);
      
      return {
        ...prev,
        notifications: updated,
        unreadCount: updated.filter(n => !n.isRead).length,
      };
    });
  }, [saveNotifications]);

  const markAllAsRead = useCallback(() => {
    setState(prev => {
      const updated = prev.notifications.map(n => ({ ...n, isRead: true }));
      saveNotifications(updated);
      
      return {
        ...prev,
        notifications: updated,
        unreadCount: 0,
      };
    });
  }, [saveNotifications]);

  const clearNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0,
    }));
    
    if (user?.id) {
      localStorage.removeItem(`${NOTIFICATION_STORAGE_KEY}-${user.id}`);
    }
  }, [user?.id]);

  const startOrderMonitoring = useCallback(() => {
    // Verificar mudanças nos pedidos a cada 30 segundos
    intervalRef.current = setInterval(async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        const response = await fetch(`/api/orders?customerId=${user.id}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const currentOrderCount = data.total || 0;

          // Se houve mudança no número de pedidos
          if (lastOrderCountRef.current > 0 && currentOrderCount > lastOrderCountRef.current) {
            addNotification({
              type: 'order_new',
              title: 'Novo Pedido Recebido!',
              message: 'Seu pedido foi confirmado e está sendo processado.',
            });
          }

          lastOrderCountRef.current = currentOrderCount;

          // Verificar mudanças de status nos pedidos ativos
          const activeOrders = data.orders?.filter((order: any) => 
            ['PENDENTE', 'CONFIRMADO', 'PREPARANDO'].includes(order.status)
          ) || [];

          for (const order of activeOrders) {
            // Aqui você pode adicionar lógica para detectar mudanças específicas de status
            // Por simplicidade, vamos adicionar uma notificação genérica
          }
        }
      } catch (error) {
        console.error('Erro ao monitorar pedidos:', error);
      }
    }, 30000); // 30 segundos
  }, [isAuthenticated, user?.id, addNotification]);

  // Simular notificações para demonstração
  const addDemoNotification = useCallback(() => {
    const demos = [
      {
        type: 'order_update' as const,
        title: 'Pedido Atualizado!',
        message: 'Seu pedido #123 mudou para "Preparando".',
        orderId: 'demo-123',
      },
      {
        type: 'system' as const,
        title: 'Promoção Especial!',
        message: 'Desconto de 20% em todas as bebidas hoje!',
      },
    ];

    const randomDemo = demos[Math.floor(Math.random() * demos.length)];
    if (randomDemo) {
      addNotification(randomDemo);
    }
  }, [addNotification]);

  return {
    // Estado
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    
    // Ações
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addDemoNotification, // Para testes
  };
};