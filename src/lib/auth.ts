import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { User, UserRole } from '@/types';

/**
 * Configurações padrão para geração de tokens JWT.
 * Pode ser sobrescrito via variáveis de ambiente em produção.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Garante que o segredo JWT seja uma string válida.
 * Lança erro se o valor não for uma string.
 */
const getJWTSecret = (): string => {
  if (typeof JWT_SECRET !== 'string') {
    throw new Error('JWT_SECRET must be a string');
  }
  return JWT_SECRET;
};

// Interfaces para tokens
/**
 * Payload transportado pelos tokens JWT utilizados no sistema.
 * iat/exp podem estar presentes conforme o JWT gerado.
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Par de tokens emitidos no login: access e refresh.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Normaliza qualquer valor de role (string solta ou enum) para o enum oficial.
 * Útil para garantir consistência ao verificar permissões ou hierarquia.
 */
export const normalizeRole = (role: string | UserRole): UserRole => {
  const value = String(role).toUpperCase();
  switch (value) {
    
    case 'STAFF':
      return UserRole.STAFF;
    case 'CUSTOMER':
      return UserRole.CUSTOMER;
    case 'MANAGER':
      return UserRole.MANAGER;
    case 'ADMIN':
      return UserRole.ADMIN;
    default:
      return UserRole.CUSTOMER;
  }
};

/**
 * Gera o hash da senha utilizando bcrypt.
 *
 * @param password Senha em texto claro.
 * @returns Hash da senha.
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compara uma senha em texto claro com o hash armazenado.
 *
 * @param password Senha fornecida pelo usuário.
 * @param hashedPassword Hash previamente armazenado.
 * @returns true se a senha corresponde ao hash, caso contrário false.
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Gera um access token JWT com curta duração para chamadas da aplicação.
 *
 * @param user Usuário autenticado.
 * @returns Token JWT assinado.
 */
export const generateAccessToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: normalizeRole(user.role),
  };

  // @ts-ignore - JWT types are complex, but this works correctly
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'lanchonete-system',
    audience: 'lanchonete-client',
  });
};

/**
 * Gera um refresh token JWT com duração maior, usado para renovar o access token.
 *
 * @param user Usuário autenticado.
 * @returns Token JWT assinado para refresh.
 */
export const generateRefreshToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: normalizeRole(user.role),
  };

  // @ts-ignore - JWT types are complex, but this works correctly
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'lanchonete-system',
    audience: 'lanchonete-refresh',
  });
};

/**
 * Gera o par de tokens (access + refresh) para o usuário informado.
 *
 * @param user Usuário autenticado.
 * @returns Par de tokens.
 */
export const generateTokenPair = (user: User): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
};

/**
 * Verifica e decodifica um token JWT (formato Bearer também é aceito).
 * Retorna o payload válido ou null em caso de erro/expiração.
 *
 * @param token Token em formato puro ou com prefixo "Bearer ".
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    // Validar se o token existe e não está vazio
    if (!token || token.trim() === '') {
      return null;
    }

    // Verificar se o token tem o formato correto (Bearer token)
    const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    if (!cleanToken || cleanToken.trim() === '') {
      return null;
    }

    // Verificar se o token tem o formato JWT básico (3 partes separadas por pontos)
    const tokenParts = cleanToken.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Token malformado - formato JWT inválido');
      return null;
    }

    // Verificar se cada parte do JWT não está vazia
    if (tokenParts.some(part => !part || part.trim() === '')) {
      console.error('❌ Token malformado - partes vazias');
      return null;
    }

    const decoded = jwt.verify(cleanToken, getJWTSecret()) as JWTPayload;
    return decoded;
  } catch (error) {
    // Log mais específico do erro
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('❌ Token JWT inválido:', error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.error('❌ Token expirado');
    } else if (error instanceof jwt.NotBeforeError) {
      console.error('❌ Token não ativo ainda');
    } else {
      console.error('❌ Erro na verificação do token:', error);
    }
    return null;
  }
};

/**
 * Verificação de token compatível com Edge Runtime (sem assinatura),
 * decodificando o payload manualmente e validando expiração.
 *
 * @param token Token em formato puro ou com prefixo "Bearer ".
 */
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
    let payload: any = null;
    try {
      const base64 = parts[1]!;
      // Corrigir base64url para base64
      const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = typeof atob === 'function' ? atob(normalized) : Buffer.from(normalized, 'base64').toString('utf8');
      payload = JSON.parse(decoded);
    } catch (err) {
      console.error('Falha ao decodificar payload do JWT (edge):', err);
      return null;
    }
    
    // Verificar se o token não expirou
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    // Validação básica de estrutura
    const hasRequired = payload && typeof payload.userId === 'string' && typeof payload.email === 'string' && payload.role != null;
    if (!hasRequired) {
      return null;
    }
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Cria um novo access token a partir de um refresh token válido.
 * Retorna null se o refresh token for inválido ou expirar.
 *
 * @param refreshToken Token de atualização.
 */
export const refreshAccessToken = (refreshToken: string): string | null => {
  try {
    const decoded = jwt.verify(refreshToken, getJWTSecret()) as JWTPayload;
    
    // Criar novo access token com os dados do refresh token
    const newPayload: JWTPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: normalizeRole(decoded.role),
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

/**
 * Extrai somente o token do cabeçalho Authorization (formato "Bearer token").
 * Retorna null se não estiver no formato esperado.
 *
 * @param authHeader Valor do header Authorization.
 */
export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

/**
 * Obtém o token JWT de uma requisição Next.js.
 * Prioriza Authorization header; na ausência, tenta cookies.
 *
 * @param request Objeto de requisição do Next.js.
 */
export const getTokenFromRequest = (request: NextRequest): string | null => {
  // Tentar obter do header Authorization
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  
  if (token) return token;
  
  // Tentar obter dos cookies
  const cookieToken = request.cookies.get('token')?.value;
  return cookieToken || null;
};

/**
 * Verifica se uma role possui uma permissão específica.
 * A tabela de permissões por role está definida internamente.
 *
 * @param userRole Role do usuário.
 * @param permission Permissão alvo (ex.: 'orders:write').
 */
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
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
      // Permissões de carrinho para permitir finalizar pedidos via /cart
      'cart:read',
      'cart:write',
      'cart:delete',
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
  };

  const role = normalizeRole(userRole);
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
};

/**
 * Checa igualdade exata entre a role do usuário e a role requerida,
 * após normalização do valor.
 */
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return normalizeRole(userRole) === normalizeRole(requiredRole);
};

/**
 * Verifica se a role do usuário atende um nível mínimo na hierarquia.
 * A hierarquia segue: CUSTOMER < STAFF < MANAGER < ADMIN.
 */
export const hasMinimumRole = (userRole: UserRole, minimumRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.CUSTOMER]: 1,
    [UserRole.STAFF]: 2,
    [UserRole.MANAGER]: 3,
    [UserRole.ADMIN]: 4,
  } as const;

  const userRank = roleHierarchy[normalizeRole(userRole)];
  const requiredRank = roleHierarchy[normalizeRole(minimumRole)];
  return (userRank ?? 0) >= (requiredRank ?? 0);
};

/**
 * Valida formato básico de e-mail.
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida senha conforme regras simples (tamanho, letras e números).
 * Retorna lista de erros quando inválida.
 */
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

/**
 * Valida nome de usuário (tamanho e caracteres permitidos).
 */
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

/**
 * Helper para padronizar respostas de erro em fluxos de autenticação.
 */
export const createAuthError = (message: string, code: string = 'AUTH_ERROR') => {
  return {
    success: false,
    error: message,
    code,
  };
};

/**
 * Helper para padronizar respostas de sucesso em autenticação,
 * incluindo dados de usuário e, opcionalmente, tokens.
 */
export const createAuthSuccess = (user: User, tokens?: TokenPair) => {
  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role),
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      ...(tokens && { tokens }),
    },
  };
};

/**
 * Configuração sugerida para cookie de access token.
 * httpOnly e sameSite ajudam na segurança em produção.
 */
export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
};

/**
 * Configuração sugerida para cookie de refresh token.
 * Duração maior e mesmas flags de segurança.
 */
export const REFRESH_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
};
