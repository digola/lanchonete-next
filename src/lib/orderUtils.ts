/**
 * Utilitários para verificação de pedidos
 */

export interface PendingOrder {
  id: string;
  total: number;
  status: string;
  user: {
    name: string;
  };
  table?: {
    number: number;
  };
  createdAt: string;
}

/**
 * Verifica se existem pedidos em aberto (não pagos) no sistema
 * @returns Promise<{hasPendingOrders: boolean, pendingOrders: PendingOrder[], count: number}>
 */
export async function checkPendingOrders(): Promise<{
  hasPendingOrders: boolean;
  pendingOrders: PendingOrder[];
  count: number;
}> {
  try {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      return { hasPendingOrders: false, pendingOrders: [], count: 0 };
    }

    // Buscar pedidos não pagos do dia atual
    const url = `/api/orders?status=PENDENTE,CONFIRMADO&includeUser=true&includeTable=true`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('❌ Erro na API de pedidos:', response.status, response.statusText);
      return { hasPendingOrders: false, pendingOrders: [], count: 0 };
    }

    const data = await response.json();
    // Filtrar apenas pedidos não pagos (status PENDENTE ou CONFIRMADO)
    const pendingOrders = (data.data || []).filter((order: PendingOrder) => 
      order.status === 'PENDENTE' || order.status === 'CONFIRMADO'
    );

    return {
      hasPendingOrders: pendingOrders.length > 0,
      pendingOrders,
      count: pendingOrders.length
    };
  } catch (error) {
    console.error('❌ Erro ao verificar pedidos pendentes:', error);
    return { hasPendingOrders: false, pendingOrders: [], count: 0 };
  }
}

/**
 * Formata lista de pedidos pendentes para exibição
 */
export function formatPendingOrdersForDisplay(pendingOrders: PendingOrder[]): string {
  if (pendingOrders.length === 0) return '';
  
  if (pendingOrders.length === 1) {
    const order = pendingOrders[0];
    if (!order) return '';
    return `Pedido #${order.id.slice(-8)} - ${order.table ? `Mesa ${order.table.number}` : 'Balcão'} - ${order.user?.name || 'Cliente'}`;
  }
  
  return `${pendingOrders.length} pedidos em aberto encontrados`;
}
