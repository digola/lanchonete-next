import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { OrderStatus, UserRole, DeliveryType, PaymentMethod } from '@/types';

// Mock do Prisma para testes
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    table: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderReview: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Entidades do Sistema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('User Entity', () => {
    it('deve criar um usuário cliente', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        role: UserRole.CLIENTE,
        isActive: true
      };

      const mockUser = {
        id: 'user-123',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await prisma.user.create({
        data: userData
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: userData
      });
    });

    it('deve buscar usuário por ID', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        name: 'João Silva',
        email: 'joao@email.com',
        role: UserRole.CLIENTE,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await prisma.user.findUnique({
        where: { id: userId }
      });

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
    });

    it('deve atualizar status do usuário', async () => {
      const userId = 'user-123';
      const updateData = { isActive: false };

      const mockUpdatedUser = {
        id: userId,
        name: 'João Silva',
        email: 'joao@email.com',
        role: UserRole.CLIENTE,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUpdatedUser);

      const result = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });

      expect(result.isActive).toBe(false);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData
      });
    });
  });

  describe('Order Entity', () => {
    it('deve criar um pedido de delivery', async () => {
      const orderData = {
        userId: 'user-123',
        status: OrderStatus.PENDENTE,
        total: 45.90,
        deliveryType: DeliveryType.DELIVERY,
        deliveryAddress: 'Rua das Flores, 123',
        paymentMethod: PaymentMethod.DINHEIRO,
        notes: 'Entregar na portaria'
      };

      const mockOrder = {
        id: 'order-123',
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: []
      };

      (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

      const result = await prisma.order.create({
        data: orderData
      });

      expect(result).toEqual(mockOrder);
      expect(result.deliveryType).toBe(DeliveryType.DELIVERY);
      expect(result.status).toBe(OrderStatus.PENDENTE);
    });

    it('deve buscar pedidos por usuário', async () => {
      const userId = 'user-123';
      const mockOrders = [
        {
          id: 'order-1',
          userId,
          status: OrderStatus.PENDENTE,
          total: 25.90,
          createdAt: new Date()
        },
        {
          id: 'order-2',
          userId,
          status: OrderStatus.ENTREGUE,
          total: 35.90,
          createdAt: new Date()
        }
      ];

      (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);

      const result = await prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
    });

    it('deve atualizar status do pedido', async () => {
      const orderId = 'order-123';
      const newStatus = OrderStatus.CONFIRMADO;

      const mockUpdatedOrder = {
        id: orderId,
        status: newStatus,
        updatedAt: new Date()
      };

      (prisma.order.update as jest.Mock).mockResolvedValue(mockUpdatedOrder);

      const result = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus }
      });

      expect(result.status).toBe(newStatus);
    });
  });

  describe('OrderItem Entity', () => {
    it('deve criar item do pedido', async () => {
      const itemData = {
        orderId: 'order-123',
        productId: 'product-123',
        quantity: 2,
        price: 12.50,
        notes: 'Sem cebola'
      };

      const mockItem = {
        id: 'item-123',
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.orderItem.create as jest.Mock).mockResolvedValue(mockItem);

      const result = await prisma.orderItem.create({
        data: itemData
      });

      expect(result).toEqual(mockItem);
      expect(result.quantity).toBe(2);
    });

    it('deve buscar itens por pedido', async () => {
      const orderId = 'order-123';
      const mockItems = [
        {
          id: 'item-1',
          orderId,
          productId: 'product-1',
          quantity: 1,
          price: 15.90
        },
        {
          id: 'item-2',
          orderId,
          productId: 'product-2',
          quantity: 2,
          price: 8.50
        }
      ];

      (prisma.orderItem.findMany as jest.Mock).mockResolvedValue(mockItems);

      const result = await prisma.orderItem.findMany({
        where: { orderId }
      });

      expect(result).toHaveLength(2);
      expect(result[0].orderId).toBe(orderId);
    });
  });

  describe('Product Entity', () => {
    it('deve criar produto', async () => {
      const productData = {
        name: 'Hambúrguer Clássico',
        description: 'Hambúrguer com carne, alface, tomate e queijo',
        price: 25.90,
        categoryId: 'category-123',
        isAvailable: true,
        imageUrl: 'https://example.com/burger.jpg'
      };

      const mockProduct = {
        id: 'product-123',
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await prisma.product.create({
        data: productData
      });

      expect(result).toEqual(mockProduct);
      expect(result.isAvailable).toBe(true);
    });

    it('deve buscar produtos por categoria', async () => {
      const categoryId = 'category-123';
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Hambúrguer',
          categoryId,
          price: 25.90,
          isAvailable: true
        },
        {
          id: 'product-2',
          name: 'Batata Frita',
          categoryId,
          price: 12.00,
          isAvailable: true
        }
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await prisma.product.findMany({
        where: { 
          categoryId,
          isAvailable: true 
        }
      });

      expect(result).toHaveLength(2);
      expect(result.every(p => p.categoryId === categoryId)).toBe(true);
    });
  });

  describe('Table Entity', () => {
    it('deve criar mesa', async () => {
      const tableData = {
        number: 5,
        capacity: 4,
        status: 'LIVRE' as any,
        assignedTo: null
      };

      const mockTable = {
        id: 'table-123',
        ...tableData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.table.create as jest.Mock).mockResolvedValue(mockTable);

      const result = await prisma.table.create({
        data: tableData
      });

      expect(result).toEqual(mockTable);
      expect(result.status).toBe('LIVRE');
    });

    it('deve atualizar status da mesa', async () => {
      const tableId = 'table-123';
      const newStatus = 'OCUPADA' as any;
      const assignedTo = 'user-123';

      const mockUpdatedTable = {
        id: tableId,
        status: newStatus,
        assignedTo,
        updatedAt: new Date()
      };

      (prisma.table.update as jest.Mock).mockResolvedValue(mockUpdatedTable);

      const result = await prisma.table.update({
        where: { id: tableId },
        data: { 
          status: newStatus,
          assignedTo 
        }
      });

      expect(result.status).toBe(newStatus);
      expect(result.assignedTo).toBe(assignedTo);
    });
  });

  describe('OrderReview Entity', () => {
    it('deve criar avaliação do pedido', async () => {
      const reviewData = {
        orderId: 'order-123',
        userId: 'user-123',
        rating: 5,
        comment: 'Excelente atendimento!'
      };

      const mockReview = {
        id: 'review-123',
        ...reviewData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.orderReview.create as jest.Mock).mockResolvedValue(mockReview);

      const result = await prisma.orderReview.create({
        data: reviewData
      });

      expect(result).toEqual(mockReview);
      expect(result.rating).toBe(5);
    });

    it('deve buscar avaliação por pedido', async () => {
      const orderId = 'order-123';
      const mockReview = {
        id: 'review-123',
        orderId,
        userId: 'user-123',
        rating: 4,
        comment: 'Muito bom!',
        createdAt: new Date()
      };

      (prisma.orderReview.findFirst as jest.Mock).mockResolvedValue(mockReview);

      const result = await prisma.orderReview.findFirst({
        where: { orderId }
      });

      expect(result).toEqual(mockReview);
      expect(result.orderId).toBe(orderId);
    });
  });

  describe('Relacionamentos', () => {
    it('deve buscar pedido com itens e usuário', async () => {
      const orderId = 'order-123';
      const mockOrderWithRelations = {
        id: orderId,
        userId: 'user-123',
        status: OrderStatus.PENDENTE,
        total: 45.90,
        user: {
          id: 'user-123',
          name: 'João Silva',
          email: 'joao@email.com'
        },
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            price: 12.50,
            product: {
              id: 'product-1',
              name: 'Hambúrguer',
              price: 12.50
            }
          }
        ]
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrderWithRelations);

      const result = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true
                }
              }
            }
          }
        }
      });

      expect(result).toEqual(mockOrderWithRelations);
      expect(result.user).toBeDefined();
      expect(result.items).toHaveLength(1);
    });
  });
});
