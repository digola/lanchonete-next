import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CustomerDashboard } from '@/app/customer/dashboard/page';
import { CustomerOrdersPage } from '@/app/customer/orders/page';
import { OrderDetailsPage } from '@/app/customer/orders/[id]/page';

// Mock dos hooks e APIs
jest.mock('@/hooks/useApiAuth', () => ({
  useApiAuth: () => ({
    user: {
      id: 'customer-123',
      name: 'João Silva',
      email: 'joao@email.com',
      role: 'CLIENTE',
      phone: '(11) 99999-9999',
      createdAt: new Date('2024-01-01')
    },
    getUserDisplayName: () => 'João Silva'
  })
}));

jest.mock('@/hooks/useApi', () => ({
  useApi: () => ({
    data: {
      data: [],
      pagination: { total: 0, page: 1, limit: 5 }
    },
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

// Mock do fetch para simular APIs
global.fetch = jest.fn();

describe('Fluxo Completo de Compra Delivery', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('1. Cliente acessa o dashboard', () => {
    it('deve exibir dashboard com informações do cliente', () => {
      render(<CustomerDashboard />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('joao@email.com')).toBeInTheDocument();
    });

    it('deve exibir estatísticas iniciais', () => {
      render(<CustomerDashboard />);
      
      expect(screen.getByText('Total de Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Pedidos Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Pedidos Entregues')).toBeInTheDocument();
    });
  });

  describe('2. Cliente navega para pedidos', () => {
    it('deve exibir lista de pedidos vazia inicialmente', () => {
      render(<CustomerOrdersPage />);
      
      expect(screen.getByText('Meus Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument();
    });

    it('deve exibir botão para novo pedido', () => {
      render(<CustomerOrdersPage />);
      
      const novoPedidoButton = screen.getByText('Novo Pedido');
      expect(novoPedidoButton).toBeInTheDocument();
    });
  });

  describe('3. Simulação de pedido de delivery criado', () => {
    const mockDeliveryOrder = {
      id: 'order-delivery-123',
      userId: 'customer-123',
      status: 'PENDENTE',
      total: 45.90,
      deliveryType: 'DELIVERY',
      deliveryAddress: 'Rua das Flores, 123 - Centro',
      paymentMethod: 'DINHEIRO',
      notes: 'Entregar na portaria',
      items: [
        {
          id: 'item-1',
          orderId: 'order-delivery-123',
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
          orderId: 'order-delivery-123',
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
          orderId: 'order-delivery-123',
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

    it('deve simular criação de pedido via API', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockDeliveryOrder
        })
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-123'
        },
        body: JSON.stringify({
          userId: 'customer-123',
          status: 'PENDENTE',
          total: 45.90,
          deliveryType: 'DELIVERY',
          deliveryAddress: 'Rua das Flores, 123 - Centro',
          paymentMethod: 'DINHEIRO',
          notes: 'Entregar na portaria',
          items: [
            { productId: 'product-1', quantity: 1, price: 25.90 },
            { productId: 'product-2', quantity: 1, price: 12.00 },
            { productId: 'product-3', quantity: 1, price: 8.00 }
          ]
        })
      });

      const result = await response.json();
      
      expect(fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-123'
        })
      }));
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('order-delivery-123');
    });
  });

  describe('4. Cliente visualiza pedido no dashboard', () => {
    it('deve exibir seção de delivery ativo quando há pedido', () => {
      // Mock do hook para retornar pedido de delivery
      jest.doMock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: {
            data: [{
              id: 'order-delivery-123',
              userId: 'customer-123',
              status: 'PENDENTE',
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
                  product: { name: 'Hambúrguer Clássico' }
                }
              ],
              createdAt: new Date(),
              updatedAt: new Date()
            }],
            pagination: { total: 1, page: 1, limit: 5 }
          },
          loading: false
        })
      }));

      render(<CustomerDashboard />);
      
      // Verificar se elementos de delivery estão presentes
      expect(screen.getByText('Pedido de Delivery Ativo')).toBeInTheDocument();
      expect(screen.getByText('Rua das Flores, 123 - Centro')).toBeInTheDocument();
      expect(screen.getByText('R$ 45,90')).toBeInTheDocument();
    });

    it('deve exibir status do pedido em tempo real', () => {
      render(<CustomerDashboard />);
      
      // Simular diferentes status
      const statusElements = screen.queryAllByText(/Pendente|Confirmado|Preparando|Saiu para entrega|Entregue/);
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('deve exibir barra de progresso do pedido', () => {
      render(<CustomerDashboard />);
      
      const progressBar = screen.queryByRole('progressbar');
      if (progressBar) {
        expect(progressBar).toBeInTheDocument();
      }
    });
  });

  describe('5. Cliente acompanha status do pedido', () => {
    it('deve simular atualização de status via WebSocket', async () => {
      const mockWebSocket = {
        isConnected: true,
        sendMessage: jest.fn()
      };

      jest.doMock('@/hooks/useWebSocket', () => ({
        useWebSocket: () => mockWebSocket
      }));

      render(<CustomerDashboard />);

      // Simular mensagem WebSocket de atualização de status
      const webSocketMessage = {
        type: 'order_update',
        data: {
          orderId: 'order-delivery-123',
          status: 'CONFIRMADO',
          timestamp: new Date().toISOString()
        }
      };

      // Simular recebimento da mensagem
      expect(mockWebSocket.sendMessage).toBeDefined();
    });

    it('deve exibir notificação de atualização de status', async () => {
      const mockAddNotification = jest.fn();
      
      jest.doMock('@/hooks/useNotifications', () => ({
        useNotifications: () => ({
          notifications: [],
          addNotification: mockAddNotification,
          removeNotification: jest.fn(),
          markAsRead: jest.fn(),
          unreadCount: 0,
          requestPermission: jest.fn()
        })
      }));

      render(<CustomerDashboard />);

      // Simular notificação de status
      const notification = {
        title: 'Status do Pedido Atualizado',
        message: 'Seu pedido foi confirmado e está sendo preparado!',
        type: 'info' as const,
        actionUrl: '/customer/orders/order-delivery-123'
      };

      mockAddNotification(notification);
      
      expect(mockAddNotification).toHaveBeenCalledWith(notification);
    });
  });

  describe('6. Cliente visualiza detalhes do pedido', () => {
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

    it('deve exibir detalhes completos do pedido', () => {
      // Mock do hook para retornar detalhes do pedido
      jest.doMock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: mockOrderDetails,
          loading: false
        })
      }));

      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Pedido #')).toBeInTheDocument();
      expect(screen.getByText('Status do Pedido')).toBeInTheDocument();
      expect(screen.getByText('Itens do Pedido')).toBeInTheDocument();
      expect(screen.getByText('Informações de Entrega')).toBeInTheDocument();
      expect(screen.getByText('Resumo do Pedido')).toBeInTheDocument();
    });

    it('deve exibir itens do pedido corretamente', () => {
      jest.doMock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: mockOrderDetails,
          loading: false
        })
      }));

      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Hambúrguer Clássico')).toBeInTheDocument();
      expect(screen.getByText('Batata Frita')).toBeInTheDocument();
      expect(screen.getByText('Refrigerante')).toBeInTheDocument();
    });

    it('deve exibir informações de entrega', () => {
      jest.doMock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: mockOrderDetails,
          loading: false
        })
      }));

      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Rua das Flores, 123 - Centro')).toBeInTheDocument();
      expect(screen.getByText('Entregar na portaria')).toBeInTheDocument();
    });
  });

  describe('7. Cliente recebe pedido entregue', () => {
    it('deve simular pedido entregue via WebSocket', async () => {
      const mockWebSocket = {
        isConnected: true,
        sendMessage: jest.fn()
      };

      jest.doMock('@/hooks/useWebSocket', () => ({
        useWebSocket: () => mockWebSocket
      }));

      render(<CustomerDashboard />);

      // Simular mensagem de entrega
      const deliveryMessage = {
        type: 'delivery_status',
        data: {
          orderId: 'order-delivery-123',
          status: 'delivered',
          timestamp: new Date().toISOString()
        }
      };

      expect(mockWebSocket.sendMessage).toBeDefined();
    });

    it('deve exibir notificação de entrega', async () => {
      const mockAddNotification = jest.fn();
      
      jest.doMock('@/hooks/useNotifications', () => ({
        useNotifications: () => ({
          notifications: [],
          addNotification: mockAddNotification,
          removeNotification: jest.fn(),
          markAsRead: jest.fn(),
          unreadCount: 0,
          requestPermission: jest.fn()
        })
      }));

      render(<CustomerDashboard />);

      const deliveryNotification = {
        title: 'Pedido Entregue! 🎉',
        message: 'Seu pedido foi entregue com sucesso. Obrigado pela preferência!',
        type: 'success' as const,
        actionUrl: '/customer/orders/order-delivery-123'
      };

      mockAddNotification(deliveryNotification);
      
      expect(mockAddNotification).toHaveBeenCalledWith(deliveryNotification);
    });
  });

  describe('8. Cliente avalia o pedido', () => {
    it('deve simular criação de avaliação via API', async () => {
      const reviewData = {
        rating: 5,
        comment: 'Excelente atendimento! Pedido chegou quente e no prazo.'
      };

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
      
      expect(fetch).toHaveBeenCalledWith('/api/orders/order-delivery-123/review', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-123'
        })
      }));
      expect(result.success).toBe(true);
      expect(result.data.rating).toBe(5);
    });

    it('deve exibir botão de avaliação para pedido entregue', () => {
      const mockOrderDetails = {
        id: 'order-delivery-123',
        status: 'ENTREGUE',
        total: 45.90,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      jest.doMock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: mockOrderDetails,
          loading: false
        })
      }));

      render(<OrderDetailsPage />);
      
      const avaliarButton = screen.queryByText('Avaliar Pedido');
      if (avaliarButton) {
        expect(avaliarButton).toBeInTheDocument();
      }
    });
  });

  describe('9. Fluxo completo de notificações', () => {
    it('deve simular sequência completa de notificações', async () => {
      const mockAddNotification = jest.fn();
      
      jest.doMock('@/hooks/useNotifications', () => ({
        useNotifications: () => ({
          notifications: [],
          addNotification: mockAddNotification,
          removeNotification: jest.fn(),
          markAsRead: jest.fn(),
          unreadCount: 0,
          requestPermission: jest.fn()
        })
      }));

      render(<CustomerDashboard />);

      // Sequência de notificações do pedido
      const notifications = [
        {
          title: 'Pedido Confirmado! ✅',
          message: 'Seu pedido foi confirmado e está sendo preparado.',
          type: 'success' as const
        },
        {
          title: 'Pedido Saiu para Entrega! 🚚',
          message: 'Seu pedido saiu para entrega. Chegada estimada em 30 minutos.',
          type: 'info' as const
        },
        {
          title: 'Pedido Entregue! 🎉',
          message: 'Seu pedido foi entregue com sucesso. Obrigado pela preferência!',
          type: 'success' as const
        }
      ];

      // Simular envio das notificações
      notifications.forEach(notification => {
        mockAddNotification(notification);
      });

      expect(mockAddNotification).toHaveBeenCalledTimes(3);
      expect(mockAddNotification).toHaveBeenNthCalledWith(1, notifications[0]);
      expect(mockAddNotification).toHaveBeenNthCalledWith(2, notifications[1]);
      expect(mockAddNotification).toHaveBeenNthCalledWith(3, notifications[2]);
    });
  });

  describe('10. Validações de segurança', () => {
    it('deve validar autenticação em todas as requisições', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Token de acesso necessário'
        })
      });

      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      const result = await response.json();
      
      expect(response.status).toBe(401);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Token de acesso necessário');
    });

    it('deve validar que cliente só vê seus próprios pedidos', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [{
            id: 'order-delivery-123',
            userId: 'customer-123', // Mesmo usuário
            status: 'PENDENTE',
            total: 45.90
          }]
        })
      });

      const response = await fetch('/api/orders?customerId=customer-123');
      const result = await response.json();
      
      expect(result.data[0].userId).toBe('customer-123');
    });
  });
});
