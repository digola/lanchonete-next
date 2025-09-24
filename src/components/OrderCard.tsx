'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/utils';
import { Order, OrderStatus, DeliveryType, PaymentMethod } from '@/types';
import { 
  Clock, 
  MapPin, 
  CreditCard, 
  User, 
  Phone, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onViewDetails?: (order: Order) => void;
  onUpdateStatus?: (order: Order, newStatus: OrderStatus) => void;
  showActions?: boolean;
  showCustomerInfo?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export const OrderCard = ({
  order,
  onViewDetails,
  onUpdateStatus,
  showActions = true,
  showCustomerInfo = false,
  className,
  variant = 'default',
}: OrderCardProps) => {
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.CONFIRMADO:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.PREPARANDO:
        return <AlertCircle className="h-4 w-4" />;
      case OrderStatus.PRONTO:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.ENTREGUE:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELADO:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getDeliveryIcon = (type: DeliveryType) => {
    return type === DeliveryType.DELIVERY ? (
      <MapPin className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CARTAO:
        return <CreditCard className="h-4 w-4" />;
      case PaymentMethod.PIX:
        return <div className="h-4 w-4 bg-green-500 rounded-full" />;
      case PaymentMethod.DINHEIRO:
      default:
        return <div className="h-4 w-4 bg-green-600 rounded-full" />;
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case OrderStatus.PENDENTE:
        return OrderStatus.CONFIRMADO;
      case OrderStatus.CONFIRMADO:
        return OrderStatus.PREPARANDO;
      case OrderStatus.PREPARANDO:
        return OrderStatus.PRONTO;
      case OrderStatus.PRONTO:
        return OrderStatus.ENTREGUE;
      default:
        return null;
    }
  };

  const getStatusButtonText = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return 'Confirmar';
      case OrderStatus.CONFIRMADO:
        return 'Iniciar Preparo';
      case OrderStatus.PREPARANDO:
        return 'Marcar Pronto';
      case OrderStatus.PRONTO:
        return 'Marcar Entregue';
      default:
        return 'Atualizar';
    }
  };

  const handleStatusUpdate = () => {
    const nextStatus = getNextStatus(order.status);
    if (nextStatus && onUpdateStatus) {
      onUpdateStatus(order, nextStatus);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order);
    }
  };

  if (variant === 'compact') {
    return (
      <Card className={`transition-all duration-200 hover:shadow-medium ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <StatusBadge status={order.status} />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Pedido #{order.id.slice(-8)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(order.total)} • {formatRelativeTime(order.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {showActions && onViewDetails && (
                <Button variant="ghost" size="sm" onClick={handleViewDetails}>
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-medium ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Pedido #{order.id.slice(-8)}
          </CardTitle>
          <StatusBadge status={order.status} dot />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {formatDateTime(order.createdAt)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="font-medium text-lg text-primary-600">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            {getDeliveryIcon(order.deliveryType)}
            <span className="text-gray-600">
              {order.deliveryType === DeliveryType.DELIVERY ? 'Delivery' : 'Retirada'}
            </span>
          </div>

          {order.deliveryAddress && (
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="truncate">{order.deliveryAddress}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-sm">
            {getPaymentIcon(order.paymentMethod)}
            <span className="text-gray-600">
              {order.paymentMethod === PaymentMethod.DINHEIRO && 'Dinheiro'}
              {order.paymentMethod === PaymentMethod.CARTAO && 'Cartão'}
              {order.paymentMethod === PaymentMethod.PIX && 'PIX'}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        {showCustomerInfo && order.user && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{order.user.name}</span>
              {order.user.email && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{order.user.email}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Table Info */}
        {order.table && (
          <div className="border-t pt-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="h-4 w-4 bg-gray-400 rounded-sm" />
              <span className="text-gray-600">
                Mesa {order.table.number} (Capacidade: {order.table.capacity})
              </span>
            </div>
          </div>
        )}

        {/* Items Summary */}
        <div className="border-t pt-3">
          <p className="text-sm text-gray-600 mb-2">
            {order.items.length} item{order.items.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-1">
            {order.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.quantity}x {item.product?.name}
                </span>
                <span className="text-gray-900">
                  {formatCurrency(item.price)}
                </span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-xs text-gray-500">
                +{order.items.length - 3} item{order.items.length - 3 > 1 ? 's' : ''} mais
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="border-t pt-3">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Observações:</span> {order.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2 pt-3 border-t">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
                leftIcon={<Eye className="h-4 w-4" />}
              >
                Ver Detalhes
              </Button>
            )}
            
            {onUpdateStatus && getNextStatus(order.status) && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStatusUpdate}
                className="flex-1"
              >
                {getStatusButtonText(order.status)}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente para lista de pedidos
interface OrderListProps {
  orders: Order[];
  onViewDetails?: (order: Order) => void;
  onUpdateStatus?: (order: Order, newStatus: OrderStatus) => void;
  showActions?: boolean;
  showCustomerInfo?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const OrderList = ({
  orders,
  onViewDetails,
  onUpdateStatus,
  showActions = true,
  showCustomerInfo = false,
  variant = 'default',
  className,
}: OrderListProps) => {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum pedido encontrado
        </h3>
        <p className="text-gray-600">
          Os pedidos aparecerão aqui quando forem criados.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          {...(onViewDetails && { onViewDetails })}
          {...(onUpdateStatus && { onUpdateStatus })}
          {...(showActions !== undefined && { showActions })}
          {...(showCustomerInfo !== undefined && { showCustomerInfo })}
          {...(variant && { variant })}
        />
      ))}
    </div>
  );
};

export default OrderCard;
