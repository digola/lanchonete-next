import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { User, UserRole } from '@/types';

// Configurações JWT
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// Helper para garantir que o secret seja uma string
const getJWTSecret = (): string => {
  if (typeof JWT_SECRET !== 'string') {
    throw new Error('JWT_SECRET must be a string');
  }
  return JWT_SECRET;
};

// Interfaces para tokens
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Funções de hash de senha
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Funções JWT
export const generateAccessToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // @ts-ignore - JWT types are complex, but this works correctly
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'lanchonete-system',
    audience: 'lanchonete-client',
  });
};

export const generateRefreshToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // @ts-ignore - JWT types are complex, but this works correctly
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'lanchonete-system',
    audience: 'lanchonete-refresh',
  });
};

export const generateTokenPair = (user: User): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    // Validar se o token existe e não está vazio
    if (!token || token.trim() === '') {
      console.error('Token is empty or null');
      return null;
    }

    // Verificar se o token tem o formato correto (Bearer token)
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    if (!cleanToken || cleanToken.trim() === '') {
      console.error('Token is empty after Bearer removal');
      return null;
    }

    const decoded = jwt.verify(cleanToken, getJWTSecret()) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const refreshAccessToken = (refreshToken: string): string | null => {
  try {
    const decoded = jwt.verify(refreshToken, getJWTSecret()) as JWTPayload;
    
    // Criar novo access token com os dados do refresh token
    const newPayload: JWTPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // @ts-ignore - JWT types are complex, but this works correctly
    return jwt.sign(newPayload, getJWTSecret(), {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'lanchonete-system',
      audience: 'lanchonete-client',
    });
  } catch (error) {
    console.error('Refresh token verification failed:', error);
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
    [UserRole.FUNCIONARIO]: [
      'menu:read',
      'orders:read',
      'orders:update',
      'orders:write',
      'products:read',
      'profile:read',
      'profile:write',
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
      'reports:read',
      'settings:read',
      'settings:write',
      'menu:read',
      'menu:write',
      'menu:delete',
      'profile:read',
      'profile:write',
    ],
  };

  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

// Verificar se o usuário tem role específico
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.CLIENTE]: 1,
    [UserRole.FUNCIONARIO]: 2,
    [UserRole.ADMINISTRADOR]: 3,
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
export const createAuthSuccess = (user: User, tokens?: TokenPair) => {
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
