import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { verifyToken } from '@/lib/auth';

// GET - Buscar alertas de estoque
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const user = await verifyToken(token);
    // Verificar se o usuário é algum tipo de administrador (flexível)
    const isAdmin = user && (
      user.role === 'ADMIN' || 
      user.role === 'ADMINISTRADOR' || 
      user.role === 'administrador' ||
      user.role === 'Administrador' ||
      user.role?.toLowerCase() === 'administrador' ||
      user.role?.toLowerCase().includes('admin')
    );

    if (!user || !isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Buscar produtos com controle de estoque
    const products = await prisma.product.findMany({
      where: {
        trackStock: true,
        stockQuantity: { not: null },
        minStockLevel: { not: null }
      },
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: [
        { stockQuantity: 'asc' },
        { name: 'asc' }
      ]
    });

    // Categorizar alertas
    const alerts: {
      outOfStock: any[],
      lowStock: any[],
      overStock: any[]
    } = {
      outOfStock: [],
      lowStock: [],
      overStock: []
    };

    products.forEach(product => {
      const stockQuantity = product.stockQuantity || 0;
      const minStockLevel = product.minStockLevel || 0;
      const maxStockLevel = product.maxStockLevel || 100;

      if (stockQuantity <= 0) {
        alerts.outOfStock.push({
          ...product,
          alertType: 'out_of_stock',
          alertMessage: 'Produto esgotado'
        });
      } else if (stockQuantity <= minStockLevel) {
        alerts.lowStock.push({
          ...product,
          alertType: 'low_stock',
          alertMessage: `Estoque baixo (${stockQuantity}/${minStockLevel})`
        });
      } else if (stockQuantity > maxStockLevel) {
        alerts.overStock.push({
          ...product,
          alertType: 'over_stock',
          alertMessage: `Estoque alto (${stockQuantity}/${maxStockLevel})`
        });
      }
    });

    // Estatísticas gerais
    const stats = {
      totalProducts: products.length,
      outOfStockCount: alerts.outOfStock.length,
      lowStockCount: alerts.lowStock.length,
      overStockCount: alerts.overStock.length,
      totalAlerts: alerts.outOfStock.length + alerts.lowStock.length + alerts.overStock.length
    };

    return NextResponse.json({
      alerts,
      stats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar alertas de estoque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

