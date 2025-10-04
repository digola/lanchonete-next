import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, UserRole, LoginCredentials, RegisterData, UpdateProfileData, ChangePasswordData } from '@/types';

// Interfaces para o store
interface AuthState {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  refreshToken: string | null;
}

interface AuthActions {
  // Ações principais
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<{ success: boolean; error?: string }>;
  
  // Ações de perfil
  updateProfile: (userData: UpdateProfileData) => Promise<{ success: boolean; error?: string }>;
  changePassword: (passwordData: ChangePasswordData) => Promise<{ success: boolean; error?: string }>;
  
  // Ações de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Verificações
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasMinimumRole: (minimumRole: UserRole) => boolean;
  
  // Utilitários
  initializeAuth: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Configuração das permissões por role
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
    'orders:update',
    'orders:write',
    'products:read',
    'profile:read',
    'profile:write',
    'tables:read',
    'tables:write',
    'tables:manage',
    'expedition:read',
    'expedition:write',
    'expedition:manage',
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
    'reports:read',
    'settings:read',
    'settings:write',
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

// Cache para debounce de requisições
const requestCache = new Map<string, Promise<any>>();

// Função para fazer requisições à API com debounce
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Se já existe uma requisição em andamento, aguardar ela
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }
  
  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      return data;
    } finally {
      // Remover da cache após completar
      requestCache.delete(cacheKey);
    }
  })();
  
  requestCache.set(cacheKey, requestPromise);
  return requestPromise;
};

// Função para obter token do localStorage
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('auth-token');
    // Verificar se o token não está corrompido
    if (token && token.trim() !== '' && !token.includes('undefined') && !token.includes('null')) {
      return token;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao acessar localStorage:', error);
    return null;
  }
};

// Função para salvar token no localStorage
const setStoredToken = (token: string | null): void => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('auth-token', token);
  } else {
    localStorage.removeItem('auth-token');
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      refreshToken: null,

      // Ações principais
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          });

          if (data.success && data.data) {
            const { user, tokens } = data.data;
            
            set({
              user,
              isAuthenticated: true,
              token: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isLoading: false,
              error: null,
            });

            // Salvar token no localStorage
            setStoredToken(tokens.accessToken);

            return { success: true };
          } else {
            throw new Error(data.error || 'Erro no login');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro no login';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const data = await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
          });

          if (data.success && data.data) {
            const { user, tokens } = data.data;
            
            set({
              user,
              isAuthenticated: true,
              token: tokens.accessToken,
              refreshToken: tokens.refreshToken,
              isLoading: false,
              error: null,
            });

            // Salvar token no localStorage
            setStoredToken(tokens.accessToken);

            return { success: true };
          } else {
            throw new Error(data.error || 'Erro no registro');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro no registro';
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
          error: null,
        });

        // Remover token do localStorage
        setStoredToken(null);

        // Limpar carrinho do localStorage
        try {
          localStorage.removeItem('lanchonete-cart-v2');
          console.log('Carrinho limpo no logout');
        } catch (error) {
          console.error('Erro ao limpar carrinho no logout:', error);
        }

        // Fazer logout na API (opcional, não bloquear se falhar)
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {
          // Ignorar erros no logout da API
        });
      },

      refreshAuth: async () => {
        try {
          const data = await apiRequest('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Para incluir cookies
          });

          if (data.success && data.data) {
            const { user, tokens } = data.data;
            
            set({
              user,
              isAuthenticated: true,
              token: tokens.accessToken,
              refreshToken: tokens.refreshToken,
            });

            // Salvar novo token no localStorage
            setStoredToken(tokens.accessToken);

            return { success: true };
          } else {
            throw new Error(data.error || 'Erro ao renovar token');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao renovar token';
          set({ 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
          });
          
          // Remover token do localStorage se falhou
          setStoredToken(null);
          
          return { success: false, error: errorMessage };
        }
      },

      // Ações de perfil
      updateProfile: async (userData: UpdateProfileData) => {
        set({ isLoading: true, error: null });
        
        try {
          const token = get().token;
          if (!token) {
            throw new Error('Token não encontrado');
          }

          const data = await apiRequest('/api/auth/me', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          });

          if (data.success && data.data) {
            set({
              user: data.data.user,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            throw new Error(data.error || 'Erro ao atualizar perfil');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
          set({ 
            isLoading: false, 
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      changePassword: async (passwordData: ChangePasswordData) => {
        set({ isLoading: true, error: null });
        
        try {
          const token = get().token;
          if (!token) {
            throw new Error('Token não encontrado');
          }

          const data = await apiRequest('/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(passwordData),
          });

          if (data.success) {
            set({
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            throw new Error(data.error || 'Erro ao alterar senha');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao alterar senha';
          set({ 
            isLoading: false, 
            error: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Ações de estado
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Verificações
      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
      },

      hasRole: (role: UserRole) => {
        const { user } = get();
        if (!user) return false;
        return user.role === role;
      },

      hasMinimumRole: (minimumRole: UserRole) => {
        const { user } = get();
        if (!user) return false;
        
        const roleHierarchy = {
          [UserRole.CUSTOMER]: 1,
          [UserRole.STAFF]: 2,
          [UserRole.MANAGER]: 3,
          [UserRole.ADMIN]: 4,
          [UserRole.ADMINISTRADOR]: 5,
        };

        return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
      },

      // Utilitários
      initializeAuth: async () => {
        const storedToken = getStoredToken();
        if (storedToken) {
          set({ token: storedToken });
          await get().checkAuthStatus();
        }
      },

      checkAuthStatus: async () => {
        const { token } = get();
        if (!token) return;

        // Cache para evitar consultas repetitivas
        const cacheKey = `auth-check-${token}`;
        const cached = sessionStorage.getItem(cacheKey);
        const now = Date.now();
        
        if (cached) {
          const { timestamp, user } = JSON.parse(cached);
          // Se o cache é válido por menos de 2 minutos, usar cache
          if (now - timestamp < 120000) {
            set({
              user,
              isAuthenticated: true,
            });
            return;
          }
        }

        try {
          const data = await apiRequest('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (data.success && data.data) {
            const user = data.data.user;
            set({
              user,
              isAuthenticated: true,
            });
            
            // Cachear resultado por 2 minutos
            sessionStorage.setItem(cacheKey, JSON.stringify({
              timestamp: now,
              user
            }));
          } else {
            // Token inválido, tentar refresh
            await get().refreshAuth();
          }
        } catch (error) {
          // Token inválido, tentar refresh
          await get().refreshAuth();
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
