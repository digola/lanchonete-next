'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import { 
  X,
  Clock,
  CheckCircle,
  Package,
  Users,
  Calendar,
  MapPin,
  CreditCard,
  Printer,
  Edit,
  Eye,
  RefreshCw,
  DollarSign
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
}

interface OrderLog {
  id: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export function OrderDetailsModal({ 
  order, 
  isOpen, 
  onClose, 
  onUpdateStatus 
}: OrderDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [logs, setLogs] = useState<OrderLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Buscar logs do pedido quando o modal abrir
  const fetchLogs = async () => {
    if (!order) return;
    
    setLoadingLogs(true);
    try {
      const token = localStorage.getItem('auth-token');
      const response = await fetch(`/api/orders/${order.id}/logs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen && order) {
      fetchLogs();
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.CONFIRMADO:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.PREPARANDO:
        return <Package className="h-4 w-4" />;
      case OrderStatus.PRONTO:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.ENTREGUE:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELADO:
        return <X className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDENTE:
        return 'warning';
      case OrderStatus.CONFIRMADO:
        return 'info';
      case OrderStatus.PREPARANDO:
        return 'secondary';
      case OrderStatus.PRONTO:
        return 'success';
      case OrderStatus.ENTREGUE:
        return 'success';
      case OrderStatus.CANCELADO:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!onUpdateStatus) return;

    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, newStatus);
      // Recarregar logs após atualização
      await fetchLogs();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const printOrder = () => {
    const printWindow = window.open('', '_blank', 'width=220,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para impressão');
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
              ${order.table ? `Mesa ${order.table.number}` : 'Balcão'}<br>
              ${currentDate.toLocaleString('pt-BR')}
            </div>
          </div>
          
          <div class="items">
            ${order.items?.map(item => `
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
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const getAvailableStatusActions = () => {
    const currentStatus = order.status;
    const actions = [];

    switch (currentStatus) {
      case OrderStatus.PENDENTE:
        actions.push(
          { status: OrderStatus.CONFIRMADO, label: 'Confirmar', color: 'blue' },
          { status: OrderStatus.CANCELADO, label: 'Cancelar', color: 'red' }
        );
        break;
      case OrderStatus.CONFIRMADO:
        actions.push(
          { status: OrderStatus.PREPARANDO, label: 'Marcar Preparando', color: 'yellow' },
          { status: OrderStatus.CANCELADO, label: 'Cancelar', color: 'red' }
        );
        break;
      case OrderStatus.PREPARANDO:
        actions.push(
          { status: OrderStatus.PRONTO, label: 'Marcar Pronto', color: 'green' },
          { status: OrderStatus.CANCELADO, label: 'Cancelar', color: 'red' }
        );
        break;
      case OrderStatus.PRONTO:
        actions.push(
          { status: OrderStatus.ENTREGUE, label: 'Marcar Entregue', color: 'green' }
        );
        break;
    }

    return actions;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Detalhes do Pedido</h2>
                <p className="text-blue-100 text-sm">Pedido #{order.id.slice(-8)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações Principais */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status e Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Informações do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">ID do Pedido</label>
                      <p className="text-lg font-semibold">#{order.id.slice(-8)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <Badge variant={getStatusColor(order.status) as any}>
                          {order.status}
                        </Badge>
                        {order.isPaid && (
                          <Badge variant="success">Pago</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Data de Criação</label>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Última Atualização</label>
                      <p className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDateTime(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cliente e Mesa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Cliente e Localização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Cliente</label>
                      <p className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {order.user?.name || 'Cliente não identificado'}
                      </p>
                      {order.user?.email && (
                        <p className="text-sm text-gray-500 ml-5">{order.user.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Localização</label>
                      <p className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {order.table ? `Mesa ${order.table.number}` : 'Balcão'}
                      </p>
                      {order.table && (
                        <p className="text-sm text-gray-500 ml-5">
                          Capacidade: {order.table.capacity} pessoas
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Itens do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Itens do Pedido ({order.items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items?.map((item, index) => (
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
                </CardContent>
              </Card>

              {/* Histórico de Alterações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Histórico de Alterações ({logs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingLogs ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">Carregando histórico...</p>
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Nenhuma alteração registrada</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {logs.map((log) => (
                        <div key={log.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                {log.action.replace('UPDATE_', '')}
                              </Badge>
                              <span className="text-sm font-medium text-gray-900">
                                {log.field}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            <p className="font-medium">{log.reason}</p>
                          </div>
                          
                          {log.user && (
                            <div className="text-xs text-gray-500 flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {log.user.name} ({log.user.role})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Painel Lateral */}
            <div className="space-y-6">
              {/* Resumo Financeiro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                    {order.paymentMethod && (
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pagamento: {order.paymentMethod}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Edit className="h-5 w-5 mr-2" />
                    Ações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      onClick={printOrder}
                      className="w-full flex items-center justify-center"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir Pedido
                    </Button>

                    {/* Ações de Status */}
                    {getAvailableStatusActions().map((action) => (
                      <Button
                        key={action.status}
                        variant="outline"
                        onClick={() => handleStatusUpdate(action.status)}
                        disabled={isUpdating}
                        className={`w-full flex items-center justify-center ${
                          action.color === 'red' ? 'text-red-600 border-red-300 hover:bg-red-50' :
                          action.color === 'blue' ? 'text-blue-600 border-blue-300 hover:bg-blue-50' :
                          action.color === 'green' ? 'text-green-600 border-green-300 hover:bg-green-50' :
                          action.color === 'yellow' ? 'text-yellow-600 border-yellow-300 hover:bg-yellow-50' :
                          ''
                        }`}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Pedido criado em {formatDateTime(order.createdAt)}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 py-2"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
