import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromRequest, verifyToken, hasPermission } from '@/lib/auth';
import { UserRole } from '@/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/users/[id] - Buscar usuário específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

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
    if (!hasPermission(decoded.role, 'users:read')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para visualizar usuários' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        tables: {
          select: {
            id: true,
            number: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

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
    if (!hasPermission(decoded.role, 'users:write')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para editar usuários' },
        { status: 403 }
      );
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, isActive } = body;

    // Validações
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar role
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Role inválido' },
        { status: 400 }
      );
    }

    // Verificar se já existe usuário com este email (exceto o atual)
    if (email && email.toLowerCase() !== existingUser.email) {
      const duplicateUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (duplicateUser) {
        return NextResponse.json(
          { success: false, error: 'Já existe um usuário com este email' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    
    if (email !== undefined) {
      updateData.email = email.toLowerCase().trim();
    }
    
    if (password !== undefined) {
      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    if (role !== undefined) {
      updateData.role = role;
    }
    
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'UPDATE_USER',
    //     entityType: 'User',
    //     entityId: id,
    //     details: JSON.stringify({
    //       oldData: existingUser,
    //       newData: updatedUser,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Deletar usuário
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

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
    if (!hasPermission(decoded.role, 'users:delete')) {
      return NextResponse.json(
        { success: false, error: 'Sem permissão para deletar usuários' },
        { status: 403 }
      );
    }

    // Não permitir que um usuário delete a si mesmo
    if (id === decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Não é possível deletar seu próprio usuário' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem pedidos
    const ordersCount = await prisma.order.count({
      where: { userId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível deletar usuário que possui pedidos. Desative o usuário ao invés de deletá-lo.' 
        },
        { status: 400 }
      );
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // await prisma.activityLog.create({
    //   data: {
    //     userId: decoded.userId,
    //     action: 'DELETE_USER',
    //     entityType: 'User',
    //     entityId: id,
    //     details: JSON.stringify({
    //       email: existingUser.email,
    //       name: existingUser.name,
    //       role: existingUser.role,
    //     }),
    //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    //     userAgent: request.headers.get('user-agent'),
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}