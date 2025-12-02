'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  ShoppingBag,
  Clock,
  TrendingUp,
  Package,
  Mail,
  Calendar,
  Eye,
  User
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';

export default function CustomerDashboard() {
  const { user, getUserDisplayName, isAuthenticated, isLoading: authLoading } = useApiAuth();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Buscar pedidos do cliente - memoizado para evitar re-criações
  const loadOrders = useCallback(async () => {
    if (!user?.id || !isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/orders?customerId=${user.id}&limit=10&sortBy=createdAt&sortOrder=desc`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const orders = data.data || [];
        
        // Separar pedidos ativos (em processamento) dos recentes
        const activeOrdersList = orders.filter((order: Order) => 
          [OrderStatus.PENDENTE, OrderStatus.CONFIRMADO, OrderStatus.PREPARANDO].includes(order.status)
        );
        
        setActiveOrders(activeOrdersList);
        setRecentOrders(orders.slice(0, 5)); // Últimos 5 pedidos
        setHasLoaded(true);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    // Só carrega quando a autenticação estiver completa e o usuário estiver disponível
    if (!authLoading && isAuthenticated && user?.id && !hasLoaded) {
      loadOrders();
    }
  }, [authLoading, isAuthenticated, user?.id, hasLoaded, loadOrders]);

  // Estatísticas básicas - memoizadas para evitar recálculos
  const stats = useMemo(() => ({
    totalOrders: recentOrders.length,
    activeOrders: activeOrders.length,
    totalSpent: recentOrders.reduce((sum, order) => sum + order.total, 0),
  }), [recentOrders, activeOrders]);

  // Estado de loading combinado - evita piscar
  const isPageLoading = authLoading || (isLoading && !hasLoaded);

  // Se estiver carregando, mostrar loading
  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {getUserDisplayName()}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Pedidos em Processamento */}
      {activeOrders.length > 0 && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Clock className="h-6 w-6 mr-2" />
              Pedidos em Processamento ({activeOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Pedido #{order.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDateTime(order.createdAt)} • {formatCurrency(order.total)}
                      </p>
                    </div>
                    <Badge variant="warning">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Básicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Processamento</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/">
              <Button variant="primary" className="w-full justify-start">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Fazer Novo Pedido
              </Button>
            </Link>
            <Link href="/customer/orders">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Ver Todos os Pedidos
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Meu Carrinho
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Informações do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  Cliente desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
            </div>

            <Link href="/customer/profile">
              <Button variant="outline" size="sm" className="w-full">
                Editar Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recentes */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pedidos Recentes
            </CardTitle>
            <Link href="/customer/orders">
              <Button variant="ghost" size="sm">
                Ver Todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          Pedido #{order.id.slice(-8)}
                        </span>
                        <Badge 
                          variant={order.status === OrderStatus.ENTREGUE ? 'success' : 
                                   order.status === OrderStatus.PENDENTE ? 'warning' : 'default'}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <Link href={`/customer/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          Detalhes ({order.table ? `Mesa ${order.table.number}` : 'Balcão'})
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
