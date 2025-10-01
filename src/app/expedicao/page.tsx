'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { UserRole, Order, OrderStatus, Table } from '@/types';
import { 
  Package, 
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Truck, 
  Users,
  TrendingUp,
  Eye,
  Printer,
  CreditCard,
  DollarSign,
  Smartphone,
  Trash2,
  User,
  Plus,
  ShoppingCart,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ExpedicaoPage() {
  const { user, isAuthenticated, isLoading } = useApiAuth();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Estados para modais de caixa
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showClearTableModal, setShowClearTableModal] = useState(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CARTAO' | 'DINHEIRO'>('DINHEIRO');
  const [splitPayment, setSplitPayment] = useState(false);
  const [splitValue, setSplitValue] = useState(0);
  const [calculatorValue, setCalculatorValue] = useState<string>('0');
  const [calculatorExpression, setCalculatorExpression] = useState<string>('');

  // Buscar pedidos
  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>('/api/orders?includeItems=true&includeUser=true&includeTable=true');

  const orders = ordersResponse?.data || [];
  
  // Debug: verificar dados dos pedidos
  useEffect(() => {
    if (orders.length > 0) {
      console.log('🔍 Pedidos carregados:', orders.length);
      console.log('🔍 Primeiro pedido:', orders[0]);
      console.log('🔍 IDs dos pedidos:', orders.map(o => o.id));
      console.log('🪑 Pedidos com mesa:', orders.filter(o => o.table).length);
      console.log('🛒 Pedidos de balcão:', orders.filter(o => !o.table).length);
      console.log('📋 Pedidos de balcão:', orders.filter(o => !o.table).map(o => ({
        id: o.id.slice(-8),
        user: o.user?.name,
        horario: new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      })));
    }
  }, [orders]);

  // Auto refresh a cada 50 segundos
  useEffect(() => {
    if (!autoRefresh || ordersLoading) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto refresh - buscando pedidos...');
      refetchOrders();
    }, 50000); // 50 segundos

    return () => {
      console.log('🛑 Limpando intervalo de auto refresh');
      clearInterval(interval);
    };
  }, [autoRefresh, refetchOrders, ordersLoading]);

  // Filtrar pedidos (já vem filtrado por data do dia da API)
  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedStatus === 'ALL' || order.status === selectedStatus;
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table?.number?.toString().includes(searchTerm) ||
      (!order.table && 'balcao'.includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  // Estatísticas
  const stats = {
    total: orders.length,
    confirmado: orders.filter(o => o.status === OrderStatus.CONFIRMADO).length,
    preparando: orders.filter(o => o.status === OrderStatus.PREPARANDO).length,
    entregue: orders.filter(o => o.status === OrderStatus.ENTREGUE).length,
    finalizado: orders.filter(o => o.status === OrderStatus.FINALIZADO).length,
    comMesa: orders.filter(o => o.table).length,
    balcao: orders.filter(o => !o.table).length,
  };

  // Função para obter cor da badge
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMADO:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARANDO:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.ENTREGUE:
        return 'bg-green-100 text-green-800';
      case OrderStatus.FINALIZADO:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter label do status
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMADO:
        return 'Confirmado';
      case OrderStatus.PREPARANDO:
        return 'Preparando';
      case OrderStatus.ENTREGUE:
        return 'Entregue';
      case OrderStatus.FINALIZADO:
        return 'Finalizado';
      default:
        return status;
    }
  };

  // Função para atualizar status do pedido
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    console.log('🔍 Atualizando pedido:', { orderId, newStatus });
    console.log('🔍 Tipo do orderId:', typeof orderId);
    console.log('🔍 OrderId é undefined?', orderId === 'undefined');
    
    if (!orderId || orderId === 'undefined') {
      console.error('❌ OrderId inválido:', orderId);
      alert('Erro: ID do pedido inválido');
      return;
    }
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar pedido');
      }

      // Atualizar lista de pedidos
      refetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  // Funções para modais
  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedOrder(null);
  };

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    setPaymentMethod('DINHEIRO');
    setSplitPayment(false);
    setSplitValue(0);
    setCalculatorValue('0');
    setCalculatorExpression('');
  };

  // Funções da calculadora
  const handleCalculatorClick = (value: string) => {
    if (value === 'C') {
      setCalculatorValue('0');
      setCalculatorExpression('');
    } else if (value === '←' || value === 'Backspace') {
      setCalculatorValue(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (value === '=') {
      // Avaliar expressão
      try {
        const result = eval(calculatorValue);
        setCalculatorExpression(calculatorValue + ' =');
        setCalculatorValue(result.toString());
      } catch {
        setCalculatorValue('Erro');
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      setCalculatorValue(prev => prev + value);
    } else if (value === '.') {
      if (!calculatorValue.split(/[+\-*/]/).pop()?.includes('.')) {
        setCalculatorValue(prev => prev + value);
      }
    } else if (/^[0-9]$/.test(value)) {
      setCalculatorValue(prev => prev === '0' ? value : prev + value);
    } else if (value === 'TOTAL') {
      // Adicionar o total do pedido à expressão
      setCalculatorValue(prev => prev === '0' ? selectedOrder?.total.toFixed(2) || '0' : prev + selectedOrder?.total.toFixed(2));
    }
  };

  const getCalculatedChange = () => {
    const paid = parseFloat(calculatorValue) || 0;
    const total = selectedOrder?.total || 0;
    return Math.max(0, paid - total);
  };

  const getRemainingAmount = () => {
    const paid = parseFloat(calculatorValue) || 0;
    const total = selectedOrder?.total || 0;
    return Math.max(0, total - paid);
  };

  // Event listener para teclado físico
  useEffect(() => {
    if (!showPaymentModal) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevenir ações padrão para teclas da calculadora
      if (/^[0-9.]$/.test(e.key) || e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Escape') {
        e.preventDefault();
      }

      if (e.key === 'Escape') {
        closePaymentModal();
      } else if (e.key === 'Delete' || e.key === 'c' || e.key === 'C') {
        setCalculatorValue('0');
        setCalculatorExpression('');
      } else if (e.key === 'Backspace') {
        handleCalculatorClick('Backspace');
      } else if (e.key === 'Enter' || e.key === '=') {
        // Se tem operador, calcular. Senão, processar pagamento
        if (/[+\-*/]/.test(calculatorValue)) {
          handleCalculatorClick('=');
        } else if (paymentMethod && parseFloat(calculatorValue) > 0) {
          processPayment();
        }
      } else if (/^[0-9.+\-*/]$/.test(e.key)) {
        handleCalculatorClick(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaymentModal, calculatorValue, paymentMethod]);

  const openClearTableModal = (order: Order) => {
    setSelectedOrder(order);
    setShowClearTableModal(true);
  };

  const closeClearTableModal = () => {
    setShowClearTableModal(false);
    setSelectedOrder(null);
  };

  // Estados para modal de adicionar produtos
  const [selectedProducts, setSelectedProducts] = useState<{productId: string, quantity: number}[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');

  // Buscar produtos e categorias (apenas quando necessário)
  const { data: productsResponse, loading: productsLoading, execute: fetchProducts } = useApi<{
    data: any[];
    pagination: any;
  }>(`/api/products?isAvailable=true&limit=50`, { 
    immediate: false
  });

  const { data: categoriesResponse, loading: categoriesLoading, execute: fetchCategories } = useApi<{
    data: any[];
    pagination: any;
  }>('/api/categories?isActive=true', { 
    immediate: false
  });

  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // Carregar produtos e categorias quando abrir o modal
  useEffect(() => {
    if (showAddProductsModal) {
      if (!productsResponse?.data) {
        fetchProducts().catch(console.error);
      }
      if (!categoriesResponse?.data) {
        fetchCategories().catch(console.error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddProductsModal]);

  const openAddProductsModal = (order: Order) => {
    setSelectedOrder(order);
    setShowAddProductsModal(true);
  };

  const closeAddProductsModal = () => {
    setShowAddProductsModal(false);
    setSelectedOrder(null);
    setSelectedProducts([]);
    setProductSearch('');
    setSelectedCategoryFilter('');
  };

  // Funções para adicionar produtos
  const addProductToOrder = async (orderId: string) => {
    if (selectedProducts.length === 0) {
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
        setTimeout(() => refetchOrders(), 1000);
        closeAddProductsModal();
        alert('Produtos adicionados com sucesso!');
      } else {
        alert(`Erro ao adicionar produtos: ${data.error || 'Tente novamente'}`);
      }
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      alert('Erro de conexão. Tente novamente.');
    }
  };

  const addProductToSelection = (product: any) => {
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

  // Função para processar pagamento
  const processPayment = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({
          paymentMethod,
          paymentAmount: selectedOrder.total,
          splitPayment,
          splitValue: splitPayment ? splitValue : selectedOrder.total
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao processar pagamento');
      }

      alert('Pagamento processado com sucesso!');
      closePaymentModal();
      refetchOrders();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento');
    }
  };

  // Função para limpar mesa
  const clearTable = async () => {
    if (!selectedOrder?.table) {
      console.log('❌ Nenhuma mesa selecionada');
      return;
    }

    try {
      console.log('🧹 Tentando limpar mesa:', selectedOrder.table.id);
      console.log('🧹 Mesa atual:', selectedOrder.table);
      
      const response = await fetch(`/api/tables/${selectedOrder.table.id}/clear`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      const result = await response.json();
      console.log('📋 Resposta da API:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar mesa');
      }

      console.log('✅ Mesa limpa com sucesso!');
      alert('Mesa limpa com sucesso!');
      closeClearTableModal();
      
      // Atualizar lista de pedidos e mesas
      refetchOrders();
      
      // Aguardar um pouco e atualizar novamente para garantir
      setTimeout(() => {
        refetchOrders();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao limpar mesa:', error);
      alert(`Erro ao limpar mesa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Função para imprimir pedido (Impressora Térmica 58mm)
  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=220,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para impressão');
      return;
    }

    const currentDate = new Date();
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Pedido #${order.id.slice(-8)}</title>
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
            
            .order-id {
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            
            .info-line {
              font-size: 9px;
              margin-bottom: 1px;
            }
            
            .section {
              border-bottom: 1px dashed #000;
              padding: 4px 0;
              margin-bottom: 4px;
            }
            
            .item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 9px;
            }
            
            .item-name {
              flex: 1;
              padding-right: 4px;
            }
            
            .item-qty {
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
            <div class="restaurant-name">LANCHONETE</div>
            <div class="order-id">Pedido #${order.id.slice(-8)}</div>
            <div class="info-line">${currentDate.toLocaleString('pt-BR')}</div>
          </div>
          
          <div class="section">
            <div class="info-line"><span class="bold">Cliente:</span> ${order.user?.name || 'N/A'}</div>
            ${order.table 
              ? `<div class="info-line"><span class="bold">Mesa:</span> ${order.table.number}</div>` 
              : `<div class="info-line"><span class="bold">Balcão:</span> ${new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>`
            }
            <div class="info-line"><span class="bold">Status:</span> ${getStatusLabel(order.status)}</div>
          </div>
          
          <div class="section">
            <div class="bold center" style="margin-bottom: 3px; font-size: 10px;">ITENS DO PEDIDO</div>
            ${order.items.map(item => `
              <div class="item">
                <span class="item-name">
                  <span class="item-qty">${item.quantity}x</span>${item.product?.name || 'Produto'}
                </span>
                <span class="item-price">${formatCurrency(item.price * item.quantity)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            TOTAL: ${formatCurrency(order.total)}
          </div>
          
          ${order.isPaid ? `
            <div class="section center">
              <div class="bold" style="font-size: 10px;">PAGO</div>
              <div class="info-line">Método: ${order.paymentMethod}</div>
              ${order.paymentProcessedAt ? `<div class="info-line">${new Date(order.paymentProcessedAt).toLocaleString('pt-BR')}</div>` : ''}
            </div>
          ` : ''}
          
          <div class="footer">
            <div>Obrigado pela preferência!</div>
            <div style="margin-top: 2px;">Sistema Lanchonete v1.0</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar carregamento e imprimir
    setTimeout(() => {
    printWindow.print();
    }, 500);
  };

  return (
    <ProtectedRoute requiredRole={UserRole.MANAGER}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Moderno */}
          <PageHeader
            title="Expedição"
            subtitle={`Gerencie o fluxo de pedidos - 📅 Exibindo pedidos do dia ${new Date().toLocaleDateString('pt-BR')}`}
            icon="📦"
            gradient="purple"
            actions={
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Novo Pedido Balcão
                </Button>
                <Button
                  variant={autoRefresh ? 'primary' : 'outline'}
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
                </Button>
                <Button onClick={() => refetchOrders()} disabled={ordersLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            }
          />

          {/* Estatísticas Modernas */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
            <StatsCard
              title="Total Hoje"
              value={stats.total.toString()}
              icon={<Package />}
              color="blue"
            />
            <StatsCard
              title="Mesas"
              value={stats.comMesa.toString()}
              icon={<Package />}
              color="blue"
            />
            <StatsCard
              title="Balcão"
              value={stats.balcao.toString()}
              icon={<ShoppingCart />}
              color="orange"
            />
            <StatsCard
              title="Confirmado"
              value={stats.confirmado.toString()}
              icon={<CheckCircle />}
              color="blue"
            />
            <StatsCard
              title="Preparando"
              value={stats.preparando.toString()}
              icon={<Clock />}
              color="yellow"
            />
            <StatsCard
              title="Entregue"
              value={stats.entregue.toString()}
              icon={<Truck />}
              color="green"
            />
            <StatsCard
              title="Finalizado"
              value={stats.finalizado.toString()}
              icon={<CheckCircle />}
              color="purple"
            />
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <div className="flex flex-col gap-4">
              {/* Campo de Busca */}
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por pedido, cliente, mesa ou 'balcao'..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Filtros de Status - Scroll horizontal no mobile */}
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedStatus === 'ALL' ? 'primary' : 'outline'}
                    onClick={() => setSelectedStatus('ALL')}
                    className="whitespace-nowrap"
                  >
                    📋 Todos
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStatus === OrderStatus.CONFIRMADO ? 'primary' : 'outline'}
                    onClick={() => setSelectedStatus(OrderStatus.CONFIRMADO)}
                    className="whitespace-nowrap"
                  >
                    ✅ Confirmado
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStatus === OrderStatus.PREPARANDO ? 'primary' : 'outline'}
                    onClick={() => setSelectedStatus(OrderStatus.PREPARANDO)}
                    className="whitespace-nowrap"
                  >
                    🔥 Preparando
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStatus === OrderStatus.ENTREGUE ? 'primary' : 'outline'}
                    onClick={() => setSelectedStatus(OrderStatus.ENTREGUE)}
                    className="whitespace-nowrap"
                  >
                    📦 Entregue
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedStatus === OrderStatus.FINALIZADO ? 'primary' : 'outline'}
                    onClick={() => setSelectedStatus(OrderStatus.FINALIZADO)}
                    className="whitespace-nowrap"
                  >
                    ✓ Finalizado
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Carregando pedidos...</p>
                        </div>
            ) : filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-600">
                    {searchTerm ? 'Tente ajustar os filtros de busca' : 'Não há pedidos no momento'}
                </p>
          </CardContent>
        </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-all hover:scale-[1.01]">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                      {/* Informações principais - Empilham no mobile */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Package className="h-5 w-5 text-blue-600" />
                          <span className="font-bold text-gray-900 text-base sm:text-lg">Pedido #{order.id.slice(-8)}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {order.user && (
                            <div className="flex items-center text-gray-700">
                              <User className="h-4 w-4 mr-1" />
                              <span className="font-medium">{order.user.name}</span>
                            </div>
                          )}
                          
                          {order.table ? (
                            <div className="flex items-center text-gray-700">
                              <Package className="h-4 w-4 mr-1" />
                              <span className="font-medium">Mesa {order.table.number}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <ShoppingCart className="h-4 w-4 mr-1 text-orange-600" />
                              <span className="font-bold text-orange-600">
                                Balcão {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                            <span className="sm:hidden">{new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Total e badges - Lado direito no desktop, embaixo no mobile */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <div className="flex items-center gap-2">
                          {order.isPaid && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Pago
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(order.total)}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{order.items.length} item(s)</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Itens do Pedido */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sm:text-base">
                          <Package className="h-4 w-4 mr-2 text-blue-600" />
                          Itens do Pedido
                        </h4>
                        <div className="space-y-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                              <div className="flex items-center space-x-2">
                                <span className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                  {item.quantity}
                                </span>
                                <span className="font-medium text-gray-900 text-sm sm:text-base">{item.product?.name || 'Produto'}</span>
                              </div>
                              <span className="font-bold text-blue-600 text-sm sm:text-base">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{order.items.length - 3} item(ns) adicional(is)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações de Status e Caixa */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-4 border-t">
                        {/* Botões de Status - apenas para pedidos não finalizados */}
                        {order.status !== OrderStatus.FINALIZADO && (
                          <>
                            {order.status === OrderStatus.CONFIRMADO && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, OrderStatus.PREPARANDO)}
                                className="col-span-2 sm:col-span-1"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Iniciar Preparo</span>
                                <span className="sm:hidden">Preparar</span>
                              </Button>
                            )}
                            {order.status === OrderStatus.PREPARANDO && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, OrderStatus.ENTREGUE)}
                                className="col-span-2 sm:col-span-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Marcar Entregue</span>
                                <span className="sm:hidden">Entregar</span>
                              </Button>
                            )}
                          </>
                        )}
                        
                        {/* Botões de Caixa - sempre visíveis */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetailsModal(order)}
                        >
                          <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Ver Detalhes</span>
                          <span className="sm:hidden">Detalhes</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printOrder(order)}
                        >
                          <Printer className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Imprimir</span>
                          <span className="sm:hidden">🖨️</span>
                        </Button>
                        
                        {/* Botão Adicionar Produtos - apenas para pedidos de mesa não finalizados */}
                        {order.table && order.status !== OrderStatus.FINALIZADO && order.status !== OrderStatus.ENTREGUE && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 col-span-2 sm:col-span-1"
                            onClick={() => openAddProductsModal(order)}
                          >
                            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Adicionar Produtos</span>
                            <span className="sm:hidden">Adicionar</span>
                          </Button>
                        )}
                        
                        {/* Botão Receber Pedido - para TODOS os pedidos não finalizados (mesa e balcão) */}
                        {order.status !== OrderStatus.FINALIZADO && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 col-span-2 sm:col-span-1 font-semibold"
                            onClick={() => openPaymentModal(order)}
                          >
                            <CreditCard className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Receber Pedido</span>
                            <span className="sm:hidden">Receber</span>
                          </Button>
                        )}
                        
                        {/* Botão Limpar Mesa - apenas para pedidos de mesa entregues/finalizados */}
                        {order.table && (order.status === OrderStatus.ENTREGUE || order.status === OrderStatus.FINALIZADO) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openClearTableModal(order)}
                            className="col-span-2 sm:col-span-1"
                          >
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Limpar Mesa</span>
                            <span className="sm:hidden">Limpar</span>
                          </Button>
                        )}
                      </div>
                </div>
              </CardContent>
            </Card>
              ))
        )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-600">
              <h3 className="text-lg sm:text-xl font-bold text-white">Detalhes do Pedido #{selectedOrder.id.slice(-8)}</h3>
              <Button variant="ghost" onClick={closeDetailsModal} className="text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Content - scrollável */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Card de Informações Principais */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-xl border-2 border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Cliente</p>
                        <p className="font-bold text-gray-900">{selectedOrder.user?.name || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${selectedOrder.table ? 'bg-gray-500' : 'bg-orange-500'}`}>
                        {selectedOrder.table ? <Package className="h-5 w-5 text-white" /> : <ShoppingCart className="h-5 w-5 text-white" />}
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 font-medium">{selectedOrder.table ? 'Mesa' : 'Local'}</p>
                        <p className={`font-bold ${selectedOrder.table ? 'text-gray-900' : 'text-orange-600'}`}>
                          {selectedOrder.table 
                            ? `Mesa ${selectedOrder.table.number}` 
                            : `Balcão ${new Date(selectedOrder.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Data/Hora</p>
                        <p className="font-bold text-gray-900 text-sm">{new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-500 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Status</p>
                        <Badge className={getStatusColor(selectedOrder.status)}>
                          {getStatusLabel(selectedOrder.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card de Pagamento */}
                <div className={`p-4 sm:p-6 rounded-xl border-2 ${
                  selectedOrder.isPaid 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${selectedOrder.isPaid ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${selectedOrder.isPaid ? 'text-green-700' : 'text-yellow-700'}`}>
                          Pagamento
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={selectedOrder.isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                            {selectedOrder.isPaid ? '✓ Pago' : '⏳ Pendente'}
                          </Badge>
                          {selectedOrder.isPaid && (
                            <span className="text-xs text-green-600 font-medium">
                              {selectedOrder.paymentMethod}
                            </span>
                          )}
                        </div>
                        {selectedOrder.isPaid && selectedOrder.paymentProcessedAt && (
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(selectedOrder.paymentProcessedAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              
                {/* Itens do Pedido */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Itens do Pedido ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {item.quantity}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.product?.name || 'Produto'}</p>
                            <p className="text-xs text-gray-600">{formatCurrency(item.price)} cada</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              
                {/* Resumo Total */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-white">TOTAL DO PEDIDO</span>
                    <span className="text-3xl font-bold text-white">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer fixo */}
            <div className="border-t p-4 sm:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
                <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  <p>📋 Visualização completa do pedido</p>
                </div>
                <Button onClick={closeDetailsModal} className="w-full sm:w-auto sm:px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold">
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recebimento de Pagamento com Calculadora */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header com Gradiente */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    💰 Receber Pagamento
                  </h3>
                  <p className="text-green-100 text-sm mt-1">
                    Pedido #{selectedOrder.id.slice(-8)} - {selectedOrder.table 
                      ? `Mesa ${selectedOrder.table.number}` 
                      : `Balcão ${new Date(selectedOrder.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    }
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closePaymentModal}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-6 w-6" />
              </Button>
              </div>
            </div>

            {/* Content com scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Total a Pagar */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl border-2 border-gray-200">
              <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total a Receber</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
              </div>
              
              {/* Display da Calculadora */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-xl border-2 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-blue-800">Valor Pago</p>
                  <p className="text-xs text-blue-600 italic">💡 Use o teclado numérico</p>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-blue-300 mb-3">
                  {calculatorExpression && (
                    <p className="text-xs sm:text-sm text-gray-500 text-right mb-1">{calculatorExpression}</p>
                  )}
                  <p className="text-2xl sm:text-3xl font-bold text-right text-blue-900">
                    {calculatorValue}
                  </p>
                </div>

                {/* Calculadora */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {['7', '8', '9', '←'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleCalculatorClick(btn)}
                      className="p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg font-bold text-base sm:text-lg hover:bg-blue-50 hover:border-blue-400 transition-all active:scale-95"
                    >
                      {btn}
                    </button>
                  ))}
                  {['4', '5', '6', 'C'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleCalculatorClick(btn)}
                      className="p-3 sm:p-4 bg-white border-2 border-gray-300 rounded-lg font-bold text-base sm:text-lg hover:bg-blue-50 hover:border-blue-400 transition-all active:scale-95"
                    >
                      {btn}
                    </button>
                  ))}
                  {['1', '2', '3', '+'].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleCalculatorClick(btn)}
                      className={`p-3 sm:p-4 border-2 rounded-lg font-bold text-base sm:text-lg transition-all active:scale-95 ${
                        btn === '+' 
                          ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'
                          : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                  {['0', '.', '-', '='].map((btn) => (
                    <button
                      key={btn}
                      onClick={() => handleCalculatorClick(btn)}
                      className={`p-3 sm:p-4 border-2 rounded-lg font-bold text-base sm:text-lg transition-all active:scale-95 ${
                        btn === '-' 
                          ? 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600'
                          : btn === '='
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-600 hover:from-blue-600 hover:to-indigo-700'
                          : 'bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400'
                      }`}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
                
                {/* Botões Especiais */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => {
                      setCalculatorValue(selectedOrder.total.toFixed(2));
                      setCalculatorExpression('');
                    }}
                    className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-2 border-green-600 rounded-lg font-bold text-xs sm:text-sm hover:from-green-600 hover:to-emerald-700 transition-all active:scale-95"
                  >
                    💰 Valor Exato
                  </button>
                  <button
                    onClick={() => {
                      setCalculatorValue(`${selectedOrder.total.toFixed(2)}-`);
                      setCalculatorExpression('Total -');
                    }}
                    className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-2 border-blue-600 rounded-lg font-bold text-xs sm:text-sm hover:from-blue-600 hover:to-indigo-700 transition-all active:scale-95"
                  >
                    🧮 Total - Pago
                  </button>
                </div>
              </div>

              {/* Informações de Pagamento */}
              {parseFloat(calculatorValue) > 0 && (
                <div className="space-y-2">
                  {/* Falta Pagar (se pagamento parcial) */}
                  {getRemainingAmount() > 0 && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 p-3 sm:p-4 rounded-xl animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl sm:text-3xl">⚠️</span>
                          <span className="font-bold text-red-800 text-sm sm:text-base">Falta Pagar:</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-red-700">
                          {formatCurrency(getRemainingAmount())}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Troco (se pagamento for maior que o total) */}
                  {paymentMethod === 'DINHEIRO' && getCalculatedChange() > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 p-3 sm:p-4 rounded-xl animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl sm:text-3xl">💰</span>
                          <span className="font-bold text-yellow-800 text-sm sm:text-base">Troco:</span>
                        </div>
                        <span className="text-xl sm:text-2xl font-bold text-yellow-700">
                          {formatCurrency(getCalculatedChange())}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Pagamento Completo */}
                  {getRemainingAmount() === 0 && getCalculatedChange() === 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 p-3 sm:p-4 rounded-xl animate-fadeIn">
                      <div className="flex justify-center items-center space-x-2">
                        <span className="text-2xl sm:text-3xl">✅</span>
                        <span className="font-bold text-green-800 text-sm sm:text-base">Pagamento Exato!</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Método de Pagamento - Cards */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                  Método de Pagamento
                  </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'PIX'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl mb-1">💳</div>
                      <p className={`text-xs sm:text-sm font-semibold ${
                        paymentMethod === 'PIX' ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        PIX
                      </p>
                </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARTAO')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'CARTAO'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl mb-1">💳</div>
                      <p className={`text-xs sm:text-sm font-semibold ${
                        paymentMethod === 'CARTAO' ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Cartão
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('DINHEIRO')}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'DINHEIRO'
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl mb-1">💵</div>
                      <p className={`text-xs sm:text-sm font-semibold ${
                        paymentMethod === 'DINHEIRO' ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                        Dinheiro
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer fixo */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-b-2xl border-t border-gray-200 flex-shrink-0">
              <div className="text-center mb-3 hidden sm:block">
                <p className="text-xs text-gray-500">
                  💡 Use o teclado numérico ou clique nos botões • "Total - Pago" calcula o que falta receber
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={closePaymentModal}
                  className="w-full sm:flex-1 py-3 font-semibold order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={processPayment}
                  disabled={!paymentMethod || parseFloat(calculatorValue) <= 0}
                  className="w-full sm:flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Confirmar Pagamento</span>
                  <span className="sm:hidden">Confirmar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Limpeza de Mesa */}
      {showClearTableModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-red-500 to-rose-600">
              <h3 className="text-lg sm:text-xl font-bold text-white">Limpar Mesa</h3>
              <Button variant="ghost" onClick={closeClearTableModal} className="text-white hover:bg-white/20">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="text-center">
                <div className="text-5xl mb-4">🧹</div>
                <p className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  Deseja realmente limpar a mesa {selectedOrder.table?.number}?
                </p>
                <p className="text-sm text-gray-600">
                  Esta ação irá liberar a mesa para novos clientes.
                </p>
              </div>
            </div>
              
            {/* Footer */}
            <div className="border-t p-4 sm:p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={closeClearTableModal}
                  className="w-full sm:flex-1 order-2 sm:order-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={clearTable} 
                  className="w-full sm:flex-1 order-1 sm:order-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold"
                >
                  Sim, Limpar Mesa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Produtos */}
      {showAddProductsModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header com Gradiente */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b-0 bg-gradient-to-r from-purple-500 to-indigo-600">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-white" />
                  Adicionar Produtos ao Pedido
                </h3>
                <p className="text-sm text-purple-100 mt-1">
                  Pedido #{selectedOrder.id.slice(-8)} - {selectedOrder.table 
                    ? `Mesa ${selectedOrder.table.number}` 
                    : `Balcão ${new Date(selectedOrder.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => addProductToOrder(selectedOrder.id)}
                  disabled={selectedProducts.length === 0 || productsLoading || categoriesLoading}
                  className="bg-white text-purple-600 hover:bg-purple-50 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  onClick={closeAddProductsModal}
                  className="text-white hover:text-purple-100 hover:bg-white/20"
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
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Produtos Selecionados */}
              {selectedProducts.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl shadow-md">
                  <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Produtos Selecionados:
                  </h4>
                  <div className="space-y-2">
                    {selectedProducts.map((item) => {
                      const product = products.find((p: any) => p.id === item.productId);
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
                  .filter((product: any) => {
                    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
                    const matchesCategory = !selectedCategoryFilter || product.categoryId === selectedCategoryFilter;
                    return matchesSearch && matchesCategory && product.isAvailable;
                  })
                  .map((product: any) => (
                    <div key={product.id} className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-xl hover:scale-105 hover:border-purple-300 transition-all duration-300 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                        <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{formatCurrency(product.price)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addProductToSelection(product)}
                        className="w-full text-xs bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 border-0 font-bold shadow-md"
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

            {/* Footer com Gradiente */}
            <div className="p-4 sm:p-6 border-t-0 bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                    <ShoppingCart className="h-4 w-4 mr-2 text-purple-600" />
                    {selectedProducts.length} produto(s) selecionado(s)
                  </span>
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  Total: {formatCurrency(selectedProducts.reduce((total, item) => {
                    const product = products.find((p: any) => p.id === item.productId);
                    return total + (product?.price || 0) * item.quantity;
                  }, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}