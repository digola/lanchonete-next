/**
 * Gerenciador de Pedidos e Mesas
 * 
 * Este módulo gerencia o ciclo de vida completo de pedidos e mesas:
 * 1. Seleção de mesa
 * 2. Criação de pedidos
 * 3. Gerenciamento de status
 * 4. Processamento de pagamentos
 * 5. Liberação de mesa
 */

import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@/types';

export interface TableState {
  tableId: string;
  tableNumber: number;
  status: 'LIVRE' | 'OCUPADA' | 'RESERVADA' | 'MANUTENCAO';
  assignedTo: string | null;
  activeOrders: Array<{
    id: string;
    status: string;
    isActive: boolean;   
    isReceived: boolean;
    total: number;
    createdAt: Date;
  }>;
}

export interface OrderCreationData {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    notes?: string;
    customizations?: any;
  }>;
  tableId: string;
  notes?: string;
  staffUserId: string;
}

export class OrderTableManager {
  /**
   * 1. SELECIONAR MESA
   * Verifica se mesa está disponível e a seleciona
   * REGRA: Uma mesa = Um pedido por vez
   */
  static async selectTable(tableId: string, staffUserId: string): Promise<{
    success: boolean;
    data?: TableState;
    error?: string;
  }> {
    try {
      console.log('🪑 [ORDER-MANAGER] Selecionando mesa:', tableId);

      // Verificar se mesa existe
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!table) {
        return { success: false, error: 'Mesa não encontrada' };
      }

      // Verificar se mesa está livre
      if (table.status !== 'LIVRE') {
        return { 
          success: false, 
          error: `Mesa ${table.number} está ${table.status.toLowerCase()}` 
        };
      }

      // Verificar se já existe pedido em andamento na mesa (REGRA: UM PEDIDO POR MESA)
      const existingActiveOrder = await prisma.order.findFirst({
        where: {
          tableId: tableId,
          status: {
            notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
          }
        },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true
        }
      });

      if (existingActiveOrder) {
        return { 
          success: false, 
          error: `Mesa ${table.number} já possui um pedido ativo (${existingActiveOrder.id})` 
        };
      }

      const tableState: TableState = {
        tableId: table.id,
        tableNumber: table.number,
        status: table.status as any,
        assignedTo: table.assignedTo,
        activeOrders: [] // Mesa livre = sem pedidos ativos
      };

      console.log('✅ [ORDER-MANAGER] Mesa selecionada:', tableState);
      return { success: true, data: tableState };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao selecionar mesa:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 2. CRIAR PEDIDO
   * Cria pedido e ocupa mesa automaticamente
   */
  static async createOrder(data: OrderCreationData): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('📝 [ORDER-MANAGER] Criando pedido para mesa:', data.tableId);

      // Validar dados
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'Itens do pedido são obrigatórios' };
      }

      if (!data.tableId) {
        return { success: false, error: 'ID da mesa é obrigatório' };
      }

      if (!data.staffUserId) {
        return { success: false, error: 'ID do staff é obrigatório' };
      }

      // Verificar se mesa existe e está disponível
      const table = await prisma.table.findUnique({
        where: { id: data.tableId }
      });

      if (!table) {
        return { success: false, error: 'Mesa não encontrada' };
      }

      // Calcular total
      let total = 0;
      const preItems: Array<{
        productId: string;
        quantity: number;
        basePrice: number;
        notes?: string | undefined;
        adicionalIds: string[];
      }> = [];
      const collectedAdicionalIds: string[] = [];

      for (const item of data.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          return { success: false, error: `Produto ${item.productId} não encontrado` };
        }

        if (!product.isAvailable) {
          return { success: false, error: `Produto ${product.name} não está disponível` };
        }

        // Normalizar customizations/adicionais
        let adicionalIds: string[] = [];
        try {
          const custom = typeof item.customizations === 'string' 
            ? JSON.parse(item.customizations) 
            : item.customizations || {};
          if (Array.isArray(custom?.adicionaisIds)) {
            adicionalIds = custom.adicionaisIds as string[];
          } else if (Array.isArray(custom?.adicionais)) {
            adicionalIds = custom.adicionais as string[];
          } else if (Array.isArray((item as any).adicionaisIds)) {
            adicionalIds = (item as any).adicionaisIds as string[];
          }
        } catch {}

        if (adicionalIds.length > 0) {
          collectedAdicionalIds.push(...adicionalIds);
        }

        preItems.push({
          productId: item.productId,
          quantity: item.quantity,
          basePrice: Number(product.price),
          notes: item.notes,
          adicionalIds,
        });
      }

      // Buscar preços dos adicionais e montar itens finais
      let adicionalPriceMap: Record<string, number> = {};
      if (collectedAdicionalIds.length > 0) {
        const uniqueIds = [...new Set(collectedAdicionalIds)];
        const adicionais = await prisma.adicional.findMany({ where: { id: { in: uniqueIds } } });
        adicionais.forEach(a => { adicionalPriceMap[a.id] = a.price || 0; });
      }

      const validatedItems: Array<{
        productId: string;
        quantity: number;
        price: number;
        notes?: string | undefined;
        customizations?: string | null;
      }> = preItems.map(pi => {
        const adicionaisPrice = (pi.adicionalIds || []).reduce((sum, id) => sum + (adicionalPriceMap[id] || 0), 0);
        const finalUnitPrice = pi.basePrice + adicionaisPrice;
        total += finalUnitPrice * pi.quantity;
        const customizations = pi.adicionalIds && pi.adicionalIds.length > 0
          ? JSON.stringify({ adicionaisIds: pi.adicionalIds })
          : null;
        return {
          productId: pi.productId,
          quantity: pi.quantity,
          price: finalUnitPrice,
          notes: pi.notes,
          customizations,
        };
      });

      // Criar pedido e ocupar mesa em transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Criar pedido
        const order = await tx.order.create({
          data: {
            userId: data.staffUserId,
            status: 'CONFIRMADO',
            isPaid: false,
            isActive: true,
            total,
            deliveryType: 'RETIRADA',
            // paymentMethod não definido aqui para usar o default do schema (ex.: 'DINHEIRO')
            notes: data.notes || null,
            tableId: data.tableId,
            items: {
              create: validatedItems as any
            }
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            table: {
              select: { id: true, number: true, capacity: true }
            },
            items: {
              include: {
                product: {
                  select: { id: true, name: true, price: true, imageUrl: true }
                }
              }
            }
          }
        });

        // 2. Ocupar mesa
        await tx.table.update({
          where: { id: data.tableId },
          data: {
            status: 'OCUPADA',
            assignedTo: data.staffUserId
          }
        });

        console.log('✅ [ORDER-MANAGER] Pedido criado e mesa ocupada:', order.id);
        return order;
      });

      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao criar pedido:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 3. ADICIONAR PRODUTOS AO PEDIDO ATIVO
   * Adiciona produtos ao pedido ativo da mesa
   * REGRA: Mesa ativa + Pedido ativo = Pode adicionar produtos
   */
  static async addProductsToOrder(tableId: string, products: Array<{
    productId: string;
    quantity: number;
    price: number;
    notes?: string;
  }>): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('🛒 [ORDER-MANAGER] Adicionando produtos ao pedido da mesa:', tableId);

      // Verificar se mesa existe e está ativa
      const table = await prisma.table.findUnique({
        where: { id: tableId }
      });

      if (!table) {
        return { success: false, error: 'Mesa não encontrada' };
      }

      if (table.status !== 'OCUPADA') {
        return { success: false, error: 'Mesa não está ocupada' };
      }

      // Buscar pedido ativo na mesa
      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId: tableId,
          status: {
            notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
          }
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, price: true } }
            }
          }
        }
      });

      if (!activeOrder) {
        return { success: false, error: 'Nenhum pedido ativo encontrado na mesa' };
      }

      // Validar produtos
      const validatedProducts: Array<{
        productId: string;
        quantity: number;
        price: number;
        notes: string | null;
      }> = [];
      let totalToAdd = 0;

      for (const product of products) {
        if (!product.productId || !product.quantity || product.quantity <= 0) {
          return { success: false, error: 'Dados do produto inválidos' };
        }

        if (!product.price || product.price <= 0) {
          return { success: false, error: 'Preço do produto inválido' };
        }

        validatedProducts.push({
          productId: product.productId,
          quantity: product.quantity,
          price: product.price,
          notes: product.notes?.trim() || null
        });

        totalToAdd += product.price * product.quantity;
      }

      // Adicionar produtos ao pedido e atualizar total com recálculo baseado nos itens
      const result = await prisma.$transaction(async (tx) => {
        // 1. Adicionar novos itens ao pedido
        await tx.orderItem.createMany({
          data: validatedProducts.map(item => ({
            orderId: activeOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          }))
        });

        // 2. Recalcular o total baseado em todos os itens do pedido
        const orderWithItems = await tx.order.findUnique({
          where: { id: activeOrder.id },
          include: {
            items: true,
            user: { select: { id: true, name: true, email: true } },
            table: { select: { id: true, number: true, capacity: true } },
          }
        });

        const recalculatedTotal = (orderWithItems?.items || []).reduce((sum, it) => sum + it.price * it.quantity, 0);
        const updatedOrder = await tx.order.update({
          where: { id: activeOrder.id },
          data: {
            total: recalculatedTotal,
            updatedAt: new Date()
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            table: { select: { id: true, number: true, capacity: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, price: true, imageUrl: true } }
              }
            }
          }
        });

        return updatedOrder;
      });

      console.log('✅ [ORDER-MANAGER] Produtos adicionados ao pedido:', result.id);
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao adicionar produtos:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 4. PROCESSAR PAGAMENTO
   * Cliente escolhe método de pagamento e staff processa
   */
  static async processPayment(orderId: string, paymentMethod: string, paymentAmount?: number): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('💳 [ORDER-MANAGER] Processando pagamento:', { orderId, paymentMethod, paymentAmount });

      // Verificar se pedido existe
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!existingOrder) {
        return { success: false, error: 'Pedido não encontrado' };
      }

      // Agora o schema local inclui isPaid; usamos este campo para persistir estado de pagamento.

      // Validar método de pagamento
      const validPaymentMethods = ['DINHEIRO', 'CARTAO', 'PIX'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return { success: false, error: 'Método de pagamento inválido' };
      }

      // Processar pagamento: apenas marcar como pago e salvar método
      // Regra de negócio: a mesa será liberada somente após RECEBER o pedido
      const result = await prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: orderId },
          data: {
            paymentMethod: paymentMethod,
            isPaid: true,
            isActive: false,
            updatedAt: new Date()
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            table: { select: { id: true, number: true, capacity: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, price: true, imageUrl: true } }
              }
            }
          }
        });

        return updatedOrder;
      });

      console.log('✅ [ORDER-MANAGER] Pagamento processado:', result.id);
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao processar pagamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 5. MARCAR PEDIDO COMO RECEBIDO
   * Marca pedido como recebido e inativo, verifica se precisa liberar mesa
   */
  static async markOrderAsReceived(orderId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { table: true }
      });

      if (!existingOrder) {
        return { success: false, error: 'Pedido não encontrado' };
      }

      if (existingOrder.status === 'ENTREGUE' || existingOrder.status === 'FINALIZADO') {
        return { success: false, error: 'Pedido já foi marcado como entregue/recebido' };
      }

      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'ENTREGUE',
            isActive: existingOrder.isPaid ? false : true,
            updatedAt: new Date()
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            table: { select: { id: true, number: true, capacity: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, price: true, imageUrl: true } }
              }
            }
          }
        });

        if (existingOrder.tableId) {
          const activeOrdersCount = await tx.order.count({
            where: {
              tableId: existingOrder.tableId,
              status: {
                notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
              }
            }
          });

          if (activeOrdersCount === 0) {
            await tx.table.update({
              where: { id: existingOrder.tableId },
              data: {
                status: 'LIVRE',
                assignedTo: null
              }
            });
          }
        }

        return order;
      });

      return { success: true, data: result };

    } catch (error) {
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 6. CANCELAR PEDIDO
   * Cancela pedido e verifica se precisa liberar mesa
   */
  static async cancelOrder(orderId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('❌ [ORDER-MANAGER] Cancelando pedido:', orderId);

      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { table: true }
      });

      if (!existingOrder) {
        return { success: false, error: 'Pedido não encontrado' };
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Cancelar pedido
        const order = await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'CANCELADO',
            isActive: false,
            updatedAt: new Date()
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
            table: { select: { id: true, number: true, capacity: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, price: true, imageUrl: true } }
              }
            }
          }
        });

        // 2. Liberar mesa automaticamente (REGRA: UM PEDIDO POR MESA)
        if (existingOrder.tableId) {
          console.log('🆓 [ORDER-MANAGER] Liberando mesa após cancelamento:', existingOrder.tableId);
          await tx.table.update({
            where: { id: existingOrder.tableId },
            data: {
              status: 'LIVRE',
              assignedTo: null
            }
          });
          console.log('✅ [ORDER-MANAGER] Mesa liberada com sucesso');
        }

        return order;
      });

      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao cancelar pedido:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 7. VERIFICAR STATUS DA MESA
   * Verifica se status da mesa está correto baseado nos pedidos
   */
  static async checkTableStatus(tableId: string): Promise<{
    success: boolean;
    data?: {
      table: any;
      activeOrders: any[];
      shouldBeOccupied: boolean;
      statusMatches: boolean;
    };
    error?: string;
  }> {
    try {
      console.log('🔍 [ORDER-MANAGER] Verificando status da mesa:', tableId);

      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!table) {
        return { success: false, error: 'Mesa não encontrada' };
      }

      // Buscar pedido ativo na mesa (REGRA: UM PEDIDO POR MESA)
      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId: tableId,
          status: {
            notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
          }
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, price: true } }
            }
          }
        }
      });

      const activeOrders = activeOrder ? [activeOrder] : [];
      const shouldBeOccupied = activeOrder !== null;
      const statusMatches = (shouldBeOccupied && table.status === 'OCUPADA') || 
                           (!shouldBeOccupied && table.status === 'LIVRE');

      return {
        success: true,
        data: {
          table,
          activeOrders,
          shouldBeOccupied,
          statusMatches
        }
      };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao verificar status da mesa:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 8. LIBERAR MESA MANUALMENTE
   * Força liberação da mesa (para casos especiais)
   */
  static async forceReleaseTable(tableId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      console.log('🆓 [ORDER-MANAGER] Liberando mesa manualmente:', tableId);

      const result = await prisma.table.update({
        where: { id: tableId },
        data: {
          status: 'LIVRE',
          assignedTo: null
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      console.log('✅ [ORDER-MANAGER] Mesa liberada manualmente');
      return { success: true, data: result };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao liberar mesa:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * 9. OBTER ESTADO COMPLETO DA MESA
   * Retorna estado completo da mesa com todos os pedidos
   */
  static async getTableCompleteState(tableId: string): Promise<{
    success: boolean;
    data?: TableState;
    error?: string;
  }> {
    try {
      console.log('📊 [ORDER-MANAGER] Obtendo estado completo da mesa:', tableId);

      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!table) {
        return { success: false, error: 'Mesa não encontrada' };
      }

      // Buscar pedido em andamento na mesa (REGRA: UM PEDIDO POR MESA)
      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId: tableId,
          status: {
            notIn: ['CANCELADO', 'ENTREGUE', 'FINALIZADO']
          }
        },
        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true
        }
      });

      const activeOrders = activeOrder
        ? [{
            id: activeOrder.id,
            status: activeOrder.status,
            // Deriva isActive e isReceived pelo status para compatibilidade
            isActive: !['CANCELADO', 'ENTREGUE', 'FINALIZADO'].includes(activeOrder.status as any),
            isReceived: ['ENTREGUE', 'FINALIZADO'].includes(activeOrder.status as any),
            total: activeOrder.total,
            createdAt: activeOrder.createdAt
          }]
        : [];

      const tableState: TableState = {
        tableId: table.id,
        tableNumber: table.number,
        status: table.status as any,
        assignedTo: table.assignedTo,
        activeOrders
      };

      return { success: true, data: tableState };

    } catch (error) {
      console.error('❌ [ORDER-MANAGER] Erro ao obter estado da mesa:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}

/**
 * Interface de conveniência (facade) para uso direto em rotas/APIs.
 * Mapeia operações do OrderTableManager em um objeto exportado
 * para facilitar importação e uso pontual.
 */
export const OrderTableAPI = {
  // Selecionar mesa
  selectTable: OrderTableManager.selectTable,
  
  // Criar pedido
  createOrder: OrderTableManager.createOrder,
  
  // Adicionar produtos ao pedido ativo
  addProductsToOrder: OrderTableManager.addProductsToOrder,
  
  // Processar pagamento
  processPayment: OrderTableManager.processPayment,
  
  // Marcar como recebido
  markAsReceived: OrderTableManager.markOrderAsReceived,
  
  // Cancelar pedido
  cancelOrder: OrderTableManager.cancelOrder,
  
  // Verificar status
  checkStatus: OrderTableManager.checkTableStatus,
  
  // Liberar mesa
  releaseTable: OrderTableManager.forceReleaseTable,
  
  // Estado completo
  getState: OrderTableManager.getTableCompleteState
};
