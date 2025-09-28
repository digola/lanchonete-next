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
  Users,
  ShoppingBag,
  Package,
  Folder,
  Table,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Eye,
  Edit,
  Plus,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Order, OrderStatus, Product, Category, User, Table as TableType, TableStatus } from '@/types';

export default function AdminDashboard() {
  const { user, getUserDisplayName } = useApiAuth();
  
  // Buscar dados para o dashboard
  const ordersUrl = '/api/orders?limit=10&sortBy=createdAt&sortOrder=desc';
  const { data: ordersResponse, loading: ordersLoading } = useApi<{ data: Order[]; pagination: any }>(ordersUrl);

  const productsUrl = '/api/products?limit=5&sortBy=createdAt&sortOrder=desc';
  const { data: productsResponse, loading: productsLoading } = useApi<{ data: Product[]; pagination: any }>(productsUrl);

  const categoriesUrl = '/api/categories';
  const { data: categoriesResponse, loading: categoriesLoading } = useApi<{ data: Category[]; pagination: any }>(categoriesUrl);

  const usersUrl = '/api/users?limit=5&sortBy=createdAt&sortOrder=desc';
  const { data: usersResponse, loading: usersLoading } = useApi<{ data: User[]; pagination: any }>(usersUrl);

  const tablesUrl = '/api/tables';
  const { data: tablesResponse, loading: tablesLoading } = useApi<{ data: TableType[]; pagination: any }>(tablesUrl);

  const recentOrders = ordersResponse?.data || [];
  const recentProducts = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const recentUsers = usersResponse?.data || [];
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

  // Estatísticas dos produtos
  const productStats = {
    total: recentProducts.length,
    active: recentProducts.filter(product => product.isAvailable).length,
    inactive: recentProducts.filter(product => !product.isAvailable).length,
    averagePrice: recentProducts.length > 0 ? recentProducts.reduce((sum, product) => sum + product.price, 0) / recentProducts.length : 0,
  };

  // Estatísticas dos usuários
  const userStats = {
    total: recentUsers.length,
    customers: recentUsers.filter(user => user.role === 'CUSTOMER').length,
    staff: recentUsers.filter(user => user.role === 'STAFF').length,
    admins: recentUsers.filter(user => user.role === 'ADMIN').length,
    active: recentUsers.filter(user => user.isActive).length,
  };

  // Estatísticas das mesas
  const tableStats = {
    total: tables.length,
    free: tables.filter(table => table.status === TableStatus.LIVRE).length,
    occupied: tables.filter(table => table.status === TableStatus.OCUPADA).length,
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
        return <TrendingUp className="h-4 w-4" />;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-600 mt-1">
          Visão geral do sistema e métricas importantes
        </p>
      </div>

      {/* Estatísticas Principais */}
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
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% vs mês anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(orderStats.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +8% vs mês anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +5% vs mês anterior
                </p>
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
                <p className="text-sm font-medium text-gray-600">Produtos Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{productStats.active}</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  -2% vs mês anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Status dos Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pendentes</span>
                </div>
                <span className="font-semibold">{orderStats.pending}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Confirmados</span>
                </div>
                <span className="font-semibold">{orderStats.confirmed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Preparando</span>
                </div>
                <span className="font-semibold">{orderStats.preparing}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Prontos</span>
                </div>
                <span className="font-semibold">{orderStats.ready}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Entregues</span>
                </div>
                <span className="font-semibold">{orderStats.delivered}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status das Mesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Table className="h-5 w-5 mr-2" />
              Status das Mesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Livres</span>
                </div>
                <span className="font-semibold">{tableStats.free}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Ocupadas</span>
                </div>
                <span className="font-semibold">{tableStats.occupied}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Reservadas</span>
                </div>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">Manutenção</span>
                </div>
                <span className="font-semibold">0</span>
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
              <BarChart3 className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/admin/products">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Gerenciar Produtos
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="w-full justify-start">
                <Folder className="h-4 w-4 mr-2" />
                Gerenciar Categorias
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gerenciar Usuários
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ver Todos os Pedidos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <Badge variant="default" className="mt-1">Administrador</Badge>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Categorias:</span>
                <span className="font-medium">{categories.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Produtos:</span>
                <span className="font-medium">{productStats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Mesas:</span>
                <span className="font-medium">{tableStats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Usuários:</span>
                <span className="font-medium">{userStats.total}</span>
              </div>
            </div>
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
          <Link href="/admin/orders">
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
                        {order.user && (
                          <span className="text-sm text-gray-600">
                            {order.user.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <Link href={`/admin/orders/${order.id}`}>
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

      {/* Produtos Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Produtos Recentes
          </CardTitle>
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">
              Ver Todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : recentProducts.length > 0 ? (
            <div className="space-y-4">
              {recentProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">{product.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={product.isAvailable ? 'success' : 'destructive'}>
                          {product.isAvailable ? 'Disponível' : 'Indisponível'}
                        </Badge>
                        {product.category && (
                          <span className="text-xs text-gray-500">
                            {product.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(product.price)}
                      </p>
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Não há produtos cadastrados no sistema.
              </p>
              <Link href="/admin/products">
                <Button variant="primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Produto
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
