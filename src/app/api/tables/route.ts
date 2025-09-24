import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { TableStatus } from '@/types';

// GET /api/tables - Listar mesas
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

    // Verificar permissão
    if (!hasPermission(decoded.role, 'orders:read')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar mesas' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const includeAssignedUser = searchParams.get('includeAssignedUser') === 'true';

    // Construir filtros
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // Buscar mesas
    const tables = await prisma.table.findMany({
      where,
      include: {
        assignedUser: includeAssignedUser ? {
          select: {
            id: true,
            name: true,
            email: true,
          },
        } : false,
      },
      orderBy: { number: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: tables,
    });
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/tables - Criar mesa
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

    // Verificar permissão
    if (!hasPermission(decoded.role, 'settings:write')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar mesas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { number, capacity, assignedTo } = body;

    // Validações
    if (!number || !capacity) {
      return NextResponse.json(
        { success: false, error: 'Número e capacidade são obrigatórios' },
        { status: 400 }
      );
    }

    if (number < 1 || capacity < 1) {
      return NextResponse.json(
        { success: false, error: 'Número e capacidade devem ser maiores que zero' },
        { status: 400 }
      );
    }

    // Verificar se já existe mesa com este número
    const existingTable = await prisma.table.findUnique({
      where: { number: parseInt(number) },
    });

    if (existingTable) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma mesa com este número' },
        { status: 400 }
      );
    }

    // Verificar se o usuário atribuído existe (se fornecido)
    if (assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedTo },
      });

      if (!assignedUser) {
        return NextResponse.json(
          { success: false, error: 'Usuário atribuído não encontrado' },
          { status: 404 }
        );
      }
    }

    // Criar mesa
    const table = await prisma.table.create({
      data: {
        number: parseInt(number),
        capacity: parseInt(capacity),
        status: TableStatus.LIVRE,
        assignedTo: assignedTo || null,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'CREATE_TABLE',
    //     entityType: 'Table',
    //     entityId: table.id,
    //     details: JSON.stringify({
    //       number: table.number,
    //       capacity: table.capacity,
    //       assignedTo: table.assignedTo,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: table,
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}