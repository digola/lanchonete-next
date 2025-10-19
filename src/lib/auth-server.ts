import * as jose from 'jose';
const bcrypt = require('bcryptjs');
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
export interface JWTPayload extends jose.JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
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

// Funções JWT usando jose
export const generateAccessToken = async (user: User): Promise<string> => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const secret = new TextEncoder().encode(getJWTSecret());
  
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
    
  return jwt;
};

export const generateRefreshToken = async (user: User): Promise<string> => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const secret = new TextEncoder().encode(getJWTSecret());
  
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_REFRESH_EXPIRES_IN)
    .sign(secret);
    
  return jwt;
};

export const generateTokenPair = async (user: User): Promise<TokenPair> => {
  return {
    accessToken: await generateAccessToken(user),
    refreshToken: await generateRefreshToken(user),
  };
};

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const secret = new TextEncoder().encode(getJWTSecret());
    const { payload } = await jose.jwtVerify(token, secret);
    
    const decoded = payload as JWTPayload;

    // Verificar se o payload tem os campos obrigatórios
    if (!decoded.userId || !decoded.email || !decoded.role) {
      console.warn('Token inválido: campos obrigatórios ausentes');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const decoded = await verifyToken(refreshToken);
    if (!decoded) return null;
    
    // Criar um novo access token
    const user: User = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      name: '', // Será preenchido pelo banco de dados se necessário
      isActive: true, // Assumir ativo para refresh token válido
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return await generateAccessToken(user);
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return null;
  }
};

export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

export const getTokenFromRequest = (request: NextRequest): string | null => {
  // Primeiro, tenta pegar do header Authorization
  const authHeader = request.headers.get('authorization');
  const headerToken = extractTokenFromHeader(authHeader);
  if (headerToken) return headerToken;
  
  // Se não encontrar no header, tenta pegar do cookie
  return request.cookies.get('token')?.value || null;
};

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const rolePermissions: Record<UserRole, string[]> = {
    [UserRole.CUSTOMER]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
    ],
    [UserRole.CLIENTE]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
    ],
    [UserRole.STAFF]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
      'view_all_orders',
      'update_order_status',
      'view_tables',
      'update_table_status',
      'view_inventory',
    ],
    [UserRole.MANAGER]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
      'view_all_orders',
      'update_order_status',
      'view_tables',
      'update_table_status',
      'view_inventory',
      'manage_products',
      'manage_categories',
      'manage_staff',
      'view_reports',
      'manage_inventory',
      'view_analytics',
    ],
    [UserRole.ADMIN]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
      'view_all_orders',
      'update_order_status',
      'view_tables',
      'update_table_status',
      'view_inventory',
      'manage_products',
      'manage_categories',
      'manage_staff',
      'view_reports',
      'manage_inventory',
      'view_analytics',
      'manage_users',
      'manage_roles',
      'manage_settings',
      'view_system_logs',
      'manage_system',
    ],
    [UserRole.ADMINISTRADOR]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
      'view_all_orders',
      'update_order_status',
      'view_tables',
      'update_table_status',
      'view_inventory',
      'manage_products',
      'manage_categories',
      'manage_staff',
      'view_reports',
      'manage_inventory',
      'view_analytics',
      'manage_users',
      'manage_roles',
      'manage_settings',
      'view_system_logs',
      'manage_system',
    ],
    [UserRole.ADMINISTRADOR_LOWER]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
      'view_all_orders',
      'update_order_status',
      'view_tables',
      'update_table_status',
      'view_inventory',
      'manage_products',
      'manage_categories',
      'manage_staff',
      'view_reports',
      'manage_inventory',
      'view_analytics',
      'manage_users',
      'manage_roles',
      'manage_settings',
      'view_system_logs',
      'manage_system',
    ],
    [UserRole.ADMINISTRADOR_TITLE]: [
      'view_menu',
      'place_order',
      'view_own_orders',
      'update_own_profile',
      'view_all_orders',
      'update_order_status',
      'view_tables',
      'update_table_status',
      'view_inventory',
      'manage_products',
      'manage_categories',
      'manage_staff',
      'view_reports',
      'manage_inventory',
      'view_analytics',
      'manage_users',
      'manage_roles',
      'manage_settings',
      'view_system_logs',
      'manage_system',
    ],
  };

  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return userRole === requiredRole;
};

// Hierarquia de roles para verificação de nível mínimo
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.CUSTOMER]: 1,
  [UserRole.CLIENTE]: 1,
  [UserRole.STAFF]: 2,
  [UserRole.MANAGER]: 3,
  [UserRole.ADMIN]: 4,
  [UserRole.ADMINISTRADOR]: 4,
  [UserRole.ADMINISTRADOR_LOWER]: 4,
  [UserRole.ADMINISTRADOR_TITLE]: 4,
};

export const hasMinimumRole = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('A senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const isValidName = (name: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('O nome é obrigatório');
  }
  
  if (name.trim().length < 2) {
    errors.push('O nome deve ter pelo menos 2 caracteres');
  }
  
  if (name.trim().length > 100) {
    errors.push('O nome deve ter no máximo 100 caracteres');
  }
  
  if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
    errors.push('O nome deve conter apenas letras e espaços');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const createAuthError = (message: string, code: string = 'AUTH_ERROR') => {
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
};

export const createAuthSuccess = (user: User, tokens?: TokenPair) => {
  const response: any = {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
  
  if (tokens) {
    response.tokens = tokens;
  }
  
  return response;
};

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