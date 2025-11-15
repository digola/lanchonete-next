'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, X } from 'lucide-react';
import { checkPendingOrders } from '@/lib/orderUtils';
import { usePendingOrdersWarning } from '@/hooks/usePendingOrdersWarning';

interface PendingOrdersIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function PendingOrdersIndicator({ 
  className = '',
  showDetails = false 
}: PendingOrdersIndicatorProps) {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { hasPendingOrders, count, forceCheck } = usePendingOrdersWarning({
    enabled: true,
    checkInterval: 15000 // Verificar a cada 15 segundos
  });

  // Buscar detalhes dos pedidos pendentes quando necessário
  useEffect(() => {
    if (!hasPendingOrders) {
      setIsVisible(false);
      setPendingOrders([]);
    } else if (showDetails) {
      checkPendingOrders().then(({ pendingOrders: orders }) => {
        setPendingOrders(orders);
        setIsVisible(true);
      }).catch(() => {});
    }
  }, [hasPendingOrders, showDetails]);

  // Se não há pedidos pendentes, não renderizar nada
  if (!hasPendingOrders) {
    return null;
  }

  return (
    <>
      {/* Indicador Principal - Sempre visível quando há pedidos pendentes */}
      <div className={`fixed top-4 right-4 z-40 ${className}`}>
        <div 
          className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 flex items-center space-x-2 animate-pulse"
          onClick={() => {
            checkPendingOrders({ details: true }).then(({ pendingOrders: orders }) => {
              setPendingOrders(orders);
              setIsVisible(true);
            }).catch(() => {});
          }}
          title="Clique para ver detalhes dos pedidos pendentes"
        >
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold text-sm">
            Pedidos em Aberto ({count || 0})
          </span>
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        </div>
      </div>

      {/* Modal de Detalhes - Só aparece se showDetails for true */}
      {showDetails && isVisible && pendingOrders.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Pedidos em Aberto Detectados
                    </h2>
                    <p className="text-orange-100 text-sm">
                      {pendingOrders.length} pedido(s) não finalizado(s)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {/* Aviso */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-200">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">
                      Atenção: Não feche o navegador sem finalizar estes pedidos!
                    </span>
                  </div>
                </div>

                {/* Lista de Pedidos */}
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">
                            Pedido #{order.id.slice(-8)}
                          </span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {order.status}
                          </span>
                        </div>
                        <span className="font-bold text-green-600">
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Cliente:</span>
                          <span>{order.user?.name || 'N/A'}</span>
                        </div>
                        {order.table && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Mesa:</span>
                            <span>Mesa {order.table.number}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Criado em:</span>
                          <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Recomendação</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    Finalize todos os pedidos pendentes antes de fechar o navegador para evitar problemas de controle.
                  </p>
                  <button
                    onClick={() => {
                      window.location.href = '/expedicao';
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Ir para Expedição
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Este aviso aparecerá sempre que você tentar fechar o navegador
                </span>
                <button
                  onClick={() => setIsVisible(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Entendi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
