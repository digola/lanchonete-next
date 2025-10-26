'use client';

import { useState, useEffect, useCallback } from 'react';

// Evitar conflito com o tipo global do navegador (Notification)
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

interface UseNotificationsOptions {
  maxNotifications?: number;
  autoRemove?: boolean;
  autoRemoveDelay?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    maxNotifications = 50,
    autoRemove = true,
    autoRemoveDelay = 5000
  } = options;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Solicitar permissão para notificações
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Remover notificação (definido antes para ser usado em addNotification)
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Adicionar notificação
  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Mostrar notificação do navegador se permitido
    if (permission === 'granted' && 'Notification' in window) {
      const browserNotification = new window.Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      };
    }

    // Auto-remover se configurado
    if (autoRemove) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, autoRemoveDelay);
    }
  }, [permission, maxNotifications, autoRemove, autoRemoveDelay, removeNotification]);

  // Marcar como lida
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Limpar todas as notificações
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Verificar permissão ao montar
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(window.Notification.permission);
    }
  }, []);

  return {
    notifications,
    permission,
    requestPermission,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.read).length
  };
}
