import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { UserRole } from '@/types';

// GET /api/admin/reports - Buscar relatórios administrativos
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de acesso necessário' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar permissão de admin
    if (!hasPermission(decoded.role, 'reports:read')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day';
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // Construir filtros de data baseado no período
    let dateFilter: any = {};
    
    if (period === 'day') {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      dateFilter = {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      };
    } else if (period === 'month') {
      const startDate = new Date(month + '-01');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      dateFilter = {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      };
    } else if (period === 'year') {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 1);
      
      dateFilter = {
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      };
    }

    // Buscar pedidos do período com otimização
    const [orders, orderCount, revenueSum, tablesData] = await Promise.all([
      prisma.order.findMany({
        where: dateFilter,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              id: true
            }
          },
          table: {
            select: {
              id: true,
              number: true,
              status: true,
              capacity: true
            }
          }
        }
      }),
      prisma.order.count({
        where: dateFilter
      }),
      prisma.order.aggregate({
        where: dateFilter,
        _sum: {
          total: true
        }
      }),
      // Buscar dados das mesas
      prisma.table.findMany({
        select: {
          id: true,
          number: true,
          status: true,
          capacity: true,
          assignedTo: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

    // Calcular métricas básicas usando dados agregados
    const totalRevenue = revenueSum._sum.total || 0;
    const totalOrders = orderCount;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Contar clientes únicos
    const uniqueCustomers = new Set(orders.map(order => order.userId)).size;

    // Status dos pedidos
    const ordersByStatus = {
      pending: orders.filter(order => order.status === 'PENDENTE').length,
      confirmed: orders.filter(order => order.status === 'CONFIRMADO').length,
      preparing: orders.filter(order => order.status === 'PREPARANDO').length,
      ready: orders.filter(order => order.status === 'PRONTO').length,
      delivered: orders.filter(order => order.status === 'ENTREGUE').length,
      cancelled: orders.filter(order => order.status === 'CANCELADO').length
    };

    // Produtos mais vendidos
    const productSales = new Map();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId;
        const productName = item.product.name;
        const quantity = item.quantity;
        const revenue = item.price * item.quantity;
        
        if (productSales.has(productId)) {
          const existing = productSales.get(productId);
          existing.quantity += quantity;
          existing.revenue += revenue;
        } else {
          productSales.set(productId, {
            name: productName,
            quantity: quantity,
            revenue: revenue
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Métricas das mesas
    const tablesMetrics = {
      total: tablesData.length,
      occupied: tablesData.filter(table => table.status === 'OCUPADA').length,
      free: tablesData.filter(table => table.status === 'LIVRE').length,
      occupancyRate: tablesData.length > 0 ? 
        (tablesData.filter(table => table.status === 'OCUPADA').length / tablesData.length) * 100 : 0,
      averageCapacity: tablesData.length > 0 ? 
        tablesData.reduce((sum, table) => sum + table.capacity, 0) / tablesData.length : 0,
      totalCapacity: tablesData.reduce((sum, table) => sum + table.capacity, 0)
    };

    // Mesas mais utilizadas (com pedidos no período)
    const tableUsage = new Map();
    orders.forEach(order => {
      if (order.table) {
        const tableNumber = order.table.number;
        if (tableUsage.has(tableNumber)) {
          tableUsage.get(tableNumber).orders += 1;
          tableUsage.get(tableNumber).revenue += order.total;
        } else {
          tableUsage.set(tableNumber, {
            number: tableNumber,
            orders: 1,
            revenue: order.total,
            capacity: order.table.capacity
          });
        }
      }
    });

    const topTables = Array.from(tableUsage.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    // Status das mesas
    const tablesByStatus = {
      livre: tablesData.filter(table => table.status === 'LIVRE').length,
      ocupada: tablesData.filter(table => table.status === 'OCUPADA').length
    };

    // Dados históricos para comparação
    let revenueByDay = [];
    let revenueByMonth = [];
    let revenueByYear = [];

    if (period === 'day') {
      // Buscar dados dos últimos 7 dias para comparação usando agregação
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      const historicalData = await prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate
          }
        },
        _sum: {
          total: true
        },
        _count: {
          id: true
        }
      });

      // Agrupar por dia
      const dailyData = new Map();
      historicalData.forEach(item => {
        const day = item.createdAt.toISOString().split('T')[0];
        if (!dailyData.has(day)) {
          dailyData.set(day, { revenue: 0, orders: 0 });
        }
        dailyData.get(day).revenue += item._sum.total || 0;
        dailyData.get(day).orders += item._count.id;
      });

      revenueByDay = Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.date.localeCompare(b.date));
    }

    // Construir resposta
    const reportData = {
      period: period,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalCustomers: uniqueCustomers,
      ordersByStatus,
      topProducts,
      revenueByDay,
      revenueByMonth,
      revenueByYear,
      // Dados das mesas
      tablesMetrics,
      topTables,
      tablesByStatus,
      tablesData: tablesData.map(table => ({
        id: table.id,
        number: table.number,
        status: table.status,
        capacity: table.capacity,
        assignedTo: table.assignedTo,
        createdAt: table.createdAt,
        updatedAt: table.updatedAt
      }))
    };

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`📊 Relatórios gerados em ${responseTime}ms para período: ${period}`);
    
    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        responseTime: `${responseTime}ms`,
        period: period,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
