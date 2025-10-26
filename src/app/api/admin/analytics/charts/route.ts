import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar permissões (apenas ADMIN)
    const user = await prisma.user.findFirst({
      where: { 
        id: decoded.userId,
        isActive: true,
        role: 'ADMIN'
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
    const chartType = searchParams.get('type') || 'all'; // all, revenue, orders, products, tables

    // Calcular datas baseado no período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const response: any = {};

    // Dados para gráfico de receita
    if (chartType === 'all' || chartType === 'revenue') {
      const revenueData = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { not: 'CANCELADO' }
        },
        select: {
          createdAt: true,
          total: true,
          id: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Agrupar por dia
      const revenueByDay = revenueData.reduce((acc: any, order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!acc[date as string]) {
          acc[date as string] = { date, revenue: 0, orders: 0 };
        }
        acc[date as string].revenue += Number(order.total);
        acc[date as string].orders += 1;
        return acc;
      }, {});

      response.revenue = Object.values(revenueByDay);
    }

    // Dados para gráfico de pedidos
    if (chartType === 'all' || chartType === 'orders') {
      const ordersData = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate }
        },
        select: {
          createdAt: true,
          total: true,
          id: true
        },
        orderBy: { createdAt: 'asc' }
      });

      // Agrupar por dia
      const ordersByDay = ordersData.reduce((acc: any, order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!acc[date as string]) {
          acc[date as string] = { date, orders: 0, revenue: 0 };
        }
        acc[date as string].orders += 1;
        acc[date as string].revenue += Number(order.total);
        return acc;
      }, {});

      response.orders = Object.values(ordersByDay);
    }

    // Dados para gráfico de produtos
    if (chartType === 'all' || chartType === 'products') {
      const productsData = await prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: startDate },
            status: { not: 'CANCELADO' }
          }
        },
        include: {
          product: {
            select: { name: true }
          }
        }
      });

      // Agrupar por produto
      const productsBySales = productsData.reduce((acc: any, item) => {
        const productName = item.product?.name || 'Produto';
        if (!acc[productName]) {
          acc[productName] = { name: productName, quantity: 0, revenue: 0 };
        }
        acc[productName].quantity += item.quantity;
        acc[productName].revenue += Number(item.price) * item.quantity;
        return acc;
      }, {});

      // Ordenar por quantidade vendida
      response.products = Object.values(productsBySales)
        .sort((a: any, b: any) => b.quantity - a.quantity)
        .slice(0, 10);
    }

    // Dados para gráfico de mesas
    if (chartType === 'all' || chartType === 'tables') {
      const tablesData = await prisma.table.findMany({
        include: {
          orders: {
            where: {
              createdAt: { gte: startDate },
              status: { not: 'CANCELADO' }
            },
            select: {
              id: true,
              total: true
            }
          }
        }
      });

      response.tables = tablesData.map(table => ({
        number: table.number,
        orders: table.orders.length,
        revenue: table.orders.reduce((sum, order) => sum + Number(order.total), 0),
        capacity: table.capacity
      }));
    }

    return NextResponse.json({
      success: true,
      data: response,
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados dos gráficos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
