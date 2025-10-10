'use client';

import { useState, useEffect } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { UserRole, Order, OrderStatus } from '@/types';
import { OrderDetailsModal } from '@/components/admin/OrderDetailsModal';
import { Calendar } from '@/components/ui/Calendar';
import { useOrdersCalendar } from '@/hooks/useOrdersCalendar';
import { 
  ShoppingBag,
  Search,
  Filter,
  Eye,
  X,
  CheckCircle,
  Clock,
  Package,
  Users,
  Calendar as CalendarIcon,
  ArrowUpDown,
  RefreshCw,
  Download,
  CalendarDays
} from 'lucide-react';

export default function AdminOrdersPage() {
  const { user } = useApiAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'total' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Hook do calendário - só carrega quando estiver no modo calendário
  const {
    ordersByDate,
    selectedDateOrders,
    isLoading: calendarLoading,
    error: calendarError,
    refetch: refetchCalendar,
    selectDate,
    selectedDate,
  } = useOrdersCalendar(undefined, viewMode === 'calendar');

  // Construir URL da API com filtros
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    params.set('limit', '50');
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    if (dateFilter) params.set('date', dateFilter);
    
    return `/api/orders?${params.toString()}`;
  };

  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>(buildApiUrl());

  const orders = ordersResponse?.data || [];

  // Atualizar URL quando filtros mudarem
  useEffect(() => {
    refetchOrders();
  }, [searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

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
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELADO:
        return <X className="h-4 w-4" />;
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
        return 'secondary';
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

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order.id));
    }
  };

  const handleBulkAction = async (action: 'cancel' | 'confirm') => {
    if (selectedOrders.length === 0) return;

    try {
      const token = localStorage.getItem('auth-token');
      
      for (const orderId of selectedOrders) {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            status: action === 'cancel' ? 'CANCELADO' : 'CONFIRMADO'
          })
        });

        if (!response.ok) {
          throw new Error(`Erro ao ${action === 'cancel' ? 'cancelar' : 'confirmar'} pedido ${orderId}`);
        }
      }

      setSelectedOrders([]);
      refetchOrders();
      alert(`${selectedOrders.length} pedidos ${action === 'cancel' ? 'cancelados' : 'confirmados'} com sucesso!`);
    } catch (error) {
      console.error('Erro na ação em massa:', error);
      alert('Erro ao executar ação em massa');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFilter('');
    setSortBy('createdAt');
    setSortOrder('desc');
    selectDate(new Date()); // Limpar seleção do calendário
  };

  const exportOrders = () => {
    const csvContent = [
      ['ID', 'Status', 'Cliente', 'Mesa', 'Total', 'Data', 'Itens'],
      ...orders.map(order => [
        order.id.slice(-8),
        order.status,
        order.user?.name || 'N/A',
        order.table?.number?.toString() || 'Balcão',
        formatCurrency(order.total),
        formatDateTime(order.createdAt),
        order.items?.length || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status do pedido');
      }

      refetchOrders();
      setShowOrderDetails(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  return (
    <ProtectedRoute requiredRole={UserRole.ADMIN}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciamento de Pedidos
            </h1>
            <p className="text-gray-600 mt-1">
              Visualize e gerencie todos os pedidos do sistema
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <div className="flex items-center border border-gray-300 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center"
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                Lista
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                className="flex items-center"
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Calendário
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                refetchOrders();
                refetchCalendar();
              }}
              disabled={ordersLoading || calendarLoading}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(ordersLoading || calendarLoading) ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              onClick={exportOrders}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros e Busca
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por ID do pedido ou nome do cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filtro por Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">Todos</option>
                      <option value={OrderStatus.PENDENTE}>Pendente</option>
                      <option value={OrderStatus.CONFIRMADO}>Confirmado</option>
                      <option value={OrderStatus.PREPARANDO}>Preparando</option>
                      <option value={OrderStatus.PRONTO}>Pronto</option>
                      <option value={OrderStatus.ENTREGUE}>Entregue</option>
                      <option value={OrderStatus.CANCELADO}>Cancelado</option>
                    </select>
                  </div>

                  {/* Filtro por Data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Ordenação */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordenar por
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'total' | 'status')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="createdAt">Data</option>
                      <option value="total">Valor</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ordem
                    </label>
                    <Button
                      variant="outline"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="w-full flex items-center justify-center"
                    >
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Limpar Filtros */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </Button>
                <span className="text-sm text-gray-500">
                  {orders.length} pedidos encontrados
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualização do Calendário */}
        {viewMode === 'calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário */}
            <div className="lg:col-span-1">
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={selectDate}
                ordersData={ordersByDate}
                className="w-full"
              />
            </div>

            {/* Pedidos da Data Selecionada */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Pedidos do Dia
                    {selectedDate && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({selectedDate.toLocaleDateString('pt-BR')})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {calendarLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-gray-200 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : selectedDateOrders.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(order.status)}
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900">
                                    Pedido #{order.id.slice(-8)}
                                  </span>
                                  <Badge variant={getStatusColor(order.status) as any}>
                                    {order.status}
                                  </Badge>
                                  {order.isPaid && (
                                    <Badge variant="success">
                                      Pago
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  <div className="flex items-center space-x-4">
                                    <span className="flex items-center">
                                      <Users className="h-3 w-3 mr-1" />
                                      {order.user?.name || 'Cliente'}
                                    </span>
                                    {order.table && (
                                      <span className="flex items-center">
                                        <Package className="h-3 w-3 mr-1" />
                                        Mesa {order.table.number}
                                      </span>
                                    )}
                                    <span className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {formatDateTime(order.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatCurrency(order.total)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.items?.length || 0} itens
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setShowOrderDetails(true);
                                }}
                                className="flex items-center"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {selectedDate ? 'Nenhum pedido encontrado' : 'Selecione uma data'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {selectedDate 
                          ? 'Não há pedidos para esta data.'
                          : 'Clique em uma data no calendário para ver os pedidos do dia.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Ações em Massa */}
        {selectedOrders.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  {selectedOrders.length} pedidos selecionados
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('confirm')}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('cancel')}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrders([])}
                  >
                    Desmarcar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Pedidos */}
        {viewMode === 'list' && (
          <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Pedidos ({orders.length})
              </CardTitle>
              {orders.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedOrders.length === orders.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-gray-200 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                      selectedOrders.includes(order.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                Pedido #{order.id.slice(-8)}
                              </span>
                              <Badge variant={getStatusColor(order.status) as any}>
                                {order.status}
                              </Badge>
                              {order.isPaid && (
                                <Badge variant="success">
                                  Pago
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {order.user?.name || 'Cliente'}
                                </span>
                                {order.table && (
                                  <span className="flex items-center">
                                    <Package className="h-3 w-3 mr-1" />
                                    Mesa {order.table.number}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDateTime(order.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.items?.length || 0} itens
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'ALL' || dateFilter
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Não há pedidos no sistema ainda.'}
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Modal de Detalhes do Pedido */}
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showOrderDetails}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      </div>
    </ProtectedRoute>
  );
}
