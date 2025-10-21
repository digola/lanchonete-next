import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateTokenPair, isValidEmail } from '@/lib/auth-server';
import {
  createAuthError,
  createAuthSuccess,
  COOKIE_CONFIG,
  REFRESH_COOKIE_CONFIG
} from '@/lib/auth';
export const runtime = 'nodejs';
import { User } from '@/types';
import { LoginCredentials } from '@/types';
import { z } from 'zod';
import { createLogger, getOrCreateRequestId, withRequestIdHeader } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const requestId = getOrCreateRequestId(request);
    const log = createLogger('api.auth.login', requestId);
    const json = (payload: any, status: number) => {
      const res = NextResponse.json(payload, { status });
      return withRequestIdHeader(res, requestId);
    };

    const contentType = request.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json')) {
      log.warn('Unsupported media type', { contentType });
      return json(
        createAuthError('Content-Type inválido: use application/json', 'UNSUPPORTED_MEDIA_TYPE'),
        415
      );
    }

    let bodyRaw: unknown;
    try {
      bodyRaw = await request.json();
    } catch (e) {
      log.warn('Invalid JSON body');
      return json(
        createAuthError('JSON inválido no corpo da requisição', 'INVALID_JSON'),
        400
      );
    }

    const loginSchema = z.object({
      email: z.string({ required_error: 'Email é obrigatório' }).email('Email inválido'),
      password: z.string({ required_error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
    });

    const parsed = loginSchema.safeParse(bodyRaw);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message);
      log.warn('Validation error', { messages });
      return json(
        createAuthError(messages.join('; '), 'VALIDATION_ERROR'),
        400
      );
    }

    const { email, password } = parsed.data as LoginCredentials;
    log.info('Login attempt', { email });

    // Validações básicas
    if (!email || !password) {
      return json(
        createAuthError('Email e senha são obrigatórios'),
        400
      );
    }

    if (!isValidEmail(email)) {
      return json(
        createAuthError('Email inválido'),
        400
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      log.warn('Invalid credentials (user not found)', { email });
      return json(
        createAuthError('Credenciais inválidas'),
        401
      );
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      log.warn('Inactive user login attempt', { userId: user.id });
      return json(
        createAuthError('Usuário desativado. Entre em contato com o administrador'),
        403
      );
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      log.warn('Invalid credentials (wrong password)', { userId: user.id });
      return json(
        createAuthError('Credenciais inválidas'),
        401
      );
    }

    // Gerar tokens
    const tokens = await generateTokenPair(user as User);

    // Criar resposta
    const response = json(
      createAuthSuccess(user as User, tokens),
      200
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

    log.info('Login success', { userId: (user as User).id });
    return response;

  } catch (error) {
    const requestId = getOrCreateRequestId(request);
    const log = createLogger('api.auth.login', requestId);
    log.error('Unhandled error', { error: error instanceof Error ? error.message : String(error) });
    const res = NextResponse.json(
      createAuthError('Erro interno do servidor'),
      { status: 500 }
    );
    return withRequestIdHeader(res, requestId);
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const res = NextResponse.json({
    message: 'Login endpoint is working',
    method: 'POST',
    requiredFields: ['email', 'password'],
  });
  return withRequestIdHeader(res, requestId);
}
