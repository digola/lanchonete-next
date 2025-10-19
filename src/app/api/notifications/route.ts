import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth-server';
;
import { NotificationType, NotificationPriority } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');

    // Buscar notificações do usuário
    const where: any = {
      OR: [
        { userId: decoded.userId }, // Notificações específicas do usuário
        { userId: null } // Notificações globais
      ],
      isActive: true
    };

    if (type) {
      where.type = type;
    }

    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.notification.count({ where })
    ]);

    // Contar notificações não lidas
    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      unreadCount
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userId, 
      title, 
      message, 
      type, 
      priority = 'normal',
      data,
      expiresAt 
    } = body;

    // Validar dados obrigatórios
    if (!title || !message || !type) {
      return NextResponse.json(
        { error: 'Título, mensagem e tipo são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de notificação
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de notificação inválido' },
        { status: 400 }
      );
    }

    // Validar prioridade
    if (!Object.values(NotificationPriority).includes(priority)) {
      return NextResponse.json(
        { error: 'Prioridade inválida' },
        { status: 400 }
      );
    }

    // Criar notificação
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        data: data ? JSON.stringify(data) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
