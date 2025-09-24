'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  ShoppingBag,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Package,
  Users,
  User,
  Calendar,
  Eye,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Order, OrderStatus, Table, TableStatus } from '@/types';

export default function StaffDashboard() {
  const { user, getUserDisplayName } = useApiAuth();
  
  // Buscar pedidos recentes
  const ordersUrl = '/api/orders?limit=10&sortBy=createdAt&sortOrder=desc';
  const { data: ordersResponse, loading: ordersLoading } = useApi<{ data: Order[]; pagination: any }>(ordersUrl);

  // Buscar mesas
  const tablesUrl = '/api/tables';
  const { data: tablesResponse, loading: tablesLoading } = useApi<{ data: Table[]; pagination: any }>(tablesUrl);

  const recentOrders = ordersResponse?.data || [];
  const tables = tablesResponse?.data || [];

  // Estatísticas dos pedidos
  const orderStats = {
    total: recentOrders.length,
    pending: recentOrders.filter(order => order.status === OrderStatus.PENDENTE).length,
    confirmed: recentOrders.filter(order => order.status === OrderStatus.CONFIRMADO).length,
    preparing: recentOrders.filter(order => order.status === OrderStatus.PREPARANDO).length,
    ready: recentOrders.filter(order => order.status === OrderStatus.PRONTO).length,
    delivered: recentOrders.filter(order => order.status === OrderStatus.ENTREGUE).length,
    cancelled: recentOrders.filter(order => order.status === OrderStatus.CANCELADO).length,
    totalRevenue: recentOrders.reduce((sum, order) => sum + order.total, 0),
  };

  // Estatísticas das mesas
  const tableStats = {
    total: tables.length,
    free: tables.filter(table => table.status === TableStatus.LIVRE).length,
    occupied: tables.filter(table => table.status === TableStatus.OCUPADA).length,
    reserved: tables.filter(table => table.status === TableStatus.RESERVADA).length,
    maintenance: tables.filter(table => table.status === TableStatus.MANUTENCAO).length,
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.CONFIRMADO:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.PREPARANDO:
        return <Package className="h-4 w-4" />;
      case OrderStatus.PRONTO:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.ENTREGUE:
        return <Star className="h-4 w-4" />;
      case OrderStatus.CANCELADO:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return 'warning';
      case OrderStatus.CONFIRMADO:
        return 'info';
      case OrderStatus.PREPARANDO:
        return 'info';
      case OrderStatus.PRONTO:
        return 'success';
      case OrderStatus.ENTREGUE:
        return 'success';
      case OrderStatus.CANCELADO:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE:
        return 'success';
      case TableStatus.OCUPADA:
        return 'destructive';
      case TableStatus.RESERVADA:
        return 'warning';
      case TableStatus.MANUTENCAO:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {getUserDisplayName()}! 👋
        </h1>
        <p className="text-gray-600 mt-1">
          Bem-vindo ao painel de controle da equipe
        </p>
      </div>

      {/* Estatísticas dos Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.total}</p>
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
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Preparando</p>
                <p className="text-2xl font-bold text-gray-900">{orderStats.preparing}</p>
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
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(orderStats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas das Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Mesas</p>
                <p className="text-2xl font-bold text-gray-900">{tableStats.total}</p>
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
                <p className="text-sm font-medium text-gray-600">Mesas Livres</p>
                <p className="text-2xl font-bold text-gray-900">{tableStats.free}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mesas Ocupadas</p>
                <p className="text-2xl font-bold text-gray-900">{tableStats.occupied}</p>
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
                <p className="text-sm font-medium text-gray-600">Reservadas</p>
                <p className="text-2xl font-bold text-gray-900">{tableStats.reserved}</p>
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
              <Activity className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/staff/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Gerenciar Pedidos
              </Button>
            </Link>
            <Link href="/staff/tables">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Mesas
              </Button>
            </Link>
            <Link href="/staff/orders?status=PENDENTE">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Ver Pedidos Pendentes
              </Button>
            </Link>
            <Link href="/staff/tables?status=LIVRE">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ver Mesas Livres
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
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  Funcionário desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
            </div>

            <Link href="/staff/profile">
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
          <Link href="/staff/orders">
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
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          Pedido #{order.id.slice(-8)}
                        </span>
                        <Badge variant={getStatusColor(order.status) as any}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.createdAt)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items?.length || 0} item(s) • {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <Link href={`/staff/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
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
                Não há pedidos recentes para exibir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status das Mesas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Status das Mesas
          </CardTitle>
          <Link href="/staff/tables">
            <Button variant="ghost" size="sm">
              Ver Todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tablesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : tables.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.slice(0, 12).map((table) => (
                <div key={table.id} className="border border-gray-200 rounded-lg p-3 text-center hover:bg-gray-50 transition-colors">
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    Mesa {table.number}
                  </div>
                  <Badge variant={getTableStatusColor(table.status) as any} size="sm">
                    {table.status}
                  </Badge>
                  {table.capacity && (
                    <p className="text-xs text-gray-500 mt-1">
                      {table.capacity} pessoas
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma mesa encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Não há mesas cadastradas no sistema.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
