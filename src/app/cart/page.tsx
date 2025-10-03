'use client';

import { useCart } from '@/hooks/useCart';
import { useApiAuth } from '@/hooks/useApiAuth';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CartPage() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
    formatTotalPrice,
    isEmpty,
  } = useCart();

  const { isAuthenticated, user } = useApiAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [deliveryType, setDeliveryType] = useState('RETIRADA');
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [tableId, setTableId] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  // Verificar se é staff e se há mesa na URL
  const isStaff = user?.role === 'STAFF' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
  
  // Buscar dados da mesa se tableId estiver disponível
  const { data: tableData } = useApi<any>(tableId ? `/api/tables/${tableId}` : '', { immediate: !!tableId });
  
  useEffect(() => {
    const tableIdParam = searchParams.get('tableId');
    if (tableIdParam) {
      setTableId(tableIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tableData) {
      const table = tableData.data || tableData;
      setTableNumber(table?.number);
    }
  }, [tableData]);

  // Função para finalizar o pedido
  const handleFinalizeOrder = async () => {
    if (!isAuthenticated) {
      // Redirecionar para login se não estiver autenticado
      router.push('/login?redirect=/cart');
      return;
    }

    if (isEmpty || items.length === 0) {
      alert('Carrinho vazio. Adicione produtos antes de finalizar.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🚀 Iniciando finalização do pedido...');
      console.log('📦 Itens do carrinho:', items);
      console.log('🏪 É staff?', isStaff);
      console.log('🪑 TableId:', tableId);

      // Preparar dados do pedido
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        ...(isStaff && tableId ? { tableId } : {
          deliveryType: deliveryType,
          deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : null,
        }),
        // Para staff, usar pagamento em dinheiro
        ...(isStaff ? { paymentMethod: 'DINHEIRO' } : { paymentMethod: paymentMethod }),
        notes: orderNotes,
        total: totalPrice
      };

      console.log('📋 Dados do pedido preparados:', orderData);

      // Verificar token
      const token = localStorage.getItem('auth-token');
      console.log('🔑 Token presente?', !!token);

      // Fazer requisição para criar o pedido no banco
      console.log('🌐 Enviando requisição para /api/orders...');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      console.log('📡 Resposta recebida:', response.status, response.statusText);
      const result = await response.json();
      console.log('📄 Resultado:', result);

      if (!response.ok) {
        console.error('❌ Erro na resposta:', result);
        throw new Error(result.error || 'Erro ao criar pedido');
      }

      console.log('✅ Pedido criado com sucesso:', result.data);


      // Limpar carrinho após sucesso
      clearCart();
      
      // Mostrar mensagem de sucesso
      setOrderCompleted(true);
      
      // Redirecionar baseado no tipo de usuário
      setTimeout(() => {
        if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
          // Staff vai para /staff após finalizar pedido
          router.push('/staff');
        } else if (user?.role === 'MANAGER') {
          // Manager vai para expedição após finalizar pedido
          router.push('/expedicao');
        } else {
          // Clientes vão para dashboard
          router.push('/customer/dashboard');
        }
      }, 3000);
      
    } catch (error: any) {
      console.error('❌ Erro ao finalizar pedido:', error);
      alert(`Erro ao finalizar pedido: ${error.message || 'Tente novamente.'}`);
    } finally {
      setIsProcessing(false);
    }
  };




  if (isEmpty) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container-app">
            <div className="flex items-center justify-between py-4">
              <Link href="/" className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-bold text-white">🍔</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Lanchonete</h1>
                  <p className="text-sm text-gray-600">Cardápio Online</p>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <main className="container-app py-16">
          <div className="text-center">
            <div className="text-6xl mb-6">🛒</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
            você será Redirecionado...
            </h1>
            <p className="text-gray-600 mb-8">
              Que tal adicionar alguns produtos deliciosos?
            </p>
            
            
            <Link href="/">
              <Button variant="primary" size="lg" leftIcon={<ArrowLeft className="h-5 w-5" />}>
                Voltar ao Cardápio
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container-app">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">🍔</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Lanchonete</h1>
                <p className="text-sm text-gray-600">Carrinho de Compras</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="container-app py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
          </h1>
          <Button variant="outline" onClick={clearCart}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Carrinho
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} hover="lift">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Product Image */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-2xl">🍔</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">{item.product.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" size="sm">
                          {item.product.category?.name || 'Sem categoria'}
                        </Badge>
                        <span className="text-primary-600 font-medium">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.productId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {orderCompleted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {isStaff ? 'Pedido Enviado para Cozinha!' : 'Pedido Enviado com Sucesso!'}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {isStaff 
                        ? `Pedido da Mesa ${tableNumber || 'N/A'} foi enviado para a cozinha e está sendo preparado.`
                        : 'Seu pedido foi enviado e está sendo processado.'
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {isStaff ? 'Redirecionando para o painel de staff...' : 'Redirecionando para o dashboard...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Resumo do Pedido
                    </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Itens ({totalItems})</span>
                    <span className="font-medium">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxa de entrega</span>
                    <span className="font-medium">Grátis</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatTotalPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Campos de seleção do pedido */}
                <div className="space-y-4 mb-6">
                  {/* Para Staff: Exibir número da mesa */}
                  {isStaff && tableId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mesa Selecionada
                      </label>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">🪑</span>
                          <div>
                            <p className="font-semibold text-blue-900">
                              Mesa {tableNumber || 'N/A'}
                            </p>
                            <p className="text-sm text-blue-700">
                              Pedido será criado para esta mesa
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Para Clientes: Tipo de entrega */}
                  {!isStaff && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Entrega
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('RETIRADA')}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                            deliveryType === 'RETIRADA'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          🏪 Retirada
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType('DELIVERY')}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                            deliveryType === 'DELIVERY'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          🚚 Delivery
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Endereço de entrega (se delivery e não for staff) */}
                  {!isStaff && deliveryType === 'DELIVERY' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço de Entrega
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Digite seu endereço completo..."
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Método de pagamento - apenas para clientes */}
                  {!isStaff && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Método de Pagamento
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('DINHEIRO')}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                            paymentMethod === 'DINHEIRO'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          💵 Dinheiro
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CARTAO')}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-colors ${
                            paymentMethod === 'CARTAO'
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          💳 Cartão
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Alguma observação especial para o pedido?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={2}
                    />
                  </div>
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  className="mb-4"
                  onClick={handleFinalizeOrder}
                  disabled={isProcessing || (!isStaff && deliveryType === 'DELIVERY' && !deliveryAddress.trim())}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      {isStaff ? (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Enviar pra Cozinha
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Finalizar Pedido
                        </>
                      )}
                    </>
                  )}
                </Button>

                <Link href="/">
                  <Button variant="outline" size="lg" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Continuar Comprando
                  </Button>
                </Link>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
