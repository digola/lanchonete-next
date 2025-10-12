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
    'orders:update',
    'orders:write',
    'products:read',
    'profile:read',
    'profile:write',
    'tables:read',
    'tables:write',
    'tables:manage',
    'reports:read',
  ],
  [UserRole.ADMIN]: [
    'menu:read',
    'orders:read',
    'orders:update',
    'orders:write',
    'products:read',
    'products:write',
    'profile:read',
    'profile:write',
    'tables:read',
    'tables:write',
    'tables:manage',
    'reports:read',
    'reports:write',
    'users:read',
    'users:write',
    'categories:read',
    'categories:write',
    'admin:all',
  ],
};

// Store simplificado para debug
export const useAuthStoreBackup = create<AuthStore>()(
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
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          const data = await response.json();

          if (data.success && data.data) {
            set({
              user: data.data.user,
              token: data.data.token,
              refreshToken: data.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({ error: data.error || 'Erro ao fazer login', isLoading: false });
            return { success: false, error: data.error || 'Erro ao fazer login' };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (data.success && data.data) {
            set({
              user: data.data.user,
              token: data.data.token,
              refreshToken: data.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return { success: true };
          } else {
            set({ error: data.error || 'Erro ao registrar', isLoading: false });
            return { success: false, error: data.error || 'Erro ao registrar' };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar';
          set({ error: errorMessage, isLoading: false });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      refreshAuth: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          const data = await response.json();

          if (data.success && data.data) {
            set({
              user: data.data.user,
              token: data.data.token,
              refreshToken: data.data.refreshToken,
              isAuthenticated: true,
            });
            return { success: true };
          } else {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            return { success: false, error: data.error || 'Erro ao renovar token' };
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return { success: false, error: 'Erro ao renovar token' };
        }
      },

      // Ações de perfil
      updateProfile: async (userData: UpdateProfileData) => {
        const token = get().token;
        if (!token) {
          return { success: false, error: 'Token não encontrado' };
        }

        try {
          const response = await fetch('/api/auth/me', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (data.success && data.data) {
            set({ user: data.data.user });
            return { success: true };
          } else {
            return { success: false, error: data.error || 'Erro ao atualizar perfil' };
          }
        } catch (error) {
          return { success: false, error: 'Erro ao atualizar perfil' };
        }
      },

      changePassword: async (passwordData: ChangePasswordData) => {
        const token = get().token;
        if (!token) {
          return { success: false, error: 'Token não encontrado' };
        }

        try {
          const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(passwordData),
          });

          const data = await response.json();

          if (data.success) {
            return { success: true };
          } else {
            return { success: false, error: data.error || 'Erro ao alterar senha' };
          }
        } catch (error) {
          return { success: false, error: 'Erro ao alterar senha' };
        }
      },

      // Ações de estado
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Verificações
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.includes(permission);
      },

      hasRole: (role: UserRole) => {
        const user = get().user;
        return user?.role === role;
      },

      hasMinimumRole: (minimumRole: UserRole) => {
        const user = get().user;
        if (!user) return false;
        
        const roleHierarchy = [UserRole.CUSTOMER, UserRole.STAFF, UserRole.MANAGER, UserRole.ADMIN];
        const userRoleIndex = roleHierarchy.indexOf(user.role);
        const minimumRoleIndex = roleHierarchy.indexOf(minimumRole);
        
        return userRoleIndex >= minimumRoleIndex;
      },

      // Utilitários
      initializeAuth: async () => {
        const token = get().token;
        if (!token) return;
        
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.success && data.data) {
            set({
              user: data.data.user,
              isAuthenticated: true,
            });
          } else {
            set({
              user: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
        }
      },

      checkAuthStatus: async () => {
        const token = get().token;
        if (!token) return;
        
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.success && data.data) {
            set({
              user: data.data.user,
              isAuthenticated: true,
            });
          } else {
            await get().refreshAuth();
          }
        } catch (error) {
          await get().refreshAuth();
        }
      },
    }),
    {
      name: 'auth-storage-backup',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
