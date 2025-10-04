'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType, NotificationPriority } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  AlertCircle,
  ShoppingBag,
  Package,
  CreditCard,
  Users,
  Settings,
  RefreshCw
} from 'lucide-react';

const getNotificationIcon = (type: NotificationType) => {
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
      return 'text-gray-500 bg-gray-100';
    case NotificationPriority.NORMAL:
      return 'text-blue-500 bg-blue-100';
    case NotificationPriority.HIGH:
      return 'text-orange-500 bg-orange-100';
    case NotificationPriority.URGENT:
      return 'text-red-500 bg-red-100';
    default:
      return 'text-gray-500 bg-gray-100';
  }
};

const getTypeColor = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ORDER:
      return 'text-green-600 bg-green-100';
    case NotificationType.STOCK:
      return 'text-yellow-600 bg-yellow-100';
    case NotificationType.PAYMENT:
      return 'text-purple-600 bg-purple-100';
    case NotificationType.USER:
      return 'text-indigo-600 bg-indigo-100';
    case NotificationType.SYSTEM:
      return 'text-gray-600 bg-gray-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');

  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    refetch,
    getStats
  } = useNotifications({ 
    limit: 50,
    autoRefresh: true,
    refreshInterval: 30000
  });

  const stats = getStats();

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterRead === 'read' && !notification.isRead) return false;
    if (filterRead === 'unread' && notification.isRead) return false;
    return true;
  });

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleRemoveNotification = async (notificationId: string) => {
    await removeNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleCreateTestNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'all' }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.message}`);
        refetch(); // Atualizar a lista
      } else {
        alert('Erro ao criar notificações de teste');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar notificações de teste');
    }
  };

  const handleCleanupNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        refetch(); // Atualizar a lista
      } else {
        alert('Erro ao limpar notificações');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao limpar notificações');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-gray-600">
            Gerencie suas notificações e alertas do sistema
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleCreateTestNotifications}
            disabled={loading}
          >
            <Bell className="h-4 w-4 mr-2" />
            Criar Teste
          </Button>
          <Button
            variant="outline"
            onClick={handleCleanupNotifications}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="primary"
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Não lidas</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Lidas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total - unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byPriority[NotificationPriority.URGENT] || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos os tipos</option>
                <option value={NotificationType.ORDER}>Pedidos</option>
                <option value={NotificationType.STOCK}>Estoque</option>
                <option value={NotificationType.PAYMENT}>Pagamento</option>
                <option value={NotificationType.USER}>Usuários</option>
                <option value={NotificationType.SYSTEM}>Sistema</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as 'all' | 'read' | 'unread')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todas</option>
                <option value="unread">Não lidas</option>
                <option value="read">Lidas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificações */}
      <Card>
        <CardHeader>
          <CardTitle>
            Notificações ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-2">Carregando notificações...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const priorityColor = getPriorityColor(notification.priority);
                const typeColor = getTypeColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Ícone */}
                      <div className={`p-2 rounded-full ${typeColor}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              <Badge className={`text-xs ${priorityColor}`}>
                                {notification.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDateTime(notification.createdAt)}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.isRead && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Marcar como lida
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveNotification(notification.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
