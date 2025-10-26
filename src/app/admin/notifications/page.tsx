'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { formatDateTime } from '@/lib/utils';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';

const getNotificationIcon = (type: AppNotification['type']) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertTriangle;
    case 'error':
      return XCircle;
    case 'info':
    default:
      return Info;
  }
};

// Removido: prioridade não existe no hook local

const getTypeColor = (type: AppNotification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-600 bg-green-100';
    case 'warning':
      return 'text-yellow-600 bg-yellow-100';
    case 'error':
      return 'text-red-600 bg-red-100';
    case 'info':
    default:
      return 'text-blue-600 bg-blue-100';
  }
};

export default function NotificationsPage() {
  const [filterType, setFilterType] = useState<'all' | AppNotification['type']>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    addNotification,
    clearAll
  } = useNotifications();

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterRead === 'read' && !notification.read) return false;
    if (filterRead === 'unread' && notification.read) return false;
    return true;
  });

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleRemoveNotification = (notificationId: string) => {
    removeNotification(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRefresh = () => {
    addNotification({
      title: 'Lista atualizada',
      message: 'As notificações locais foram atualizadas.',
      type: 'info'
    });
  };

  const handleCreateTestNotifications = () => {
    const samples: Omit<AppNotification, 'id' | 'timestamp' | 'read'>[] = [
      { title: 'Pedido Confirmado! ✅', message: 'Seu pedido foi confirmado e está sendo preparado.', type: 'success' },
      { title: 'Pedido Saiu para Entrega! 🚚', message: 'Seu pedido saiu para entrega. Chegada estimada em 30 minutos.', type: 'info' },
      { title: 'Atenção ao Estoque!', message: 'Um produto está com estoque baixo.', type: 'warning' },
      { title: 'Erro de Sistema', message: 'Falha ao sincronizar com o servidor.', type: 'error' }
    ];
    samples.forEach(n => addNotification(n));
  };

  const handleCleanupNotifications = () => {
    clearAll();
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
          >
            <Bell className="h-4 w-4 mr-2" />
            Criar Teste
          </Button>
          <Button
            variant="outline"
            onClick={handleCleanupNotifications}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
          >
            <Info className={`h-4 w-4 mr-2`} />
            Atualizar
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="primary"
              onClick={handleMarkAllAsRead}
            >
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
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
                <p className="text-2xl font-bold text-gray-900">{notifications.length - unreadCount}</p>
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
                onChange={(e) => setFilterType(e.target.value as AppNotification['type'] | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos os tipos</option>
                <option value="success">Sucesso</option>
                <option value="info">Informações</option>
                <option value="warning">Avisos</option>
                <option value="error">Erros</option>
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
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type);
                const typeColor = getTypeColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
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
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                               }`}>
                                 {notification.title}
                               </h3>
                              <Badge variant="outline" className="text-xs">
                                {notification.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDateTime(notification.timestamp)}
                            </p>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
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
