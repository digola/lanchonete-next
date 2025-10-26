import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken, createAuthError, createAuthSuccess } from '@/lib/auth';
import { User } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Obter token da requisição
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        createAuthError('Token de autenticação não fornecido'),
        { status: 401 }
      );
    }

    // Verificar e decodificar token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        createAuthError('Token inválido ou expirado'),
        { status: 401 }
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user) {
      return NextResponse.json(
        createAuthError('Usuário não encontrado'),
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        createAuthError('Usuário desativado'),
        { status: 403 }
      );
    }

    // Retornar dados do usuário
    return NextResponse.json(createAuthSuccess(user as User));

  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return NextResponse.json(
      createAuthError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

// Método PUT para atualizar dados do usuário
export async function PUT(request: NextRequest) {
  try {
    // Obter token da requisição
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        createAuthError('Token de autenticação não fornecido'),
        { status: 401 }
      );
    }

    // Verificar e decodificar token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        createAuthError('Token inválido ou expirado'),
        { status: 401 }
      );
    }

    // Obter dados do body
    const body = await request.json();
    const { name, email } = body;

    // Validações
    if (!name || !email) {
      return NextResponse.json(
        createAuthError('Nome e email são obrigatórios'),
        { status: 400 }
      );
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== decoded.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser && existingUser.id !== decoded.userId) {
        return NextResponse.json(
          createAuthError('Email já está em uso'),
          { status: 400 }
        );
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        updatedAt: new Date(),
      },
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
    // try {
      // await prisma.activityLog.create({
        // data: {
          // userId: decoded.userId,
          // action: 'UPDATE_PROFILE',
          // entityType: 'User',
          // entityId: decoded.userId,
          // details: JSON.stringify({
          //   oldEmail: decoded.email,
          //   newEmail: email,
          //   name: name,
          // }),
          // ipAddress: request.headers.get('x-forwarded-for') || 
          //            request.headers.get('x-real-ip') || 
          //            'unknown',
          // userAgent: request.headers.get('user-agent'),
        // },
      // });
    // } catch (logError) {
    //   console.error('Erro ao registrar log de atualização:', logError);
    // }

    return NextResponse.json(createAuthSuccess(updatedUser as User));

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      createAuthError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

// Método DELETE para deletar conta (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    // Obter token da requisição
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        createAuthError('Token de autenticação não fornecido'),
        { status: 401 }
      );
    }

    // Verificar e decodificar token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        createAuthError('Token inválido ou expirado'),
        { status: 401 }
      );
    }

    // Obter dados do body
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        createAuthError('Senha é obrigatória para deletar a conta'),
        { status: 400 }
      );
    }

    // Buscar usuário para verificar senha
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        createAuthError('Usuário não encontrado'),
        { status: 404 }
      );
    }

    // Verificar senha
    const { verifyPassword } = await import('@/lib/auth');
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        createAuthError('Senha incorreta'),
        { status: 401 }
      );
    }

    // Desativar usuário (soft delete)
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // try {
      // await prisma.activityLog.create({
        // data: {
          // userId: decoded.userId,
          // action: 'DELETE_ACCOUNT',
          // entityType: 'User',
          // entityId: decoded.userId,
          // details: JSON.stringify({
          //   email: user.email,
          //   name: user.name,
          // }),
          // ipAddress: request.headers.get('x-forwarded-for') || 
          //            request.headers.get('x-real-ip') || 
          //            'unknown',
          // userAgent: request.headers.get('user-agent'),
        // },
      // });
    // } catch (logError) {
    //   console.error('Erro ao registrar log de exclusão:', logError);
    // }

    // Criar resposta e remover cookies
    const response = NextResponse.json({
      success: true,
      message: 'Conta deletada com sucesso',
    });

    response.cookies.delete('token');
    response.cookies.delete('refreshToken');

    return response;

  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    return NextResponse.json(
      createAuthError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}
