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
    const today = new Date();
    const date = searchParams.get('date') || today.toISOString().split('T')[0];
    const month = searchParams.get('month') || today.toISOString().substring(0, 7);
    const year = searchParams.get('year') || today.getFullYear().toString();

    // Construir filtros de data baseado no período
    let dateFilter: any = {};
    
    if (period === 'day' && date) {
      // Criar datas no horário local para evitar problemas de timezone
      const parts = date.split('-').map(Number);
      const yearNum = parts[0] || 0;
      const monthNum = parts[1] || 0;
      const dayNum = parts[2] || 0;
      const startDate = new Date(yearNum, monthNum - 1, dayNum, 0, 0, 0, 0);
      const endDate = new Date(yearNum, monthNum - 1, dayNum, 23, 59, 59, 999);
      
      console.log(`📅 Filtro de data (dia): ${startDate.toISOString()} até ${endDate.toISOString()}`);
      
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
    } else if (period === 'month' && month) {
      // Criar datas no horário local
      const parts = month.split('-').map(Number);
      const yearNum = parts[0] || 0;
      const monthNum = parts[1] || 0;
      const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999); // Último dia do mês
      
      console.log(`📅 Filtro de data (mês): ${startDate.toISOString()} até ${endDate.toISOString()}`);
      
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
    } else if (period === 'year' && year) {
      // Criar datas no horário local
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);
      
      console.log(`📅 Filtro de data (ano): ${startDate.toISOString()} até ${endDate.toISOString()}`);
      
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate
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
              id: true,
              role: true
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

    // Separar pedidos de balcão e mesa
    // Pedidos de balcão: sem tableId OU criados por MANAGER
    const counterOrders = orders.filter(order => 
      !order.tableId || order.user?.role === 'MANAGER'
    );
    // Pedidos de mesa: com tableId E NÃO criados por MANAGER
    const tableOrders = orders.filter(order => 
      order.tableId && order.user?.role !== 'MANAGER'
    );

    // Métricas de balcão
    const counterMetrics = {
      totalOrders: counterOrders.length,
      totalRevenue: counterOrders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: counterOrders.length > 0 
        ? counterOrders.reduce((sum, order) => sum + order.total, 0) / counterOrders.length 
        : 0,
      percentage: totalOrders > 0 ? (counterOrders.length / totalOrders) * 100 : 0
    };

    // Métricas de mesa
    const tableMetrics = {
      totalOrders: tableOrders.length,
      totalRevenue: tableOrders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: tableOrders.length > 0 
        ? tableOrders.reduce((sum, order) => sum + order.total, 0) / tableOrders.length 
        : 0,
      percentage: totalOrders > 0 ? (tableOrders.length / totalOrders) * 100 : 0
    };

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
    let revenueByDay: Array<{ date: string; revenue: number; orders: number }> = [];
    let revenueByMonth: Array<{ month: string; revenue: number; orders: number }> = [];
    let revenueByYear: Array<{ year: string; revenue: number; orders: number }> = [];

    if (period === 'day' && date) {
      // Buscar dados dos últimos 7 dias para comparação
      const parts = date.split('-').map(Number);
      const yearNum = parts[0] || 0;
      const monthNum = parts[1] || 0;
      const dayNum = parts[2] || 0;
      const selectedDate = new Date(yearNum, monthNum - 1, dayNum);
      
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);

      const historicalOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          total: true
        }
      });

      // Agrupar por dia
      const dailyData = new Map();
      for (let i = 0; i < 7; i++) {
        const day = new Date(selectedDate);
        day.setDate(day.getDate() - (6 - i));
        const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
        dailyData.set(dayStr, { revenue: 0, orders: 0 });
      }

      historicalOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dayStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
        if (dailyData.has(dayStr)) {
          dailyData.get(dayStr).revenue += order.total;
          dailyData.get(dayStr).orders += 1;
        }
      });

      revenueByDay = Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.date.localeCompare(b.date));
    } else if (period === 'month' && month) {
      // Buscar dados do mês dia por dia
      const parts = month.split('-').map(Number);
      const yearNum = parts[0] || 0;
      const monthNum = parts[1] || 0;
      const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

      const historicalOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          total: true
        }
      });

      // Agrupar por dia
      const dailyData = new Map();
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        dailyData.set(dayStr, { revenue: 0, orders: 0 });
      }

      historicalOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const dayStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}-${String(orderDate.getDate()).padStart(2, '0')}`;
        if (dailyData.has(dayStr)) {
          dailyData.get(dayStr).revenue += order.total;
          dailyData.get(dayStr).orders += 1;
        }
      });

      revenueByDay = Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.date.localeCompare(b.date));

      // Buscar dados dos últimos 12 meses para comparação
      const monthStartDate = new Date(yearNum, monthNum - 12, 1, 0, 0, 0, 0);

      const monthlyOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: monthStartDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          total: true
        }
      });

      const monthlyData = new Map();
      for (let i = 0; i < 12; i++) {
        const m = new Date(yearNum, monthNum - 12 + i, 1);
        const monthStr = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthStr, { revenue: 0, orders: 0 });
      }

      monthlyOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.has(monthStr)) {
          monthlyData.get(monthStr).revenue += order.total;
          monthlyData.get(monthStr).orders += 1;
        }
      });

      revenueByMonth = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.month.localeCompare(b.month));
    } else if (period === 'year' && year) {
      // Buscar dados do ano mês por mês
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(yearNum, 11, 31, 23, 59, 59, 999);

      const yearOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          total: true
        }
      });

      const monthlyData = new Map();
      for (let i = 0; i < 12; i++) {
        const monthStr = `${yearNum}-${String(i + 1).padStart(2, '0')}`;
        monthlyData.set(monthStr, { revenue: 0, orders: 0 });
      }

      yearOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthStr = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData.has(monthStr)) {
          monthlyData.get(monthStr).revenue += order.total;
          monthlyData.get(monthStr).orders += 1;
        }
      });

      revenueByMonth = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.month.localeCompare(b.month));

      // Buscar dados dos últimos 5 anos para comparação
      const yearStartDate = new Date(yearNum - 4, 0, 1, 0, 0, 0, 0);

      const yearlyOrders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: yearStartDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          total: true
        }
      });

      const yearlyData = new Map();
      for (let i = 0; i < 5; i++) {
        const y = (yearNum - 4 + i).toString();
        yearlyData.set(y, { revenue: 0, orders: 0 });
      }

      yearlyOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const y = orderDate.getFullYear().toString();
        if (yearlyData.has(y)) {
          yearlyData.get(y).revenue += order.total;
          yearlyData.get(y).orders += 1;
        }
      });

      revenueByYear = Array.from(yearlyData.entries()).map(([year, data]) => ({
        year,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => a.year.localeCompare(b.year));
    }

    // Análise de horários de pico
    const hourlyData = new Map<number, { orders: number; revenue: number }>();
    for (let i = 0; i < 24; i++) {
      hourlyData.set(i, { orders: 0, revenue: 0 });
    }

    orders.forEach(order => {
      const hour = order.createdAt.getHours();
      if (hourlyData.has(hour)) {
        hourlyData.get(hour)!.orders += 1;
        hourlyData.get(hour)!.revenue += order.total;
      }
    });

    const peakHours = Array.from(hourlyData.entries())
      .map(([hour, data]) => ({
        hour: `${hour}:00`,
        orders: data.orders,
        revenue: data.revenue
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    // Análise por categoria de produto
    const categoryRevenue = new Map<string, { revenue: number; orders: number; quantity: number }>();
    
    for (const order of orders) {
      for (const item of order.items) {
        // Buscar categoria do produto
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { category: true }
        });

        if (product?.category) {
          const categoryName = product.category.name;
          const revenue = item.price * item.quantity;

          if (categoryRevenue.has(categoryName)) {
            const existing = categoryRevenue.get(categoryName)!;
            existing.revenue += revenue;
            existing.quantity += item.quantity;
            existing.orders += 1;
          } else {
            categoryRevenue.set(categoryName, {
              revenue,
              orders: 1,
              quantity: item.quantity
            });
          }
        }
      }
    }

    const topCategories = Array.from(categoryRevenue.entries())
      .map(([name, data]) => ({
        name,
        revenue: data.revenue,
        orders: data.orders,
        quantity: data.quantity
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Métricas adicionais
    const cancelledOrders = orders.filter(o => o.status === 'CANCELADO').length;
    const completedOrders = orders.filter(o => o.status === 'ENTREGUE').length;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Análise de formas de pagamento
    const paymentMethods = new Map<string, { count: number; revenue: number }>();
    orders.forEach(order => {
      if (order.paymentMethod) {
        if (paymentMethods.has(order.paymentMethod)) {
          paymentMethods.get(order.paymentMethod)!.count += 1;
          paymentMethods.get(order.paymentMethod)!.revenue += order.total;
        } else {
          paymentMethods.set(order.paymentMethod, { count: 1, revenue: order.total });
        }
      }
    });

    const paymentMethodsData = Array.from(paymentMethods.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.revenue
    }));

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
        createdAt: table.createdAt.toISOString(),
        updatedAt: table.updatedAt.toISOString()
      })),
      // Métricas adicionais
      peakHours,
      topCategories,
      cancellationRate,
      completionRate,
      paymentMethods: paymentMethodsData,
      // Métricas de balcão vs mesa
      counterMetrics,
      tableMetrics
    };

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`📊 Relatórios gerados em ${responseTime}ms para período: ${period}`);
    console.log(`📊 Total de pedidos encontrados: ${totalOrders}`);
    console.log(`📊 Receita total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`📊 Pedidos de balcão: ${counterMetrics.totalOrders} (${counterMetrics.percentage.toFixed(1)}%) - R$ ${counterMetrics.totalRevenue.toFixed(2)}`);
    console.log(`📊 Pedidos de mesa: ${tableMetrics.totalOrders} (${tableMetrics.percentage.toFixed(1)}%) - R$ ${tableMetrics.totalRevenue.toFixed(2)}`);
    console.log(`ℹ️  Critério balcão: pedidos sem mesa OU criados por MANAGER`);
    
    return NextResponse.json({
      success: true,
      data: reportData,
      meta: {
        responseTime: `${responseTime}ms`,
        period: period,
        timestamp: new Date().toISOString(),
        ordersFound: totalOrders
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
