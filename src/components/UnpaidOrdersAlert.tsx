'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, CreditCard, X, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types';

interface UnpaidOrdersAlertProps {
  onRefresh?: () => void;
  className?: string;
}

export function UnpaidOrdersAlert({ onRefresh, className = '' }: UnpaidOrdersAlertProps) {
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Buscar pedidos não pagos
  const fetchUnpaidOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await fetch('/api/orders?isPaid=false&isActive=true&includeUser=true&includeTable=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnpaidOrders(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos não pagos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar pedidos não pagos ao montar o componente
  useEffect(() => {
    fetchUnpaidOrders();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnpaidOrders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Se não há pedidos não pagos ou o alerta foi fechado, não mostrar
  if (!isVisible || unpaidOrders.length === 0) {
    return null;
  }

  const totalUnpaidAmount = unpaidOrders.reduce((total, order) => total + order.total, 0);

  return (
    <Card className={`border-red-200 bg-gradient-to-r from-red-50 to-orange-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 text-sm sm:text-base">
                Pedidos Não Pagos Detectados
              </h3>
              <p className="text-red-600 text-xs sm:text-sm">
                {unpaidOrders.length} pedido(s) pendente(s) • Total: {formatCurrency(totalUnpaidAmount)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {unpaidOrders.length}
            </Badge>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchUnpaidOrders}
              disabled={isLoading}
              className="text-red-600 hover:bg-red-100"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="text-red-600 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Lista de pedidos não pagos */}
        <div className="mt-3 space-y-2 max-h-32 overflow-y-auto">
          {unpaidOrders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-gray-900">
                  #{order.id.slice(-8)}
                </span>
                <span className="text-xs text-gray-600">
                  {order.table ? `Mesa ${order.table.number}` : 'Balcão'}
                </span>
              </div>
              <span className="text-sm font-bold text-red-600">
                {formatCurrency(order.total)}
              </span>
            </div>
          ))}
          
          {unpaidOrders.length > 3 && (
            <p className="text-xs text-red-600 text-center">
              +{unpaidOrders.length - 3} pedido(s) adicional(is)
            </p>
          )}
        </div>
        
        <div className="mt-3 p-2 bg-red-100 rounded-lg border border-red-200">
          <p className="text-xs text-red-800 text-center font-medium">
            ⚠️ Finalize todos os pedidos antes de sair da página de expedição
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
