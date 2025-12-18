'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { LogoutWithPendingOrdersCheck } from '@/components/LogoutWithPendingOrdersCheck';
import { PendingOrdersIndicator } from '@/components/PendingOrdersIndicator';
import { UnpaidOrdersAlert } from '@/components/UnpaidOrdersAlert';
import { usePendingOrdersWarning } from '@/hooks/usePendingOrdersWarning';
import { UserRole, Order, OrderStatus, Table, TableStatus } from '@/types';
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
  Trash2,
  User,
  Plus,
  ShoppingCart,
  X,
  LogOut
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { table } from 'console';
import { OrderDetailsButton } from '@/components/staff/OrderDetailsModal';
import { title } from 'process';
import { toast } from '@/lib/toast';

// Função utilitária para cálculos monetários precisos
const preciseMoneyCalculation = {
  // Converter para centavos (inteiro)
  toCents: (value: number): number => Math.round(value * 100),
  
  // Converter de centavos para reais
  fromCents: (cents: number): number => cents / 100,
  
  // Somar valores monetários
  add: (a: number, b: number): number => {
    return preciseMoneyCalculation.fromCents(
      preciseMoneyCalculation.toCents(a) + preciseMoneyCalculation.toCents(b)
    );
  },
  
  // Subtrair valores monetários
  subtract: (a: number, b: number): number => {
    return preciseMoneyCalculation.fromCents(
      Math.max(0, preciseMoneyCalculation.toCents(a) - preciseMoneyCalculation.toCents(b))
    );
  }
};

export default function ExpedicaoPage() {
  const { user, isAuthenticated, isLoading, token } = useApiAuth();
  
  // Hook para avisar sobre pedidos pendentes ao fechar o navegador
  usePendingOrdersWarning({
    enabled: true,
    checkInterval: 20000, // Verificar a cada 20 segundos (mais frequente na expedição)
    customMessage: '⚠️ ATENÇÃO: Você tem pedidos não pagos na expedição! Finalize todos os pedidos antes de sair.'
  });
  
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Estados para modais de caixa
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClearTableModal, setShowClearTableModal] = useState(false);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  // Estados antigos removidos - usando apenas o novo modal de pagamento
  
  // Estados para o modal de pagamento (igual ao staff)
  const [paymentInputValue, setPaymentInputValue] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'PIX' | 'CARTAO' | 'DINHEIRO' | ''>('');
  const [paymentSession, setPaymentSession] = useState<{
    id: string;
    orderId: string;
    originalTotal: number;
    currentTotal: number;
    payments: Array<{
      method: 'PIX' | 'CARTAO' | 'DINHEIRO';
      amount: number;
      timestamp: Date;
    }>;
    isActive: boolean;
  } | null>(null);

  // Buscar pedidos
  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>('/api/orders?includeItems=true&includeUser=true&includeTable=true');

  const orders = useMemo(() => ordersResponse?.data || [], [ordersResponse?.data]);
  
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
      toast.error('ID inválido', 'Erro: ID do pedido inválido');
      return;
    }
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`
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
      toast.error('Erro ao atualizar status do pedido', 'Tente novamente.');
    }
  };

  // Funções para modais

  const openPaymentModal = (order: Order) => {
    setSelectedOrder(order);
    
    // Criar nova sessão de pagamento (igual ao staff)
    const newSession = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      originalTotal: order.total,
      currentTotal: order.total,
      payments: [],
      isActive: true
    };
    
    setPaymentSession(newSession);
    setSelectedOrder(order);
    setPaymentInputValue('');
    setSelectedPaymentMethod('');
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedOrder(null);
    setPaymentInputValue('');
    setSelectedPaymentMethod('');
    setPaymentSession(null);
  };

  // Funções do modal de pagamento (igual ao staff)
  const handlePaymentInputChange = (value: string) => {
    console.log('🔍 Input Change:', { originalValue: value, currentState: paymentInputValue });
    console.log('🔍 Modal State:', { showPaymentModal, selectedOrder: !!selectedOrder, paymentSession: !!paymentSession });
    
    // Se o valor estiver vazio, permitir
    if (value === '') {
      setPaymentInputValue('');
      return;
    }
    
    // Permitir números, ponto e vírgula decimal
    let cleanValue = value.replace(/[^0-9.,]/g, '');
    
    // Verificar se há múltiplos separadores decimais antes de converter
    const commaCount = (cleanValue.match(/,/g) || []).length;
    const dotCount = (cleanValue.match(/\./g) || []).length;
    
    if (commaCount > 1 || dotCount > 1 || (commaCount > 0 && dotCount > 0)) {
      console.log('❌ Múltiplos separadores decimais rejeitados:', { commaCount, dotCount });
      return;
    }
    
    // Converter vírgula para ponto (padrão brasileiro)
    cleanValue = cleanValue.replace(',', '.');
    
    // Não permitir que comece com ponto
    if (cleanValue.startsWith('.')) {
      cleanValue = '0' + cleanValue;
    }
    
    // Limitar a 2 casas decimais
    const parts = cleanValue.split('.');
    if (parts[1] && parts[1].length > 2) {
      console.log('❌ Mais de 2 casas decimais rejeitadas:', { decimalPart: parts[1], length: parts[1].length });
      return; // Não permitir mais de 2 casas decimais
    }
    
    // Não permitir valores muito grandes (mais de 999999.99)
    const numericValue = parseFloat(cleanValue);
    if (isNaN(numericValue)) {
      console.log('❌ Valor inválido (NaN)');
      return;
    }
    
    if (numericValue > 999999.99) {
      console.log('❌ Valor muito grande rejeitado:', { numericValue });
      return;
    }
    
    console.log('✅ Valor aceito:', { originalValue: value, cleanValue, numericValue });
    setPaymentInputValue(cleanValue);
  };

  const handlePaymentMethodSelect = (method: 'PIX' | 'CARTAO' | 'DINHEIRO') => {
    if (!paymentSession) return;
    
    setSelectedPaymentMethod(method);
    
    // Usar função utilitária para cálculos monetários precisos
    console.log('🔍 Processando pagamento:', { paymentInputValue, type: typeof paymentInputValue });
    
    // Garantir que o valor não tenha vírgula antes do parseFloat
    const cleanPaymentValue = paymentInputValue.replace(',', '.');
    const numericValue = parseFloat(cleanPaymentValue) || 0;
    
    console.log('🔍 Valor processado:', { cleanPaymentValue, numericValue });
    
    // Adicionar pagamento à sessão
    const newPayment = {
      method,
      amount: numericValue,
      timestamp: new Date()
    };
    
    // Calcular novo total usando função utilitária
    const newTotal = preciseMoneyCalculation.subtract(paymentSession.currentTotal, numericValue);
    
    // Debug logs
    console.log('🔍 Debug Pagamento:', {
      method,
      numericValue,
      currentTotal: paymentSession.currentTotal,
      newTotal,
      isZero: newTotal === 0,
      isLessThanZero: newTotal < 0,
      calculation: `${paymentSession.currentTotal} - ${numericValue} = ${newTotal}`
    });
    
    const updatedSession = {
      ...paymentSession,
      currentTotal: newTotal,
      payments: [...paymentSession.payments, newPayment]
    };
    
    setPaymentSession(updatedSession);
    setPaymentInputValue('');
    setSelectedPaymentMethod('');
  };

  const processTablePayment = async () => {
    console.log('🔍 Processando pagamento:', { paymentSession, currentTotal: paymentSession?.currentTotal });
    
    if (!paymentSession || paymentSession.currentTotal > 0.01) {
      console.log('❌ Pagamento não pode ser processado:', { 
        hasSession: !!paymentSession, 
        currentTotal: paymentSession?.currentTotal 
      });
      return;
    }
    
    try {
      const requestBody = {
        paymentSession: {
          payments: paymentSession.payments,
          totalPaid: paymentSession.originalTotal
        },
        totalPaid: paymentSession.originalTotal
      };
      
      console.log('🔍 Enviando pagamento:', { 
        orderId: paymentSession.orderId, 
        requestBody,
        payments: paymentSession.payments,
        originalTotal: paymentSession.originalTotal
      });
      
      const response = await fetch(`/api/orders/${paymentSession.orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro na API:', { status: response.status, statusText: response.statusText, errorData });
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Pagamento processado com sucesso:', result);
      toast.success('Pagamento processado', 'Pedido pago com sucesso.');
      closePaymentModal();
      refetchOrders();
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  // Funções da calculadora (mantidas para compatibilidade)
  // Função da calculadora antiga removida

  // Funções da calculadora antiga removidas - usando apenas o novo modal de pagamento

  const openClearTableModal = (order: Order) => {
    setSelectedOrder(order);
    setShowClearTableModal(true);
  };

  const closeClearTableModal = () => {
    setShowClearTableModal(false);
    setSelectedOrder(null);
  };

  // Estados para modal de adicionar produtos
  const [selectedProducts, setSelectedProducts] = useState<{productId: string, quantity: number, notes?: string, adicionaisIds?: string[]}[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [productAdicionais, setProductAdicionais] = useState<{[productId: string]: any[]}>({});

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
    setProductAdicionais({});
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
          'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ items: selectedProducts }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTimeout(() => refetchOrders(), 1000);
        closeAddProductsModal();
        toast.success('Produtos adicionados', 'Itens adicionados ao pedido.');
      } else {
        toast.error('Erro ao adicionar produtos', data.error || 'Tente novamente');
      }
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      toast.error('Erro de conexão', 'Tente novamente.');
    }
  };

  const addProductToSelection = async (product: any) => {
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
      // Fetch adicionais para este produto
      try {
        const response = await fetch(`/api/products/${product.id}/adicionais`);
        if (response.ok) {
          const result = await response.json();
          setProductAdicionais(prev => ({
            ...prev,
            [product.id]: result.data || []
          }));
        }
      } catch (error) {
        console.error('Error fetching adicionais:', error);
      }
      
      setSelectedProducts(prev => [...prev, { productId: product.id, quantity: 1, notes: '', adicionaisIds: [] }]);
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

  // Função para processar pagamento antiga removida - usando apenas processTablePayment

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
          'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`
        }
      });

      const result = await response.json();
      console.log('📋 Resposta da API:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao limpar mesa');
      }

      console.log('✅ Mesa limpa com sucesso!');
      toast.success('Mesa limpa', 'A mesa foi marcada como livre.');
      closeClearTableModal();
      
      // Atualizar lista de pedidos e mesas
      refetchOrders();
      
      // Aguardar um pouco e atualizar novamente para garantir
      setTimeout(() => {
        refetchOrders();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao limpar mesa:', error);
      toast.error('Erro ao limpar mesa', error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  // Função para imprimir pedido (Impressora Térmica 58mm)
  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=220,height=600');
    if (!printWindow) {
      toast.info('Permita pop-ups para impressão');
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
            <div class="info-line"><span class="bold">Cliente: </span> ${order.user?.name || 'N/A'}</div>
           
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
                  <p className="text-xs text-gray-500">${item.notes ? `(${item.notes})` : ''}</p>
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

  {/* Função para cancelar pedido e liberar mesa */}
const cancelOrder = async (order: Order) => {
  const ok = window.confirm('Confirmar cancelamento do pedido?');
  if (!ok) return;
  try {
    const response = await fetch(`/api/orders/${order.id}` , {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`
      },
      body: JSON.stringify({ status: 'CANCELADO' })
    });
    const result = await response.json();
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || 'Erro ao cancelar pedido');
    }
    toast.success('Pedido cancelado', 'O pedido foi cancelado.');
    refetchOrders();
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    toast.error('Erro ao cancelar pedido', error instanceof Error ? error.message : 'Erro desconhecido');
  }
};
  

  return (
    // Acesso estrito: apenas MANAGER e ADMIN podem acessar a expedição
    <ProtectedRoute allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        {/* Indicador de Pedidos Pendentes */}
        <PendingOrdersIndicator showDetails={true} />
        
        {/* Alerta de Pedidos Não Pagos */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <UnpaidOrdersAlert onRefresh={refetchOrders} />
        </div>
        
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
                
                <LogoutWithPendingOrdersCheck
                  variant="outline"
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </LogoutWithPendingOrdersCheck>
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
                    ✅ Confirmados
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
                    ✓ Finalizados
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
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Link href="/staff" className="inline-block">
                      <Button variant="primary">
                        <Plus className="h-4 w-4 mr-1" /> Criar pedido no Caixa
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => refetchOrders()}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
                    </Button>
                  </div>
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
                          {order.isPaid && order.isActive === false &&(
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CreditCard className="h-3 w-3 mr-1" />
                              Pago
                            </Badge>
                          )}
                          { order.status === OrderStatus.CANCELADO && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Clock className="h-3 w-3 mr-1" />
                             Cancelado
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
                                <p className="text-xs text-gray-500">{item.notes}</p>
                              </div>
                              <span className="font-bold text-blue-600 text-sm sm:text-base">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{order.items.length - 3} item(ns) adicional(is) "não exbidos nesta lista"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Ações de Status e Caixa */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 pt-4 border-t">
                        {/* Se pedido NÃO estiver pago - mostrar todos os botões */}
                        {!order.isPaid && (
                          <>
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
                            
                            {/* Botão Adicionar Produtos - apenas para pedidos de mesa não finalizados */}
                            {order.status !== OrderStatus.FINALIZADO && order.status !== OrderStatus.CANCELADO && (
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
                            {order.status === OrderStatus.FINALIZADO && !order.isPaid && order.isActive === true && (
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
                          
                            {/* Botão Liberar Mesa - para pedidos pagos de mesa */}
                            
                            
                           
                          </>
                        )}
                      
                        
                        {/* Botões sempre visíveis - Imprimir */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => printOrder(order)}
                        >
                          <Printer className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Imprimir</span>
                          <span className="sm:hidden">🖨️</span>
                        </Button>
                          {/* Botão Detalhes do Pedido */}
                          <OrderDetailsButton order={order} />
                          {/* Botão Cancelar Pedido e Liberar Mesa sera exibido apenas para pedidos ativos e que não foram finalizados ou entregues */}
                          {order.isActive === true && order.status !== OrderStatus.FINALIZADO && order.status !== OrderStatus.ENTREGUE && order.status !== OrderStatus.CANCELADO && ( 
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelOrder(order)}
                            className="whitespace-nowrap text-red-600 border-red-300 hover:bg-red-100 col-span-2 sm:col-span-1 font-semibold"
                          >
                            <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Cancelar Pedido </span>
                            <span className="sm:hidden">Cancelar e Liberar</span>
                          </Button> 

 ) }
                         {/* Botão Limpar Mesa - apenas para pedidos de mesa entregues/finalizados */}
                            {order.table && order.status === OrderStatus.FINALIZADO &&  order.table.status === TableStatus.OCUPADA && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openClearTableModal(order)}
                                className="whitespace-nowrap text-red-600 border-red-300 hover:bg-red-100 col-span-2 sm:col-span-1 font-semibold"
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


      {/* Modal de Pagamento - Cópia do Staff */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
              <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                    <h2 className="text-xl font-bold text-white">Processar Pagamento</h2>
                    <p className="text-green-100 text-sm">
                          {selectedOrder.table 
                            ? `Mesa ${selectedOrder.table.number}` 
                        : `Balcão`} - Pedido #{selectedOrder.id.slice(-8)}
                        </p>
                      </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closePaymentModal}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
              </Button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Total do Pedido */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
              <div className="text-center">
                    <p className="text-lg font-semibold text-blue-800 mb-2">Total do Pedido</p>
                    <p className="text-4xl font-bold text-blue-900">
                      {formatCurrency(paymentSession?.originalTotal || 0)}
                    </p>
                    {paymentSession && paymentSession.currentTotal < paymentSession.originalTotal && (
                      <p className="text-sm text-blue-600 mt-1">
                        Valor a pagar: {formatCurrency(paymentSession.currentTotal)}
                      </p>
                    )}
                </div>
                </div>
                
                {/* Input de Valor */}
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-900">
                    Valor a Pagar
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">💰</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={paymentInputValue}
                      onChange={(e) => handlePaymentInputChange(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                      autoFocus
                      style={{ pointerEvents: 'auto', userSelect: 'auto' }}
                    />
                </div>
              </div>

                {/* Status do Pagamento */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Valor Pago:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(paymentSession ? 
                        paymentSession.payments.reduce((total, payment) => 
                          preciseMoneyCalculation.add(total, payment.amount), 0) : 0)}
                        </span>
                      </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="font-semibold text-gray-700">Restante:</span>
                    <span className={`text-xl font-bold ${(paymentSession?.currentTotal || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(paymentSession?.currentTotal || 0)}
                        </span>
                      </div>
                    </div>

                {/* Seleção do Método de Pagamento */}
                {paymentSession && paymentSession.currentTotal > 0.01 && (
                  <div className="space-y-4">
                    <label className="block text-lg font-semibold text-gray-900">
                  Método de Pagamento
                  </label>
                    <div className="grid grid-cols-3 gap-4">
                  <button
                    type="button"
                        onClick={() => handlePaymentMethodSelect('PIX')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedPaymentMethod === 'PIX'
                        ? 'border-green-500 bg-green-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                          <div className="text-3xl mb-2">💳</div>
                          <p className={`font-semibold ${
                            selectedPaymentMethod === 'PIX' ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        PIX
                      </p>
                </div>
                  </button>

                  <button
                    type="button"
                        onClick={() => handlePaymentMethodSelect('CARTAO')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedPaymentMethod === 'CARTAO'
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                          <div className="text-3xl mb-2">💳</div>
                          <p className={`font-semibold ${
                            selectedPaymentMethod === 'CARTAO' ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        Cartão
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                        onClick={() => handlePaymentMethodSelect('DINHEIRO')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedPaymentMethod === 'DINHEIRO'
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg scale-105'
                        : 'border-gray-200 bg-white hover:border-yellow-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-center">
                          <div className="text-3xl mb-2">💵</div>
                          <p className={`font-semibold ${
                            selectedPaymentMethod === 'DINHEIRO' ? 'text-yellow-700' : 'text-gray-700'
                      }`}>
                        Dinheiro
                      </p>
                    </div>
                  </button>
                </div>
              </div>
                )}

                {/* Histórico de Pagamentos */}
                {paymentSession && paymentSession.payments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Pagamentos Realizados</h3>
                    <div className="space-y-2">
                      {paymentSession.payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {payment.method === 'PIX' ? '📱' : payment.method === 'CARTAO' ? '💳' : '💰'}
                            </span>
                            <span className="font-medium">{payment.method}</span>
            </div>
                          <span className="font-bold text-green-600">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensagem de Status */}
                {paymentSession && paymentSession.currentTotal > 0.01 && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">⚠️</span>
                      <span className="font-semibold text-yellow-800">
                        Ainda falta {formatCurrency(paymentSession.currentTotal)} para completar o pagamento. Selecione um método para pagar o restante.
                      </span>
              </div>
                  </div>
                )}

                {paymentSession && paymentSession.currentTotal <= 0.01 && paymentSession.payments.length > 0 && (
                  <div className="bg-green-50 border-2 border-green-300 p-4 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">✅</span>
                      <span className="font-semibold text-green-800">
                        Pagamento completo! Pronto para processar.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer do Modal */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {paymentSession && paymentSession.currentTotal <= 0.01 && paymentSession.payments.length > 0 && (
                    <span>Pronto para processar pagamento</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={closePaymentModal}
                    className="px-6 py-2"
                >
                  Cancelar
                </Button>
                {!selectedOrder?.isPaid && (
                  <Button
                    onClick={processTablePayment}
                    disabled={(paymentSession?.currentTotal || 0) > 0.01 || !paymentSession || paymentSession.payments.length === 0}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Processar Pagamento 
                  </Button>
                )}
                </div>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={closeClearTableModal}
                className="text-white hover:bg-white/20 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirmar limpeza da mesa?
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Esta ação irá marcar a mesa como disponível e finalizar o pedido. 
                  Esta ação não pode ser desfeita.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-600">
                    <strong>Pedido:</strong> #{selectedOrder.id.slice(-8)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Mesa:</strong> {selectedOrder.table?.number || 'Balcão'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Total:</strong> {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
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
            {/* Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gradient-to-r from-blue-500 to-indigo-600">
              <h3 className="text-lg sm:text-xl font-bold text-white">Adicionar Produtos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                onClick={() => setShowAddProductsModal(false)}
                className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Informações do Pedido */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Pedido #{selectedOrder.id.slice(-8)}</h4>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span><strong>Cliente:</strong> {selectedOrder.user?.name || 'N/A'}</span>
                    <span><strong>Mesa:</strong> {selectedOrder.table?.number || 'Balcão'}</span>
                    <span><strong>Status:</strong> {getStatusLabel(selectedOrder.status)}</span>
                    <span><strong>Total Atual:</strong> {formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Filtros */}
                <div className="space-y-4">
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
                  
                  {/* Filtro de Categoria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                {/* Lista de Produtos */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Produtos Disponíveis</h4>
                  {productsLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Carregando produtos...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                      {products
                        .filter(product => 
                          product.isAvailable &&
                          (!productSearch || product.name.toLowerCase().includes(productSearch.toLowerCase())) &&
                          (!selectedCategoryFilter || product.categoryId === selectedCategoryFilter)
                        )
                        .map((product) => (
                          <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-900 text-sm">{product.name}</h5>
                              <span className="text-sm font-bold text-blue-600">{formatCurrency(product.price)}</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addProductToSelection(product)}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Produtos Selecionados */}
                {selectedProducts.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Produtos Selecionados</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedProducts.map((selectedProduct) => {
                        const product = products.find(p => p.id === selectedProduct.productId);
                        if (!product) return null;
                        const adicionais = productAdicionais[selectedProduct.productId] || [];
                        
                        return (
                          <div key={selectedProduct.productId} className="flex flex-col p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h6 className="font-medium text-gray-900 text-sm">{product.name}</h6>
                                <p className="text-xs text-gray-600">{formatCurrency(product.price)} cada</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateProductQuantity(selectedProduct.productId, selectedProduct.quantity - 1)}
                                  className="w-8 h-8 p-0"
                                >
                                  -
                                </Button>
                                <span className="w-8 text-center font-medium text-sm">{selectedProduct.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateProductQuantity(selectedProduct.productId, selectedProduct.quantity + 1)}
                                  className="w-8 h-8 p-0"
                                >
                                  +
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeProductFromSelection(selectedProduct.productId)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Adicionais disponíveis */}
                            {adicionais.length > 0 && (
                              <div className="pl-0 pt-2 border-t border-blue-200">
                                <p className="text-xs font-medium text-gray-700 mb-2">Adicionais:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {adicionais.map((adicional) => (
                                    <label key={adicional.id} className="flex items-center space-x-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={selectedProduct.adicionaisIds?.includes(adicional.id) || false}
                                        onChange={(e) => {
                                          const val = e.target.checked;
                                          setSelectedProducts(prev => prev.map(p => 
                                            p.productId === selectedProduct.productId 
                                              ? {
                                                  ...p,
                                                  adicionaisIds: val 
                                                    ? [...(p.adicionaisIds || []), adicional.id]
                                                    : (p.adicionaisIds || []).filter(id => id !== adicional.id)
                                                }
                                              : p
                                          ));
                                        }}
                                        className="w-4 h-4 rounded"
                                      />
                                      <span className="text-xs text-gray-700">
                                        {adicional.name}
                                        {adicional.price > 0 && ` (+${formatCurrency(adicional.price)})`}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Campo de observações */}
                            <div className="pt-2 border-t border-blue-200">
                              <textarea
                                placeholder="Observações (ex.: sem cebola, extra picante)"
                                value={selectedProduct.notes || ''}
                                onChange={(e) => setSelectedProducts(prev => prev.map(p => p.productId === selectedProduct.productId ? { ...p, notes: e.target.value } : p))}
                                className="w-full p-2 border border-gray-200 rounded-md text-sm resize-none"
                                rows={2}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Total dos Produtos Selecionados */}
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total dos produtos selecionados:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(selectedProducts.reduce((total, item) => {
                            const product = products.find(p => p.id === item.productId);
                            return total + (product?.price || 0) * item.quantity;
                          }, 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 sm:p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedProducts.length > 0 && (
                    <span>{selectedProducts.length} produto(s) selecionado(s)</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={closeAddProductsModal}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  {selectedProducts.length > 0 && (
                    <Button
                      onClick={() => addProductToOrder(selectedOrder.id)}
                      className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar ao Pedido
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
