'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order, OrderStatus, UserRole, Product, Category, Table, TableStatus } from '@/types';
import { 
  Package, 
  RefreshCw,
  CheckCircle,
  Plus,
  ShoppingCart,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Printer,
  Clock3
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

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showDivisionModal, setShowDivisionModal] = useState(false);
  const [personPayments, setPersonPayments] = useState<{id: string, name: string, amount: number, method: string}[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  // Buscar dados da mesa
  const { data: tableResponse, loading: tableLoading, execute: refetchTable } = useApi<{ data: Table }>(`/api/tables/${tableId}?includeAssignedUser=true`);

  // Buscar pedidos da mesa
  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>(`/api/orders?tableId=${tableId}&includeItems=true&includeUser=true&sortBy=createdAt&sortOrder=desc`);

  // Buscar produtos (apenas quando necessário)
  const { data: productsResponse, loading: productsLoading, execute: fetchProducts } = useApi<{
    data: Product[];
    pagination: any;
  }>(`/api/products?isAvailable=true&limit=50`, { 
    immediate: false
  });

  // Buscar categorias (apenas quando necessário)
  const { data: categoriesResponse, loading: categoriesLoading, execute: fetchCategories } = useApi<{
    data: Category[];
    pagination: any;
  }>('/api/categories?isActive=true', { 
    immediate: false
  });

  // Carregar produtos e categorias apenas quando o modal de adicionar produtos for aberto
  useEffect(() => {
    if (showAddProducts) {
      // Só busca se ainda não tem dados em cache
      if (!productsResponse?.data) {
        fetchProducts().catch(console.error);
      }
      if (!categoriesResponse?.data) {
        fetchCategories().catch(console.error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddProducts]);

  const table = tableResponse?.data;
  const orders = ordersResponse?.data || [];
  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // Filtrar apenas pedidos ativos (não recebidos ainda)
  const activeOrders = orders.filter(order => 
    !order.isReceived && [OrderStatus.PENDENTE, OrderStatus.CONFIRMADO, OrderStatus.PREPARANDO, OrderStatus.PRONTO, OrderStatus.ENTREGUE].includes(order.status)
  );

  // Função para marcar pedido como recebido
  const markAsReceived = async (orderId: string) => {
    if (!user) return;
    
    setUpdatingOrderId(orderId);

    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isReceived: true }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTimeout(() => refetchOrders(), 1000);
        
        // Verificar se não há mais pedidos ativos
        const remainingOrders = activeOrders.filter(o => o.id !== orderId);
        if (remainingOrders.length === 0 && table?.status === TableStatus.OCUPADA) {
          const shouldLiberateTable = window.confirm(
            'Não há mais pedidos ativos!\n\nDeseja liberar a mesa agora?'
          );
          
          if (shouldLiberateTable) {
            await updateTableStatus(TableStatus.LIVRE);
          }
        }
      } else {
        alert('Erro ao marcar pedido como recebido');
      }
    } catch (error) {
      console.error('Erro ao marcar pedido como recebido:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Função para avançar status do pedido
  const advanceOrderStatus = async (orderId: string, currentStatus: OrderStatus) => {
    if (!user) return;
    
    setUpdatingOrderId(orderId);

    try {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;
      
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refetch apenas se necessário (cache vai expirar automaticamente)
        setTimeout(() => refetchOrders(), 1000);
        
        // Se o pedido foi marcado como ativo, mostrar modal de impressão
        if (nextStatus === OrderStatus.PRONTO) {
          // Usar os dados atualizados da resposta da API
          if (data.data) {
            setOrderToPrint(data.data);
            setShowPrintModal(true);
      } else {
            // Fallback: buscar na lista local
            const readyOrder = orders.find(o => o.id === orderId);
            if (readyOrder) {
              setOrderToPrint(readyOrder);
              setShowPrintModal(true);
            }
          }
        }
      } else {
        alert('Erro ao atualizar status do pedido');
      }
    } catch (error) {
      console.error('Erro ao atualizar status do pedido:', error);
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Funções para adicionar produtos aos pedidos
  const addProductToOrder = async (orderId: string) => {
    if (!user || selectedProducts.length === 0) {
      return;
    }
    
    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${orderId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: selectedProducts }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refetch apenas se necessário (cache vai expirar automaticamente)
        setTimeout(() => refetchOrders(), 1000);
        setSelectedProducts([]);
        setShowAddProducts(null);
        alert('Produtos adicionados com sucesso!');
      } else {
        alert(`Erro ao adicionar produtos: ${data.error || 'Tente novamente'}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  const addProductToSelection = (product: Product) => {
    const existing = selectedProducts.find(p => p.productId === product.id);
    if (existing) {
      setSelectedProducts(prev => 
        prev.map(p => 
          p.productId === product.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [...prev, { productId: product.id, quantity: 1 }]);
    }
  };

  const removeProductFromSelection = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromSelection(productId);
      return;
    }
    
      setSelectedProducts(prev => 
        prev.map(p => 
          p.productId === productId 
            ? { ...p, quantity }
            : p
        )
      );
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Função para receber pagamento simples
  const receivePayment = async () => {
    if (!user || !selectedPaymentMethod || !paymentAmount || paymentAmount <= 0) {
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${selectedOrder?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: OrderStatus.ENTREGUE,
          paymentMethod: selectedPaymentMethod 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refetch apenas se necessário (cache vai expirar automaticamente)
        setTimeout(() => refetchOrders(), 1000);
        setShowReceiveModal(false);
        setSelectedPaymentMethod('');
        setPaymentAmount(0);
        
        // Perguntar se quer liberar a mesa
        const shouldLiberateTable = window.confirm(
          'Pagamento recebido com sucesso!\n\nDeseja liberar a mesa agora?'
        );
        
        if (shouldLiberateTable) {
          await updateTableStatus(TableStatus.LIVRE);
        }
      } else {
        alert('Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro ao receber pagamento:', error);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  // Funções para divisão de pagamentos
  const addPersonToDivision = () => {
    if (!newPersonName.trim()) return;
    
    const newPerson = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
      amount: 0,
      method: 'DINHEIRO'
    };
    
    setPersonPayments([...personPayments, newPerson]);
    setNewPersonName('');
  };

  const removePersonFromDivision = (personId: string) => {
    setPersonPayments(personPayments.filter(p => p.id !== personId));
  };

  const updatePersonPayment = (personId: string, field: 'amount' | 'method', value: string | number) => {
    setPersonPayments(personPayments.map(p => 
      p.id === personId ? { ...p, [field]: value } : p
    ));
  };

  const calculateTotalPaid = () => {
    return personPayments.reduce((total, person) => total + (person.amount || 0), 0);
  };

  const calculateRemaining = () => {
    const totalToPay = activeOrders.reduce((total, order) => total + order.total, 0);
    return totalToPay - calculateTotalPaid();
  };

  const updateTableStatus = async (newStatus: TableStatus) => {
    if (!table) {
      console.error('Mesa não encontrada');
      alert('Erro: Dados da mesa não carregados');
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/tables/${table.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Refetch apenas se necessário (cache vai expirar automaticamente)
        setTimeout(() => refetchTable(), 500);
        alert(`Mesa ${newStatus === TableStatus.LIVRE ? 'liberada' : newStatus === TableStatus.OCUPADA ? 'ocupada' : 'em manutenção'} com sucesso!`);
      } else {
        alert('Erro ao atualizar status da mesa');
      }
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  const processDivisionPayment = async () => {
    const totalPaid = calculateTotalPaid();
    const totalToPay = activeOrders.reduce((total, order) => total + order.total, 0);
    
    if (totalPaid < totalToPay) {
      alert(`Valor insuficiente. Faltam ${formatCurrency(totalToPay - totalPaid)}`);
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      
      // Marcar todos os pedidos como entregues
      const promises = activeOrders.map(order => 
        fetch(`/api/orders/${order.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            status: OrderStatus.ENTREGUE,
            paymentMethod: 'DIVIDIDO' // Indicar que foi dividido
          }),
        })
      );

      await Promise.all(promises);
      
      // Refetch apenas se necessário (cache vai expirar automaticamente)
      setTimeout(() => refetchOrders(), 1000);
      setShowDivisionModal(false);
      setPersonPayments([]);
      setShowReceiveModal(false);
      
      // Perguntar se quer liberar a mesa
      const shouldLiberateTable = window.confirm(
        'Pagamentos processados com sucesso!\n\nDeseja liberar a mesa agora?'
      );
      
      if (shouldLiberateTable) {
        await updateTableStatus(TableStatus.LIVRE);
      }
    } catch (error) {
      console.error('Erro ao processar pagamentos divididos:', error);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  // Função para impressão de recibo em impressoras térmicas (58mm)
  const printReceipt = () => {
    const printWindow = window.open('', '_blank', 'width=220,height=600');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para impressão');
      return;
    }

    const currentDate = new Date();
    const receiptContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Recibo - Mesa ${table?.number || tableId?.slice(-8)}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 2mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.3;
            width: 54mm;
            padding: 2mm;
            background: white;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          
          .restaurant-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 2px;
          }
          
          .table-info {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 2px;
          }
          
          .section {
            border-bottom: 1px dashed #000;
            padding: 4px 0;
            margin-bottom: 4px;
          }
          
          .order-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 9px;
          }
          
          .item-name {
            flex: 1;
            padding-right: 4px;
          }
          
          .item-quantity {
            font-weight: bold;
            margin-right: 4px;
          }
          
          .item-price {
            font-weight: bold;
            white-space: nowrap;
          }
          
          .total {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            padding: 4px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            margin: 4px 0;
          }
          
          .footer {
            text-align: center;
            margin-top: 6px;
            font-size: 8px;
          }
          
          .status {
            text-align: center;
            margin: 4px 0;
            padding: 2px;
            background: #f0f0f0;
            font-weight: bold;
            font-size: 10px;
          }
          
          .bold {
            font-weight: bold;
          }
          
          .center {
            text-align: center;
          }
          
          @media print {
            body {
              width: 58mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">🍔 LANCHONETE</div>
          <div>Mesa #${table?.number || tableId?.slice(-8)}</div>
          <div>${currentDate.toLocaleString('pt-BR')}</div>
        </div>
        
        <div class="status">
          STATUS: ${table?.status === TableStatus.OCUPADA ? 'OCUPADA' : 
                   table?.status === TableStatus.LIVRE ? 'LIVRE' : 'MANUTENCAO'}
        </div>
        
        ${activeOrders.length > 0 ? `
          <div class="section">
            <div class="bold center" style="margin-bottom: 3px; font-size: 10px;">
              PEDIDOS ATIVOS (${activeOrders.length})
            </div>
          </div>
          ${activeOrders.map(order => `
            <div class="section">
              <div class="center bold" style="font-size: 10px; margin-bottom: 2px;">
                Pedido #${order.id.slice(-8)}
              </div>
              <div style="font-size: 9px; margin-bottom: 2px;">
                Cliente: ${order.user?.name || 'N/A'}
              </div>
              ${order.items?.map(item => `
                <div class="order-item">
                  <span class="item-name">
                    <span class="item-quantity">${item.quantity}x</span>${item.product?.name || 'Produto'}
                  </span>
                  <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
                </div>
              `).join('') || '<div class="center">Nenhum item</div>'}
              ${order.notes ? `<div style="font-size: 8px; font-style: italic; margin-top: 2px; background: #f9f9f9; padding: 2px;">Obs: ${order.notes}</div>` : ''}
              <div class="bold" style="text-align: right; margin-top: 2px; font-size: 10px;">
                Subtotal: ${formatCurrency(order.total)}
              </div>
            </div>
          `).join('')}
        ` : '<div class="center" style="margin: 10px 0; font-size: 10px;">NENHUM PEDIDO ATIVO</div>'}
        
        <div class="total">
          TOTAL GERAL: ${formatCurrency(activeOrders.reduce((total, order) => total + order.total, 0))}
        </div>
        
        <div class="footer">
          <div>Impresso em:</div>
          <div>${currentDate.toLocaleString('pt-BR')}</div>
          <div style="margin-top: 2px;">Sistema Lanchonete v1.0</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
    
    // Aguardar carregamento e imprimir
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Funções auxiliares
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
      case OrderStatus.PENDENTE: return 'Confirmar';
      case OrderStatus.CONFIRMADO: return 'Iniciar Preparo';
      case OrderStatus.PREPARANDO: return 'Marcar Pronto';
      case OrderStatus.PRONTO: return 'Entregar';
      default: return 'Avançar';
    }
  };

  const getButtonColor = (currentStatus: OrderStatus): string => {
    switch (currentStatus) {
      case OrderStatus.PENDENTE: return 'bg-yellow-600 hover:bg-yellow-700';
      case OrderStatus.CONFIRMADO: return 'bg-blue-600 hover:bg-blue-700';
      case OrderStatus.PREPARANDO: return 'bg-orange-600 hover:bg-orange-700';
      case OrderStatus.PRONTO: return 'bg-green-600 hover:bg-green-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.PENDENTE: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMADO: return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARANDO: return 'bg-orange-100 text-orange-800';
      case OrderStatus.PRONTO: return 'bg-green-100 text-green-800';
      case OrderStatus.ENTREGUE: return 'bg-gray-100 text-gray-800';
      case OrderStatus.CANCELADO: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE: return 'Pendente';
      case OrderStatus.CONFIRMADO: return 'Confirmado';
      case OrderStatus.PREPARANDO: return 'Preparando';
      case OrderStatus.PRONTO: return 'Ativo';
      case OrderStatus.ENTREGUE: return 'Entregue';
      case OrderStatus.CANCELADO: return 'Cancelado';
      default: return status;
    }
  };

  if (ordersLoading) {
    return (
      <ProtectedRoute requiredRole={UserRole.STAFF}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole={UserRole.STAFF}>
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Simplificado */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/staff')}
                  className="w-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Mesa #{table?.number || tableId?.slice(-8)}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Pedidos Ativos • {activeOrders.length} pedido(s)
                    {table && (
                      <span className="ml-2">
                        • Status: {table.status === TableStatus.LIVRE ? 'Livre' : 
                                 table.status === TableStatus.OCUPADA ? 'Ocupada' : 
                                 'Manutenção'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowReceiveModal(true)}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  disabled={activeOrders.length === 0}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Receber
                </Button>
                <Button
                  variant="outline"
                  onClick={printReceipt}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Recibo
                </Button>
                {table && table.status !== TableStatus.LIVRE && activeOrders.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => updateTableStatus(TableStatus.LIVRE)}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Liberar Mesa
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => refetchOrders()}
                  className="w-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>

          {/* Pedidos Ativos */}
                <div className="space-y-4">
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <Card key={order.id} className="border-l-4 border-blue-500">
                  <CardContent className="p-4 sm:p-6">
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
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <span>{order.user?.name || 'N/A'}</span>
                        </div>
                        </div>
                        
                        {/* Botões de ação */}
                        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                          {/* Botão de avançar status */}
                          {getNextStatus(order.status) && (
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
                          )}
                          
                          {/* Botão de marcar como recebido (só aparece para pedidos PRONTO ou ENTREGUE) */}
                          {(order.status === OrderStatus.PRONTO || order.status === OrderStatus.ENTREGUE) && (
                            <Button
                              className="bg-purple-600 hover:bg-purple-700 text-white font-medium w-full sm:w-auto"
                              onClick={() => markAsReceived(order.id)}
                              disabled={updatingOrderId === order.id}
                            >
                              {updatingOrderId === order.id ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  <span className="hidden sm:inline">Processando...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Marcar Recebido</span>
                                  <span className="sm:hidden">Recebido</span>
                                </>
                              )}
                            </Button>
                          )}
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
                          
                        {/* Botões de ação */}
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openOrderDetails(order)}
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Ver Detalhes</span>
                              <span className="sm:hidden">Detalhes</span>
                            </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddProducts(order.id)}
                            className="w-full sm:w-auto text-xs sm:text-sm bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Adicionar Produtos</span>
                            <span className="sm:hidden">Adicionar</span>
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
                  </CardContent>
                </Card>
              ))
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
          </div>

          {/* Botão para atualizar */}
          <div className="mt-6">
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
                  </div>

      {/* Modal de Detalhes do Pedido */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Detalhes do Pedido #{selectedOrder.id.slice(-8)}
              </h3>
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
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cliente</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedOrder.user?.name || 'N/A'}</p>
                    </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusLabel(selectedOrder.status)}
                    </Badge>
                    </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data</p>
                    <p className="text-sm text-gray-900">{formatDateTime(selectedOrder.createdAt)}</p>
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
                          {item.quantity}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{item.product?.name || 'Produto'}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} cada
                          </p>
                          {item.notes && (
                            <p className="text-sm text-orange-600 font-medium">
                              Obs: {item.notes}
                            </p>
                          )}
                      </div>
                    </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
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
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                <p>Detalhes completos do pedido</p>
              </div>
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

        {/* Modal de Receber Pagamento - REDESENHADO */}
        {showReceiveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center">
                      💰 Receber Pagamento
                    </h3>
                    <p className="text-green-100 text-sm mt-1">
                      Mesa #{table?.number || tableId?.slice(-8)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReceiveModal(false);
                      setSelectedPaymentMethod('');
                      setPaymentAmount(0);
                    }}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Total a Receber - Destaque */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total a Receber</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {formatCurrency(activeOrders.reduce((total, order) => total + order.total, 0))}
                    </p>
                  </div>
                </div>

                {/* Método de Pagamento - Cards */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Selecione o Método de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('PIX')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'PIX'
                          ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">💳</div>
                        <p className={`text-sm font-semibold ${
                          selectedPaymentMethod === 'PIX' ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          PIX
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('CARTAO')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'CARTAO'
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">💳</div>
                        <p className={`text-sm font-semibold ${
                          selectedPaymentMethod === 'CARTAO' ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          Cartão
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('DINHEIRO')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'DINHEIRO'
                          ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">💵</div>
                        <p className={`text-sm font-semibold ${
                          selectedPaymentMethod === 'DINHEIRO' ? 'text-yellow-700' : 'text-gray-700'
                        }`}>
                          Dinheiro
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Valor Recebido */}
                {selectedPaymentMethod && (
                  <div className="animate-fadeIn">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Valor Recebido
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-200 focus:border-green-500 transition-all"
                        placeholder="0,00"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {/* Troco - Se aplicável */}
                {paymentAmount > 0 && selectedPaymentMethod === 'DINHEIRO' && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">💰</span>
                        <span className="font-semibold text-yellow-800">Troco:</span>
                      </div>
                      <span className="text-2xl font-bold text-yellow-700">
                        {formatCurrency(Math.max(0, paymentAmount - activeOrders.reduce((total, order) => total + order.total, 0)))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer com botões */}
              <div className="bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
                <div className="flex flex-col space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReceiveModal(false);
                      setShowDivisionModal(true);
                    }}
                    className="w-full py-3 bg-blue-50 border-2 border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold text-base"
                  >
                    <Package className="h-5 w-5 mr-2" />
                    🧮 Dividir Conta
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReceiveModal(false);
                        setSelectedPaymentMethod('');
                        setPaymentAmount(0);
                      }}
                      className="flex-1 py-3 font-semibold"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={receivePayment}
                      disabled={!selectedPaymentMethod || !paymentAmount || paymentAmount <= 0}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirmar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Divisão de Conta - REDESENHADO COM CALCULADORA */}
        {showDivisionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
              {/* Header com gradiente */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white flex items-center">
                      🧮 Dividir Conta
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      Mesa #{table?.number || tableId?.slice(-8)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDivisionModal(false);
                      setPersonPayments([]);
                    }}
                    className="text-white hover:bg-white/20 rounded-full"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Calculadora de Divisão */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Coluna Esquerda - Total e Restante */}
                  <div className="space-y-4">
                    {/* Total da Conta */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-gray-200">
                      <p className="text-sm font-medium text-gray-600 mb-2">Total da Conta</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {formatCurrency(activeOrders.reduce((total, order) => total + order.total, 0))}
                      </p>
                    </div>

                    {/* Restante a Pagar */}
                    <div className={`p-6 rounded-xl border-2 ${
                      calculateRemaining() <= 0 
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300' 
                        : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                    }`}>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        {calculateRemaining() <= 0 ? '✅ Conta Fechada!' : '⏳ Restante'}
                      </p>
                      <p className={`text-4xl font-bold ${
                        calculateRemaining() <= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {formatCurrency(Math.abs(calculateRemaining()))}
                      </p>
                      {calculateRemaining() < 0 && (
                        <p className="text-sm text-green-600 mt-2">
                          💰 Troco: {formatCurrency(Math.abs(calculateRemaining()))}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Coluna Direita - Adicionar Pagamento */}
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200">
                      <h4 className="text-sm font-bold text-blue-900 mb-3">➕ Adicionar Pagamento</h4>
                      
                      {/* Nome */}
                      <input
                        type="text"
                        value={newPersonName}
                        onChange={(e) => setNewPersonName(e.target.value)}
                        placeholder="Nome (opcional)..."
                        className="w-full px-4 py-3 mb-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && addPersonToDivision()}
                      />

                      {/* Métodos de Pagamento - Cards pequenos */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            const tempName = newPersonName || `Pessoa ${personPayments.length + 1}`;
                            const newPerson = {
                              id: Date.now().toString(),
                              name: tempName,
                              amount: 0,
                              method: 'PIX'
                            };
                            setPersonPayments([...personPayments, newPerson]);
                            setNewPersonName('');
                          }}
                          className="p-3 bg-white border-2 border-green-300 rounded-lg hover:bg-green-50 transition-all"
                        >
                          <div className="text-2xl mb-1">💳</div>
                          <p className="text-xs font-semibold text-green-700">PIX</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const tempName = newPersonName || `Pessoa ${personPayments.length + 1}`;
                            const newPerson = {
                              id: Date.now().toString(),
                              name: tempName,
                              amount: 0,
                              method: 'CARTAO'
                            };
                            setPersonPayments([...personPayments, newPerson]);
                            setNewPersonName('');
                          }}
                          className="p-3 bg-white border-2 border-blue-300 rounded-lg hover:bg-blue-50 transition-all"
                        >
                          <div className="text-2xl mb-1">💳</div>
                          <p className="text-xs font-semibold text-blue-700">Cartão</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const tempName = newPersonName || `Pessoa ${personPayments.length + 1}`;
                            const newPerson = {
                              id: Date.now().toString(),
                              name: tempName,
                              amount: 0,
                              method: 'DINHEIRO'
                            };
                            setPersonPayments([...personPayments, newPerson]);
                            setNewPersonName('');
                          }}
                          className="p-3 bg-white border-2 border-yellow-300 rounded-lg hover:bg-yellow-50 transition-all"
                        >
                          <div className="text-2xl mb-1">💵</div>
                          <p className="text-xs font-semibold text-yellow-700">Dinheiro</p>
                        </button>
                      </div>
                    </div>

                    {/* Total Pago */}
                    <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                      <p className="text-sm font-medium text-green-600 mb-1">Total Pago</p>
                      <p className="text-3xl font-bold text-green-700">
                        {formatCurrency(calculateTotalPaid())}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {personPayments.length} pagamento(s) registrado(s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de Pagamentos */}
                {personPayments.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center">
                      💰 Pagamentos Registrados
                    </h4>
                    {personPayments.map((person, index) => (
                      <div key={person.id} className="flex items-center space-x-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-bold text-blue-700">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{person.name}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                                R$
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={person.amount || ''}
                                onChange={(e) => updatePersonPayment(person.id, 'amount', Number(e.target.value) || 0)}
                                placeholder="0,00"
                                className="w-full pl-10 pr-3 py-2 text-lg font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className={`px-3 py-2 rounded-lg font-semibold text-sm ${
                              person.method === 'PIX' ? 'bg-green-100 text-green-700' :
                              person.method === 'CARTAO' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {person.method === 'PIX' ? '💳 PIX' : 
                               person.method === 'CARTAO' ? '💳 Cartão' : 
                               '💵 Dinheiro'}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePersonFromDivision(person.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {personPayments.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">🧮</div>
                    <p className="text-lg font-medium">Adicione pagamentos acima</p>
                    <p className="text-sm">Escolha o método e informe o valor</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-6 rounded-b-2xl border-t border-gray-200">
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDivisionModal(false);
                      setPersonPayments([]);
                      setNewPersonName('');
                    }}
                    className="flex-1 py-3 font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={processDivisionPayment}
                    disabled={personPayments.length === 0 || calculateRemaining() > 0}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {calculateRemaining() > 0 ? `Falta ${formatCurrency(calculateRemaining())}` : 'Confirmar Pagamento'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Impressão para Cozinha */}
        {showPrintModal && orderToPrint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-red-50">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                  <Printer className="h-5 w-5 mr-2 text-red-600" />
                  Pedido para Cozinha
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mesa #{tableId?.slice(-8)} • {formatDateTime(orderToPrint.createdAt)}
                </p>
              </div>
                  <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
                  </Button>
                </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Informações do Pedido */}
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                    <p className="text-sm font-medium text-red-800">Pedido #</p>
                    <p className="text-lg font-bold text-red-900">{orderToPrint.id.slice(-8)}</p>
                    </div>
                    <div>
                    <p className="text-sm font-medium text-red-800">Mesa</p>
                    <p className="text-lg font-bold text-red-900">#{tableId?.slice(-8)}</p>
                    </div>
                    <div>
                    <p className="text-sm font-medium text-red-800">Cliente</p>
                    <p className="text-lg font-bold text-red-900">{orderToPrint.user?.name || 'N/A'}</p>
                    </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">Total</p>
                    <p className="text-lg font-bold text-red-900">{formatCurrency(orderToPrint.total)}</p>
                  </div>
                    </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center text-red-700">
                    <Clock3 className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Confirmado em: {formatDateTime(orderToPrint.createdAt)}</span>
                </div>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    ATIVO
                            </Badge>
                          </div>
                            </div>
                            
              {/* Itens do Pedido */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-red-600" />
                  Itens do Pedido
                </h4>
                <div className="space-y-3">
                  {orderToPrint.items?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {item.quantity}
                        </div>
                              <div>
                          <p className="font-semibold text-gray-900 text-lg">{item.product?.name || 'Produto'}</p>
                                        <p className="text-sm text-gray-600">
                            {formatCurrency(item.price)} cada • Subtotal: {formatCurrency(item.price * item.quantity)}
                                        </p>
                                        {item.notes && (
                            <p className="text-sm text-orange-600 font-medium mt-1">
                              ⚠️ Obs: {item.notes}
                            </p>
                                        )}
                                      </div>
                                    </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
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

              {/* Observações do Pedido */}
              {orderToPrint.notes && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-orange-600" />
                    Observações Gerais
                  </h4>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-gray-700 font-medium">{orderToPrint.notes}</p>
                        </div>
                    </div>
                  )}

              {/* Resumo Final */}
              <div className="p-4 bg-gray-100 rounded-lg">
                      <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total do Pedido:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {formatCurrency(orderToPrint.total)}
                        </span>
                      </div>
                      </div>
                </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                <p>Este pedido foi enviado para a cozinha automaticamente.</p>
                <p>Imprima este documento para acompanhar o preparo.</p>
              </div>
              <div className="flex space-x-3">
                  <Button
                    variant="outline"
                  onClick={() => setShowPrintModal(false)}
                  className="w-full sm:w-auto"
                  >
                    Fechar
                  </Button>
                  <Button
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                  </Button>
              </div>
                </div>
              </div>
            </div>
          )}

      {/* Modal de Adicionar Produtos */}
      {showAddProducts && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-blue-50">
                  <div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-blue-600" />
                  Adicionar Produtos ao Pedido
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                  Selecione os produtos para adicionar ao pedido
                    </p>
                  </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => addProductToOrder(showAddProducts)}
                  disabled={selectedProducts.length === 0 || productsLoading || categoriesLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  size="sm"
                >
                  {productsLoading || categoriesLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Carregando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Adicionar ao Pedido</span>
                      <span className="sm:hidden">Adicionar</span>
                    </>
                  )}
                </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                  onClick={() => {
                    setShowAddProducts(null);
                    setSelectedProducts([]);
                    setProductSearch('');
                    setSelectedCategory('');
                  }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </Button>
              </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Filtros */}
              <div className="mb-6 space-y-4">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                      </div>

                {/* Filtro por Categoria */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                      </div>
                    </div>

              {/* Produtos Selecionados */}
              {selectedProducts.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-3">Produtos Selecionados:</h4>
                  <div className="space-y-2">
                    {selectedProducts.map((item) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="flex-1">
                            <span className="font-medium text-sm">{product?.name}</span>
                            <span className="text-xs text-gray-600 ml-2">{formatCurrency(product?.price || 0)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProductQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProductQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 p-0"
                            >
                              +
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProductFromSelection(item.productId)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                      </div>
                      </div>
                      );
                    })}
                    </div>
                  </div>
              )}

              {/* Lista de Produtos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products
                  .filter(product => {
                    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
                    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
                    return matchesSearch && matchesCategory && product.isAvailable;
                  })
                  .map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                        <span className="text-sm font-bold text-green-600">{formatCurrency(product.price)}</span>
                            </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addProductToSelection(product)}
                        className="w-full text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                            </div>
                  ))}
                  </div>

              {products.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600 text-center">
                <p>{selectedProducts.length} produto(s) selecionado(s)</p>
                <p>Total: {formatCurrency(selectedProducts.reduce((total, item) => {
                  const product = products.find(p => p.id === item.productId);
                  return total + (product?.price || 0) * item.quantity;
                }, 0))}</p>
                </div>
              </div>
            </div>
        </div>
      )}
    </ProtectedRoute>
  );
}