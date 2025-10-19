import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, generateTokenPair } from '@/lib/auth-server';
import { UserRole } from '@/types';
import { isValidEmail, isValidPassword, isValidName } from '@/lib/auth-server';
import {
  createAuthError,
  createAuthSuccess,
  COOKIE_CONFIG,
  REFRESH_COOKIE_CONFIG
} from '@/lib/auth';

const prisma = new PrismaClient();
export const runtime = 'nodejs';
import { User } from '@/types';
import { RegisterData } from '@/types';
import { createLogger, getOrCreateRequestId, withRequestIdHeader } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const log = createLogger('api.auth.register', requestId);
  const json = (payload: any, status: number) => {
    const res = NextResponse.json(payload, { status });
    return withRequestIdHeader(res, requestId);
  };
  try {
    const body: RegisterData = await request.json();
    const { name, email, password, confirmPassword } = body;

    // Validações básicas
    if (!name || !email || !password || !confirmPassword) {
      return json(
        createAuthError('Todos os campos são obrigatórios'),
        400
      );
    }

    // Validar nome
    const nameValidation = isValidName(name);
    if (!nameValidation.isValid) {
      return json(
        createAuthError(nameValidation.errors.join(', ')),
        400
      );
    }

    // Validar email
    if (!isValidEmail(email)) {
      return json(
        createAuthError('Email inválido'),
        400
      );
    }

    // Validar senha
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
      return json(
        createAuthError(passwordValidation.errors.join(', ')),
        400
      );
    }

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      return json(
        createAuthError('As senhas não coincidem'),
        400
      );
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return json(
        createAuthError('Email já está em uso'),
        400
      );
    }

    // Hash da senha
    const hashedPassword = await hashPassword(password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'CLIENTE', // Role padrão para novos usuários
        isActive: true,
      },
    });

    // Gerar tokens
    const tokens = await generateTokenPair(user as User);

    // Criar resposta
    const response = json(
      createAuthSuccess(user as User, tokens),
      201
    );

    // Definir cookies
    response.cookies.set('token', tokens.accessToken, COOKIE_CONFIG);
    response.cookies.set('refreshToken', tokens.refreshToken, REFRESH_COOKIE_CONFIG);

    log.info('Register success', { userId: (user as User).id });
    return response;

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Register failed', { error: msg });
    
    // Verificar se é erro de duplicação de email
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return json(
        createAuthError('Email já está em uso'),
        400
      );
    }

    return json(
      createAuthError('Erro interno do servidor'),
      500
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET(request: NextRequest) {
  const requestId = getOrCreateRequestId(request);
  const res = NextResponse.json({
    message: 'Register endpoint is working',
    method: 'POST',
    requiredFields: ['name', 'email', 'password', 'confirmPassword'],
    defaultRole: 'CLIENTE',
  });
  return withRequestIdHeader(res, requestId);
}
