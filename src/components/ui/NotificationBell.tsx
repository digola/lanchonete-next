'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertCircle, ShoppingBag, Package, CreditCard, Users, Settings } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification, NotificationType, NotificationPriority } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { Button } from './Button';
import { Badge } from './Badge';

interface NotificationBellProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case NotificationType.ORDER:
      return ShoppingBag;
    case NotificationType.STOCK:
      return Package;
    case NotificationType.PAYMENT:
      return CreditCard;
    case NotificationType.USER:
      return Users;
    case NotificationType.SYSTEM:
      return Settings;
    default:
      return AlertCircle;
  }
};

const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case NotificationPriority.LOW:
      return 'text-gray-500';
    case NotificationPriority.NORMAL:
      return 'text-blue-500';
    case NotificationPriority.HIGH:
      return 'text-orange-500';
    case NotificationPriority.URGENT:
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const getPriorityBgColor = (priority: NotificationPriority) => {
  switch (priority) {
    case NotificationPriority.LOW:
      return 'bg-gray-50';
    case NotificationPriority.NORMAL:
      return 'bg-blue-50';
    case NotificationPriority.HIGH:
      return 'bg-orange-50';
    case NotificationPriority.URGENT:
      return 'bg-red-50';
    default:
      return 'bg-gray-50';
  }
};

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotifications({ 
    limit: 10,
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleRemoveNotification = async (notification: Notification) => {
    await removeNotification(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificações
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Carregando...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const priorityColor = getPriorityColor(notification.priority);
                const priorityBgColor = getPriorityBgColor(notification.priority);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Ícone */}
                      <div className={`p-2 rounded-full ${priorityBgColor}`}>
                        <IconComponent className={`h-4 w-4 ${priorityColor}`} />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDateTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(notification)}
                                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                title="Marcar como lida"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveNotification(notification)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Badge de prioridade */}
                        {notification.priority === NotificationPriority.URGENT && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            Urgente
                          </Badge>
                        )}
                        {notification.priority === NotificationPriority.HIGH && (
                          <Badge variant="outline" className="mt-2 text-xs border-orange-500 text-orange-600">
                            Alta
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {unreadCount} não lidas de {notifications.length} total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
