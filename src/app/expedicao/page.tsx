'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Table as TableType, TableStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw,
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Table,
  Users,
  Home,
  Coffee
} from 'lucide-react';
import Link from 'next/link';

// Tipos para a página de expedição
interface ExpedicaoOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  estimatedDelivery: string;
  deliveryTime?: string | undefined;
  notes?: string;
  tableId?: string; // Relacionamento com mesa
}

// Tipos para produtos da mesa
interface MesaProduct {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  addedAt: string;
}

// Tipos para mesa com pedidos
interface MesaWithOrders {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  assignedTo?: string | undefined;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  } | undefined;
  products: MesaProduct[];
  orders: ExpedicaoOrder[];
  totalValue: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface ExpedicaoStats {
  total: number;
  preparing: number;
  ready: number;
  outForDelivery: number;
  delivered: number;
  cancelled: number;
}

export default function ExpedicaoPage() {
  const { isAuthenticated, user, hasRole } = useOptimizedAuth();
  const [orders, setOrders] = useState<ExpedicaoOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExpedicaoOrder[]>([]);
  const [tables, setTables] = useState<TableType[]>([]);
  const [stats, setStats] = useState<ExpedicaoStats>({
    total: 0,
    preparing: 0,
    ready: 0,
    outForDelivery: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ExpedicaoOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'tables'>('orders');
  const [showOpenTableModal, setShowOpenTableModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<MesaWithOrders | null>(null);
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [mesasWithOrders, setMesasWithOrders] = useState<MesaWithOrders[]>([]);

  // Carregar dados
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados para demonstração
      const mockOrders: ExpedicaoOrder[] = [
        {
          id: '1',
          orderNumber: 'PED-001',
          customerName: 'João Silva',
          customerPhone: '(11) 99999-9999',
          customerAddress: 'Rua das Flores, 123 - Centro',
          status: 'preparing',
          total: 45.90,
          items: [
            { id: '1', name: 'Hambúrguer Clássico', quantity: 2, price: 25.90 },
            { id: '2', name: 'Batata Frita', quantity: 1, price: 12.00 },
            { id: '3', name: 'Refrigerante', quantity: 2, price: 8.00 }
          ],
          createdAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString(),
          notes: 'Sem cebola no hambúrguer'
        },
        {
          id: '2',
          orderNumber: 'PED-002',
          customerName: 'Maria Santos',
          customerPhone: '(11) 88888-8888',
          customerAddress: 'Av. Principal, 456 - Bairro Novo',
          status: 'ready',
          total: 32.50,
          items: [
            { id: '4', name: 'Pizza Margherita', quantity: 1, price: 28.50 },
            { id: '5', name: 'Coca-Cola', quantity: 1, price: 4.00 }
          ],
          createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
          estimatedDelivery: new Date(Date.now() + 15 * 60000).toISOString()
        },
        {
          id: '3',
          orderNumber: 'PED-003',
          customerName: 'Pedro Costa',
          customerPhone: '(11) 77777-7777',
          customerAddress: 'Rua da Paz, 789 - Vila Nova',
          status: 'out_for_delivery',
          total: 67.80,
          items: [
            { id: '6', name: 'Combo Família', quantity: 1, price: 55.80 },
            { id: '7', name: 'Açaí', quantity: 2, price: 12.00 }
          ],
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
          estimatedDelivery: new Date(Date.now() + 10 * 60000).toISOString(),
          deliveryTime: new Date(Date.now() - 20 * 60000).toISOString()
        },
        {
          id: '4',
          orderNumber: 'PED-004',
          customerName: 'Ana Oliveira',
          customerPhone: '(11) 66666-6666',
          customerAddress: 'Rua das Palmeiras, 321 - Jardim',
          status: 'delivered',
          total: 28.90,
          items: [
            { id: '8', name: 'Salada Caesar', quantity: 1, price: 18.90 },
            { id: '9', name: 'Suco Natural', quantity: 1, price: 10.00 }
          ],
          createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
          estimatedDelivery: new Date(Date.now() - 30 * 60000).toISOString(),
          deliveryTime: new Date(Date.now() - 30 * 60000).toISOString()
        }
      ];
      
      setOrders(mockOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar mesas
  const loadTables = useCallback(async () => {
    try {
      const response = await fetch('/api/tables?includeAssignedUser=true');
      if (response.ok) {
        const data = await response.json();
        setTables(data.data || []);
      } else {
        // Fallback: criar mesas mockadas para teste
        const mockTables = [
          { id: '1', number: 1, capacity: 4, status: TableStatus.LIVRE, createdAt: new Date(), updatedAt: new Date() },
          { id: '2', number: 2, capacity: 4, status: TableStatus.LIVRE, createdAt: new Date(), updatedAt: new Date() },
          { id: '3', number: 3, capacity: 6, status: TableStatus.OCUPADA, createdAt: new Date(), updatedAt: new Date() },
          { id: '4', number: 4, capacity: 4, status: TableStatus.LIVRE, createdAt: new Date(), updatedAt: new Date() },
        ];
        setTables(mockTables);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      // Fallback: criar mesas mockadas para teste
      const mockTables = [
        { id: '1', number: 1, capacity: 4, status: TableStatus.LIVRE, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', number: 2, capacity: 4, status: TableStatus.LIVRE, createdAt: new Date(), updatedAt: new Date() },
        { id: '3', number: 3, capacity: 6, status: TableStatus.OCUPADA, createdAt: new Date(), updatedAt: new Date() },
        { id: '4', number: 4, capacity: 4, status: TableStatus.LIVRE, createdAt: new Date(), updatedAt: new Date() },
      ];
      setTables(mockTables);
    }
  }, []);

  // Calcular estatísticas
  const calculateStats = useCallback((ordersList: ExpedicaoOrder[]) => {
    const newStats: ExpedicaoStats = {
      total: ordersList.length,
      preparing: ordersList.filter(o => o.status === 'preparing').length,
      ready: ordersList.filter(o => o.status === 'ready').length,
      outForDelivery: ordersList.filter(o => o.status === 'out_for_delivery').length,
      delivered: ordersList.filter(o => o.status === 'delivered').length,
      cancelled: ordersList.filter(o => o.status === 'cancelled').length,
    };
    setStats(newStats);
  }, []);

  // Filtrar pedidos
  const filterOrders = useCallback(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    calculateStats(filtered);
  }, [orders, searchTerm, statusFilter, calculateStats]);

  // Atualizar status do pedido
  const updateOrderStatus = useCallback((orderId: string, newStatus: ExpedicaoOrder['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: newStatus,
            deliveryTime: newStatus === 'delivered' ? new Date().toISOString() : order.deliveryTime
          }
        : order
    ));
  }, []);

  // Efeitos
  useEffect(() => {
    loadOrders();
    loadTables();
  }, [loadOrders, loadTables]);


  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
      loadTables();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadOrders, loadTables]);

  // Funções para mesas
  const updateTableStatus = useCallback(async (tableId: string, newStatus: TableStatus) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadTables();
      }
    } catch (error) {
      console.error('Erro ao atualizar status da mesa:', error);
    }
  }, [loadTables]);

  // Função para abrir mesa
  const handleOpenTable = useCallback(async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: TableStatus.OCUPADA,
          assignedTo: user?.id 
        }),
      });

      if (response.ok) {
        loadTables();
        setShowOpenTableModal(false);
        // Aqui você pode adicionar uma notificação de sucesso
        console.log('Mesa aberta com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao abrir mesa:', error);
    }
  }, [loadTables, user?.id]);

  // Obter mesas livres
  const getAvailableTables = () => {
    return tables.filter(table => table.status === TableStatus.LIVRE);
  };

  // Funções para gerenciar produtos e pedidos das mesas
  const loadMesasWithOrders = useCallback(async () => {
    try {
      // Simular dados de mesas com pedidos
      const mockMesasWithOrders: MesaWithOrders[] = tables.map(table => ({
        id: table.id,
        number: table.number,
        capacity: table.capacity,
        status: table.status,
        assignedTo: table.assignedTo,
        assignedUser: table.assignedUser,
        products: table.status === TableStatus.OCUPADA ? [
          {
            id: '1',
            productId: 'prod1',
            name: 'Hambúrguer Clássico',
            price: 25.90,
            quantity: 2,
            notes: 'Sem cebola',
            addedAt: new Date().toISOString()
          },
          {
            id: '2',
            productId: 'prod2',
            name: 'Batata Frita',
            price: 12.00,
            quantity: 1,
            addedAt: new Date().toISOString()
          }
        ] : [],
        orders: table.status === TableStatus.OCUPADA ? [
          {
            id: 'order1',
            orderNumber: `PED-${table.number}-001`,
            customerName: 'Cliente da Mesa',
            customerPhone: '(11) 99999-9999',
            customerAddress: `Mesa ${table.number}`,
            status: 'preparing',
            total: 63.80,
            items: [
              { id: '1', name: 'Hambúrguer Clássico', quantity: 2, price: 25.90 },
              { id: '2', name: 'Batata Frita', quantity: 1, price: 12.00 }
            ],
            createdAt: new Date().toISOString(),
            estimatedDelivery: new Date(Date.now() + 30 * 60000).toISOString(),
            tableId: table.id
          }
        ] : [],
        totalValue: table.status === TableStatus.OCUPADA ? 63.80 : 0,
        createdAt: table.createdAt,
        updatedAt: table.updatedAt
      }));
      
      setMesasWithOrders(mockMesasWithOrders);
    } catch (error) {
      console.error('Erro ao carregar mesas com pedidos:', error);
    }
  }, [tables]);

  // Efeito para carregar mesas com pedidos
  useEffect(() => {
    loadMesasWithOrders();
  }, [loadMesasWithOrders]);

  // Adicionar produto à mesa
  const addProductToTable = useCallback(async (tableId: string, product: MesaProduct) => {
    try {
      setMesasWithOrders(prev => prev.map(mesa => 
        mesa.id === tableId 
          ? {
              ...mesa,
              products: [...mesa.products, product],
              totalValue: mesa.totalValue + (product.price * product.quantity)
            }
          : mesa
      ));
    } catch (error) {
      console.error('Erro ao adicionar produto à mesa:', error);
    }
  }, []);

  // Remover produto da mesa
  const removeProductFromTable = useCallback(async (tableId: string, productId: string) => {
    try {
      setMesasWithOrders(prev => prev.map(mesa => {
        if (mesa.id === tableId) {
          const product = mesa.products.find(p => p.id === productId);
          const newProducts = mesa.products.filter(p => p.id !== productId);
          return {
            ...mesa,
            products: newProducts,
            totalValue: product ? mesa.totalValue - (product.price * product.quantity) : mesa.totalValue
          };
        }
        return mesa;
      }));
    } catch (error) {
      console.error('Erro ao remover produto da mesa:', error);
    }
  }, []);

  // Fechar mesa
  const closeTable = useCallback(async (tableId: string) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: TableStatus.LIVRE,
          assignedTo: null 
        }),
      });

      if (response.ok) {
        loadTables();
        setMesasWithOrders(prev => prev.map(mesa => 
          mesa.id === tableId 
            ? { ...mesa, status: TableStatus.LIVRE, products: [], orders: [], totalValue: 0 }
            : mesa
        ));
        setShowTableDetails(false);
        setSelectedTable(null);
      }
    } catch (error) {
      console.error('Erro ao fechar mesa:', error);
    }
  }, [loadTables]);

  // Verificar permissões
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h1>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para acessar esta página.
          </p>
          <Link href="/login">
            <Button variant="primary">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Verificar se tem permissão para expedição
  if (!hasRole('FUNCIONARIO' as any) && !hasRole('ADMINISTRADOR' as any)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 mb-6">
            Apenas funcionários e administradores podem acessar a expedição.
          </p>
          <Link href="/">
            <Button variant="primary">
              Voltar ao Início
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: ExpedicaoOrder['status']) => {
    const statusMap = {
      preparing: { label: 'Preparando', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      ready: { label: 'Pronto', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      out_for_delivery: { label: 'Saiu para Entrega', color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    return statusMap[status];
  };

  const getNextStatus = (currentStatus: ExpedicaoOrder['status']): ExpedicaoOrder['status'] | null => {
    const statusFlow: Record<string, ExpedicaoOrder['status']> = {
      preparing: 'ready',
      ready: 'out_for_delivery',
      out_for_delivery: 'delivered',
    };
    return statusFlow[currentStatus] || null;
  };

  const getTableStatusInfo = (status: TableStatus) => {
    const statusMap = {
      [TableStatus.LIVRE]: { label: 'Livre', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      [TableStatus.OCUPADA]: { label: 'Ocupada', color: 'bg-red-100 text-red-800', icon: Users },
      [TableStatus.RESERVADA]: { label: 'Reservada', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      [TableStatus.MANUTENCAO]: { label: 'Manutenção', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    };
    return statusMap[status];
  };

  const getTableStats = () => {
    return {
      total: tables.length,
      livre: tables.filter(t => t.status === TableStatus.LIVRE).length,
      ocupada: tables.filter(t => t.status === TableStatus.OCUPADA).length,
      reservada: tables.filter(t => t.status === TableStatus.RESERVADA).length,
      manutencao: tables.filter(t => t.status === TableStatus.MANUTENCAO).length,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Expedição</h1>
                <p className="text-sm text-gray-600">Controle de pedidos e entregas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Tabs */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Package className="h-4 w-4 inline mr-2" />
                  Delivery
                </button>
                <button
                  onClick={() => setActiveTab('tables')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'tables'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Table className="h-4 w-4 inline mr-2" />
                  Mesas
                </button>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  loadOrders();
                  loadTables();
                }}
                disabled={isLoading}
                leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
              >
                Atualizar
              </Button>
              <Link href="/">
                <Button variant="outline">
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Conteúdo baseado na aba ativa */}
        {activeTab === 'orders' ? (
          <>
            {/* Estatísticas de Pedidos */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
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
                  <p className="text-sm font-medium text-gray-600">Preparando</p>
                  <p className="text-lg font-bold text-gray-900">{stats.preparing}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Prontos</p>
                  <p className="text-lg font-bold text-gray-900">{stats.ready}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Saiu</p>
                  <p className="text-lg font-bold text-gray-900">{stats.outForDelivery}</p>
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
                  <p className="text-sm font-medium text-gray-600">Entregues</p>
                  <p className="text-lg font-bold text-gray-900">{stats.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Cancelados</p>
                  <p className="text-lg font-bold text-gray-900">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por número do pedido, cliente ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-gray-400" />}
                />
              </div>
              <div className="md:w-48">
                <select
                  className="form-select block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os Status</option>
                  <option value="preparing">Preparando</option>
                  <option value="ready">Pronto</option>
                  <option value="out_for_delivery">Saiu para Entrega</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum pedido encontrado
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Não encontramos pedidos com os filtros aplicados.'
                    : 'Não há pedidos para expedição no momento.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const nextStatus = getNextStatus(order.status);
              const StatusIcon = statusInfo.icon;

              return (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.orderNumber}
                          </h3>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Informações do Cliente */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{order.customerName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{order.customerPhone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{order.customerAddress}</span>
                            </div>
                          </div>

                          {/* Informações do Pedido */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Total:</span>
                              <span className="font-semibold">{formatCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Pedido:</span>
                              <span className="text-sm">{formatDateTime(order.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Entrega:</span>
                              <span className="text-sm">{formatDateTime(order.estimatedDelivery)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Itens do Pedido */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Itens:</h4>
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Observações */}
                        {order.notes && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">Observação:</p>
                                <p className="text-sm text-yellow-700">{order.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          leftIcon={<Eye className="h-4 w-4" />}
                        >
                          Ver Detalhes
                        </Button>
                        
                        {nextStatus && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, nextStatus)}
                            leftIcon={<Play className="h-4 w-4" />}
                          >
                            {nextStatus === 'ready' && 'Marcar Pronto'}
                            {nextStatus === 'out_for_delivery' && 'Saiu para Entrega'}
                            {nextStatus === 'delivered' && 'Marcar Entregue'}
                          </Button>
                        )}

                        {order.status === 'preparing' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            leftIcon={<XCircle className="h-4 w-4" />}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
          </>
        ) : (
          <>
            {/* Estatísticas de Mesas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Table className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total</p>
                      <p className="text-lg font-bold text-gray-900">{getTableStats().total}</p>
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
                      <p className="text-sm font-medium text-gray-600">Livre</p>
                      <p className="text-lg font-bold text-gray-900">{getTableStats().livre}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Users className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Ocupada</p>
                      <p className="text-lg font-bold text-gray-900">{getTableStats().ocupada}</p>
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
                      <p className="text-sm font-medium text-gray-600">Reservada</p>
                      <p className="text-lg font-bold text-gray-900">{getTableStats().reservada}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Manutenção</p>
                      <p className="text-lg font-bold text-gray-900">{getTableStats().manutencao}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Botão Abrir Mesa */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Controle de Mesas</h3>
                    <p className="text-sm text-gray-600">Gerencie a ocupação das mesas do restaurante</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total: {tables.length} | Livres: {getAvailableTables().length}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowOpenTableModal(true)}
                    leftIcon={<Coffee className="h-4 w-4" />}
                    disabled={tables.length === 0 || getAvailableTables().length === 0}
                  >
                    Abrir Mesa ({getAvailableTables().length})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Layout das Mesas */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Layout das Mesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {mesasWithOrders.map((mesa) => {
                    const statusInfo = getTableStatusInfo(mesa.status);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <div
                        key={mesa.id}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                          mesa.status === TableStatus.LIVRE
                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                            : mesa.status === TableStatus.OCUPADA
                            ? 'border-red-200 bg-red-50 hover:bg-red-100'
                            : mesa.status === TableStatus.RESERVADA
                            ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          if (mesa.status === TableStatus.OCUPADA) {
                            setSelectedTable(mesa);
                            setShowTableDetails(true);
                          } else {
                            // Ciclo de status: LIVRE -> OCUPADA -> RESERVADA -> LIVRE
                            const nextStatus = 
                              mesa.status === TableStatus.LIVRE ? TableStatus.OCUPADA :
                              mesa.status === TableStatus.RESERVADA ? TableStatus.LIVRE :
                              TableStatus.RESERVADA;
                            updateTableStatus(mesa.id, nextStatus);
                          }
                        }}
                      >
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <StatusIcon className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-lg">Mesa {mesa.number}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {mesa.capacity} pessoas
                          </p>
                          <Badge className={statusInfo.color}>
                            {statusInfo.label}
                          </Badge>
                          
                          {/* Informações da mesa ocupada */}
                          {mesa.status === TableStatus.OCUPADA && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-gray-600">
                                {mesa.products.length} produtos
                              </p>
                              <p className="text-xs font-semibold text-green-600">
                                {formatCurrency(mesa.totalValue)}
                              </p>
                              {mesa.assignedUser && (
                                <p className="text-xs text-gray-500">
                                  {mesa.assignedUser.name}
                                </p>
                              )}
                            </div>
                          )}
                          
                          {mesa.assignedUser && mesa.status !== TableStatus.OCUPADA && (
                            <p className="text-xs text-gray-500 mt-1">
                              {mesa.assignedUser.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Lista Detalhada das Mesas */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Mesas</CardTitle>
              </CardHeader>
              <CardContent>
                {tables.length === 0 ? (
                  <div className="text-center py-12">
                    <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma mesa encontrada
                    </h3>
                    <p className="text-gray-600">
                      Não há mesas cadastradas no sistema.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tables.map((table) => {
                      const statusInfo = getTableStatusInfo(table.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div key={table.id} className="flex items-center bg-gray-50 p-4 rounded-lg">
                          <div className="p-3 rounded-full bg-gray-200 mr-4">
                            <StatusIcon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">
                              Mesa {table.number}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Capacidade: {table.capacity} pessoas
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={statusInfo.color}>
                                {statusInfo.label}
                              </Badge>
                              {table.assignedUser && (
                                <Badge variant="secondary">
                                  {table.assignedUser.name}
                                </Badge>
                              )}
                              <span className="text-sm text-gray-500">
                                {formatDateTime(table.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTableStatus(table.id, TableStatus.LIVRE)}
                              className="text-green-600 border-green-300 hover:bg-green-50"
                            >
                              Livre
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTableStatus(table.id, TableStatus.OCUPADA)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Ocupada
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTableStatus(table.id, TableStatus.RESERVADA)}
                              className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                            >
                              Reservada
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTableStatus(table.id, TableStatus.MANUTENCAO)}
                              className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                              Manutenção
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      {/* Modal de Abrir Mesa */}
      {showOpenTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Coffee className="h-5 w-5 mr-2" />
                  Abrir Mesa
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOpenTableModal(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione uma mesa para abrir
                  </h3>
                  <p className="text-sm text-gray-600">
                    Escolha uma mesa livre para ocupar
                  </p>
                </div>

                {getAvailableTables().length === 0 ? (
                  <div className="text-center py-12">
                    <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma mesa livre
                    </h3>
                    <p className="text-gray-600">
                      Todas as mesas estão ocupadas, reservadas ou em manutenção.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {getAvailableTables().map((table) => (
                      <div
                        key={table.id}
                        className="p-4 border-2 border-green-200 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 hover:border-green-300 transition-all"
                        onClick={() => handleOpenTable(table.id)}
                      >
                        <div className="text-center">
                          <div className="flex justify-center mb-2">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            Mesa {table.number}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {table.capacity} pessoas
                          </p>
                          <Badge className="bg-green-100 text-green-800">
                            Livre
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowOpenTableModal(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes da Mesa */}
      {showTableDetails && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Table className="h-5 w-5 mr-2" />
                  Mesa {selectedTable.number} - Detalhes
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTableDetails(false);
                    setSelectedTable(null);
                  }}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Informações da Mesa */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Informações da Mesa</h4>
                    <p><strong>Número:</strong> {selectedTable.number}</p>
                    <p><strong>Capacidade:</strong> {selectedTable.capacity} pessoas</p>
                    <p><strong>Status:</strong> 
                      <Badge className={getTableStatusInfo(selectedTable.status).color}>
                        {getTableStatusInfo(selectedTable.status).label}
                      </Badge>
                    </p>
                    {selectedTable.assignedUser && (
                      <p><strong>Responsável:</strong> {selectedTable.assignedUser.name}</p>
                    )}
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Resumo Financeiro</h4>
                    <p><strong>Total:</strong> {formatCurrency(selectedTable.totalValue)}</p>
                    <p><strong>Produtos:</strong> {selectedTable.products.length}</p>
                    <p><strong>Pedidos:</strong> {selectedTable.orders.length}</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Ações</h4>
                    <div className="space-y-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowAddProductModal(true)}
                        leftIcon={<Coffee className="h-4 w-4" />}
                      >
                        Adicionar Produto
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeTable(selectedTable.id)}
                        leftIcon={<XCircle className="h-4 w-4" />}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Fechar Mesa
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Produtos da Mesa */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Produtos da Mesa</h4>
                  {selectedTable.products.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum produto adicionado à mesa</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedTable.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{product.name}</h5>
                            <p className="text-sm text-gray-600">
                              {product.quantity}x {formatCurrency(product.price)} = {formatCurrency(product.price * product.quantity)}
                            </p>
                            {product.notes && (
                              <p className="text-xs text-gray-500">Obs: {product.notes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProductFromTable(selectedTable.id, product.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pedidos da Mesa */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Pedidos da Mesa</h4>
                  {selectedTable.orders.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum pedido associado à mesa</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTable.orders.map((order) => (
                        <div key={order.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">{order.orderNumber}</h5>
                            <Badge className={getStatusInfo(order.status).color}>
                              {getStatusInfo(order.status).label}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Cliente:</strong> {order.customerName}</p>
                              <p><strong>Telefone:</strong> {order.customerPhone}</p>
                            </div>
                            <div>
                              <p><strong>Total:</strong> {formatCurrency(order.total)}</p>
                              <p><strong>Criado:</strong> {formatDateTime(order.createdAt)}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <h6 className="font-medium text-gray-700 mb-1">Itens:</h6>
                            <div className="space-y-1">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span>{formatCurrency(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalhes do Pedido {selectedOrder.orderNumber}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <Badge className={getStatusInfo(selectedOrder.status).color}>
                    {React.createElement(getStatusInfo(selectedOrder.status).icon, { className: "h-3 w-3 mr-1" })}
                    {getStatusInfo(selectedOrder.status).label}
                  </Badge>
                </div>

                {/* Cliente */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                    <p><strong>Nome:</strong> {selectedOrder.customerName}</p>
                    <p><strong>Telefone:</strong> {selectedOrder.customerPhone}</p>
                    <p><strong>Endereço:</strong> {selectedOrder.customerAddress}</p>
                  </div>
                </div>

                {/* Itens */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center p-2 bg-primary-50 rounded font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Observações</h4>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Pedido feito:</span>
                    <p>{formatDateTime(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Previsão de entrega:</span>
                    <p>{formatDateTime(selectedOrder.estimatedDelivery)}</p>
                  </div>
                  {selectedOrder.deliveryTime && (
                    <div>
                      <span className="font-medium text-gray-700">Entregue em:</span>
                      <p>{formatDateTime(selectedOrder.deliveryTime)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
