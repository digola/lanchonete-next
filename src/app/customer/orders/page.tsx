'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { OrderCard } from '@/components/OrderCard';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  Search,
  Filter,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Star,
  Package
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import Link from 'next/link';

export default function CustomerOrdersPage() {
  const { user } = useApiAuth();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'total' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Buscar pedidos do cliente
  const buildOrdersUrl = () => {
    if (!user?.id) return '';
    const params = new URLSearchParams({
      customerId: user.id,
      limit: '20',
      sortBy,
      sortOrder,
    });
    if (selectedStatus !== 'all') params.append('status', selectedStatus);
    if (searchTerm) params.append('search', searchTerm);
    return `/api/orders?${params.toString()}`;
  };

  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>(buildOrdersUrl());

  const orders = ordersResponse?.data || [];
  const pagination = ordersResponse?.pagination;

  // Aplicar filtro de status da URL
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
      setSelectedStatus(statusParam as OrderStatus);
    }
  }, [searchParams]);

  const handleStatusFilter = (status: OrderStatus | 'all') => {
    setSelectedStatus(status);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
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
        return <XCircle className="h-4 w-4" />;
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

  const statusCounts = {
    all: orders.length,
    [OrderStatus.PENDENTE]: orders.filter(order => order.status === OrderStatus.PENDENTE).length,
    [OrderStatus.CONFIRMADO]: orders.filter(order => order.status === OrderStatus.CONFIRMADO).length,
    [OrderStatus.PREPARANDO]: orders.filter(order => order.status === OrderStatus.PREPARANDO).length,
    [OrderStatus.PRONTO]: orders.filter(order => order.status === OrderStatus.PRONTO).length,
    [OrderStatus.ENTREGUE]: orders.filter(order => order.status === OrderStatus.ENTREGUE).length,
    [OrderStatus.CANCELADO]: orders.filter(order => order.status === OrderStatus.CANCELADO).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Meus Pedidos
          </h1>
          <p className="text-gray-600 mt-1">
            Acompanhe todos os seus pedidos
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => refetchOrders()}
            disabled={ordersLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link href="/">
            <Button variant="primary">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Busca */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID do pedido..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros de Status */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('all')}
              >
                Todos ({statusCounts.all})
              </Button>
              {Object.values(OrderStatus).map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter(status)}
                >
                  {getStatusIcon(status)}
                  <span className="ml-2">
                    {status} ({statusCounts[status]})
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts.all}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts[OrderStatus.PENDENTE]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Prontos</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts[OrderStatus.PRONTO]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Entregues</p>
                <p className="text-lg font-bold text-gray-900">{statusCounts[OrderStatus.ENTREGUE]}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Star className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(orders.reduce((sum, order) => sum + order.total, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pedido #{order.id.slice(-8)}
                        </h3>
                        <Badge variant={getStatusColor(order.status) as any}>
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Data:</span> {formatDateTime(order.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Itens:</span> {order.items?.length || 0} produto(s)
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span> {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'}
                        </div>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Itens do pedido:</p>
                          <div className="flex flex-wrap gap-1">
                            {order.items.slice(0, 3).map((item, index) => (
                              <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {item.product?.name} x{item.quantity}
                              </span>
                            ))}
                            {order.items.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{order.items.length - 3} mais
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-6">
                      <p className="text-xl font-bold text-gray-900 mb-2">
                        {formatCurrency(order.total)}
                      </p>
                      <Link href={`/customer/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Não encontramos pedidos com os filtros aplicados.'
                  : 'Você ainda não fez nenhum pedido. Que tal fazer seu primeiro pedido?'
                }
              </p>
              <Link href="/">
                <Button variant="primary">
                  <ShoppingBag className="h-4 w-4 mr-2" />
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
