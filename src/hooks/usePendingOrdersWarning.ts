import { useEffect, useRef } from 'react';
import { checkPendingOrders } from '@/lib/orderUtils';

interface UsePendingOrdersWarningOptions {
  enabled?: boolean;
  checkInterval?: number; // em milissegundos
  customMessage?: string;
}

/**
 * Hook que monitora pedidos pendentes e avisa quando o usuário tenta fechar o navegador
 */
export function usePendingOrdersWarning({
  enabled = true,
  checkInterval = 30000, // 30 segundos
  customMessage
}: UsePendingOrdersWarningOptions = {}) {
  const hasPendingOrdersRef = useRef(false);
  const lastCheckRef = useRef<number>(0);

  // Função para verificar pedidos pendentes (não pagos)
  const checkPendingOrdersStatus = async () => {
    try {
      const { hasPendingOrders, pendingOrders, count } = await checkPendingOrders();
      hasPendingOrdersRef.current = hasPendingOrders;
      lastCheckRef.current = Date.now();
      
      // Salvar no cache do localStorage para acesso síncrono no beforeunload
      localStorage.setItem('lastPendingOrdersCheck', Date.now().toString());
      localStorage.setItem('lastPendingOrdersCount', count.toString());
      localStorage.setItem('hasPendingOrders', hasPendingOrders.toString());
      
      // Log apenas quando há mudança de estado
      if (hasPendingOrders) {
        console.log('⚠️ Pedidos não pagos detectados:', count);
      }
    } catch (error) {
      console.error('❌ Erro ao verificar pedidos não pagos:', error);
    }
  };

  // Verificação inicial
  useEffect(() => {
    if (enabled) {
      checkPendingOrdersStatus();
    }
  }, [enabled]);

  // Verificação periódica
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      checkPendingOrdersStatus();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [enabled, checkInterval]);

  // Interceptar tentativa de fechar o navegador/aba
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      try {
        // Verificação rápida usando cache do localStorage
        const lastPendingCount = localStorage.getItem('lastPendingOrdersCount');
        const hasPending = hasPendingOrdersRef.current || (lastPendingCount && parseInt(lastPendingCount) > 0);
        
        if (hasPending) {
          const defaultMessage = 'Existem pedidos não pagos que precisam ser finalizados antes de sair.';
          const message = customMessage || defaultMessage;
          
          console.log('⚠️ Aviso de pedidos não pagos exibido');
          
          // Para navegadores modernos, definir returnValue é suficiente
          event.preventDefault();
          event.returnValue = message;
          
          // Para compatibilidade com navegadores mais antigos
          return message;
        }
      } catch (error) {
        console.error('❌ Erro no beforeunload:', error);
        // Em caso de erro, assumir que há pedidos pendentes por segurança
        const message = customMessage || 'Existem pedidos não pagos que precisam ser finalizados antes de sair.';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    const handleVisibilityChange = () => {
      // Verificar pedidos pendentes quando a aba volta a ficar visível
      if (!document.hidden) {
        const timeSinceLastCheck = Date.now() - lastCheckRef.current;
        // Se passou mais de 1 minuto desde a última verificação, verificar novamente
        if (timeSinceLastCheck > 60000) {
          checkPendingOrdersStatus();
        }
      }
    };

    // Adicionar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, customMessage]);

  // Função para forçar verificação manual
  const forceCheck = () => {
    checkPendingOrdersStatus();
  };

  return {
    hasPendingOrders: hasPendingOrdersRef.current,
    forceCheck
  };
}
