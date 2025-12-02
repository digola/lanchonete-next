import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';
import { 
  hashPassword, 
  generateTokenPair, 
  isValidEmail,
  isValidPassword,
  isValidName,
  createAuthError,
  createAuthSuccess,
  COOKIE_CONFIG,
  REFRESH_COOKIE_CONFIG
} from '@/lib/auth';
import { User } from '@/types';
import { RegisterData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json();
    const { name, email, password, confirmPassword } = body;

    // Validações básicas
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        createAuthError('Todos os campos são obrigatórios'),
        { status: 400 }
      );
    }

    // Validar nome
    const nameValidation = isValidName(name);
    if (!nameValidation.isValid) {
      return NextResponse.json(
        createAuthError(nameValidation.errors.join(', ')),
        { status: 400 }
      );
    }

    // Validar email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        createAuthError('Email inválido'),
        { status: 400 }
      );
    }

    // Validar senha
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        createAuthError(passwordValidation.errors.join(', ')),
        { status: 400 }
      );
    }

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      return NextResponse.json(
        createAuthError('As senhas não coincidem'),
        { status: 400 }
      );
    }

    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        createAuthError('Email já está em uso'),
        { status: 400 }
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
        role: 'CUSTOMER', // Role padrão para novos usuários (inglês)
        isActive: true,
      },
    });

    // Gerar tokens
    const tokens = generateTokenPair(user as User);

    // Criar resposta
    const response = NextResponse.json(
      createAuthSuccess(user as User, tokens),
      { status: 201 }
    );

    // Definir cookies
    response.cookies.set('token', tokens.accessToken, COOKIE_CONFIG);
    response.cookies.set('refreshToken', tokens.refreshToken, REFRESH_COOKIE_CONFIG);

    // Log da atividade (comentado para SQLite - modelo activityLog não existe)
    // try {
    //   await prisma.activityLog.create({
        // data: {
        //   userId: user.id,
        //   action: 'REGISTER',
        //   entityType: 'User',
        //   entityId: user.id,
        //   details: JSON.stringify({
        //     email: user.email,
        //     name: user.name,
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
    //   console.error('Erro ao registrar log de registro:', logError);
    //   // Não falhar o registro por causa do log
    // }

    return response;

  } catch (error) {
    console.error('Erro no registro:', error);
    
    // Verificar se é erro de duplicação de email
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        createAuthError('Email já está em uso'),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createAuthError('Erro interno do servidor'),
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está funcionando
export async function GET() {
  return NextResponse.json({
    message: 'Register endpoint is working',
    method: 'POST',
    requiredFields: ['name', 'email', 'password', 'confirmPassword'],
    defaultRole: 'CUSTOMER',
  });
}
