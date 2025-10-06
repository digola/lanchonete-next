'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { checkPendingOrders, formatPendingOrdersForDisplay } from '@/lib/orderUtils';
import { useApiAuth } from '@/hooks/useApiAuth';
import { LogOut, AlertTriangle, Package, X, CheckCircle } from 'lucide-react';

interface LogoutWithPendingOrdersCheckProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutWithPendingOrdersCheck({
  variant = 'outline',
  size = 'md',
  className = '',
  showIcon = true,
  children
}: LogoutWithPendingOrdersCheckProps) {
  const { logout } = useApiAuth();
  const [showModal, setShowModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const handleLogoutClick = async () => {
    setIsChecking(true);
    try {
      const { hasPendingOrders, pendingOrders: orders } = await checkPendingOrders();
      
      if (hasPendingOrders) {
        setPendingOrders(orders);
        setShowModal(true);
      } else {
        // Não há pedidos pendentes, fazer logout normalmente
        await logout();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro ao verificar pedidos pendentes:', error);
      // Em caso de erro, permitir logout
      await logout();
      window.location.href = '/login';
    } finally {
      setIsChecking(false);
    }
  };

  const handleForceLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const handleCancelLogout = () => {
    setShowModal(false);
    setPendingOrders([]);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleLogoutClick}
        disabled={isChecking}
        className={className}
      >
        {isChecking ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Verificando...</span>
          </div>
        ) : (
          <>
            {showIcon && <LogOut className="h-4 w-4 mr-2" />}
            {children || 'Sair'}
          </>
        )}
      </Button>

      {/* Modal de Confirmação */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Atenção - Pedidos em Aberto</h2>
                    <p className="text-orange-100 text-sm">
                      Existem pedidos não finalizados no sistema
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelLogout}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Aviso Principal */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-yellow-800">
                        Não é possível fazer logout
                      </h3>
                      <p className="text-yellow-700">
                        Existem {pendingOrders.length} pedido(s) em aberto que precisam ser finalizados.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-yellow-200">
                    <p className="text-sm text-gray-700">
                      <strong>Recomendação:</strong> Finalize todos os pedidos pendentes antes de sair do sistema 
                      para evitar problemas de controle e gestão.
                    </p>
                  </div>
                </div>

                {/* Lista de Pedidos Pendentes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-blue-600" />
                    Pedidos em Aberto
                  </h3>
                  
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
                </div>

                {/* Ações */}
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Próximos Passos</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Acesse a página de Expedição para gerenciar os pedidos</li>
                    <li>• Finalize os pedidos pendentes</li>
                    <li>• Após finalizar todos os pedidos, você poderá fazer logout</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => window.location.href = '/expedicao'}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Ir para Expedição
                </Button>
                
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={handleCancelLogout}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleForceLogout}
                    className="px-6 bg-red-600 hover:bg-red-700 text-white font-semibold"
                  >
                    Sair Mesmo Assim
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
