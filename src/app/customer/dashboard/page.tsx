'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderCard } from '@/components/OrderCard';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  ShoppingBag,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  User
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';

export default function CustomerDashboard() {
  const { user, getUserDisplayName } = useApiAuth();
  
  // Buscar pedidos recentes do cliente
  const ordersUrl = user?.id ? `/api/orders?customerId=${user.id}&limit=5&sortBy=createdAt&sortOrder=desc` : '';
  const { data: ordersResponse, loading: ordersLoading } = useApi<{ data: Order[]; pagination: any }>(ordersUrl);

  const recentOrders = ordersResponse?.data || [];

  // Estatísticas dos pedidos
  const stats = {
    totalOrders: recentOrders.length,
    pendingOrders: recentOrders.filter(order => order.status === OrderStatus.PENDENTE).length,
    completedOrders: recentOrders.filter(order => order.status === OrderStatus.ENTREGUE).length,
    totalSpent: recentOrders.reduce((sum, order) => sum + order.total, 0),
  };

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

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pedidos Concluídos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/">
              <Button variant="outline" className="w-full justify-start">
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
              <Button variant="primary" size="sm" className="w-full">
                Editar Perfil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos Recentes */}
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
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
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
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Você ainda não fez nenhum pedido. Que tal fazer seu primeiro pedido?
              </p>
              <Link href="/">
                <Button variant="primary">
                  Fazer Pedido
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
