'use client';

import { useCart } from '@/hooks/useCart';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { table } from 'console';
import { useRealTables } from '@/hooks/useRealData';
import { toast } from '@/lib/toast';

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
    tableId: cartTableId,
    tableNumber: cartTableNumber,
    setCartTable,
  } = useCart();

  const { isAuthenticated, user } = useOptimizedAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Suportar tanto ?tableId quanto ?tableNumber na URL (QR pode passar número)
  const tableIdFromUrl = searchParams?.get('tableId') || null;
  const tableNumberFromUrl = searchParams?.get('tableNumber') || null;
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [deliveryType, setDeliveryType] = useState('RETIRADA');
  const [paymentMethod, setPaymentMethod] = useState('DINHEIRO');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Carregar dados de mesas para resolver número a partir do ID (quando só o tableId vier na URL)
  const { data: realTablesData } = useRealTables([]);

  // Quando houver tableId na URL e o número não estiver definido, tentar resolver pelo dataset de mesas
  useEffect(() => {
    try {
      if (tableIdFromUrl && (cartTableNumber == null)) {
        const tables = Array.isArray(realTablesData) ? realTablesData : [];
        const found = tables.find((t: any) => t?.id === tableIdFromUrl);
        const resolvedNumber = found?.number ?? found?.tableNumber ?? null;

        if (resolvedNumber != null && typeof resolvedNumber === 'number') {
          setCartTable(tableIdFromUrl, resolvedNumber);
          // Opcional: atualizar a URL para incluir o número (mantendo o ID)
          // const params = new URLSearchParams(window.location.search);
          // params.set('tableNumber', String(resolvedNumber));
          // window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
      }
    } catch (err) {
      console.warn('Falha ao resolver número da mesa pelo tableId:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableIdFromUrl, realTablesData]);

  // Quando houver tableNumber na URL e não houver tableId, tentar resolver o ID via dataset de mesas
  useEffect(() => {
    try {
      const parsedNumber = tableNumberFromUrl ? parseInt(tableNumberFromUrl, 10) : (cartTableNumber ?? null);
      if (!tableIdFromUrl && !cartTableId && parsedNumber != null) {
        const tables = Array.isArray(realTablesData) ? realTablesData : [];
        const found = tables.find((t: any) => (t?.number ?? t?.tableNumber) === parsedNumber);
        if (found?.id) {
          setCartTable(found.id, parsedNumber);
        }
      }
    } catch (err) {
      console.warn('Falha ao resolver tableId pelo tableNumber:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumberFromUrl, cartTableNumber, realTablesData]);

  // Função para finalizar o pedido
  const handleFinalizeOrder = async () => {
    if (!isAuthenticated) {
      // Redirecionar para login se não estiver autenticado
      router.push('/login?redirect=/cart');
      return;
    }

    if (isEmpty || items.length === 0) {
      toast.warning('Carrinho vazio', 'Adicione produtos antes de finalizar.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🛒 Iniciando finalização do pedido:', {
        items: items,
        totalPrice: totalPrice,
        userId: user?.id
      });

      // Preparar dados do pedido
      const orderData: any = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || null,
          customizations: item.customizations || null,
        })),
        deliveryType: deliveryType,
        tableId: tableIdFromUrl || cartTableId || null,
        tableNumber: tableNumberFromUrl || cartTableNumber || null,
        paymentMethod: paymentMethod,
        deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : null,
        notes: orderNotes,
        total: totalPrice
      };

      // Se houver tableId na URL, incluir no payload para salvar o relacionamento order->table
      if (tableIdFromUrl || cartTableId) {
        orderData.tableId = tableIdFromUrl || cartTableId;
      } else if (tableNumberFromUrl || cartTableNumber) {
        const parsed = tableNumberFromUrl ? parseInt(tableNumberFromUrl, 10) : NaN;
        const parsedFromCart = cartTableNumber ?? null;
        const finalParsed = !isNaN(parsed) ? parsed : (parsedFromCart ?? null);
        if (finalParsed !== null) orderData.tableNumber = finalParsed;
      }

      console.log('📦 Dados do pedido preparados:', orderData);

      // Decidir entre criar pedido (POST) ou adicionar itens ao pedido existente (PUT)
      const token = localStorage.getItem('auth-token');
      if (!token) {
        toast.error('Usuário não autenticado', 'Faça login para finalizar o pedido.');
        return;
      }

      let response: Response;

      if (orderData.tableId || orderData.tableNumber !== 'livre') {
        // Buscar status da mesa para decidir a ação
        let tableId: string | null = orderData.tableId || null;

        // Se só temos o número, tentar resolver o ID via API
        if (!tableId && typeof orderData.tableNumber === 'number') {
          try {
            const tblRes = await fetch(`/api/tables?number=${orderData.tableNumber}`, {
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-store'
            });
            const tblJson = await tblRes.json();
            if (tblRes.ok && Array.isArray(tblJson?.data) && tblJson.data.length > 0) {
              tableId = tblJson.data[0].id;
              orderData.tableId = tableId;
              setCartTable(tableId, orderData.tableNumber);
            }
          } catch (e) {
            console.warn('Não foi possível resolver tableId via número:', e);
          }
        }

        let tableStatus: string | null = null;
        if (tableId) {
          const tableRes = await fetch(`/api/tables/${tableId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          });
          const tableJson = await tableRes.json();
          if (!tableRes.ok || !tableJson?.success) {
            throw new Error(tableJson?.error || 'Erro ao consultar mesa');
          }
          tableStatus = tableJson?.data?.status ?? null;
        }

        if (tableStatus === 'OCUPADA') {
          // Mesa ocupada: adicionar itens ao pedido ativo existente
          const pendingStatuses = ['PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'PRONTO'];
          const ordersRes = await fetch(`/api/orders?tableId=${tableId}&status=${pendingStatuses.join(',')}&limit=1&sortOrder=desc`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
          });
          const ordersJson = await ordersRes.json();
          if (!ordersRes.ok) {
            throw new Error(ordersJson?.error || 'Erro ao buscar pedido ativo da mesa');
          }

          const existingOrder = Array.isArray(ordersJson?.data) ? ordersJson.data[0] : null;

          if (existingOrder?.id) {
            const itemsPayload = items.map(i => {
              let adicionaisIds: string[] = [];
              try {
                const custom = typeof i.customizations === 'string' 
                  ? JSON.parse(i.customizations) 
                  : (i.customizations || {});
                if (Array.isArray(custom?.adicionaisIds)) {
                  adicionaisIds = custom.adicionaisIds as string[];
                } else if (Array.isArray(custom?.adicionais)) {
                  adicionaisIds = custom.adicionais as string[];
                }
              } catch {}
              return {
                productId: i.productId,
                quantity: i.quantity,
                notes: i.notes || null,
                ...(adicionaisIds.length > 0 ? { adicionaisIds } : {}),
              };
            });

            response = await fetch(`/api/orders/${existingOrder.id}/items`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ items: itemsPayload })
            });
            toast.info('Mesa ocupada', 'Itens adicionados ao pedido existente.');
          } else {
            // Fallback: não achou pedido ativo, criar novo
            response = await fetch('/api/orders', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(orderData)
            });
          }
        } else {
          // Mesa livre (ou sem status definido): criar novo pedido
          response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
          });
        }
      } else {
        toast.error('Mesa não associada', 'É necessário associar o pedido a uma mesa.');
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Erro ao criar/atualizar pedido');
      }

      console.log('✅ Pedido criado/atualizado com sucesso:', result);

      // Limpar carrinho após sucesso
      clearCart();
      
      // Mostrar mensagem de sucesso
      setOrderCompleted(true);
      toast.success('Pedido finalizado', 'Seu pedido foi processado com sucesso.');
      
      // Redirecionar para dashboard após 3 segundos
      setTimeout(() => {
        router.push('/staff/');
      }, 3000);
      
    } catch (err) {
      console.error(' Erro ao finalizar pedido:', err);
      const message = err instanceof Error ? err.message : 'Tente novamente.';
      toast.error('Erro ao finalizar pedido', message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Debug: Log detalhado na página /cart
  console.log('🛒 CartPage - Estado completo:', {
    itemsCount: items.length,
    totalItems,
    totalPrice,
    tableIdFromUrl,
    tableId: cartTableId,
    tableNumberFromUrl,
    tableNumber: cartTableNumber,
    isEmpty,
    items: items,
    localStorage: typeof window !== 'undefined' ? localStorage.getItem('lanchonete-cart-v2') : 'N/A'
  });



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
              Seu carrinho está vazio
            </h1>
            <p className="text-gray-600 mb-8">
              Que tal adicionar alguns produtos deliciosos?
            </p>
            
            {/* Debug Panel */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Panel</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                <p>Items: {items.length}</p>
                <p>Total Items: {totalItems}</p>
                <p>Total Price: R$ {totalPrice.toFixed(2)}</p>
                <p>Is Empty: {isEmpty ? 'SIM' : 'NÃO'}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                🔄 Recarregar Página
              </Button>
            </div>
            
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
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Mesa: {tableNumberFromUrl ?? (cartTableNumber != null ? String(cartTableNumber) : 'não definida')}
            </span>
          </div>
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
                      {item.notes ? (
                        <div className="mt-1 text-xs text-gray-500">
                          Obs.: {item.notes}
                        </div>
                      ) : null}
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
                      Pedido Enviado com Sucesso!
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Seu pedido foi enviado e está sendo processado.
                    </p>
                    <p className="text-sm text-gray-500">
                      Redirecionando para o dashboard...
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
                  {/* Tipo de entrega */}
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

                  {/* Endereço de entrega (se delivery) */}
                  {deliveryType === 'DELIVERY' && (
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

                  {/* Método de pagamento */}
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
                  disabled={isProcessing || (deliveryType === 'DELIVERY' && !deliveryAddress.trim())}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Finalizar Pedido
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
