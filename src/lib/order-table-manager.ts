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

export interface TableState {
  tableId: string;
  tableNumber: number;
  status: 'LIVRE' | 'OCUPADA' | 'RESERVADA' | 'MANUTENCAO';
  assignedTo: string | null;
  activeOrders: Array<{
    id: string;
    status: 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'CANCELADO' | 'ENTREGUE' | 'FINALIZADO';
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

      // Verificar se já existe pedido ativo na mesa (REGRA: UM PEDIDO POR MESA)
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
      const validatedItems: Array<{
        productId: string;
        quantity: number;
        price: number;
            notes: string | undefined;
        customizations?: string | null;
      }> = [];

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

        const itemTotal = Number(product.price) * item.quantity;
        total += itemTotal;

        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: Number(product.price),
          notes: item.notes,
          customizations: item.customizations ? JSON.stringify(item.customizations) : null,
        });
      }

      // Criar pedido e ocupar mesa em transação
      const result = await prisma.$transaction(async (tx) => {
        // 1. Criar pedido
        const order = await tx.order.create({
          data: {
            userId: data.staffUserId,
            status: 'CONFIRMADO',
            total,
            deliveryType: 'RETIRADA',
            paymentMethod: 'PENDENTE',  // ← PAGAMENTO PENDENTE
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
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, price: true } }
            }
          }
        }
      });

      const activeOrders = activeOrder ? [{
        id: activeOrder.id,
        status: activeOrder.status as 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'CANCELADO' | 'ENTREGUE' | 'FINALIZADO',
        total: Number(activeOrder.total),
        createdAt: activeOrder.createdAt
      }] : [];
      const shouldBeOccupied = activeOrder !== null;
      const statusMatches = (shouldBeOccupied && table.status === 'OCUPADA') || 
                           (!shouldBeOccupied && ['LIVRE', 'RESERVADA', 'MANUTENCAO'].includes(table.status));

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

      if (existingOrder.status === 'PAGO' || existingOrder.status === 'ENTREGUE' || existingOrder.status === 'FINALIZADO') {
        return { success: false, error: 'Pedido já foi pago' };
      }

      // Validar método de pagamento
      const validPaymentMethods = ['DINHEIRO', 'CARTAO', 'PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return { success: false, error: 'Método de pagamento inválido' };
      }

      // Processar pagamento
      const result = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: paymentMethod,
          status: 'PAGO',
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
      console.log('📦 [ORDER-MANAGER] Marcando pedido como recebido:', orderId);

      // Verificar se pedido existe
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: { table: true }
      });

      if (!existingOrder) {
        return { success: false, error: 'Pedido não encontrado' };
      }

      if (existingOrder.status === 'ENTREGUE') {
        return { success: false, error: 'Pedido já foi recebido' };
      }

      // Atualizar pedido e verificar mesa
      const result = await prisma.$transaction(async (tx) => {
        // 1. Marcar pedido como recebido e inativo
        const order = await tx.order.update({
          where: { id: orderId },
          data: {
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
          console.log('🆓 [ORDER-MANAGER] Liberando mesa automaticamente:', existingOrder.tableId);
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
      console.error('❌ [ORDER-MANAGER] Erro ao marcar pedido como recebido:', error);
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

      const activeOrders = activeOrder ? [{
        id: activeOrder.id,
        status: activeOrder.status as 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'CANCELADO' | 'ENTREGUE' | 'FINALIZADO',
        total: Number(activeOrder.total),
        createdAt: activeOrder.createdAt
      }] : [];
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

      // Buscar pedido ativo na mesa (REGRA: UM PEDIDO POR MESA)
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

      const activeOrders = activeOrder ? [{
        id: activeOrder.id,
        status: activeOrder.status as 'PENDENTE' | 'EM_PREPARO' | 'PRONTO' | 'CANCELADO' | 'ENTREGUE' | 'FINALIZADO',
        total: Number(activeOrder.total),
        createdAt: activeOrder.createdAt
      }] : [];

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
 * Interface de conveniência para uso direto nas APIs
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
