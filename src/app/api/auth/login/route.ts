import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
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
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      return NextResponse.json(
        createAuthError('Content-Type inválido: use application/json', 'UNSUPPORTED_MEDIA_TYPE'),
        { status: 415 }
      );
    }

    let bodyRaw: unknown;
    try {
      bodyRaw = await request.json();
    } catch (e) {
      return NextResponse.json(
        createAuthError('JSON inválido no corpo da requisição', 'INVALID_JSON'),
        { status: 400 }
      );
    }

    const loginSchema = z.object({
      email: z.string({ required_error: 'Email é obrigatório' }).email('Email inválido'),
      password: z.string({ required_error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
    });

    const parsed = loginSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message);
      return NextResponse.json(
        createAuthError(messages.join('; '), 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    const { email, password } = parsed.data as LoginCredentials;

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
