'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { printOrder } from '@/lib/printOrder';
import { productionRealDataConfig } from '@/config/realDataConfig';

interface OrderDetailsModalContentProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal elegante para exibir detalhes completos do pedido
 * Inclui: adicionais, observações, itens, etc.
 * Usa componente Modal padrão do projeto
 */
const OrderDetailsModalContent: React.FC<OrderDetailsModalContentProps> = React.memo(
  ({ order, isOpen, onClose }) => {
    // Buscar dados dos adicionais
    const [adicionaisMap, setAdicionaisMap] = useState<Record<string, { name: string; price: number }>>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setMounted(true);
        return;
      }
      // Delay para garantir que o modal foi completamente removido
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }, [isOpen]);

    useEffect(() => {
      if (!isOpen) return;

      // Coletar todos os IDs de adicionais dos itens
      const allAdicionalIds: string[] = [];
      order.items?.forEach(item => {
        if (item.customizations) {
          try {
            const customizations = typeof item.customizations === 'string' 
              ? JSON.parse(item.customizations) 
              : item.customizations;
            const ids = Array.isArray(customizations?.adicionaisIds)
              ? customizations.adicionaisIds
              : Array.isArray(customizations?.adicionais)
                ? customizations.adicionais
                : [];
            if (ids.length > 0) allAdicionalIds.push(...ids);
          } catch (e) {
            console.error('Erro ao parsear customizations:', e);
          }
        }
      });

      // Buscar dados dos adicionais
      if (allAdicionalIds.length > 0) {
        const uniqueIds = [...new Set(allAdicionalIds)];
        fetch(`/api/adicionais`)
          .then(res => res.json())
          .then(result => {
            if (result.success && result.data) {
              const map: Record<string, { name: string; price: number }> = {};
              result.data.forEach((adic: any) => {
                if (uniqueIds.includes(adic.id)) {
                  map[adic.id] = {
                    name: adic.name,
                    price: adic.price || 0
                  };
                }
              });
              setAdicionaisMap(map);
            }
          })
          .catch(error => {
            console.error('Erro ao buscar adicionais:', error);
          });
      }
    }, [isOpen, order.items]);

    // Função auxiliar para obter adicionais de um item
    const getItemAdicionais = useMemo(() => {
      return (item: any) => {
        if (!item.customizations) return [];
        try {
          const customizations = typeof item.customizations === 'string' 
            ? JSON.parse(item.customizations) 
            : item.customizations;
          const ids = Array.isArray(customizations?.adicionaisIds)
            ? customizations.adicionaisIds
            : Array.isArray(customizations?.adicionais)
              ? customizations.adicionais
              : [];
          if (ids.length > 0) {
            return ids.map((id: string) => adicionaisMap[id]).filter((adic: any) => adic);
          }
        } catch (e) {
          console.error('Erro ao parsear customizations:', e);
        }
        return [];
      };
    }, [adicionaisMap]);


    if (!mounted && !isOpen) return null;

    return (
      <Modal
        isOpen={isOpen && mounted}
        onClose={onClose}
        title={`📋 Detalhes do Pedido #${order.id.slice(-8)}`}
        size="lg"
        showCloseButton
        closeOnOverlayClick
        closeOnEscape
      >
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          
          {/* Informações Gerais */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-center text-base">ℹ️ Informações Gerais</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-center">
              {order.user && (
                <div>
                  <span className="text-gray-600 text-xs">Cliente</span>
                  <p className="font-bold text-gray-900">{order.user.name}</p>
                </div>
              )}
              {order.table && (
                <div>
                  <span className="text-gray-600 text-xs">Mesa</span>
                  <p className="font-bold text-gray-900">Mesa{order.table.number}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600 text-xs">Status</span>
                <p className="font-bold text-blue-600">{order.status}</p>
              </div>
              <div>
                <span className="text-gray-600 text-xs">Data/Hora</span>
                <p className="font-bold text-gray-900 text-xs">
                  {new Date(order.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-base">📦 Itens do Pedido</h3>
            <div className="space-y-4">
              {(order.items ?? []).map((item, index) => {
                const itemAdicionais = getItemAdicionais(item);
                const adicionaisTotal = itemAdicionais.reduce((sum: number, adic: any) => sum + (adic?.price || 0), 0);
                const unitBase = (item.product?.price ?? item.price) || 0;
                const unitWithAdicionais = unitBase + adicionaisTotal;
               
                return (
                  <div key={item.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-300 text-sm">
                    {/* Cabeçalho do Item */}
                    <div className="flex justify-between items-start mb-2 pb-2 border-b-2 border-gray-200">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-base">
                          {item.quantity}x {item.product?.name || 'Produto'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Preço unitário: {formatCurrency(unitWithAdicionais)}
                      
                        </div>
                   
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-blue-600 text-lg">
                          {formatCurrency(unitWithAdicionais * item.quantity)}
                        </div>
                      </div>
                     
                    </div>  
                   
                    {/* Adicionais com Valores */}
                    {itemAdicionais.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-yellow-300 bg-yellow-50 p-2 rounded">
                        <div className="text-xs font-bold text-yellow-800 mb-1">✨ ADICIONAIS:</div>
                        <div className="text-xs text-gray-800 space-y-1">
                          {itemAdicionais.map((adic: any, idx: number | string) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-yellow-900">
                                • {adic.name}
                              </span>
                              {adic.price > 0 && (
                                <span className="text-yellow-800 font-bold">
                                  +{formatCurrency(adic.price)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {adicionaisTotal > 0 && (
                          <div className="text-xs font-bold text-yellow-900 mt-2 text-right pt-1 border-t border-yellow-200">
                            Total Adicionais: +{formatCurrency(adicionaisTotal)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Observações */}
                    {item.notes && (
                      <div className="mt-2 pt-2 border-t border-orange-300 bg-orange-50 p-2 rounded">
                        <div className="text-xs font-bold text-orange-800 mb-1">📝Observações:</div>
                        <div className="text-xs text-gray-800 italic">{item.notes}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Observações Gerais do Pedido */}
          {order.notes && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-gray-900 mb-2 text-center text-sm">📋 Observações Gerais</h3>
              <p className="text-sm text-gray-700 text-center italic">{order.notes}</p>
            </div>
          )}

          {/* Status de Pagamento */}
          <div className={`p-4 rounded-lg border-2 text-center ${
            order.isPaid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex flex-col items-center justify-center gap-2">
              <span className={`font-bold text-lg ${
                order.isPaid ? 'text-green-700' : 'text-red-700'
              }`}>
                {order.isPaid ? '✅ PAGO' : '❌ NÃO PAGO'}
              </span>
              <span className={`font-bold text-2xl ${
                order.isPaid ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency((order.items || []).reduce((sum, it: any) => {
                  const custom = typeof it.customizations === 'string' ? (() => { try { return JSON.parse(it.customizations); } catch { return {}; } })() : (it.customizations || {});
                  const ids = Array.isArray(custom?.adicionaisIds) ? custom.adicionaisIds : Array.isArray(custom?.adicionais) ? custom.adicionais : [];
                  const adicTotal = ids.reduce((s: number, id: string) => s + ((adicionaisMap[id]?.price) || 0), 0);
                  const unitBase = (it.product?.price ?? it.price) || 0;
                  return sum + (unitBase + adicTotal) * (it.quantity || 1);
                }, 0))}
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="border-t-2 pt-4 mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={() => printOrder(order)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              🖨️ Imprimir
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
);

OrderDetailsModalContent.displayName = 'OrderDetailsModalContent';

/**
 * Botão para abrir modal de detalhes do pedido
 * Memoizado para evitar re-renderizações desnecessárias
 */
export const OrderDetailsButton: React.FC<{ order: Order }> = React.memo(({ order }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const handleOpen = useCallback(() => {
    setModalKey(prev => prev + 1);
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="border-2 border-blue-300 hover:border-blue-500 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 font-medium"
        leftIcon={<Eye className="h-4 w-4" />}
      >
        <span className="hidden sm:inline">Ver Detalhes</span>
        <span className="sm:hidden">Detalhes *</span>
      </Button>

      {isOpen && (
        <OrderDetailsModalContent 
          key={`modal-${order.id}-${modalKey}`}
          order={order}
          isOpen={isOpen}
          onClose={handleClose}
        />
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renderizações desnecessárias
  return prevProps.order.id === nextProps.order.id;
});

OrderDetailsButton.displayName = 'OrderDetailsButton';
