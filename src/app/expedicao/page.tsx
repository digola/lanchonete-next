'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi, useTables } from '@/hooks/useApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order, OrderStatus, UserRole, Table, TableStatus } from '@/types';
import { 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  Calendar,
  ShoppingBag,
  Users,
  BarChart3,
  RefreshCw,
  CheckCircle,
  Clock,
  X,
  ArrowRight,
  ArrowLeft,
  Table as TableIcon,
  UserCheck,
  ExternalLink,
  Mail,
  Shield,
  Edit,
  Lock
} from 'lucide-react';

export default function ExpedicaoPage() {
  const { user } = useApiAuth();
  const router = useRouter();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'tables' | 'profile'>('orders');

  // Buscar pedidos ativos
  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>('/api/orders?includeItems=true&includeUser=true&sortBy=createdAt&sortOrder=desc');

  // Buscar mesas
  const { data: tablesResponse, loading: tablesLoading, execute: refetchTables } = useTables({
    includeAssignedUser: true
  });


  const orders = ordersResponse?.data || [];
  const tables = tablesResponse?.data || [];
  
  // Filtrar apenas pedidos ativos
  const activeOrders = orders.filter(order => 
    [OrderStatus.PENDENTE, OrderStatus.CONFIRMADO, OrderStatus.PREPARANDO, OrderStatus.PRONTO].includes(order.status)
  );

  // Filtrar por tipo de pedido
  const filteredOrders = activeOrders.filter(order => {
    if (filterType === 'all') return true;
    if (filterType === 'delivery') return order.deliveryType === 'DELIVERY';
    if (filterType === 'pickup') return order.deliveryType === 'RETIRADA';
    return true;
  });

  // Estatísticas calculadas
  const stats = {
    totalOrders: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === OrderStatus.PENDENTE).length,
    confirmed: filteredOrders.filter(o => o.status === OrderStatus.CONFIRMADO).length,
    preparing: filteredOrders.filter(o => o.status === OrderStatus.PREPARANDO).length,
    ready: filteredOrders.filter(o => o.status === OrderStatus.PRONTO).length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    delivery: filteredOrders.filter(o => o.deliveryType === 'DELIVERY').length,
    pickup: filteredOrders.filter(o => o.deliveryType === 'RETIRADA').length,
    // Estatísticas das mesas
    totalTables: tables.length,
    freeTables: tables.filter((t: Table) => t.status === TableStatus.LIVRE).length,
    occupiedTables: tables.filter((t: Table) => t.status === TableStatus.OCUPADA).length,
    assignedTables: tables.filter((t: Table) => t.assignedTo).length
  };

  // Função para avançar status do pedido automaticamente
  const advanceOrderStatus = async (orderId: string, currentStatus: OrderStatus) => {
    if (!user) return;
    
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;
    
    try {
      setUpdatingOrderId(orderId);
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Atualizar a lista de pedidos
        await refetchOrders();
        console.log('Status atualizado com sucesso:', data.message);
      } else {
        console.error('Erro ao atualizar status do pedido:', data.error || 'Erro desconhecido');
        // Aqui você pode adicionar uma notificação de erro para o usuário
        alert(`Erro: ${data.error || 'Não foi possível atualizar o status do pedido'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE: return 'bg-gray-100 text-gray-800';
      case OrderStatus.CONFIRMADO: return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARANDO: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PRONTO: return 'bg-green-100 text-green-800';
      case OrderStatus.ENTREGUE: return 'bg-blue-100 text-blue-800';
      case OrderStatus.CANCELADO: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE: return 'Pendente';
      case OrderStatus.CONFIRMADO: return 'Confirmado';
      case OrderStatus.PREPARANDO: return 'Preparando';
      case OrderStatus.PRONTO: return 'Pronto';
      case OrderStatus.ENTREGUE: return 'Entregue';
      case OrderStatus.CANCELADO: return 'Cancelado';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case OrderStatus.PENDENTE: return OrderStatus.CONFIRMADO;
      case OrderStatus.CONFIRMADO: return OrderStatus.PREPARANDO;
      case OrderStatus.PREPARANDO: return OrderStatus.PRONTO;
      case OrderStatus.PRONTO: return OrderStatus.ENTREGUE;
      default: return null;
    }
  };

  const getNextStatusLabel = (currentStatus: OrderStatus): string => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusLabel(nextStatus) : 'Finalizado';
  };

  const getButtonText = (currentStatus: OrderStatus): string => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return 'Entregue ✓';
    
    switch (currentStatus) {
      case OrderStatus.PENDENTE: return 'Confirmar Pedido';
      case OrderStatus.CONFIRMADO: return 'Iniciar Preparo';
      case OrderStatus.PREPARANDO: return 'Marcar Pronto';
      case OrderStatus.PRONTO: return 'Marcar Entregue';
      default: return 'Avançar';
    }
  };

  const getButtonColor = (currentStatus: OrderStatus): string => {
    switch (currentStatus) {
      case OrderStatus.PENDENTE: return 'bg-blue-600 hover:bg-blue-700';
      case OrderStatus.CONFIRMADO: return 'bg-yellow-600 hover:bg-yellow-700';
      case OrderStatus.PREPARANDO: return 'bg-orange-600 hover:bg-orange-700';
      case OrderStatus.PRONTO: return 'bg-green-600 hover:bg-green-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };




  // Buscar pedidos ativos das mesas ocupadas
  const getTableOrders = (tableId: string) => {
    return orders.filter(order => 
      order.tableId === tableId && 
      [OrderStatus.PENDENTE, OrderStatus.CONFIRMADO, OrderStatus.PREPARANDO, OrderStatus.PRONTO].includes(order.status)
    );
  };

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE: return 'bg-green-100 text-green-800';
      case TableStatus.OCUPADA: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableStatusLabel = (status: TableStatus) => {
    switch (status) {
      case TableStatus.LIVRE: return 'Livre';
      case TableStatus.OCUPADA: return 'Ocupada';
      default: return status;
    }
  };

  return (
    <ProtectedRoute requiredRoles={[UserRole.STAFF, UserRole.MANAGER]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Expedição
            </h1>
            <p className="text-gray-600">
              Gerencie pedidos, mesas e controle a expedição
            </p>
          </div>

          {/* Abas */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-2" />
                  Pedidos ({stats.totalOrders})
                </button>
                <button
                  onClick={() => setActiveTab('tables')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'tables'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TableIcon className="h-4 w-4 inline mr-2" />
                  Mesas ({stats.totalTables})
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Perfil
                </button>
              </nav>
            </div>
          </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'orders' && (
          <>
            {/* Estatísticas dos Pedidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Preparando</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.preparing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Prontos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ready}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros de Tipo */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">Filtrar por tipo:</h3>
              <div className="flex space-x-2">
                <Button
                  variant={filterType === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  Todos ({stats.delivery + stats.pickup})
                </Button>
                <Button
                  variant={filterType === 'delivery' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('delivery')}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Delivery ({stats.delivery})
                </Button>
                <Button
                  variant={filterType === 'pickup' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('pickup')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Retirada ({stats.pickup})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              Pedidos Ativos {filterType !== 'all' && `(${filterType === 'delivery' ? 'Delivery' : 'Retirada'})`}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pedido #{order.id.slice(-8)}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatDateTime(order.createdAt)} • {formatCurrency(order.total)}
                        </p>
                      </div>
                      
                      {/* Botão de ação principal */}
                      <div className="ml-4">
                        {getNextStatus(order.status) ? (
                          <Button
                            className={`${getButtonColor(order.status)} text-white font-medium`}
                            onClick={() => advanceOrderStatus(order.id, order.status)}
                            disabled={updatingOrderId === order.id}
                          >
                            {updatingOrderId === order.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Atualizando...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                {getButtonText(order.status)}
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium">
                            <CheckCircle className="h-4 w-4 mr-2 inline" />
                            Finalizado
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{order.user?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {order.deliveryType === 'DELIVERY' ? (
                          <Truck className="h-4 w-4 text-blue-400" />
                        ) : (
                          <Package className="h-4 w-4 text-green-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'}
                        </span>
                      </div>
                    </div>

                    {/* Informações específicas de delivery */}
                    {order.deliveryType === 'DELIVERY' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Truck className="h-5 w-5 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Informações de Delivery</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-700">
                              {order.deliveryAddress || 'Endereço não informado'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-700">
                              Contato via app
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {order.items && order.items.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Itens do Pedido:</h4>
                        <div className="flex flex-wrap gap-2">
                          {order.items.slice(0, 4).map((item, index) => (
                            <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {item.product?.name || 'Produto'} x{item.quantity}
                            </span>
                          ))}
                          {order.items.length > 4 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              +{order.items.length - 4} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Indicador do próximo status */}
                    {getNextStatus(order.status) && (
                      <div className="text-sm text-gray-500">
                        Próximo: <span className="font-medium">{getNextStatusLabel(order.status)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum pedido ativo
                </h3>
                <p className="text-gray-600">
                  Não há pedidos em andamento no momento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}

        {/* Seção de Mesas */}
        {activeTab === 'tables' && (
          <>
            {/* Estatísticas das Mesas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TableIcon className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Mesas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTables}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Livres</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.freeTables}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ocupadas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.occupiedTables}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <UserCheck className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Atribuídas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.assignedTables}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Mesas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">Gerenciamento de Mesas</CardTitle>
                <Button variant="outline" size="sm" onClick={() => refetchTables()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent>
                {tablesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : tables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tables.map((table: Table) => (
                      <div key={table.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <TableIcon className="h-6 w-6 text-gray-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Mesa #{table.number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Capacidade: {table.capacity} pessoas
                              </p>
                            </div>
                          </div>
                          <Badge className={getTableStatusColor(table.status)}>
                            {getTableStatusLabel(table.status)}
                          </Badge>
                        </div>

                        {table.assignedUser && (
                          <div className="mb-3 p-2 bg-blue-50 rounded">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-sm text-blue-800">
                                Atribuída para: {table.assignedUser.name}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Pedidos ativos da mesa */}
                        {table.status === TableStatus.OCUPADA && (
                          <div className="mb-3">
                            {getTableOrders(table.id).length > 0 ? (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">Pedidos Ativos:</h4>
                                {getTableOrders(table.id).map((order) => (
                                  <div key={order.id} className="p-2 bg-gray-50 rounded text-sm">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">Pedido #{order.id.slice(-8)}</span>
                                      <Badge className={getStatusColor(order.status)}>
                                        {getStatusLabel(order.status)}
                                      </Badge>
                                    </div>
                                    <div className="text-gray-600">
                                      {formatCurrency(order.total)} • {order.items?.length || 0} itens
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                Nenhum pedido ativo
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex space-x-2 flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/?tableId=${table.id}`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Gerenciar Mesa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TableIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma mesa encontrada
                    </h3>
                    <p className="text-gray-600">
                      Não há mesas cadastradas no sistema.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Seção de Perfil */}
        {activeTab === 'profile' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Meu Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Informações do usuário */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                      <p className="text-gray-600">{user?.email}</p>
                      <Badge className="mt-1">
                        {user?.role === 'STAFF' ? 'Staff' : user?.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
                      </Badge>
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Informações Pessoais</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Nome</p>
                            <p className="font-medium">{user?.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Função</p>
                            <p className="font-medium">
                              {user?.role === 'STAFF' ? 'Staff' : user?.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900">Informações da Conta</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Membro desde</p>
                            <p className="font-medium">
                              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className="font-medium text-green-600">Ativo</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="flex space-x-4">
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </Button>
                      <Button variant="outline">
                        <Lock className="h-4 w-4 mr-2" />
                        Alterar Senha
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

