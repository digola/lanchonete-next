import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { 
  refreshAccessToken, 
  verifyToken, 
  createAuthError,
  createAuthSuccess,
  COOKIE_CONFIG,
  REFRESH_COOKIE_CONFIG
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Obter refresh token dos cookies
    const refreshToken = request.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        createAuthError('Refresh token não fornecido'),
        { status: 401 }
      );
    }

    // Verificar se o refresh token é válido
    const decoded = verifyToken(refreshToken);
    
    if (!decoded) {
      return NextResponse.json(
        createAuthError('Refresh token inválido ou expirado'),
        { status: 401 }
      );
    }

    // Verificar se o usuário ainda existe e está ativo
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

    // Gerar novo access token
    const newAccessToken = refreshAccessToken(refreshToken);
    
    if (!newAccessToken) {
      return NextResponse.json(
        createAuthError('Erro ao gerar novo token'),
        { status: 500 }
      );
    }

    // Criar resposta
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        tokens: {
          accessToken: newAccessToken,
          refreshToken: refreshToken, // Manter o mesmo refresh token
        },
      },
    });

    // Atualizar cookie do access token
    response.cookies.set('token', newAccessToken, COOKIE_CONFIG);

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // try {
    //   await prisma.activityLog.create({
        // data: {
        //   userId: user.id,
        //   action: 'REFRESH_TOKEN',
        //   entityType: 'User',
        //   entityId: user.id,
        //   details: JSON.stringify({
        //     email: user.email,
        //     role: user.role,
        //     userAgent: request.headers.get('user-agent'),
        //     ipAddress: request.headers.get('x-forwarded-for') || 
        //                request.headers.get('x-real-ip') || 
        //                'unknown',
        //   }),
        //   ipAddress: request.headers.get('x-forwarded-for') || 
        //              request.headers.get('x-real-ip') || 
        //              'unknown',
        //   userAgent: request.headers.get('user-agent'),
        // },
      // });
    // } catch (logError) {
    //   console.error('Erro ao registrar log de refresh:', logError);
    //   // Não falhar o refresh por causa do log
    // }

    return response;

  } catch (error) {
    console.error('Erro no refresh token:', error);
    return NextResponse.json(
      createAuthError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Refresh token endpoint is working',
    method: 'POST',
    description: 'Refreshes the access token using the refresh token from cookies',
  });
}
