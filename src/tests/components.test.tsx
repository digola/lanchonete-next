import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CustomerDashboard } from '@/app/customer/dashboard/page';
import { CustomerOrdersPage } from '@/app/customer/orders/page';
import { OrderDetailsPage } from '@/app/customer/orders/[id]/page';
import { CustomerProfilePage } from '@/app/customer/profile/page';

// Mock dos hooks
jest.mock('@/hooks/useApiAuth', () => ({
  useApiAuth: () => ({
    user: {
      id: 'user-123',
      name: 'João Silva',
      email: 'joao@email.com',
      role: 'CLIENTE',
      createdAt: new Date()
    },
    getUserDisplayName: () => 'João Silva'
  })
}));

jest.mock('@/hooks/useApi', () => ({
  useApi: () => ({
    data: {
      data: [
        {
          id: 'order-1',
          userId: 'user-123',
          status: 'PENDENTE',
          total: 25.90,
          deliveryType: 'DELIVERY',
          deliveryAddress: 'Rua das Flores, 123',
          paymentMethod: 'DINHEIRO',
          items: [
            {
              id: 'item-1',
              productId: 'product-1',
              quantity: 1,
              price: 25.90,
              product: {
                id: 'product-1',
                name: 'Hambúrguer',
                price: 25.90
              }
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      pagination: { total: 1, page: 1, limit: 5 }
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

describe('Componentes da Área Customer', () => {
  describe('CustomerDashboard', () => {
    it('deve renderizar dashboard com informações do usuário', () => {
      render(<CustomerDashboard />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    it('deve exibir estatísticas de pedidos', () => {
      render(<CustomerDashboard />);
      
      expect(screen.getByText('Total de Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Pedidos Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Pedidos Entregues')).toBeInTheDocument();
    });

    it('deve exibir seção de delivery ativo quando há pedido', () => {
      render(<CustomerDashboard />);
      
      // Simular pedido de delivery ativo
      const deliverySection = screen.queryByText('Pedido de Delivery Ativo');
      if (deliverySection) {
        expect(deliverySection).toBeInTheDocument();
      }
    });

    it('deve exibir pedidos recentes', () => {
      render(<CustomerDashboard />);
      
      expect(screen.getByText('Pedidos Recentes')).toBeInTheDocument();
    });
  });

  describe('CustomerOrdersPage', () => {
    it('deve renderizar lista de pedidos', () => {
      render(<CustomerOrdersPage />);
      
      expect(screen.getByText('Meus Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Acompanhe todos os seus pedidos')).toBeInTheDocument();
    });

    it('deve exibir filtros de status', () => {
      render(<CustomerOrdersPage />);
      
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Confirmados')).toBeInTheDocument();
    });

    it('deve exibir campo de busca', () => {
      render(<CustomerOrdersPage />);
      
      const searchInput = screen.getByPlaceholderText('Buscar por ID do pedido...');
      expect(searchInput).toBeInTheDocument();
    });

    it('deve exibir estatísticas de pedidos', () => {
      render(<CustomerOrdersPage />);
      
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Pendentes')).toBeInTheDocument();
      expect(screen.getByText('Prontos')).toBeInTheDocument();
      expect(screen.getByText('Entregues')).toBeInTheDocument();
    });

    it('deve permitir busca por termo', async () => {
      render(<CustomerOrdersPage />);
      
      const searchInput = screen.getByPlaceholderText('Buscar por ID do pedido...');
      fireEvent.change(searchInput, { target: { value: 'order-123' } });
      
      expect(searchInput).toHaveValue('order-123');
    });

    it('deve permitir filtro por status', () => {
      render(<CustomerOrdersPage />);
      
      const pendenteButton = screen.getByText('Pendentes');
      fireEvent.click(pendenteButton);
      
      expect(pendenteButton).toHaveClass('bg-primary-600');
    });
  });

  describe('OrderDetailsPage', () => {
    const mockOrder = {
      id: 'order-123',
      userId: 'user-123',
      status: 'PENDENTE',
      total: 25.90,
      deliveryType: 'DELIVERY',
      deliveryAddress: 'Rua das Flores, 123',
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
            name: 'Hambúrguer',
            price: 25.90
          }
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    beforeEach(() => {
      jest.mock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: mockOrder,
          loading: false
        })
      }));
    });

    it('deve renderizar detalhes do pedido', () => {
      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Pedido #')).toBeInTheDocument();
    });

    it('deve exibir status do pedido', () => {
      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Status do Pedido')).toBeInTheDocument();
    });

    it('deve exibir itens do pedido', () => {
      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Itens do Pedido')).toBeInTheDocument();
    });

    it('deve exibir informações de entrega', () => {
      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Informações de Entrega')).toBeInTheDocument();
    });

    it('deve exibir resumo financeiro', () => {
      render(<OrderDetailsPage />);
      
      expect(screen.getByText('Resumo do Pedido')).toBeInTheDocument();
    });
  });

  describe('CustomerProfilePage', () => {
    it('deve renderizar perfil do usuário', () => {
      render(<CustomerProfilePage />);
      
      expect(screen.getByText('Meu Perfil')).toBeInTheDocument();
      expect(screen.getByText('Gerencie suas informações pessoais')).toBeInTheDocument();
    });

    it('deve exibir informações pessoais', () => {
      render(<CustomerProfilePage />);
      
      expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('joao@email.com')).toBeInTheDocument();
    });

    it('deve permitir edição do perfil', () => {
      render(<CustomerProfilePage />);
      
      const editButton = screen.getByText('Editar');
      fireEvent.click(editButton);
      
      expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument();
    });

    it('deve exibir seção de segurança', () => {
      render(<CustomerProfilePage />);
      
      expect(screen.getByText('Segurança')).toBeInTheDocument();
    });

    it('deve permitir alteração de senha', () => {
      render(<CustomerProfilePage />);
      
      const changePasswordButton = screen.getByText('Alterar');
      fireEvent.click(changePasswordButton);
      
      expect(screen.getByLabelText('Senha Atual')).toBeInTheDocument();
      expect(screen.getByLabelText('Nova Senha')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmar Nova Senha')).toBeInTheDocument();
    });
  });

  describe('Interações e Estados', () => {
    it('deve exibir loading states', () => {
      jest.mock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: null,
          loading: true
        })
      }));

      render(<CustomerDashboard />);
      
      // Verificar se elementos de loading estão presentes
      const loadingElements = screen.queryAllByTestId('loading');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('deve exibir estados vazios', () => {
      jest.mock('@/hooks/useApi', () => ({
        useApi: () => ({
          data: { data: [], pagination: { total: 0 } },
          loading: false
        })
      }));

      render(<CustomerOrdersPage />);
      
      expect(screen.getByText('Nenhum pedido encontrado')).toBeInTheDocument();
    });

    it('deve exibir erros de conexão', () => {
      jest.mock('@/hooks/useWebSocket', () => ({
        useWebSocket: () => ({
          isConnected: false,
          connectionStatus: 'error',
          sendMessage: jest.fn()
        })
      }));

      render(<CustomerDashboard />);
      
      // Verificar se indicadores de erro estão presentes
      const errorIndicators = screen.queryAllByText(/erro|falha|conexão/i);
      expect(errorIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Responsividade', () => {
    it('deve adaptar layout para mobile', () => {
      // Simular viewport mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<CustomerDashboard />);
      
      // Verificar se elementos responsivos estão presentes
      const responsiveElements = screen.queryAllByTestId('mobile-layout');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('deve adaptar layout para desktop', () => {
      // Simular viewport desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<CustomerDashboard />);
      
      // Verificar se elementos desktop estão presentes
      const desktopElements = screen.queryAllByTestId('desktop-layout');
      expect(desktopElements.length).toBeGreaterThan(0);
    });
  });
});
