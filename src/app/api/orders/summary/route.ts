import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { UserRole } from '@/types';
import { getCache, setCache, CACHE_DURATION } from '@/lib/cache';

// GET /api/orders/summary - Resumo de pedidos pendentes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusesParam = searchParams.get('statuses');
    const limitToToday = searchParams.get('today') === 'true';

    // Auth
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

    // Status pendentes padrão
    const defaultPending = ['PENDENTE', 'CONFIRMADO', 'PREPARANDO', 'PRONTO'];
    const statuses = (statusesParam || defaultPending.join(',')).split(',').map(s => s.trim().toUpperCase());

    // Filtros por role (compatível com /api/orders)
    const where: any = { status: { in: statuses } };

    if (decoded.role === UserRole.CUSTOMER) {
      where.userId = decoded.userId;
    } else if (decoded.role === UserRole.STAFF || decoded.role === UserRole.ADMIN) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: today };
    } else if (decoded.role === UserRole.MANAGER) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.user = { role: { in: [UserRole.STAFF, UserRole.MANAGER] } };
      where.createdAt = { gte: today };
    }

    if (limitToToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.createdAt = { gte: today };
    }

    // Cache
    const cacheKey = `orders_summary_${decoded.userId}_${statuses.join('-')}_${where.createdAt ? 'today' : 'all'}`;
    const cached = getCache(cacheKey, CACHE_DURATION.MEDIUM);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Agregado leve: count + primeiras/últimas datas
    const agg = await prisma.order.aggregate({
      where,
      _count: { _all: true },
      _min: { createdAt: true },
      _max: { createdAt: true },
    });

    const responseData = {
      success: true,
      count: (agg._count as any)?._all || 0,
      firstDate: agg._min?.createdAt || null,
      lastDate: agg._max?.createdAt || null,
      statuses,
    };

    setCache(cacheKey, responseData);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Erro em /api/orders/summary:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error?.message },
      { status: 500 }
    );
  }
}

