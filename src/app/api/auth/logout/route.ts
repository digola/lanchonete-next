import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Obter token da requisição
    const token = getTokenFromRequest(request);
    
    if (token) {
      // Verificar token para obter informações do usuário
      const decoded = verifyToken(token);
      
      if (decoded) {
        // Log da atividade de logout (comentado para SQLite - modelo activityLog não existe)
        // try {
        //   await prisma.activityLog.create({
        //     data: {
        //       userId: decoded.userId,
        //       action: 'LOGOUT',
        //       entityType: 'User',
        //       entityId: decoded.userId,
        //       details: JSON.stringify({
        //         email: decoded.email,
        //         role: decoded.role,
        //         userAgent: request.headers.get('user-agent'),
        //         ipAddress: request.headers.get('x-forwarded-for') || 
        //                    request.headers.get('x-real-ip') || 
        //                    'unknown',
        //       }),
        //       ipAddress: request.headers.get('x-forwarded-for') || 
        //                  request.headers.get('x-real-ip') || 
        //                  'unknown',
        //       userAgent: request.headers.get('user-agent'),
        //     },
        //   });
        // } catch (logError) {
        //   console.error('Erro ao registrar log de logout:', logError);
        //   // Não falhar o logout por causa do log
        // }
      }
    }

    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    // Remover cookies
    response.cookies.delete('token');
    response.cookies.delete('refreshToken');

    return response;

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Logout endpoint is working',
    method: 'POST',
    description: 'Logs out the current user and clears cookies',
  });
}
