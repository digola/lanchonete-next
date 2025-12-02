import { Order } from '@/types';
import { formatCurrency } from './utils';

/**
 * Função utilitária para imprimir pedidos em impressora térmica 58mm
 * Busca adicionais automaticamente e formata o conteúdo para impressão
 */
export async function printOrder(order: Order): Promise<void> {
  // Buscar todos os IDs de adicionais dos itens
  const allAdicionalIds: string[] = [];
  order.items.forEach(item => {
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
  let adicionaisMap: Record<string, { name: string; price: number }> = {};
  if (allAdicionalIds.length > 0) {
    try {
      const uniqueIds = [...new Set(allAdicionalIds)];
      const response = await fetch(`/api/adicionais`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          result.data.forEach((adic: any) => {
            if (uniqueIds.includes(adic.id)) {
              adicionaisMap[adic.id] = {
                name: adic.name,
                price: adic.price || 0
              };
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar adicionais para impressão:', error);
    }
  }

  const printWindow = window.open('', '_blank', 'width=220,height=600');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para impressão');
    return;
  }

  const currentDate = new Date();
  
  // Função auxiliar para obter adicionais de um item
  const getItemAdicionais = (item: any) => {
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

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'CONFIRMADO': 'Confirmado',
      'PREPARANDO': 'Preparando',
      'ENTREGUE': 'Entregue',
      'FINALIZADO': 'Finalizado',
      'CANCELADO': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const computedTotal = (order.items || []).reduce((sum, it: any) => {
    try {
      const custom = typeof it.customizations === 'string' ? JSON.parse(it.customizations) : (it.customizations || {});
      const ids = Array.isArray(custom?.adicionaisIds) ? custom.adicionaisIds : Array.isArray(custom?.adicionais) ? custom.adicionais : [];
      const adicTotal = ids.reduce((s: number, id: string) => s + ((adicionaisMap[id]?.price) || 0), 0);
      const unitBase = (it.product?.price ?? it.price) || 0;
      return sum + (unitBase + adicTotal) * (it.quantity || 1);
    } catch {
      return sum + (it.price || 0) * (it.quantity || 1);
    }
  }, 0);

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Pedido #${order.id.slice(-8)}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 0;
            padding: 0;
          }

          * { box-sizing: border-box; margin: 0; padding: 0; }

          /* Optimized for 58mm thermal printer */
          body {
            font-family: 'Courier New', monospace;
            font-size: 9px;
            line-height: 1.1;
            width: 58mm;
            padding: 1mm;
            background: white;
            color: #000;
          }

          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 2px; margin-bottom: 2px; }
          .restaurant-name { font-weight: bold; font-size: 11px; margin-bottom: 0px; }
          .order-id { font-size: 8px; font-weight: bold; margin-bottom: 0px; }
          .info-line { font-size: 7px; margin-bottom: 0px; }

          .section { border-bottom: 1px dashed #000; padding: 2px 0; margin-bottom: 2px; }

          /* Item line: qty (3mm) | name (flex) | price (10mm) */
          .item { display: flex; align-items: flex-start; margin-bottom: 1px; font-size: 8px; gap: 1px; }
          .item .item-qty { width: 3mm; font-weight: bold; text-align: left; flex-shrink: 0; }
          .item .item-name { flex: 1; word-break: break-word; }
          .item .item-price { width: 10mm; text-align: right; font-weight: bold; flex-shrink: 0; }

          /* Adicionais display (compact) */
          .add-line { display: flex; justify-content: space-between; align-items: baseline; margin: 0px 0; padding: 0px 1px; font-size: 7px; margin-top: 1px; }
          .add-name { flex: 1; margin-left: 2mm; }
          .add-price { text-align: right; font-weight: bold; margin-left: 1px; }
          .add-container { margin-top: 1px; margin-bottom: 1px; }

          /* Utility classes */
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .total { text-align: center; font-weight: bold; font-size: 10px; padding: 1px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 1px 0; }
          .footer { text-align: center; margin-top: 1px; font-size: 7px; }

          /* Print tweaks to fit content on a single ticket page */
          @media print {
            @page { size: 58mm auto; margin: 0; }
            html, body { width: 58mm; padding: 0; margin: 0; }
            body { padding: 0.5mm 1mm; font-size: 9px; line-height: 1.1; }

            /* Prevent page breaks and keep sections compact */
            .section, .item, .add-line { page-break-inside: avoid; break-inside: avoid; }
            .section { padding: 1px 0; margin-bottom: 1px; }
            .item { margin-bottom: 0px; gap: 0px; }
            .add-line { margin: 0px 0; padding: 0px; }

            /* No scaling - fit naturally within 58mm */
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">LANCHONETE</div>
          <div class="order-id">Pedido #${order.id.slice(-8)}</div>
          <div class="info-line">${currentDate.toLocaleString('pt-BR')}</div>
        </div>
        
        <div class="section">
          <div class="info-line"><span class="bold">Cliente: </span> ${order.user?.name || 'N/A'}</div>
          ${order.table 
            ? `<div class="info-line"><span class="bold">Mesa:</span> ${order.table.number}</div>` 
            : `<div class="info-line"><span class="bold">Balcão:</span> ${new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>`
          }
          <div class="info-line"><span class="bold">Status:</span> ${getStatusLabel(order.status)}</div>
        </div>
        
        <div class="section">
          <div class="bold center" style="margin-bottom: 3px; font-size: 10px;">ITENS DO PEDIDO</div>
          ${order.items.map(item => {
            const itemAdicionais = getItemAdicionais(item);
            return `
            <div>
              <div class="item">
                <span class="item-name">
                  <span class="item-qty">${item.quantity}x</span>${item.product?.name || 'Produto'}
                </span>
                <span class="item-price">${(() => {
                  try {
                    const custom = typeof item.customizations === 'string' ? JSON.parse(item.customizations) : (item.customizations || {});
                    const ids = Array.isArray(custom?.adicionaisIds) ? custom.adicionaisIds : Array.isArray(custom?.adicionais) ? custom.adicionais : [];
                    const adicTotal = ids.reduce((s: number, id: string) => s + ((adicionaisMap[id]?.price) || 0), 0);
                    const unitBase = (item.product?.price ?? item.price) || 0;
                    return formatCurrency((unitBase + adicTotal) * (item.quantity || 1));
                  } catch {
                    return formatCurrency((item.price || 0) * (item.quantity || 1));
                  }
                })()}</span>
              </div>
              ${itemAdicionais.length > 0 ? `
                <div class="add-container" style="margin-left: 5mm; margin-top: 1px; margin-bottom: 1px; padding: 0px 1px; font-size: 7px; border-left: 1px dotted #ccc; padding-left: 1mm;">
                  ${itemAdicionais.map((adic: any) => `
                    <div class="add-line" style="margin-bottom: 0px;">
                      <span class="add-name" style="font-weight: normal;">• ${adic.name || 'Adicional'}</span>
                      ${adic.price > 0 ? `<span class="add-price" style="font-weight: bold;">${formatCurrency(adic.price)}</span>` : '<span class="add-price" style="font-weight: normal;">Grátis</span>'}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
              ${item.notes ? `
                <div style="margin-left: 3mm; margin-top: 0px; padding: 0px 1px; font-size: 7px;">
                  <div style="font-weight: bold;">OBS: ${item.notes}</div>
                </div>
              ` : ''}
            </div>
          `;
          }).join('')}
        </div>
        
        <div class="total">
          TOTAL: ${formatCurrency(computedTotal)}
        </div>
        
        ${order.isPaid ? `
          <div class="section center">
            <div class="bold" style="font-size: 10px;">PAGO</div>
            <div class="info-line">Método: ${order.paymentMethod}</div>
            ${order.paymentProcessedAt ? `<div class="info-line">${new Date(order.paymentProcessedAt).toLocaleString('pt-BR')}</div>` : ''}
          </div>
        ` : ''}
        
        <div class="footer">
          <div>Obrigado pela preferência!</div>
          <div style="margin-top: 2px;">Sistema Lanchonete v1.0</div>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Aguardar carregamento e imprimir
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

