'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { useRealOrders, useRealData } from '@/hooks/useRealData';
import { getRealDataConfig, isModuleEnabled } from '@/config/realDataConfig';
import { ErrorBoundary, ApiError, NetworkError, useErrorHandler, useNetworkStatus } from '@/components/ErrorBoundary';
import { DashboardLoading } from '@/components/LoadingStates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { OrderCard } from '@/components/OrderCard';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { 
  ShoppingBag,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Package,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  User,
  Truck,
  Navigation,
  Timer,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';

export default function CustomerDashboard() {
  const { user, getUserDisplayName } = useApiAuth();
  const [deliveryOrders, setDeliveryOrders] = useState<Order[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'>('preparing');
  
  // Error handling
  const { error: componentError, handleError, resetError } = useErrorHandler();
  const isOnline = useNetworkStatus();
  // Sistema de notificações
  const { 
    notifications, 
    addNotification, 
    removeNotification, 
    markAsRead, 
    unreadCount,
    requestPermission 
  } = useNotifications({
    maxNotifications: 20,
    autoRemove: true,
    autoRemoveDelay: 10000
  });

  // WebSocket para atualizações em tempo real (desabilitado temporariamente)
  // const { isConnected, sendMessage } = useWebSocket({
  //   url: process.env.NODE_ENV === 'production' 
  //     ? 'wss://your-domain.com/ws' 
  //     : 'ws://localhost:3000/ws',
  //   onMessage: (message) => {
  //     switch (message.type) {
  //       case 'order_update':
  //         // Atualizar status do pedido
  //         if (message.data.orderId === activeDelivery?.id) {
  //           setDeliveryStatus(message.data.status);
  //         }
  //         break;
  //       case 'delivery_status':
  //         // Atualizar status de delivery
  //         setDeliveryStatus(message.data.status);
  //         break;
  //       case 'notification':
  //         // Adicionar notificação
  //         addNotification({
  //           title: message.data.title || 'Nova Notificação',
  //           message: message.data.message,
  //           type: message.data.type || 'info',
  //           actionUrl: message.data.actionUrl
  //         });
  //         break;
  //     }
  //   },
  //   onOpen: () => {
  //     console.log('WebSocket conectado');
  //   },
  //   onClose: () => {
  //     console.log('WebSocket desconectado');
  //   },
  //   onError: (error) => {
  //     console.error('Erro WebSocket:', error);
  //   }
  // });

  // Simular WebSocket desabilitado
  const isConnected = false;
  const sendMessage = () => {};
  
  // Configuração de dados reais
  const realDataConfig = getRealDataConfig();
  const ordersEnabled = isModuleEnabled('orders');

  // Dados simulados como fallback
  const mockOrders: Order[] = [
    {
      id: 'order-001',
      userId: user?.id || '',
      status: OrderStatus.PENDENTE,
      total: 45.90,
      deliveryType: 'DELIVERY' as any,
      paymentMethod: 'DINHEIRO' as any,
      deliveryAddress: 'Rua das Flores, 123 - Centro',
      notes: 'Entregar na portaria',
      items: [
        { 
          id: '1', 
          orderId: 'order-001',
          productId: 'prod1',
          quantity: 1, 
          price: 25.90,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        { 
          id: '2', 
          orderId: 'order-001',
          productId: 'prod2',
          quantity: 1, 
          price: 12.00,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Usar dados reais ou simulados baseado na configuração
  const ordersUrl = user?.id && ordersEnabled 
    ? `/api/orders?customerId=${user.id}&limit=5&sortBy=createdAt&sortOrder=desc` 
    : '';

  const { 
    data: realOrdersData, 
    loading: realOrdersLoading, 
    error: realOrdersError,
    isRealData: isOrdersRealData,
    isFromCache: isOrdersFromCache,
    refresh: refreshOrders
  } = useRealOrders(user?.id, mockOrders);

  // Fallback para API tradicional se dados reais não estiverem habilitados
  const { data: ordersResponse, loading: ordersLoading } = useApi<{ data: Order[]; pagination: any }>(ordersUrl);

  // Determinar qual fonte de dados usar
  const recentOrders = ordersEnabled ? realOrdersData : (ordersResponse?.data || []);
  const isLoadingOrders = ordersEnabled ? realOrdersLoading : ordersLoading;

  // Buscar pedidos de delivery ativos
  useEffect(() => {
    const loadActiveDeliveries = async () => {
      if (!user?.id) return;
      
      try {
        // Buscar pedidos em andamento (PENDENTE, CONFIRMADO, PREPARANDO)
        const response = await fetch(`/api/orders?customerId=${user.id}&status=PENDENTE&limit=5&sortBy=createdAt&sortOrder=desc`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const activeOrders = data.data?.filter((order: Order) => 
            order.deliveryType === 'DELIVERY' && 
            [OrderStatus.PENDENTE, OrderStatus.CONFIRMADO, OrderStatus.PREPARANDO].includes(order.status)
          ) || [];
          
          setDeliveryOrders(activeOrders);
          setActiveDelivery(activeOrders[0] || null);
        }
      } catch (error) {
        console.error('Erro ao carregar pedidos de delivery:', error);
        // Fallback para dados simulados em caso de erro
        const mockDeliveryOrders: Order[] = [
          {
            id: 'delivery-001',
            userId: user?.id || '',
            status: OrderStatus.PENDENTE,
            total: 45.90,
            deliveryType: 'DELIVERY' as any,
            deliveryAddress: 'Rua das Flores, 123 - Centro',
            paymentMethod: 'DINHEIRO' as any,
            notes: 'Entregar na portaria',
            items: [
              { 
                id: '1', 
                orderId: 'delivery-001',
                productId: 'prod1',
                quantity: 1, 
                price: 25.90,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              { 
                id: '2', 
                orderId: 'delivery-001',
                productId: 'prod2',
                quantity: 1, 
                price: 12.00,
                createdAt: new Date(),
                updatedAt: new Date()
              },
              { 
                id: '3', 
                orderId: 'delivery-001',
                productId: 'prod3',
                quantity: 1, 
                price: 8.00,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        setDeliveryOrders(mockDeliveryOrders);
        setActiveDelivery(mockDeliveryOrders[0] || null);
      }
    };

    loadActiveDeliveries();
  }, [user]);

  // Simular atualização de status de delivery
  useEffect(() => {
    if (activeDelivery) {
      const interval = setInterval(() => {
        setDeliveryStatus(prev => {
          if (prev === 'preparing') return 'out_for_delivery';
          if (prev === 'out_for_delivery') return 'delivered';
          return prev;
        });
      }, 30000); // Atualiza a cada 30 segundos

      return () => clearInterval(interval);
    }
    return undefined;
  }, [activeDelivery]);

  // Estatísticas dos pedidos
  const stats = {
    totalOrders: recentOrders.length,
    pendingOrders: recentOrders.filter(order => order.status === OrderStatus.PENDENTE).length,
    completedOrders: recentOrders.filter(order => order.status === OrderStatus.ENTREGUE).length,
    totalSpent: recentOrders.reduce((sum, order) => sum + order.total, 0),
    deliveryOrders: deliveryOrders.length,
    activeDelivery: activeDelivery ? 1 : 0,
  };

  // Função para obter informações do status de delivery
  const getDeliveryStatusInfo = (status: string) => {
    switch (status) {
      case 'preparing':
        return {
          label: 'Preparando',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock,
          description: 'Seu pedido está sendo preparado'
        };
      case 'out_for_delivery':
        return {
          label: 'Saiu para Entrega',
          color: 'bg-blue-100 text-blue-800',
          icon: Truck,
          description: 'Seu pedido saiu para entrega'
        };
      case 'delivered':
        return {
          label: 'Entregue',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle2,
          description: 'Seu pedido foi entregue'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          color: 'bg-red-100 text-red-800',
          icon: XCircle,
          description: 'Seu pedido foi cancelado'
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle,
          description: 'Status desconhecido'
        };
    }
  };

  // Função para calcular tempo estimado
  const getEstimatedTime = () => {
    // Simular tempo baseado no status
    if (deliveryStatus === 'preparing') return '25 minutos';
    if (deliveryStatus === 'out_for_delivery') return '10 minutos';
    return 'Entregue';
  };

  // Se não estiver online, mostrar erro de rede
  if (!isOnline) {
    return (
      <div className="space-y-6">
        <NetworkError />
      </div>
    );
  }

  // Se houver erro no componente, mostrar erro
  if (componentError) {
    return (
      <div className="space-y-6">
        <ApiError 
          error={componentError} 
          onRetry={resetError}
          fallbackMessage="Erro no dashboard"
        />
      </div>
    );
  }

  // Se estiver carregando, mostrar loading
  if (isLoadingOrders) {
    return <DashboardLoading />;
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Olá, {getUserDisplayName()}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Bem-vindo ao seu painel de controle
            </p>
          </div>
          
          {/* Indicador de fonte de dados */}
          <div className="flex items-center space-x-2">
            {ordersEnabled ? (
              <div className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  {isOrdersRealData ? 'Dados Reais' : 'Cache'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Dados Simulados</span>
              </div>
            )}
            
            {ordersEnabled && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshOrders}
                disabled={realOrdersLoading}
                className="text-xs"
              >
                {realOrdersLoading ? 'Atualizando...' : 'Atualizar'}
              </Button>
            )}
          </div>
        </div>
        
        {/* Aviso de fallback se houver erro */}
        {ordersEnabled && realOrdersError && (
          <ApiError 
            error={realOrdersError}
            onRetry={refreshOrders}
            fallbackMessage="Usando dados simulados devido a erro na API"
          />
        )}
      </div>

      {/* Seção de Delivery Ativo */}
      {activeDelivery && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <Truck className="h-6 w-6 mr-2" />
              Pedido de Delivery Ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status do Pedido */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const statusInfo = getDeliveryStatusInfo(deliveryStatus);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <>
                        <div className="p-2 bg-white rounded-lg">
                          <StatusIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{statusInfo.label}</p>
                          <p className="text-sm text-gray-600">{statusInfo.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Tempo estimado: {getEstimatedTime()}
                  </span>
                </div>
              </div>

              {/* Informações do Pedido */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pedido #{activeDelivery.id.slice(-8)}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(activeDelivery.total)}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Itens do Pedido:</h4>
                  <div className="space-y-1">
                    {activeDelivery.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x Produto {item.productId}</span>
                        <span>{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações de Entrega */}
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Endereço de Entrega:</p>
                    <p className="text-sm text-gray-600">{activeDelivery.deliveryAddress}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Telefone:</p>
                    <p className="text-sm text-gray-600">(11) 99999-9999</p>
                  </div>
                </div>
                
                {activeDelivery.notes && (
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Observações:</p>
                      <p className="text-sm text-gray-600">{activeDelivery.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Barra de Progresso */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progresso do Pedido</span>
                <span>{deliveryStatus === 'preparing' ? '25%' : deliveryStatus === 'out_for_delivery' ? '75%' : '100%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    deliveryStatus === 'preparing' ? 'bg-yellow-500 w-1/4' :
                    deliveryStatus === 'out_for_delivery' ? 'bg-blue-500 w-3/4' :
                    'bg-green-500 w-full'
                  }`}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pedidos Concluídos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivery Ativo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDelivery}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Fazer Novo Pedido
              </Button>
            </Link>
            <Link href="/customer/orders">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Ver Todos os Pedidos
              </Button>
            </Link>
            <Link href="/cart">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Meu Carrinho
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Rastreamento de Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Rastreamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeDelivery ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Navigation className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Pedido em andamento</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Status: {getDeliveryStatusInfo(deliveryStatus).label}</p>
                  <p>Tempo: {getEstimatedTime()}</p>
                </div>
                <Button variant="primary" size="sm" className="w-full">
                  <Navigation className="h-4 w-4 mr-2" />
                  Rastrear Pedido
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Nenhum pedido de delivery ativo</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Meu Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  Cliente desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
            </div>

            <Link href="/customer/profile">
              <Button variant="primary" size="sm" className="w-full">
                Editar Perfil
              </Button>
            </Link>
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
          <Link href="/customer/orders">
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
              {recentOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          Pedido #{order.id.slice(-8)}
                        </span>
                        <Badge 
                          variant={order.status === OrderStatus.ENTREGUE ? 'success' : 
                                   order.status === OrderStatus.PENDENTE ? 'warning' : 'default'}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <Link href={`/customer/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
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
                Você ainda não fez nenhum pedido. Que tal fazer seu primeiro pedido?
              </p>
              <Link href="/">
                <Button variant="primary">
                  Fazer Pedido
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </ErrorBoundary>
  );
}
