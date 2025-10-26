import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { NotificationService } from '@/lib/notificationService';

// POST /api/admin/notifications/cleanup - Limpar notificações expiradas
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar permissão (apenas admin)
    if (!hasPermission(decoded.role, 'settings:write')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    // Limpar notificações expiradas
    const cleanedCount = await NotificationService.cleanExpiredNotifications();

    return NextResponse.json({
      success: true,
      message: `${cleanedCount} notificações expiradas foram removidas`,
      data: { cleanedCount }
    });

  } catch (error) {
    console.error('Erro ao limpar notificações:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/admin/notifications/cleanup - Obter estatísticas de notificações
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar permissão (apenas admin)
    if (!hasPermission(decoded.role, 'settings:read')) {
      return NextResponse.json(
        { success: false, error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    // Obter estatísticas
    const stats = await NotificationService.getNotificationStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de notificações:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
