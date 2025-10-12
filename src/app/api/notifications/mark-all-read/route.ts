import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // Marcar todas as notificações do usuário como lidas
    const result = await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: decoded.userId },
          { userId: null } // Notificações globais
        ],
        isRead: false,
        isActive: true
      },
      data: {
        isRead: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} notificações marcadas como lidas`,
      count: result.count
    });

  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
