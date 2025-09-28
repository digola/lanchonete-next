'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi, useTables } from '@/hooks/useApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order, OrderStatus, UserRole, Table, TableStatus, Product, Category } from '@/types';
import { 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  ShoppingBag,
  RefreshCw,
  CheckCircle,
  Clock,
  Plus,
  ShoppingCart,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Table as TableIcon,
  UserCheck,
  UserX,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react';

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useApiAuth();
  const tableId = params.id as string;
  
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [showAddProducts, setShowAddProducts] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{productId: string, quantity: number}[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Debug: Monitorar mudanças no estado selectedProducts
  useEffect(() => {
    console.log('🔄 selectedProducts mudou:', selectedProducts);
  }, [selectedProducts]);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Buscar dados da mesa
  const { data: tableResponse, loading: tableLoading, execute: refetchTable } = useApi<Table>(`/api/tables/${tableId}?includeAssignedUser=true`);

  // Buscar pedidos da mesa
  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>(`/api/orders?tableId=${tableId}&includeItems=true&includeUser=true&sortBy=createdAt&sortOrder=desc`);

  // Buscar produtos
  const { data: productsResponse, loading: productsLoading } = useApi<{
    data: Product[];
    pagination: any;
  }>(`/api/products?isAvailable=true&limit=50`);

  // Buscar categorias
  const { data: categoriesResponse, loading: categoriesLoading } = useApi<{
    data: Category[];
    pagination: any;
  }>('/api/categories?isActive=true');

  const table = tableResponse;
  const orders = ordersResponse?.data || [];
  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // Filtrar apenas pedidos ativos
  const activeOrders = orders.filter(order => 
    [OrderStatus.PENDENTE, OrderStatus.CONFIRMADO, OrderStatus.PREPARANDO, OrderStatus.PRONTO].includes(order.status)
  );

  // Estatísticas da mesa
  const stats = {
    totalOrders: activeOrders.length,
    pending: activeOrders.filter(o => o.status === OrderStatus.PENDENTE).length,
    confirmed: activeOrders.filter(o => o.status === OrderStatus.CONFIRMADO).length,
    preparing: activeOrders.filter(o => o.status === OrderStatus.PREPARANDO).length,
    ready: activeOrders.filter(o => o.status === OrderStatus.PRONTO).length,
    totalRevenue: activeOrders.reduce((sum, order) => sum + order.total, 0)
  };

  // Função para avançar status do pedido
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
        await refetchOrders();
        console.log('Status atualizado com sucesso:', data.message);
      } else {
        console.error('Erro ao atualizar status do pedido:', data.error || 'Erro desconhecido');
        alert(`Erro: ${data.error || 'Não foi possível atualizar o status do pedido'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Função para atualizar status da mesa
  const updateTableStatus = async (newStatus: TableStatus) => {
    if (!user || !table) {
      console.error('Usuário ou mesa não encontrados:', { user: !!user, table: !!table });
      return;
    }
    
    if (!table.id) {
      console.error('ID da mesa não encontrado:', table);
      alert('Erro: ID da mesa não encontrado');
      return;
    }
    
    console.log('Atualizando mesa:', { tableId: table.id, newStatus });
    
    try {
      const response = await fetch(`/api/tables/${table.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await refetchTable();
        console.log('Status da mesa atualizado com sucesso:', data.message);
        alert('Status da mesa atualizado com sucesso!');
      } else {
        console.error('Erro ao atualizar status da mesa:', data.error || 'Erro desconhecido');
        alert(`Erro: ${data.error || 'Não foi possível atualizar o status da mesa'}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status da mesa:', error);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  // Funções para adicionar produtos aos pedidos
  const addProductToOrder = async (orderId: string) => {
    console.log('🔍 Debug addProductToOrder:', {
      user: !!user,
      selectedProductsLength: selectedProducts.length,
      selectedProducts,
      orderId
    });

    if (!user || selectedProducts.length === 0) {
      console.log('❌ Condições não atendidas:', { user: !!user, selectedProductsLength: selectedProducts.length });
      return;
    }
    
    try {
      console.log('📤 Enviando requisição para API:', {
        url: `/api/orders/${orderId}/items`,
        items: selectedProducts
      });

      const response = await fetch(`/api/orders/${orderId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: selectedProducts }),
      });

      console.log('📥 Resposta da API:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('📊 Dados da resposta:', data);

      if (response.ok && data.success) {
        console.log('✅ Produtos adicionados com sucesso');
        await refetchOrders();
        setShowAddProducts(null);
        setSelectedProducts([]);
        console.log('Produtos adicionados com sucesso:', data.message);
      } else {
        console.error('❌ Erro ao adicionar produtos:', data.error || 'Erro desconhecido');
        alert(`Erro: ${data.error || 'Não foi possível adicionar os produtos'}`);
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar produtos:', error);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  const addProductToSelection = (productId: string) => {
    console.log('🔍 Debug addProductToSelection:', {
      productId,
      currentSelectedProducts: selectedProducts
    });

    const existing = selectedProducts.find(p => p.productId === productId);
    if (existing) {
      console.log('➕ Produto já existe, incrementando quantidade');
      setSelectedProducts(prev => 
        prev.map(p => 
          p.productId === productId 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      console.log('➕ Adicionando novo produto à seleção');
      setSelectedProducts(prev => [...prev, { productId, quantity: 1 }]);
    }

    console.log('📋 Produtos selecionados após adição:', selectedProducts);
  };

  const removeProductFromSelection = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromSelection(productId);
    } else {
      setSelectedProducts(prev => 
        prev.map(p => 
          p.productId === productId 
            ? { ...p, quantity }
            : p
        )
      );
    }
  };

  // Função para abrir modal de detalhes do pedido
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? '' : categoryId);
  };

  const clearFilters = () => {
    setProductSearch('');
    setSelectedCategory('');
  };

  // Filtrar produtos por busca e categoria
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Funções auxiliares
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

  if (tableLoading) {
    return (
      <ProtectedRoute requiredRole={UserRole.STAFF}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="text-gray-600">Carregando mesa...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!table) {
    return (
      <ProtectedRoute requiredRole={UserRole.STAFF}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <TableIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mesa não encontrada</h1>
            <p className="text-gray-600 mb-6">A mesa solicitada não existe ou foi removida.</p>
            <Button onClick={() => router.push('/expedicao')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Mesas
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.STAFF}>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Redirecionar baseado no role do usuário
                  if (user?.role === 'STAFF') {
                    router.push('/staff');
                  } else {
                    router.push('/expedicao');
                  }
                }}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Mesa #{table.number}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Capacidade: {table.capacity} pessoas • Status: {getTableStatusLabel(table.status)}
                </p>
              </div>
            </div>

            {/* Status da mesa */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <Badge className={getTableStatusColor(table.status)}>
                {getTableStatusLabel(table.status)}
              </Badge>
              {table.assignedUser && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">
                    Atribuída para: {table.assignedUser.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controles da mesa */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                <div>
                  <h3 className="text-lg font-semibold">Controle da Mesa</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Gerencie o status e pedidos da mesa</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {table.status === TableStatus.LIVRE ? (
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                      onClick={() => updateTableStatus(TableStatus.OCUPADA)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Ocupar Mesa</span>
                      <span className="sm:hidden">Ocupar</span>
                    </Button>
                  ) : (
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                      onClick={() => updateTableStatus(TableStatus.LIVRE)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Liberar Mesa</span>
                      <span className="sm:hidden">Liberar</span>
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReceiveModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 w-full sm:w-auto"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Receber
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => refetchOrders()}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Atualizar</span>
                    <span className="sm:hidden">Atualizar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center">
                  <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Pedidos</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center">
                  <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Confirmados</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Preparando</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.preparing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center">
                  <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  <div className="ml-2 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Prontos</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.ready}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pedidos da mesa */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl font-semibold">Pedidos da Mesa</CardTitle>
              {activeOrders.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAddProducts('table')}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Adicionar Produtos</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              )}
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
              ) : activeOrders.length > 0 ? (
                <div className="space-y-4">
                  {activeOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 space-y-3 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              Pedido #{order.id.slice(-8)}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            {formatDateTime(order.createdAt)} • {formatCurrency(order.total)}
                          </p>
                        </div>
                        
                        {/* Botão de ação principal */}
                        <div className="w-full sm:w-auto">
                          {getNextStatus(order.status) ? (
                            <Button
                              className={`${getButtonColor(order.status)} text-white font-medium w-full sm:w-auto`}
                              onClick={() => advanceOrderStatus(order.id, order.status)}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  <span className="hidden sm:inline">Atualizando...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">{getButtonText(order.status)}</span>
                                  <span className="sm:hidden">{getButtonText(order.status).split(' ')[0]}</span>
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="px-3 sm:px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-center sm:text-left">
                              <CheckCircle className="h-4 w-4 mr-2 inline" />
                              <span className="hidden sm:inline">Finalizado</span>
                              <span className="sm:hidden">✓</span>
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
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'}
                          </span>
                        </div>
                      </div>

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
                          
                          {/* Botão para ver detalhes completos */}
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openOrderDetails(order)}
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Ver Detalhes Completos</span>
                              <span className="sm:hidden">Detalhes</span>
                            </Button>
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
                    Não há pedidos em andamento nesta mesa.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modal para Adicionar Produtos */}
          {showAddProducts && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg p-3 sm:p-6 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex items-start sm:items-center justify-between mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">
                    Adicionar Produtos aos Pedidos da Mesa
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddProducts(null);
                      setSelectedProducts([]);
                      setProductSearch('');
                      setSelectedCategory('');
                    }}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Busca e filtros */}
                <div className="mb-4 space-y-4">
                  {/* Busca de produtos */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filtro por categoria */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Filtrar por Categoria</h4>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <Button
                        variant={selectedCategory === '' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleCategoryFilter('')}
                        className="transition-all duration-200 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        <span className="hidden sm:inline">🍽️</span>
                        <span className="sm:hidden">🍽️</span>
                        <span className="ml-1">Todas</span>
                      </Button>
                      {categoriesLoading ? (
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-6 sm:h-8 w-16 sm:w-24 bg-gray-200 rounded animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        categories.map((category: Category) => (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handleCategoryFilter(category.id)}
                            className="transition-all duration-200 hover:scale-105 text-xs sm:text-sm px-2 sm:px-3"
                            leftIcon={
                              category.imageUrl ? (
                                <img 
                                  src={category.imageUrl} 
                                  alt={category.name}
                                  className="w-3 h-3 sm:w-4 sm:h-4 object-cover rounded"
                                />
                              ) : (
                                <span className="text-xs sm:text-sm">
                                  {category.name === 'Bebidas' ? '🥤' :
                                   category.name === 'Pratos' ? '🍽️' :
                                   category.name === 'Sobremesas' ? '🍰' :
                                   category.name === 'Pizzas' ? '🍕' :
                                   category.name === 'Lanches' ? '🍔' : '📦'}
                                </span>
                              )
                            }
                          >
                            <span className="hidden sm:inline">{category.name}</span>
                            <span className="sm:hidden">{category.name.length > 8 ? category.name.substring(0, 8) + '...' : category.name}</span>
                          </Button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Botão limpar filtros */}
                  {(productSearch || selectedCategory) && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Limpar Filtros
                      </Button>
                    </div>
                  )}
                </div>

                {/* Lista de produtos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-6 max-h-60 sm:max-h-80 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-2 sm:p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</h4>
                          <p className="text-xs sm:text-sm text-gray-600">{formatCurrency(product.price)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addProductToSelection(product.id)}
                          className="flex-shrink-0 p-1 sm:p-2"
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Produtos selecionados */}
                {selectedProducts.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Produtos Selecionados:</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedProducts.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <div key={item.productId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm sm:text-base truncate block">{product?.name}</span>
                              <span className="text-xs sm:text-sm text-gray-600">{formatCurrency(product?.price || 0)}</span>
                            </div>
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                                className="p-1 sm:p-2"
                              >
                                <span className="text-xs sm:text-sm">-</span>
                              </Button>
                              <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                                className="p-1 sm:p-2"
                              >
                                <span className="text-xs sm:text-sm">+</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeProductFromSelection(item.productId)}
                                className="p-1 sm:p-2"
                              >
                                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddProducts(null);
                      setSelectedProducts([]);
                      setProductSearch('');
                      setSelectedCategory('');
                    }}
                    className="w-full sm:w-auto text-sm sm:text-base"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      if (activeOrders.length > 0 && activeOrders[0]) {
                        addProductToOrder(activeOrders[0].id);
                      }
                    }}
                    disabled={selectedProducts.length === 0}
                    className="w-full sm:w-auto text-sm sm:text-base"
                  >
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Adicionar ao Pedido</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Receber */}
          {showReceiveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Receber Pedidos - Mesa {table?.number}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => setShowReceiveModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Informações da Mesa */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Informações da Mesa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Número da Mesa</p>
                      <p className="font-semibold">{table?.number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Capacidade</p>
                      <p className="font-semibold">{table?.capacity} pessoas</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={table?.status === TableStatus.OCUPADA ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {table?.status === TableStatus.OCUPADA ? 'Ocupada' : 'Livre'}
                      </Badge>
                    </div>
                  </div>
                  {table?.assignedUser && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Atendido por</p>
                      <p className="font-semibold">{table.assignedUser.name}</p>
                    </div>
                  )}
                </div>

                {/* Lista de Pedidos e Itens */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Pedidos Ativos</h3>
                  
                  {activeOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum pedido ativo para esta mesa</p>
                    </div>
                  ) : (
                    activeOrders.map((order) => (
                      <Card key={order.id} className="mb-4">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">
                              Pedido #{order.id.slice(-8)}
                            </CardTitle>
                            <Badge className={
                              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'PREPARING' ? 'bg-orange-100 text-orange-800' :
                              order.status === 'READY' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {order.status === 'PENDING' ? 'Pendente' :
                               order.status === 'CONFIRMED' ? 'Confirmado' :
                               order.status === 'PREPARING' ? 'Preparando' :
                               order.status === 'READY' ? 'Pronto' :
                               order.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Criado em:</span>
                              <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                            </div>
                            
                            {order.items && order.items.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2">Itens do Pedido:</h4>
                                <div className="space-y-2">
                                  {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <div>
                                        <p className="font-medium">{item.product?.name || 'Produto não encontrado'}</p>
                                        <p className="text-sm text-gray-600">
                                          Quantidade: {item.quantity} | 
                                          Preço: {formatCurrency(item.price)} | 
                                          Total: {formatCurrency(item.price * item.quantity)}
                                        </p>
                                        {item.notes && (
                                          <p className="text-sm text-gray-500 italic">Obs: {item.notes}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-3 border-t">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total do Pedido:</span>
                                    <span className="text-lg font-bold text-blue-600">
                                      {formatCurrency(order.items.reduce((total, item) => total + (item.price * item.quantity), 0))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                {/* Opções de Recebimento */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Forma de Recebimento</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* PIX */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === 'pix' 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('pix')}
                    >
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">PIX</h4>
                          <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                        </div>
                      </div>
                    </div>

                    {/* Cartão */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === 'card' 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('card')}
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="h-6 w-6 text-green-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Cartão</h4>
                          <p className="text-sm text-gray-600">Débito ou crédito</p>
                        </div>
                      </div>
                    </div>

                    {/* Dinheiro */}
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPaymentMethod === 'cash' 
                          ? 'border-blue-500 bg-blue-100' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPaymentMethod('cash')}
                    >
                      <div className="flex items-center space-x-3">
                        <Banknote className="h-6 w-6 text-yellow-600" />
                        <div>
                          <h4 className="font-semibold text-gray-900">Dinheiro</h4>
                          <p className="text-sm text-gray-600">Pagamento em espécie</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Campo de valor (apenas para dinheiro) */}
                  {selectedPaymentMethod === 'cash' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor Recebido
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentAmount || ''}
                          onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0,00"
                        />
                      </div>
                      {paymentAmount > 0 && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-600">
                            Total dos pedidos: {formatCurrency(activeOrders.reduce((total, order) => 
                              total + (order.items?.reduce((orderTotal, item) => 
                                orderTotal + (item.price * item.quantity), 0) || 0), 0
                            ))}
                          </p>
                          <p className={`font-semibold ${
                            paymentAmount >= activeOrders.reduce((total, order) => 
                              total + (order.items?.reduce((orderTotal, item) => 
                                orderTotal + (item.price * item.quantity), 0) || 0), 0
                            ) ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Troco: {formatCurrency(paymentAmount - activeOrders.reduce((total, order) => 
                              total + (order.items?.reduce((orderTotal, item) => 
                                orderTotal + (item.price * item.quantity), 0) || 0), 0
                            ))}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resumo do pagamento */}
                  {selectedPaymentMethod && (
                    <div className="mt-4 p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total a Receber:</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(activeOrders.reduce((total, order) => 
                            total + (order.items?.reduce((orderTotal, item) => 
                              orderTotal + (item.price * item.quantity), 0) || 0), 0
                          ))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Forma de pagamento:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedPaymentMethod === 'pix' ? 'PIX' :
                           selectedPaymentMethod === 'card' ? 'Cartão' :
                           selectedPaymentMethod === 'cash' ? 'Dinheiro' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botões de ação */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReceiveModal(false);
                      setSelectedPaymentMethod('');
                      setPaymentAmount(0);
                    }}
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!selectedPaymentMethod) {
                        alert('Selecione uma forma de pagamento');
                        return;
                      }
                      
                      if (selectedPaymentMethod === 'cash' && paymentAmount <= 0) {
                        alert('Informe o valor recebido');
                        return;
                      }
                      
                      if (selectedPaymentMethod === 'cash') {
                        const totalAmount = activeOrders.reduce((total, order) => 
                          total + (order.items?.reduce((orderTotal, item) => 
                            orderTotal + (item.price * item.quantity), 0) || 0), 0
                        );
                        
                        if (paymentAmount < totalAmount) {
                          alert('Valor insuficiente para cobrir o total dos pedidos');
                          return;
                        }
                      }
                      
                      try {
                        // Atualizar status da mesa para LIVRE após recebimento
                        const response = await fetch(`/api/tables/${tableId}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
                          },
                          body: JSON.stringify({ 
                            status: 'LIVRE',
                            assignedTo: null 
                          }),
                        });

                        if (response.ok) {
                          console.log('✅ Status da mesa atualizado para LIVRE após recebimento');
                          // Atualizar dados da mesa
                          refetchTable();
                          refetchOrders();
                        } else {
                          console.error('❌ Erro ao atualizar status da mesa:', await response.text());
                        }
                      } catch (error) {
                        console.error('❌ Erro ao atualizar mesa:', error);
                      }
                      
                      // Mostrar confirmação de recebimento
                      const paymentMethod = selectedPaymentMethod === 'pix' ? 'PIX' :
                                           selectedPaymentMethod === 'card' ? 'Cartão' :
                                           'Dinheiro';
                      
                      alert(`Recebimento confirmado!\nForma: ${paymentMethod}\nTotal: ${formatCurrency(activeOrders.reduce((total, order) => 
                        total + (order.items?.reduce((orderTotal, item) => 
                          orderTotal + (item.price * item.quantity), 0) || 0), 0
                      ))}\n\nMesa liberada com sucesso!`);
                      
                      setShowReceiveModal(false);
                      setSelectedPaymentMethod('');
                      setPaymentAmount(0);
                    }}
                    disabled={!selectedPaymentMethod || (selectedPaymentMethod === 'cash' && paymentAmount <= 0)}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Recebimento
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Detalhes do Pedido */}
          {showOrderDetails && selectedOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Detalhes do Pedido
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Mesa {table?.number} • {formatDateTime(selectedOrder.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOrderDetails(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {/* Informações do Pedido */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Cliente:</span>
                        <span className="text-sm font-medium">{selectedOrder.user?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Tipo:</span>
                        <span className="text-sm font-medium">
                          {selectedOrder.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge 
                          variant="outline" 
                          className={`${
                            selectedOrder.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                            selectedOrder.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800' :
                            selectedOrder.status === 'PREPARANDO' ? 'bg-orange-100 text-orange-800' :
                            selectedOrder.status === 'PRONTO' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedOrder.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Pagamento:</span>
                        <span className="text-sm font-medium">{selectedOrder.paymentMethod || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TableIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Mesa:</span>
                        <span className="text-sm font-medium">{table?.number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(selectedOrder.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Itens do Pedido</h4>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{item.product?.name || 'Produto'}</p>
                              <p className="text-sm text-gray-600">
                                Quantidade: {item.quantity} • {formatCurrency(item.price)} cada
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                            <p className="text-xs text-gray-500">subtotal</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhum item encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedOrder.notes && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Observações</h4>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedOrder.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Endereço de Entrega */}
                  {selectedOrder.deliveryType === 'DELIVERY' && selectedOrder.deliveryAddress && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Endereço de Entrega</h4>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
                          <p className="text-sm text-gray-700">{selectedOrder.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowOrderDetails(false)}
                    className="w-full sm:w-auto"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
