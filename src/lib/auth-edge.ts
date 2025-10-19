import { NextRequest } from 'next/server';
import { UserRole } from '@/types';

// Interfaces para tokens
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Função para verificar token no Edge Runtime (sem jsonwebtoken)
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

// Função para extrair token do request
export const getTokenFromRequest = (request: NextRequest): string | null => {
  // Primeiro, tentar pegar do cookie
  const cookieToken = request.cookies.get('token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Se não encontrar no cookie, tentar no header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return null;
};

// Funções de verificação de permissões (compatíveis com Edge Runtime)
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
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

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const hasMinimumRole = (userRole: UserRole, minimumRole: UserRole): boolean => {
  return hasRole(userRole, minimumRole);
};