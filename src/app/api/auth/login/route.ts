import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  verifyPassword, 
  generateTokenPair, 
  isValidEmail,
  createAuthError,
  createAuthSuccess,
  COOKIE_CONFIG,
  REFRESH_COOKIE_CONFIG
} from '@/lib/auth';
import { User } from '@/types';
import { LoginCredentials } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        createAuthError('Email e senha são obrigatórios'),
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        createAuthError('Email inválido'),
        { status: 400 }
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        createAuthError('Credenciais inválidas'),
        { status: 401 }
      );
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      return NextResponse.json(
        createAuthError('Usuário desativado. Entre em contato com o administrador'),
        { status: 403 }
      );
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        createAuthError('Credenciais inválidas'),
        { status: 401 }
      );
    }

    // Gerar tokens
    const tokens = generateTokenPair(user as User);

    // Criar resposta
    const response = NextResponse.json(
      createAuthSuccess(user as User, tokens),
      { status: 200 }
    );

    // Definir cookies
    response.cookies.set('token', tokens.accessToken, COOKIE_CONFIG);
    response.cookies.set('refreshToken', tokens.refreshToken, REFRESH_COOKIE_CONFIG);

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // try {
    //   await prisma.activityLog.create({
    //     data: {
    //       userId: user.id,
    //       action: 'LOGIN',
    //       entityType: 'User',
    //       entityId: user.id,
    //       details: JSON.stringify({
    //         email: user.email,
    //         role: user.role,
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
    //   console.error('Erro ao registrar log de login:', logError);
    //   // Não falhar o login por causa do log
    // }

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      createAuthError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Login endpoint is working',
    method: 'POST',
    requiredFields: ['email', 'password'],
  });
}
