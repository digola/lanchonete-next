'use client';

import { useState } from 'react';

import { useCartPersistence } from '@/hooks/useCartPersistence';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { DeliveryType, PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  CreditCard, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
  const { isAuthenticated, user } = useApiAuth();
  const {
    items,
    totalItems,
    totalPrice,
    updateItemQuantity,
    removeFromCart,
    clearCart,
    setItemNotes,
    addToCart,
    removeFromCart: removeItem,
  } = useCartPersistence();

  const [showCheckout, setShowCheckout] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.DELIVERY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.DINHEIRO);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateItemQuantity(productId, newQuantity);
    }
  };

  const handleItemNotesChange = (productId: string, notes: string) => {
    setItemNotes(productId, notes);
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      // Redirecionar para login
      window.location.href = '/login';
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Preparar dados do pedido
      const orderData = {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          customizations: item.customizations,
          notes: item.notes,
        })),
        deliveryType,
        deliveryAddress: deliveryType === DeliveryType.DELIVERY ? deliveryAddress : null,
        paymentMethod,
        notes,
      };

      // Criar pedido
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar pedido');
      }

      // Limpar carrinho e mostrar sucesso
      clearCart();
      setShowCheckout(false);
      
      // Mostrar modal de sucesso
      alert('Pedido criado com sucesso!');
      
      // Redirecionar para área do cliente
      window.location.href = '/cliente/pedidos';

    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao criar pedido. Tente novamente.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (items.length === 0) {
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
              Adicione alguns produtos deliciosos ao seu carrinho!
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
            
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Continuar Comprando
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(true)}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Limpar Carrinho
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-app py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Itens do Carrinho ({totalItems})
            </h2>

            {items.map((item) => (
              <Card key={item.product.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📷
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {item.product.description}
                      </p>
                      <p className="text-lg font-semibold text-primary-600">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
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
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Item Notes */}
                  <div className="mt-4">
                    <Input
                      placeholder="Observações para este item (opcional)"
                      value={item.notes || ''}
                      onChange={(e) => handleItemNotesChange(item.product.id, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Resumo do Pedido</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Summary */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>

                {/* Checkout Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowCheckout(true)}
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                >
                  Finalizar Pedido
                </Button>
              </CardContent>
            </Card>

            {/* Delivery Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Entrega
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value={DeliveryType.DELIVERY}
                        checked={deliveryType === DeliveryType.DELIVERY}
                        onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                        className="text-primary-500"
                      />
                      <span className="text-sm">Delivery</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value={DeliveryType.RETIRADA}
                        checked={deliveryType === DeliveryType.RETIRADA}
                        onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                        className="text-primary-500"
                      />
                      <span className="text-sm">Retirada no Local</span>
                    </label>
                  </div>
                </div>

                {deliveryType === DeliveryType.DELIVERY && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Endereço de Entrega
                    </label>
                    <Input
                      placeholder="Rua, número, bairro, cidade"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value={PaymentMethod.DINHEIRO}
                        checked={paymentMethod === PaymentMethod.DINHEIRO}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-primary-500"
                      />
                      <span className="text-sm">Dinheiro</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value={PaymentMethod.CARTAO}
                        checked={paymentMethod === PaymentMethod.CARTAO}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                        className="text-primary-500"
                      />
                      <span className="text-sm">Cartão</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações Gerais
                  </label>
                  <Input
                    placeholder="Observações adicionais (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Finalizar Pedido"
      >
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h3 className="text-lg font-semibold mb-2">Confirmar Pedido</h3>
            <p className="text-gray-600">
              Você está prestes a finalizar seu pedido de{' '}
              <span className="font-semibold">{formatCurrency(totalPrice)}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Pedido:</h4>
              <div className="space-y-1 text-sm">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>Tipo de Entrega:</strong> {deliveryType === DeliveryType.DELIVERY ? 'Delivery' : 'Retirada'}</p>
              {deliveryType === DeliveryType.DELIVERY && deliveryAddress && (
                <p><strong>Endereço:</strong> {deliveryAddress}</p>
              )}
              <p><strong>Pagamento:</strong> {paymentMethod === PaymentMethod.DINHEIRO ? 'Dinheiro' : 'Cartão'}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleCheckout}
              disabled={isCreatingOrder}
              className="flex-1"
              leftIcon={isCreatingOrder ? undefined : <CheckCircle className="h-4 w-4" />}
            >
              {isCreatingOrder ? 'Criando Pedido...' : 'Confirmar Pedido'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Cart Confirmation */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearCart}
        title="Limpar Carrinho"
        description="Tem certeza que deseja remover todos os itens do carrinho?"
        confirmText="Limpar"
        cancelText="Cancelar"
      />
    </div>
  );
}
