/**
 * Utilitários para verificação e formatação de pedidos pendentes.
 *
 * Focados em identificar pedidos não finalizados (status pendentes) e
 * apresentar um resumo amigável para exibição.
 */

/**
 * Estrutura simplificada de um pedido pendente.
 */
export interface PendingOrder {
  id: string;
  status: string;
  total: number;
  user?: {
    name: string;
  };
  table?: {
    number: number;
  };
  createdAt: string;
  isActive: boolean;
  isPaid: boolean;
}

/**
 * Verifica se existem pedidos em aberto (status pendentes) no sistema.
 * Utiliza token de autenticação presente no localStorage.
 *
 * Status considerados pendentes: PENDENTE, CONFIRMADO, PREPARANDO, PRONTO.
 *
 * @returns Objeto com indicador booleano, lista dos pedidos e contagem.
 */
export async function checkPendingOrders(options: { details?: boolean } = {}): Promise<{
  hasPendingOrders: boolean;
  pendingOrders: PendingOrder[];
  count: number;
}> {
  try {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      return { hasPendingOrders: false, pendingOrders: [], count: 0 };
    }

    const pendingStatuses = ['PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'PRONTO'];
    const summaryUrl = `/api/orders/summary?statuses=${pendingStatuses.join(',')}`;

    const summaryResp = await fetch(summaryUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!summaryResp.ok) {
      let details = '';
      try {
        const err = await summaryResp.json();
        details = err?.error || err?.details || JSON.stringify(err);
      } catch {}
      console.error('❌ Erro na API de resumo de pedidos:', summaryResp.status, summaryResp.statusText, details);
      return { hasPendingOrders: false, pendingOrders: [], count: 0 };
    }

    const summary = await summaryResp.json();
    const count = summary?.count || 0;

    if (count === 0) {
      return { hasPendingOrders: false, pendingOrders: [], count: 0 };
    }

    // Se não precisar de detalhes, retornar apenas o resumo
    if (options.details === false) {
      return { hasPendingOrders: true, pendingOrders: [], count };
    }

    const detailsUrl = `/api/orders?includeUser=true&includeTable=true&status=${pendingStatuses.join(',')}&limit=3`;
    const detailsResp = await fetch(detailsUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });

    if (!detailsResp.ok) {
      return { hasPendingOrders: true, pendingOrders: [], count };
    }

    const details = await detailsResp.json();
    const pendingOrders = (details.data || []).filter((order: PendingOrder & { status?: string }) => {
      const s = (order.status || '').toUpperCase();
      return pendingStatuses.includes(s);
    });

    return { hasPendingOrders: true, pendingOrders, count };
  } catch (error) {
    console.error('❌ Erro ao verificar pedidos pendentes:', error);
    return { hasPendingOrders: false, pendingOrders: [], count: 0 };
  }
}

/**
 * Formata a lista de pedidos pendentes para exibição resumida.
 * Se houver apenas um pedido, inclui id abreviado, tipo (mesa/balcão) e nome do cliente.
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
