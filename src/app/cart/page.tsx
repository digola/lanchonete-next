'use client';

import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

  // Debug: Log detalhado na página /cart
  console.log('🛒 CartPage - Estado completo:', {
    items: items.length,
    totalItems,
    totalPrice,
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

                <Button variant="primary" size="lg" fullWidth className="mb-4">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Finalizar Pedido
                </Button>

                <Link href="/">
                  <Button variant="outline" size="lg" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                    Continuar Comprando
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
