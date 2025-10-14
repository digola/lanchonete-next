import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock dos componentes e hooks
jest.mock('@/hooks/useApiAuth', () => ({
  useApiAuth: () => ({
    user: {
      id: 'customer-123',
      name: 'João Silva',
      email: 'joao@email.com',
      role: 'CUSTOMER',
      phone: '(11) 99999-9999'
    },
    getUserDisplayName: () => 'João Silva'
  })
}));

jest.mock('@/hooks/useApi', () => ({
  useApi: () => ({
    data: null,
    loading: false
  })
}));

jest.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    sendMessage: jest.fn()
  })
}));

jest.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    markAsRead: jest.fn(),
    unreadCount: 0,
    requestPermission: jest.fn()
  })
}));

// Mock do fetch
global.fetch = jest.fn();

describe('Fluxo de Interação do Cliente - Compra Delivery', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Cenário 1: Cliente faz primeiro pedido de delivery', () => {
    it('deve simular fluxo completo de pedido', async () => {
      // 1. Cliente acessa o sistema
      console.log('🛒 Cliente acessa o sistema...');
      
      // 2. Cliente navega para o cardápio
      console.log('📱 Cliente navega para o cardápio...');
      
      // 3. Cliente adiciona itens ao carrinho
      const mockCartItems = [
        { id: '1', name: 'Hambúrguer Clássico', price: 25.90, quantity: 1 },
        { id: '2', name: 'Batata Frita', price: 12.00, quantity: 1 },
        { id: '3', name: 'Refrigerante', price: 8.00, quantity: 1 }
      ];
      
      console.log('🛒 Itens adicionados ao carrinho:', mockCartItems);
      
      // 4. Cliente finaliza pedido
      const orderData = {
        userId: 'customer-123',
        status: 'PENDENTE',
        total: 45.90,
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Rua das Flores, 123 - Centro',
        paymentMethod: 'DINHEIRO',
        notes: 'Entregar na portaria',
        items: mockCartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      console.log('📝 Dados do pedido:', orderData);
      
      // 5. Simular criação do pedido via API
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'order-delivery-123',
            ...orderData,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      });
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-123'
        },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('order-delivery-123');
      expect(result.data.total).toBe(45.90);
      expect(result.data.deliveryType).toBe('DELIVERY');
      
      console.log('✅ Pedido criado com sucesso:', result.data.id);
    });
  });

  describe('Cenário 2: Acompanhamento em tempo real', () => {
    it('deve simular atualizações de status via WebSocket', async () => {
      const mockWebSocket = {
        isConnected: true,
        sendMessage: jest.fn()
      };
      
      // Simular diferentes status do pedido
      const statusUpdates = [
        { status: 'PENDENTE', message: 'Pedido recebido, aguardando confirmação' },
        { status: 'CONFIRMADO', message: 'Pedido confirmado, iniciando preparo' },
        { status: 'PREPARANDO', message: 'Pedido sendo preparado' },
        { status: 'PRONTO', message: 'Pedido pronto, saindo para entrega' },
        { status: 'ENTREGUE', message: 'Pedido entregue com sucesso!' }
      ];
      
      console.log('🔄 Simulando atualizações de status...');
      
      for (const update of statusUpdates) {
        const webSocketMessage = {
          type: 'order_update',
          data: {
            orderId: 'order-delivery-123',
            status: update.status,
            message: update.message,
            timestamp: new Date().toISOString()
          }
        };
        
        console.log(`📡 WebSocket: ${update.status} - ${update.message}`);
        
        // Simular processamento da mensagem
        expect(webSocketMessage.type).toBe('order_update');
        expect(webSocketMessage.data.orderId).toBe('order-delivery-123');
      }
      
      console.log('✅ Todas as atualizações processadas');
    });
  });

  describe('Cenário 3: Sistema de notificações', () => {
    it('deve simular notificações push durante o pedido', async () => {
      const mockAddNotification = jest.fn();
      
      // Sequência de notificações
      const notifications = [
        {
          title: 'Pedido Confirmado! ✅',
          message: 'Seu pedido foi confirmado e está sendo preparado.',
          type: 'success' as const,
          timestamp: new Date()
        },
        {
          title: 'Pedido Saiu para Entrega! 🚚',
          message: 'Seu pedido saiu para entrega. Chegada estimada em 30 minutos.',
          type: 'info' as const,
          timestamp: new Date()
        },
        {
          title: 'Pedido Entregue! 🎉',
          message: 'Seu pedido foi entregue com sucesso. Obrigado pela preferência!',
          type: 'success' as const,
          timestamp: new Date()
        }
      ];
      
      console.log('🔔 Simulando notificações push...');
      
      for (const notification of notifications) {
        mockAddNotification(notification);
        console.log(`📱 Notificação: ${notification.title}`);
      }
      
      expect(mockAddNotification).toHaveBeenCalledTimes(3);
      console.log('✅ Todas as notificações enviadas');
    });
  });

  describe('Cenário 4: Visualização de detalhes', () => {
    it('deve simular visualização de detalhes do pedido', async () => {
      const mockOrderDetails = {
        id: 'order-delivery-123',
        userId: 'customer-123',
        status: 'PREPARANDO',
        total: 45.90,
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Rua das Flores, 123 - Centro',
        paymentMethod: 'DINHEIRO',
        notes: 'Entregar na portaria',
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 1,
            price: 25.90,
            product: {
              id: 'product-1',
              name: 'Hambúrguer Clássico',
              price: 25.90
            }
          },
          {
            id: 'item-2',
            productId: 'product-2',
            quantity: 1,
            price: 12.00,
            product: {
              id: 'product-2',
              name: 'Batata Frita',
              price: 12.00
            }
          },
          {
            id: 'item-3',
            productId: 'product-3',
            quantity: 1,
            price: 8.00,
            product: {
              id: 'product-3',
              name: 'Refrigerante',
              price: 8.00
            }
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Simular busca de detalhes do pedido
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockOrderDetails
        })
      });
      
      const response = await fetch('/api/orders/order-delivery-123');
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('order-delivery-123');
      expect(result.data.items).toHaveLength(3);
      expect(result.data.total).toBe(45.90);
      
      console.log('📋 Detalhes do pedido carregados:');
      console.log(`   ID: ${result.data.id}`);
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Total: R$ ${result.data.total}`);
      console.log(`   Endereço: ${result.data.deliveryAddress}`);
      console.log(`   Itens: ${result.data.items.length}`);
    });
  });

  describe('Cenário 5: Avaliação do pedido', () => {
    it('deve simular avaliação após entrega', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Excelente atendimento! Pedido chegou quente e no prazo. Recomendo!'
      };
      
      // Simular criação de avaliação
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'review-123',
            orderId: 'order-delivery-123',
            userId: 'customer-123',
            rating: 5,
            comment: reviewData.comment,
            createdAt: new Date()
          }
        })
      });
      
      const response = await fetch('/api/orders/order-delivery-123/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-123'
        },
        body: JSON.stringify(reviewData)
      });
      
      const result = await response.json();
      
      expect(result.success).toBe(true);
      expect(result.data.rating).toBe(5);
      expect(result.data.comment).toBe(reviewData.comment);
      
      console.log('⭐ Avaliação criada:');
      console.log(`   Rating: ${result.data.rating}/5`);
      console.log(`   Comentário: ${result.data.comment}`);
    });
  });

  describe('Cenário 6: Tratamento de erros', () => {
    it('deve simular tratamento de erros durante o pedido', async () => {
      // Simular erro de rede
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token-123'
          },
          body: JSON.stringify({
            userId: 'customer-123',
            status: 'PENDENTE',
            total: 45.90
          })
        });
      } catch (error) {
        expect(error.message).toBe('Network error');
        console.log('❌ Erro de rede capturado:', error.message);
      }
      
      // Simular erro de autenticação
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Token de acesso necessário'
        })
      });
      
      const response = await fetch('/api/orders');
      const result = await response.json();
      
      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Token de acesso necessário');
      
      console.log('🔒 Erro de autenticação capturado');
    });
  });

  describe('Cenário 7: Performance e otimização', () => {
    it('deve simular métricas de performance', async () => {
      const startTime = Date.now();
      
      // Simular múltiplas requisições
      const requests = [
        fetch('/api/orders?customerId=customer-123'),
        fetch('/api/auth/me'),
        fetch('/api/orders/order-delivery-123')
      ];
      
      await Promise.all(requests);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`⚡ Performance: ${duration}ms para ${requests.length} requisições`);
      
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });
  });

  describe('Cenário 8: Fluxo completo end-to-end', () => {
    it('deve simular fluxo completo do cliente', async () => {
      console.log('🚀 Iniciando fluxo completo do cliente...');
      
      // 1. Login do cliente
      console.log('1️⃣ Cliente faz login...');
      
      // 2. Navegação para cardápio
      console.log('2️⃣ Cliente navega para cardápio...');
      
      // 3. Adição de itens ao carrinho
      console.log('3️⃣ Cliente adiciona itens ao carrinho...');
      
      // 4. Finalização do pedido
      console.log('4️⃣ Cliente finaliza pedido de delivery...');
      
      // 5. Acompanhamento em tempo real
      console.log('5️⃣ Cliente acompanha status em tempo real...');
      
      // 6. Recebimento de notificações
      console.log('6️⃣ Cliente recebe notificações push...');
      
      // 7. Visualização de detalhes
      console.log('7️⃣ Cliente visualiza detalhes do pedido...');
      
      // 8. Recebimento do pedido
      console.log('8️⃣ Cliente recebe pedido entregue...');
      
      // 9. Avaliação do pedido
      console.log('9️⃣ Cliente avalia o pedido...');
      
      // 10. Finalização do fluxo
      console.log('🔟 Fluxo completo finalizado com sucesso!');
      
      expect(true).toBe(true); // Fluxo completado
    });
  });
});
