import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { Notification, NotificationType, NotificationPriority } from '@/types';

export interface UseNotificationsOptions {
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em ms
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { 
    limit = 20, 
    type, 
    isRead, 
    enabled = true, 
    autoRefresh = true,
    refreshInterval = 30000 // 30 segundos
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Construir URL com parâmetros
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    
    if (type) params.set('type', type);
    if (isRead !== undefined) params.set('isRead', isRead.toString());
    
    return `/api/notifications?${params.toString()}`;
  }, [limit, type, isRead]);

  const { data, loading: apiLoading, error: apiError, execute } = useApi<{
    data: Notification[];
    unreadCount: number;
    pagination: any;
  }>(enabled ? buildUrl() : '', { immediate: enabled });

  // Atualizar estado quando dados da API mudarem
  useEffect(() => {
    if (data) {
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
      setError(null);
    }
  }, [data]);

  useEffect(() => {
    if (apiError) {
      setError(apiError);
    }
  }, [apiError]);

  useEffect(() => {
    setLoading(apiLoading);
  }, [apiLoading]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    const interval = setInterval(() => {
      execute();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, enabled, refreshInterval, execute]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isRead: true }),
      });

      if (response.ok) {
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      return false;
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
        return result.count;
      }
      return 0;
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      return 0;
    }
  }, []);

  // Remover notificação
  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remover do estado local
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        // Atualizar contador se não estava lida
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
      return false;
    }
  }, [notifications]);

  // Criar notificação (para admin)
  const createNotification = useCallback(async (notificationData: {
    userId?: string;
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    data?: any;
    expiresAt?: Date;
  }) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (response.ok) {
        const result = await response.json();
        // Adicionar ao estado local se for para o usuário atual
        if (!notificationData.userId) {
          setNotifications(prev => [result.data, ...prev]);
          if (result.data.priority === 'urgent' || result.data.priority === 'high') {
            setUnreadCount(prev => prev + 1);
          }
        }
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  }, []);

  // Estatísticas das notificações
  const getStats = useCallback((): NotificationStats => {
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let unread = 0;

    notifications.forEach(notification => {
      // Por tipo
      byType[notification.type] = (byType[notification.type] || 0) + 1;
      
      // Por prioridade
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
      
      // Não lidas
      if (!notification.isRead) {
        unread++;
      }
    });

    return {
      total: notifications.length,
      unread,
      byType,
      byPriority
    };
  }, [notifications]);

  const refetch = useCallback(() => {
    if (enabled) {
      execute();
    }
  }, [enabled, execute]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    createNotification,
    getStats,
    refetch
  };
}