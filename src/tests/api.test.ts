import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as getOrders, POST as createOrder } from '@/app/api/orders/route';
import { GET as getOrderById, PUT as updateOrder } from '@/app/api/orders/[id]/route';
import { POST as createReview } from '@/app/api/orders/[id]/review/route';

// Mock do Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    orderReview: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock do auth
jest.mock('@/lib/auth', () => ({
  getTokenFromRequest: jest.fn(),
  verifyToken: jest.fn(),
  hasPermission: jest.fn(),
}));

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/orders', () => {
    it('deve retornar lista de pedidos para cliente', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-123',
          status: 'PENDENTE',
          total: 25.90,
          createdAt: new Date()
        }
      ];

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken } = require('@/lib/auth');

      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(1);
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'CLIENTE' });

      const request = new NextRequest('http://localhost:3000/api/orders?customerId=user-123');
      const response = await getOrders(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });

    it('deve retornar erro 401 sem token', async () => {
      const { getTokenFromRequest } = require('@/lib/auth');
      getTokenFromRequest.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/orders');
      const response = await getOrders(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Token de acesso necessário');
    });

    it('deve filtrar pedidos por status', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          userId: 'user-123',
          status: 'PENDENTE',
          total: 25.90
        }
      ];

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken } = require('@/lib/auth');

      prisma.order.findMany.mockResolvedValue(mockOrders);
      prisma.order.count.mockResolvedValue(1);
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'CLIENTE' });

      const request = new NextRequest('http://localhost:3000/api/orders?customerId=user-123&status=PENDENTE');
      const response = await getOrders(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
            status: 'PENDENTE'
          })
        })
      );
    });
  });

  describe('POST /api/orders', () => {
    it('deve criar novo pedido', async () => {
      const orderData = {
        userId: 'user-123',
        status: 'PENDENTE',
        total: 45.90,
        deliveryType: 'DELIVERY',
        deliveryAddress: 'Rua das Flores, 123',
        paymentMethod: 'DINHEIRO',
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 12.50
          }
        ]
      };

      const mockCreatedOrder = {
        id: 'order-123',
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken } = require('@/lib/auth');

      prisma.order.create.mockResolvedValue(mockCreatedOrder);
      prisma.orderItem.create.mockResolvedValue({
        id: 'item-123',
        orderId: 'order-123',
        productId: 'product-1',
        quantity: 2,
        price: 12.50
      });
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'CLIENTE' });

      const request = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createOrder(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe('order-123');
    });
  });

  describe('GET /api/orders/[id]', () => {
    it('deve retornar pedido específico', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        userId: 'user-123',
        status: 'PENDENTE',
        total: 25.90,
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
        ]
      };

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken } = require('@/lib/auth');

      prisma.order.findUnique.mockResolvedValue(mockOrder);
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'CLIENTE' });

      const request = new NextRequest(`http://localhost:3000/api/orders/${orderId}`);
      const response = await getOrderById(request, { params: { id: orderId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(orderId);
    });

    it('deve retornar erro 404 para pedido não encontrado', async () => {
      const orderId = 'order-not-found';

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken } = require('@/lib/auth');

      prisma.order.findUnique.mockResolvedValue(null);
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'CLIENTE' });

      const request = new NextRequest(`http://localhost:3000/api/orders/${orderId}`);
      const response = await getOrderById(request, { params: { id: orderId } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Pedido não encontrado');
    });
  });

  describe('PUT /api/orders/[id]', () => {
    it('deve atualizar status do pedido', async () => {
      const orderId = 'order-123';
      const updateData = { status: 'CONFIRMADO' };
      const mockUpdatedOrder = {
        id: orderId,
        status: 'CONFIRMADO',
        updatedAt: new Date()
      };

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken, hasPermission } = require('@/lib/auth');

      prisma.order.findUnique.mockResolvedValue({ id: orderId, userId: 'user-123' });
      prisma.order.update.mockResolvedValue(mockUpdatedOrder);
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'FUNCIONARIO' });
      hasPermission.mockReturnValue(true);

      const request = new NextRequest(`http://localhost:3000/api/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await updateOrder(request, { params: { id: orderId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('CONFIRMADO');
    });
  });

  describe('POST /api/orders/[id]/review', () => {
    it('deve criar avaliação do pedido', async () => {
      const orderId = 'order-123';
      const reviewData = {
        rating: 5,
        comment: 'Excelente atendimento!'
      };

      const mockReview = {
        id: 'review-123',
        orderId,
        userId: 'user-123',
        rating: 5,
        comment: 'Excelente atendimento!',
        createdAt: new Date()
      };

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken } = require('@/lib/auth');

      prisma.order.findFirst.mockResolvedValue({
        id: orderId,
        userId: 'user-123',
        status: 'ENTREGUE'
      });
      prisma.orderReview.findFirst.mockResolvedValue(null);
      prisma.orderReview.create.mockResolvedValue(mockReview);
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'CLIENTE' });

      const request = new NextRequest(`http://localhost:3000/api/orders/${orderId}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createReview(request, { params: { id: orderId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.rating).toBe(5);
    });

    it('deve retornar erro para pedido não entregue', async () => {
      const orderId = 'order-123';
      const reviewData = {
        rating: 5,
        comment: 'Excelente atendimento!'
      };

      const { prisma } = require('@/lib/prisma');
      const { getTokenFromRequest, verifyToken } = require('@/lib/auth');

      prisma.order.findFirst.mockResolvedValue({
        id: orderId,
        userId: 'user-123',
        status: 'PENDENTE'
      });
      getTokenFromRequest.mockReturnValue('valid-token');
      verifyToken.mockReturnValue({ userId: 'user-123', role: 'CLIENTE' });

      const request = new NextRequest(`http://localhost:3000/api/orders/${orderId}/review`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await createReview(request, { params: { id: orderId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Apenas pedidos entregues podem ser avaliados');
    });
  });
});
