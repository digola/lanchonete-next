'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  Menu, 
  Bell, 
  ShoppingCart, 
  User,
  LogOut,
  Settings,
  Home,
  X,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function CustomerHeader() {
  const { user, logout, getRoleLabel, getUserDisplayName } = useApiAuth();
  const { totalItems } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const handleNotificationItemClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const formatNotificationTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Navegação Principal */}
          <div className="flex items-center space-x-4">
            <Link href="/customer/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Lanchonete</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/customer/dashboard" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/customer/orders" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Meus Pedidos
              </Link>
              <Link 
                href="/customer/cart" 
                className="text-gray-600 hover:text-primary-600 transition-colors"
              >
                Cardápio
              </Link>
            </nav>
          </div>

          {/* Ações do Usuário */}
          <div className="flex items-center space-x-4">
            {/* Carrinho Detalhado */}
            {totalItems > 0 && (
              <Link href="/cart" className="relative inline-block">
                <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">Carrinho</span>
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                </button>
              </Link>
            )}

            {/* Notificações */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNotificationClick}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  size="sm"
                  className="absolute -top-2 -right-2 min-w-[20px] h-5 flex items-center justify-center"
                >
                    {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
                )}
              </Button>

              {/* Dropdown de Notificações */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">Notificações</h3>
                    <div className="flex items-center space-x-2">
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Marcar todas como lidas
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Notificações */}
                  {notifications.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                            notification.isRead 
                              ? 'border-transparent bg-white' 
                              : 'border-primary-500 bg-primary-50'
                          }`}
                          onClick={() => handleNotificationItemClick(notification.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatNotificationTime(notification.timestamp)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1 ml-2"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Nenhuma notificação</p>
                    </div>
                  )}

                  {/* Botão de Demo (apenas para desenvolvimento) */}
                  <div className="border-t border-gray-100 px-4 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead()}
                      className="w-full text-xs text-gray-600 hover:text-gray-800"
                    >
                      Marcar todas como lidas
            </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu do Usuário */}
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleLabel()}
                  </p>
                </div>
              </Button>

              {/* Dropdown do Usuário */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/customer/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Meu Perfil
                  </Link>
                  <Link
                    href="/customer/orders"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-3" />
                    Meus Pedidos
                  </Link>
                  <Link
                    href="/customer/cart"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Home className="h-4 w-4 mr-3" />
                    Cardápio
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
