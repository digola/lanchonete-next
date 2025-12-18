'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from '@/lib/toast';

import { 
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Clock,
  CreditCard,
  Phone,
  Mail,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Star,
  Truck,
  AlertCircle,
  PlusCircle
} from 'lucide-react';
import { Order, OrderStatus, Product } from '@/types';
//import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/DialogContent';
export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, token } = useApiAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAddingProducts, setIsAddingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{productId: string, quantity: number}[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Função para buscar detalhes do pedido
  const fetchOrderDetails = useCallback(async () => {
    if (!orderId || !isAuthenticated || !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar detalhes do pedido');
      }

      if (data.success && data.data) {
        setOrder(data.data);
        setHasLoaded(true);
      } else {
        throw new Error('Dados do pedido não encontrados');
      }
    } catch (error: any) {
      console.error('Erro ao carregar pedido:', error);
      setError(error.message || 'Erro ao carregar detalhes do pedido');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, isAuthenticated, user?.id, token]);

  // Carregar dados quando as condições estiverem prontas
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.id && orderId && !hasLoaded) {
      fetchOrderDetails();
    }
  }, [authLoading, isAuthenticated, user?.id, orderId, hasLoaded, fetchOrderDetails]);
  
  // Função para buscar produtos disponíveis
  const fetchAvailableProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products?isAvailable=true', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar produtos');
      }

      if (data.success && data.data) {
        setAvailableProducts(data.data);
      }
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
    }
  }, [token]);

  // Função para adicionar produtos ao pedido
  const addProductsToOrder = useCallback(async () => {
    if (!orderId || selectedProducts.length === 0) return;

    try {
      setIsLoading(true);
      
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
        setOrder(data.data);
        setIsAddingProducts(false);
        setSelectedProducts([]);
        toast.success('Produtos adicionados com sucesso!');
      } else {
        toast.error('Erro ao adicionar produtos', data.error || 'Tente novamente');
      }
    } catch (error: any) {
      console.error('Erro ao adicionar produtos:', error);
      toast.error('Erro de conexão', 'Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, selectedProducts, token]);

  // Função para adicionar produto à seleção
  const addProductToSelection = useCallback((product: any) => {
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
  }, [selectedProducts]);

  // Função para remover produto da seleção
  const removeProductFromSelection = useCallback((productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  }, []);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return <Clock className="h-5 w-5" />;
      case OrderStatus.CONFIRMADO:
        return <CheckCircle className="h-5 w-5" />;
      case OrderStatus.ENTREGUE:
        return <Star className="h-5 w-5" />;
      case OrderStatus.CANCELADO:
        return <XCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return 'warning';
      case OrderStatus.CONFIRMADO:
        return 'info';
      case OrderStatus.ENTREGUE:
        return 'success';
      case OrderStatus.CANCELADO:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return 'Seu pedido está aguardando confirmação.';
      case OrderStatus.CONFIRMADO:
        return 'Seu pedido foi confirmado e está sendo preparado.';
      case OrderStatus.ENTREGUE:
        return 'Seu pedido foi entregue com sucesso!';
      case OrderStatus.CANCELADO:
        return 'Seu pedido foi cancelado.';
      default:
        return 'Status não identificado.';
    }
  };

  // Estado de loading combinado
  const isPageLoading = authLoading || (isLoading && !hasLoaded);

  // Mostrar loading
  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Erro ao carregar pedido
        </h3>
        <p className="text-gray-600 mb-6">
          {error}
        </p>
        <div className="space-x-4">
          <Button variant="outline" onClick={fetchOrderDetails}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
          <Link href="/customer/dashboard">
            <Button variant="primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mostrar pedido não encontrado
  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Pedido não encontrado
        </h3>
        <p className="text-gray-600 mb-6">
          O pedido que você está procurando não existe ou não foi encontrado.
        </p>
        <Link href="/customer/dashboard">
          <Button variant="primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal para adicionar produtos */}
      
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              {availableProducts.length > 0 ? (
                <>
                  <h3 className="font-medium">Produtos Disponíveis</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {availableProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{formatCurrency(product.price)}</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => addProductToSelection(product)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {selectedProducts.length > 0 && (
                    <>
                      <h3 className="font-medium mt-4">Produtos Selecionados</h3>
                      <div className="space-y-2">
                        {selectedProducts.map((item) => {
                          const product = availableProducts.find(p => p.id === item.productId);
                          return (
                            <div key={item.productId} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                              <div>
                                <p className="font-medium">{product?.name}</p>
                                <p className="text-sm">Quantidade: {item.quantity}</p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => removeProductFromSelection(item.productId)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Remover
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddingProducts(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={addProductsToOrder}
                          disabled={selectedProducts.length === 0 || isLoading}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmar
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Carregando produtos disponíveis...</p>
                </div>
              )}
            </div>
          </div>
       
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/customer/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pedido #{order?.id?.slice(-8) || 'Carregando...'}
            </h1>
            <p className="text-gray-600">
              {order?.createdAt ? formatDateTime(order.createdAt) : 'Carregando...'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {(order.status === OrderStatus.PENDENTE || order.status === OrderStatus.CONFIRMADO) && (
            <Button
              variant="success"
              onClick={() => {
                setIsAddingProducts(true);
                fetchAvailableProducts();
              }}
              disabled={isLoading}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar Produtos
            </Button>
          )}
          <Button
            variant="outline"
            onClick={fetchOrderDetails}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status do Pedido */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              order.status === OrderStatus.ENTREGUE ? 'bg-green-100' :
              order.status === OrderStatus.CONFIRMADO ? 'bg-blue-100' :
              order.status === OrderStatus.PENDENTE ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              {getStatusIcon(order.status)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Status do Pedido
                </h3>
                <Badge variant={getStatusColor(order.status) as any}>
                  {order.status}
                </Badge>
              </div>
              <p className="text-gray-600">
                {getStatusDescription(order.status)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhes do Pedido */}
        <div className="lg:col-span-2 space-y-6">
          {/* Itens do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {item.product?.name || 'Produto não encontrado'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Quantidade: {item.quantity}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Observação: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency((item.product?.price || 0) * item.quantity)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(item.product?.price || 0)} cada
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum item encontrado neste pedido.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Informações de Entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Informações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo de Entrega</p>
                  <div className="flex items-center mt-1">
                    {order.deliveryType === 'DELIVERY' ? (
                      <Truck className="h-4 w-4 mr-2 text-blue-600" />
                    ) : (
                      <Package className="h-4 w-4 mr-2 text-green-600" />
                    )}
                    <span className="text-gray-900">
                      {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retirada'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Forma de Pagamento</p>
                  <div className="flex items-center mt-1">
                    <CreditCard className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="text-gray-900">
                      {order.paymentMethod === 'DINHEIRO' ? 'Dinheiro' :
                       order.paymentMethod === 'CARTAO' ? 'Cartão' :
                       order.paymentMethod === 'PIX' ? 'PIX' : 'Outro'}
                    </span>
                  </div>
                </div>
              </div>

              {order.deliveryAddress && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Endereço de Entrega</p>
                  <p className="text-gray-900 mt-1">{order.deliveryAddress}</p>
                </div>
              )}

              {order.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Observações</p>
                  <p className="text-gray-900 mt-1">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumo do Pedido */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  {formatCurrency(order.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taxa de Entrega</span>
                <span className="text-gray-900">R$ 0,00</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary-600">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/customer/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              
              {order.status === OrderStatus.ENTREGUE && (
                <Button variant="primary" className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Avaliar Pedido
                </Button>
              )}

              <Link href="/" className="block">
                <Button variant="outline" className="w-full">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Fazer Novo Pedido
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Informações de Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Precisa de Ajuda?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">(11) 99999-9999</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">contato@lanchonete.com</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
