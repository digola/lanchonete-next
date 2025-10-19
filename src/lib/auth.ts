import { NextRequest } from 'next/server';
import { UserRole } from '@/types';
import * as jose from 'jose';

// Interfaces para tokens
export interface JWTPayload extends jose.JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Função para gerar JWT usando jose
export async function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
  
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
    
  return jwt;
}

// Função para verificar JWT usando jose
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Função para extrair token do request
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Tentar pegar do cookie
  const tokenCookie = request.cookies.get('token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

// Versão compatível com Edge Runtime para middleware
export const verifyTokenEdge = (token: string): JWTPayload | null => {
  try {
    if (!token) {
      return null;
    }

    // Verificar se o token tem o formato correto (Bearer token)
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    if (!cleanToken || cleanToken.trim() === '') {
      return null;
    }

    // Decodificar o token manualmente (sem verificação de assinatura no Edge Runtime)
    const parts = cleanToken.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]!));
    
    // Verificar se o token não expirou
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Extrair token do header Authorization
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

// Middleware para extrair token da requisição
export const getTokenFromRequest = (request: NextRequest): string | null => {
  // Tentar obter do header Authorization
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (token) return token;
  
  // Tentar obter dos cookies
  const cookieToken = request.cookies.get('token')?.value;
  return cookieToken || null;
};

// Verificar se o usuário tem permissão específica
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const ROLE_PERMISSIONS = {
    [UserRole.CUSTOMER]: [
      'menu:read',
      'orders:read',
      'orders:create',
      'orders:update',
      'profile:read',
      'profile:write',
      'cart:read',
      'cart:write',
      'cart:delete',
    ],
    [UserRole.CLIENTE]: [
      'menu:read',
      'orders:read',
      'orders:create',
      'orders:update',
      'profile:read',
      'profile:write',
      'cart:read',
      'cart:write',
      'cart:delete',
    ],
    [UserRole.STAFF]: [
      'menu:read',
      'orders:read',
      'orders:create',
      'orders:update',
      'orders:write',
      'products:read',
      'profile:read',
      'profile:write',
      'tables:read',
      'tables:write',
    ],
    [UserRole.MANAGER]: [
      'menu:read',
      'orders:read',
      'orders:create',
      'orders:update',
      'orders:write',
      'products:read',
      'profile:read',
      'profile:write',
      'tables:read',
      'tables:write',
      'reports:read',
    ],
    [UserRole.ADMIN]: [
      'users:read',
      'users:write',
      'users:delete',
      'products:read',
      'products:write',
      'products:delete',
      'categories:read',
      'categories:write',
      'categories:delete',
      'orders:read',
      'orders:write',
      'orders:delete',
      'orders:create',
      'reports:read',
      'settings:read',
      'settings:write',
      'menu:read',
      'menu:write',
      'menu:delete',
      'profile:read',
      'profile:write',
      'tables:read',
      'tables:write',
      'tables:manage',
    ],
    [UserRole.ADMINISTRADOR]: [
      'users:read',
      'users:write',
      'users:delete',
      'products:read',
      'products:write',
      'products:delete',
      'categories:read',
      'categories:write',
      'categories:delete',
      'orders:read',
      'orders:write',
      'orders:delete',
      'orders:create',
      'reports:read',
      'settings:read',
      'settings:write',
      'menu:read',
      'menu:write',
      'menu:delete',
      'profile:read',
      'profile:write',
      'tables:read',
      'tables:write',
      'tables:manage',
    ],
    [UserRole.ADMINISTRADOR_LOWER]: [
      'users:read',
      'users:write',
      'users:delete',
      'products:read',
      'products:write',
      'products:delete',
      'categories:read',
      'categories:write',
      'categories:delete',
      'orders:read',
      'orders:write',
      'orders:delete',
      'orders:create',
      'reports:read',
      'settings:read',
      'settings:write',
      'menu:read',
      'menu:write',
      'menu:delete',
      'profile:read',
      'profile:write',
      'tables:read',
      'tables:write',
      'tables:manage',
    ],
    [UserRole.ADMINISTRADOR_TITLE]: [
      'users:read',
      'users:write',
      'users:delete',
      'products:read',
      'products:write',
      'products:delete',
      'categories:read',
      'categories:write',
      'categories:delete',
      'orders:read',
      'orders:write',
      'orders:delete',
      'orders:create',
      'reports:read',
      'settings:read',
      'settings:write',
      'menu:read',
      'menu:write',
      'menu:delete',
      'profile:read',
      'profile:write',
      'tables:read',
      'tables:write',
      'tables:manage',
    ],
  };

  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// Verificar se o usuário tem role específico
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.CUSTOMER]: 1,
    [UserRole.CLIENTE]: 1,
    [UserRole.STAFF]: 2,
    [UserRole.MANAGER]: 3,
    [UserRole.ADMIN]: 4,
    [UserRole.ADMINISTRADOR]: 4,
    [UserRole.ADMINISTRADOR_LOWER]: 4,
    [UserRole.ADMINISTRADOR_TITLE]: 4,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Verificar se o usuário tem role mínimo
export const hasMinimumRole = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return hasRole(userRole, minimumRole);
};

// Validar email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar senha
export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('A senha deve ter pelo menos 6 caracteres');
  }
  
  if (password.length > 128) {
    errors.push('A senha deve ter no máximo 128 caracteres');
  }
  
  // Pelo menos uma letra
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra');
  }
  
  // Pelo menos um número
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validar nome
export const isValidName = (name: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (name.trim().length < 2) {
    errors.push('O nome deve ter pelo menos 2 caracteres');
  }
  
  if (name.trim().length > 100) {
    errors.push('O nome deve ter no máximo 100 caracteres');
  }
  
  // Apenas letras, espaços, hífens e acentos
  if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(name.trim())) {
    errors.push('O nome deve conter apenas letras, espaços, hífens e acentos');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Função para criar resposta de erro de autenticação
export const createAuthError = (message: string, code: string = 'AUTH_ERROR') => {
  return {
    success: false,
    error: message,
    code,
  };
};

// Função para criar resposta de sucesso com dados do usuário
export const createAuthSuccess = (user: any, tokens?: any) => {
  return {
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
      ...(tokens && { tokens }),
    },
  };
};

// Configurações de cookies
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
};

export const REFRESH_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
};
