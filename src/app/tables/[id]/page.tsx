'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order, OrderStatus, UserRole, Product, Category, Table } from '@/types';
import { toast } from '@/lib/toast';
// Removido import do StaffTableAPI - será usado via APIs

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
import { 
  ArrowLeft,
  RefreshCw,
  Plus,
  ShoppingCart,
  CheckCircle,
  X,
  Package,
  Clock3,
  CreditCard,
  Receipt,
  Printer,
  Eye
} from 'lucide-react';

export default function TablePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isStaffOrAdmin, token } = useApiAuth();
  const tableId = params.id as string;
  
  // Estados
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{productId: string, quantity: number, price: number, notes?: string}[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  
  // Estados do modal de pagamento da mesa
  const [showTablePaymentModal, setShowTablePaymentModal] = useState(false);
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

  // Buscar dados da mesa
  const { data: tableResponse, loading: tableLoading, execute: refetchTable } = useApi<{ data: Table }>(`/api/tables/${tableId}?includeAssignedUser=true`);

  // Buscar pedidos ativos da mesa
  const { data: ordersResponse, loading: ordersLoading, execute: refetchOrders } = useApi<{ 
    data: Order[]; 
    pagination: any 
  }>(`/api/orders?tableId=${tableId}&includeItems=true&includeUser=true&status=PENDENTE,CONFIRMADO,PREPARANDO,PRONTO&sortBy=createdAt&sortOrder=desc`);

  // Buscar produtos
  const { data: productsResponse, loading: productsLoading, execute: fetchProducts } = useApi<{
    data: Product[];
    pagination: any;
  }>(`/api/products?isAvailable=true&limit=50`, { 
    immediate: false
  });

  // Buscar categorias
  const { data: categoriesResponse, loading: categoriesLoading, execute: fetchCategories } = useApi<{
    data: Category[];
    pagination: any;
  }>('/api/categories?isActive=true', { 
    immediate: false
  });

  const table = tableResponse?.data;
  const orders = ordersResponse?.data || [];
  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];

  // Carregar produtos e categorias quando modal for aberto
  useEffect(() => {
    if (showAddProductsModal) {
      if (!productsResponse?.data) fetchProducts();
      if (!categoriesResponse?.data) fetchCategories();
    }
  }, [showAddProductsModal, productsResponse?.data, categoriesResponse?.data, fetchProducts, fetchCategories]);

  // Verificar se usuário tem permissão (mínimo STAFF)
  if (!isStaffOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-4">
              Apenas staff e gerentes podem acessar esta página.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Função para adicionar produtos ao pedido ativo
  const addProductsToOrder = async () => {
    if (selectedProducts.length === 0) return;
    
    // Garantir que mesa está ativa e existe um pedido elegível (PENDENTE ou CONFIRMADO)
    if (table?.status !== 'OCUPADA') {
      toast.warning('Mesa não está ativa', 'A mesa precisa estar OCUPADA para adicionar produtos.');
      return;
    }

    const eligibleOrder = selectedOrder ?? orders.find(o => !o.isPaid && (o.status === OrderStatus.PENDENTE || o.status === OrderStatus.CONFIRMADO));
    if (!eligibleOrder) {
      toast.warning('Pedido não elegível', 'Somente pedidos PENDENTE ou CONFIRMADO e não pagos podem receber produtos.');
      return;
    }

    console.log('🛒 Adicionando produtos ao pedido:', {
      tableId,
      orderId: eligibleOrder.id,
      selectedProducts
    });

    setLoading(true);
    try {
      const token = localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${eligibleOrder.id}/add-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          products: selectedProducts
        })
      });
      
      if (response.ok) {
        toast.success('Produtos adicionados', 'Os produtos foram adicionados ao pedido da mesa.');
        setShowAddProductsModal(false);
        setSelectedProducts([]);
        setProductSearch('');
        setSelectedCategory('');
        setSelectedOrder(null);
        refetchOrders();
      } else {
        const error = await response.json().catch(() => ({ message: 'Erro ao adicionar produtos' }));
        console.error('❌ Falha ao adicionar produtos:', error);
        toast.error('Erro ao adicionar produtos', error.message || 'Tente novamente ou verifique o status do pedido/mesa.');
      }
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      toast.error('Erro ao adicionar produtos', 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const openAddProductsModal = () => {
    // Garante mesa ativa
    if (table?.status !== 'OCUPADA') {
      toast.warning('Mesa não está ativa', 'A mesa precisa estar OCUPADA para adicionar produtos.');
      return;
    }

    // Seleciona o pedido elegível (PENDENTE ou CONFIRMADO e não pago)
    const targetOrder = orders.find(o => !o.isPaid && (o.status === OrderStatus.PENDENTE || o.status === OrderStatus.CONFIRMADO));
    if (!targetOrder) {
      toast.info('Nenhum pedido elegível', 'Crie um pedido PENDENTE/CONFIRMADO para adicionar produtos.');
      return;
    }

    setSelectedOrder(targetOrder);
    setShowAddProductsModal(true);
  };

  // Funções do modal de pagamento
  const openTablePaymentModal = () => {
    if (orders.length === 0) return;
    const order = orders[0];
    if (!order) return;
    
    // Criar nova sessão de pagamento
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
    setShowTablePaymentModal(true);
  };

  const closeTablePaymentModal = () => {
    setShowTablePaymentModal(false);
    setSelectedOrder(null);
    setPaymentInputValue('');
    setSelectedPaymentMethod('');
    setPaymentSession(null);
  };

  const handlePaymentInputChange = (value: string) => {
    console.log('🔍 Input Change:', { originalValue: value, currentState: paymentInputValue });
    
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
    if (!paymentSession || paymentSession.currentTotal > 0.01) return;
    
    setLoading(true);
    try {
      const tokenFromStorage = token || localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${paymentSession.orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenFromStorage}`
        },
        body: JSON.stringify({
          paymentSession: paymentSession,
          totalPaid: paymentSession.originalTotal
        })
      });
      
      if (response.ok) {
        toast.success('Pagamento processado com sucesso!');
        closeTablePaymentModal();
        refetchOrders();
      } else {
        const error = await response.json();
        toast.error('Erro ao processar pagamento', error.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };


  // Função para marcar como recebido
  const markAsReceived = async (orderId: string) => {
    setLoading(true);
    try {
      const tokenFromStorage = token || localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${orderId}/receive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenFromStorage}`
        }
      });
      
      if (response.ok) {
        refetchOrders();
        refetchTable();
      } else {
        const error = await response.json();
        toast.error('Erro ao marcar como recebido', error.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao marcar como recebido:', error);
      toast.error('Erro ao marcar como recebido');
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar pedido
  const cancelOrder = async (orderId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    setLoading(true);
    try {
      const tokenFromStorage = token || localStorage.getItem('auth-token');
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenFromStorage}`
        },
        body: JSON.stringify({
          status: 'CANCELADO'
        })
      });
      
      if (response.ok) {
        refetchOrders();
        refetchTable();
      } else {
        const error = await response.json();
        toast.error('Erro ao cancelar pedido', error.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast.error('Erro ao cancelar pedido');
    } finally {
      setLoading(false);
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
          <meta charset="utf-8">
          <title>Pedido ${order.id.slice(-8)}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.2;
              margin: 0;
              padding: 8px;
              width: 58mm;
              max-width: 58mm;
            }
            
            .header {
              text-align: center;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            
            .restaurant-name {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            
            .order-info {
              font-size: 10px;
              margin-bottom: 8px;
            }
            
            .items {
              margin-bottom: 8px;
            }
            
            .item {
              margin-bottom: 4px;
              padding-bottom: 2px;
              border-bottom: 1px dotted #ccc;
            }
            
            .item-name {
              font-weight: bold;
            }
            
            .item-details {
              font-size: 10px;
              color: #666;
              margin-left: 4px;
            }
            
            .total {
              border-top: 1px dashed #000;
              padding-top: 8px;
              text-align: center;
              font-weight: bold;
              font-size: 14px;
            }
            
            .footer {
              text-align: center;
              font-size: 10px;
              margin-top: 8px;
              border-top: 1px dashed #000;
              padding-top: 8px;
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
            <div class="order-info">
              Pedido #${order.id.slice(-8)}<br>
              Mesa ${table?.number || 'N/A'}<br>
              ${currentDate.toLocaleString('pt-BR')}
            </div>
          </div>
          
          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <div class="item-name">${item.quantity}x ${item.product?.name || 'Produto'}</div>
                ${item.customizations ? `<div class="item-details">${item.customizations}</div>` : ''}
                ${item.notes ? `<div class="item-details">Obs: ${item.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="total">
            Total: R$ ${order.total.toFixed(2).replace('.', ',')}
          </div>
          
          <div class="footer">
            Obrigado pela preferência!
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

  // Função para exibir detalhes do pedido
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Adicionar produto à seleção
  const addProductToSelection = (product: Product) => {
    const existingIndex = selectedProducts.findIndex(p => p.productId === product.id);
    
    if (existingIndex >= 0) {
      const updated = [...selectedProducts];
      if (updated[existingIndex]) {
        updated[existingIndex].quantity += 1;
        setSelectedProducts(updated);
      }
    } else {
      setSelectedProducts([...selectedProducts, {
        productId: product.id,
        quantity: 1,
        price: product.price,
        notes: ''
      }]);
    }
  };

  // Remover produto da seleção
  const removeProductFromSelection = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId !== productId));
  };

  // Atualizar quantidade
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeProductFromSelection(productId);
      return;
    }
    
    const updated = selectedProducts.map(p => 
      p.productId === productId ? { ...p, quantity } : p
    );
    setSelectedProducts(updated);
  };

  // Calcular total da seleção usando função utilitária
  const selectionTotal = selectedProducts.reduce((total, item) => 
    preciseMoneyCalculation.add(total, item.price * item.quantity), 0);

  if (tableLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando dados da mesa...</p>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Mesa não encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              A mesa solicitada não existe ou foi removida.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Voltar às Mesas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/staff')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Voltar</span>
                </Button>
                
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🪑</div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      Mesa {table.number}
                    </h1>
                    <p className="text-sm text-gray-500">
                      Capacidade: {table.capacity} pessoas
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Badge 
                  variant={table.status === 'OCUPADA' ? 'destructive' : 'default'}
                  className="text-sm"
                >
                  {table.status === 'OCUPADA' ? 'Ocupada' : 'Livre'}
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchOrders();
                    refetchTable();
                  }}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status da Mesa */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Status da Mesa</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {orders.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    Pedidos Ativos
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(orders.reduce((total, order) => 
                      preciseMoneyCalculation.add(total, order.total), 0))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total em Pedidos
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {table.assignedUser?.name || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Atribuído a
                  </div>
                </div>
              </div>
          </CardContent>
          </Card>

          {/* Produtos dos pedidos da mesa (agregado) */}
          {orders.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Produtos dos pedidos da mesa</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const allItems = orders.flatMap(order => order.items || []);
                  if (allItems.length === 0) {
                    return (
                      <div className="text-sm text-gray-600">Nenhum produto nos pedidos desta mesa.</div>
                    );
                  }

                  // Agregar por productId (fallback para nome)
                  const aggregated = new Map<string, {
                    key: string;
                    name: string;
                    totalQuantity: number;
                    totalValue: number;
                  }>();

                  for (const item of allItems) {
                    const key = item.productId || item.product?.name || `item-${item.id}`;
                    const name = item.product?.name || 'Produto não encontrado';
                    const lineTotal = item.price * item.quantity;
                    const existing = aggregated.get(key);
                    if (existing) {
                      existing.totalQuantity += item.quantity;
                      existing.totalValue += lineTotal;
                    } else {
                      aggregated.set(key, {
                        key,
                        name,
                        totalQuantity: item.quantity,
                        totalValue: lineTotal,
                      });
                    }
                  }

                  const aggregatedList = Array.from(aggregated.values());
                  const grandTotal = aggregatedList.reduce((sum, it) => preciseMoneyCalculation.add(sum, it.totalValue), 0);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {aggregatedList.map((it) => (
                          <div key={it.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{it.name}</div>
                              <div className="text-sm text-gray-500">Qtd total: {it.totalQuantity}</div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(it.totalValue)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end pt-2">
                        <div className="text-sm text-gray-600 mr-2">Valor total dos produtos</div>
                        <div className="text-lg font-semibold text-gray-900">{formatCurrency(grandTotal)}</div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Pedidos Ativos */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Pedidos Ativos
              </h2>
              
              <div className="flex items-center space-x-2">
                {/* Botão Adicionar Produtos: mesa ativa + pedido PENDENTE/CONFIRMADO e não pago */}
                {table?.status === 'OCUPADA' && orders.some(order => !order.isPaid && (order.status === OrderStatus.PENDENTE || order.status === OrderStatus.CONFIRMADO)) && (
                  <Button
                    onClick={openAddProductsModal}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Produtos</span>
                  </Button>
                )}

                {/* Botão Processar Pagamento: existe pedido não pago */}
                {orders.some(order => !order.isPaid) && (
                  <Button
                    onClick={openTablePaymentModal}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Processar Pagamento</span>
                  </Button>
                )}
              </div>
              
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum pedido ativo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Esta mesa não possui pedidos ativos no momento.
                  </p>
                  <Button
                    onClick={() => router.push(`/cart?tableId=${tableId}&fromTable=1`)}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Criar Pedido</span>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={
                              order.status === 'CONFIRMADO' ? 'default' :
                              order.status === 'PREPARANDO' ? 'secondary' :
                              order.status === 'PRONTO' ? 'destructive' :
                              'outline'
                            }
                          >
                            {order.status}
                          </Badge>
                          
                          <div className="text-sm text-gray-500">
                            #{order.id.slice(-8)}
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(order.total)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {order.isPaid ? 'Pago' : 'Pendente'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Itens do Pedido */}
                      <div className="space-y-2 mb-4">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {item.product?.name || 'Produto não encontrado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Qtd: {item.quantity} x {formatCurrency(item.price)}
                                {item.notes && (
                                  <span className="ml-2 text-blue-600">
                                    ({item.notes})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Ações do Pedido */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          {!order.isPaid && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelOrder(order.id)}
                              className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancelar</span>
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openOrderDetails(order)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Detalhes ({order.table ? `Mesa ${order.table.number}` : 'Balcão'})</span>
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printOrder(order)}
                            className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                          >
                            <Printer className="h-4 w-4" />
                            <span>Imprimir</span>
                          </Button>
                        </div>
                        
                        {order.isPaid && (
                          <Button
                            size="sm"
                            onClick={() => markAsReceived(order.id)}
                            disabled={loading}
                            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Marcar como Recebido</span>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Adicionar Produtos */}
        {showAddProductsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Header do Modal */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Adicionar Produtos ao Pedido</h2>
                      <p className="text-blue-100 text-sm">Selecione os produtos para adicionar ao pedido ativo</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddProductsModal(false);
                      setSelectedProducts([]);
                      setProductSearch('');
                      setSelectedCategory('');
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Conteúdo do Modal */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lista de Produtos */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" />
                      Produtos Disponíveis
                    </h3>
                    
                    {/* Filtros */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <input
                          type="text"
                          placeholder="🔍 Buscar produtos..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      
                      <div>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">📂 Todas as categorias</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Lista de Produtos */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer group"
                          onClick={() => addProductToSelection(product)}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500 group-hover:text-blue-700">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Produtos Selecionados */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
                      Produtos Selecionados
                    </h3>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProducts.map((item) => {
                        const product = products.find(p => p.id === item.productId);
                        return (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-green-50"
                          >
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {product?.name || 'Produto não encontrado'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(item.price)} cada
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-8 h-8 p-0 rounded-full"
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-semibold text-lg">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-8 h-8 p-0 rounded-full"
                              >
                                +
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeProductFromSelection(item.productId)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0 rounded-full"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {selectedProducts.length > 0 && (
                      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="flex items-center justify-between text-xl font-bold text-green-800">
                          <span>💰 Total a Adicionar:</span>
                          <span>{formatCurrency(selectionTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer do Modal */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {selectedProducts.length > 0 && (
                      <span>{selectedProducts.length} produto(s) selecionado(s)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddProductsModal(false);
                        setSelectedProducts([]);
                        setProductSearch('');
                        setSelectedCategory('');
                      }}
                      className="px-6 py-2"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={addProductsToOrder}
                      disabled={loading || selectedProducts.length === 0}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Adicionar ao Pedido
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Modal de Pagamento da Mesa */}
        {showTablePaymentModal && selectedOrder && (
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
                      <h2 className="text-xl font-bold text-white">Processar Pagamento </h2>
                      <p className="text-green-100 text-sm">Mesa {table?.number} - Pedido #{selectedOrder.id.slice(-8)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeTablePaymentModal}
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
                        className="w-full pl-12 pr-4 py-4 text-2xl font-bold text-center border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Digite o valor (ex: 43,21)"
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
                      onClick={closeTablePaymentModal}
                      className="px-6 py-2"
                    >
                      Cancelar
                    </Button>
                    {!selectedOrder?.isPaid && (
                      <Button
                        onClick={processTablePayment}
                        disabled={loading || (paymentSession?.currentTotal || 0) > 0.01 || !paymentSession || paymentSession.payments.length === 0}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4 mr-2" />
                        )}
                        Processar Pagamento 
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Detalhes do Pedido */}
        {showOrderDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header do Modal */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Detalhes do Pedido</h2>
                      <p className="text-blue-100 text-sm">Pedido #{selectedOrder.id.slice(-8)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOrderDetailsModal(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Conteúdo do Modal */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Informações do Pedido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Informações Básicas</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">ID:</span> #{selectedOrder.id.slice(-8)}</div>
                        <div><span className="font-medium">Status:</span> 
                          <Badge className="ml-2" variant={
                            selectedOrder.status === 'CONFIRMADO' ? 'default' :
                            selectedOrder.status === 'PREPARANDO' ? 'secondary' :
                            selectedOrder.status === 'PRONTO' ? 'destructive' : 'outline'
                          }>
                            {selectedOrder.status}
                          </Badge>
                        </div>
                         
                        <div><span className="font-medium">Criado em:</span> {formatDateTime(selectedOrder.createdAt)}</div>
                        <div><span className="font-medium">Pagamento:</span> 
                          <span className={`ml-2 font-medium ${selectedOrder.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                            {selectedOrder.isPaid ? 'Pago' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Resumo Financeiro</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Subtotal:</span> {formatCurrency(selectedOrder.total)}</div>
                        <div><span className="font-medium">Total:</span> 
                          <span className="ml-2 text-lg font-bold text-green-600">
                            {formatCurrency(selectedOrder.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Itens do Pedido */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Itens do Pedido</h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-1">
                                {item.product?.name || 'Produto não encontrado'}
                              
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                  
                                Quantidade: {item.quantity} x {formatCurrency(item.price)} = {formatCurrency(item.price * item.quantity)}
                              </div>
                              {item.customizations && (
                                <div className="text-sm text-blue-600 mb-1">
                                  <span className="font-medium">Personalizações:</span> {item.customizations}
                                </div>
                              )}
                              {item.notes && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Observações:</span> {item.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer do Modal */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Total do pedido: {formatCurrency(selectedOrder.total)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowOrderDetailsModal(false)}
                      className="px-6 py-2"
                    >
                      Fechar
                    </Button>
                    <Button
                      onClick={() => {
                        printOrder(selectedOrder);
                        setShowOrderDetailsModal(false);
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Pedido
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
