import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { TableStatus } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/tables/[id] - Buscar mesa específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    const table = await prisma.table.findUnique({
      where: { id },
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

    if (!table) {
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: table,
    });
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/tables/[id] - Atualizar mesa
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log('🔍 Atualizando mesa ID:', id);

    // Verificar autenticação
    const token = getTokenFromRequest(request);
    if (!token) {
      console.log('❌ Token não fornecido');
      return NextResponse.json(
        { success: false, error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('❌ Token inválido');
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    console.log('✅ Token válido para usuário:', decoded.userId);

    // Verificar permissão
    if (!hasPermission(decoded.role, 'tables:write')) {
      console.log('❌ Sem permissão para editar mesas');
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar mesas' },
        { status: 403 }
      );
    }

    // Verificar se a mesa existe
    const existingTable = await prisma.table.findUnique({
      where: { id },
    });

    if (!existingTable) {
      console.log('❌ Mesa não encontrada:', id);
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }

    console.log('✅ Mesa encontrada:', existingTable);

    const body = await request.json();
    const { number, capacity, status, assignedTo } = body;
    console.log('🔍 Dados recebidos para atualização:', body);

    // Validações
    if (number !== undefined && (number < 1 || !Number.isInteger(Number(number)))) {
      return NextResponse.json(
        { success: false, error: 'Número deve ser um inteiro positivo' },
        { status: 400 }
      );
    }

    if (capacity !== undefined && (capacity < 1 || !Number.isInteger(Number(capacity)))) {
      return NextResponse.json(
        { success: false, error: 'Capacidade deve ser um inteiro positivo' },
        { status: 400 }
      );
    }

    if (status && !Object.values(TableStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Verificar se já existe mesa com o mesmo número (exceto a atual)
    if (number && Number(number) !== existingTable.number) {
      const duplicateTable = await prisma.table.findUnique({
        where: { number: Number(number) },
      });

      if (duplicateTable) {
        return NextResponse.json(
          { success: false, error: 'Já existe uma mesa com este número' },
          { status: 400 }
        );
      }
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

    // Preparar dados para atualização
    const updateData: any = {};
    if (number !== undefined) updateData.number = Number(number);
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (status !== undefined) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;

    console.log('🔍 Dados de atualização preparados:', updateData);

    // Atualizar mesa
    const updatedTable = await prisma.table.update({
      where: { id },
      data: updateData,
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

    console.log('✅ Mesa atualizada com sucesso:', updatedTable);

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'UPDATE_TABLE',
    //     entityType: 'Table',
    //     entityId: id,
    //     details: JSON.stringify({
    //       oldData: existingTable,
    //       newData: updatedTable,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: updatedTable,
    });
  } catch (error) {
    console.error('Erro ao atualizar mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id] - Deletar mesa
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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
    if (!hasPermission(decoded.role, 'tables:write')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar mesas' },
        { status: 403 }
      );
    }

    // Verificar se a mesa existe
    const existingTable = await prisma.table.findUnique({
      where: { id },
    });

    if (!existingTable) {
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se a mesa tem pedidos
    const ordersCount = await prisma.order.count({
      where: { tableId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível deletar mesa que possui pedidos. Altere o status da mesa para manutenção.' 
        },
        { status: 400 }
      );
    }

    // Deletar mesa
    await prisma.table.delete({
      where: { id },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'DELETE_TABLE',
    //     entityType: 'Table',
    //     entityId: id,
    //     details: JSON.stringify({
    //       number: existingTable.number,
    //       capacity: existingTable.capacity,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Mesa deletada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}