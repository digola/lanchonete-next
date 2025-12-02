import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

/**
 * useApiAuth
 *
 * Hook personalizado para autenticação que encapsula a AuthStore e expõe:
 *  - Estado: user, isAuthenticated, isLoading, error, token
 *  - Ações principais: login, register, logout, refreshAuth
 *  - Ações de perfil: updateProfile, changePassword
 *  - Ações de estado: setLoading, setError, clearError
 *  - Verificações: hasPermission, hasRole, hasMinimumRole
 *  - Utilitários: initializeAuth, checkAuthStatus
 *  - Helpers: getUserDisplayName, getUserInitials, getRoleColor, getRoleLabel, canAccessRoute
 *
 * Efeitos:
 *  - initializeAuth na montagem (uma vez)
 *  - verificação periódica do status quando autenticado (com heurística de expiração do token)
 *
 * @returns Objeto com estado, ações e utilitários de autenticação prontos para uso
 */
export const useApiAuth = () => {
  const {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    
    // Ações principais
    login,
    register,
    logout,
    refreshAuth,
    
    // Ações de perfil
    updateProfile,
    changePassword,
    
    // Ações de estado
    setLoading,
    setError,
    clearError,
    
    // Verificações
    hasPermission,
    hasRole,
    hasMinimumRole,
    
    // Utilitários
    initializeAuth,
    checkAuthStatus,
  } = useAuthStore();

  // Inicializar autenticação quando o hook é montado (apenas uma vez)
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]); // Adicionada dependência correta

  // Verificar status de autenticação periodicamente (otimizado)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        // Só verificar se o token está próximo do vencimento
        const token = localStorage.getItem('auth-token');
        if (token) {
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3 || !tokenParts[1]) {
              throw new Error('Token inválido');
            }
            const payload = JSON.parse(atob(tokenParts[1]));
            const now = Date.now() / 1000;
            const timeUntilExpiry = payload.exp - now;
            
            // Só verificar se o token expira em menos de 10 minutos
            if (timeUntilExpiry < 600) {
              checkAuthStatus();
            }
          } catch (error) {
            // Token inválido, verificar status
            checkAuthStatus();
          }
        }
      }, 10 * 60 * 1000); // Verificar a cada 10 minutos (reduzido)

      return () => clearInterval(interval);
    }
    
    return undefined;
  }, [isAuthenticated, checkAuthStatus]);

  // Função para login com tratamento de erro
  const loginWithErrorHandling = async (credentials: Parameters<typeof login>[0]) => {
    clearError();
    const result = await login(credentials);
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  };

  // Função para registro com tratamento de erro
  const registerWithErrorHandling = async (userData: Parameters<typeof register>[0]) => {
    clearError();
    const result = await register(userData);
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  };

  // Função para logout com estado de loading e limpeza
  const logoutWithCleanup = async () => {
    try {
      clearError();
      // Ativar estado de loading para feedback visual
      setLoading(true);
      // Executar logout síncrono da store
      await Promise.resolve().then(() => logout());
      // Manter um pequeno atraso para permitir transições de UI
      await new Promise((resolve) => setTimeout(resolve, 200));
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar perfil com tratamento de erro
  const updateProfileWithErrorHandling = async (userData: Parameters<typeof updateProfile>[0]) => {
    clearError();
    const result = await updateProfile(userData);
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  };

  // Função para alterar senha com tratamento de erro
  const changePasswordWithErrorHandling = async (passwordData: Parameters<typeof changePassword>[0]) => {
    clearError();
    const result = await changePassword(passwordData);
    
    if (!result.success && result.error) {
      setError(result.error);
    }
    
    return result;
  };

  // Verificações de role específicas
  const isAdmin = hasRole(UserRole.ADMIN);
  const isStaff = hasRole(UserRole.STAFF);
  const isManager = hasRole(UserRole.MANAGER);
  const isClient = hasRole(UserRole.CUSTOMER);
  const isStaffOrAdmin = hasMinimumRole(UserRole.STAFF);

  // Verificações de permissões específicas
  const canManageUsers = hasPermission('users:write');
  const canManageProducts = hasPermission('products:write');
  const canManageOrders = hasPermission('orders:write');
  const canViewReports = hasPermission('reports:read');
  const canManageSettings = hasPermission('settings:write');
  const canManageCategories = hasPermission('categories:write');

  // Verificações de acesso a áreas
  const canAccessAdmin = hasMinimumRole(UserRole.ADMIN);
  const canAccessStaff = hasMinimumRole(UserRole.STAFF);
  const canAccessCustomer = hasMinimumRole(UserRole.CUSTOMER);

  // Função para obter nome do usuário
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.name || user.email.split('@')[0];
  };

  // Função para obter iniciais do usuário
  const getUserInitials = () => {
    if (!user) return '';
    const name = user.name || user.email;
    const words = name.split(' ');
    if (words.length >= 2) {
      const firstLetter = words[0]?.[0] || '';
      const secondLetter = words[1]?.[0] || '';
      return (firstLetter + secondLetter).toUpperCase();
    }
    return name[0]?.toUpperCase() || '';
  };

  // Função para obter cor baseada no role
  const getRoleColor = () => {
    if (!user) return 'gray';
    
    // user.role já está normalizado em inglês pela AuthStore
    switch (user.role) {
      case UserRole.ADMIN:
        return 'red';
      case UserRole.STAFF:
        return 'blue';
      case UserRole.MANAGER:
        return 'orange';
      case UserRole.CUSTOMER:
        return 'green';
      default:
        return 'gray';
    }
  };

  // Função para obter label do role
  const getRoleLabel = () => {
    if (!user) return '';
    
    // Labels amigáveis (mantendo inglês por consistência atual do app)
    switch (user.role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.STAFF:
        return 'Staff';
      case UserRole.MANAGER:
        return 'Manager';
      case UserRole.CUSTOMER:
        return 'Customer';
      default:
        return 'User';
    }
  };

  // Função para verificar se pode acessar uma rota específica
  const canAccessRoute = (route: string) => {
    if (!isAuthenticated) return false;

    // Rotas públicas
    const publicRoutes = ['/', '/login', '/register'];
    if (publicRoutes.includes(route)) return true;

    // Rotas por role
    if (route.startsWith('/admin')) return canAccessAdmin;
    if (route.startsWith('/staff')) return canAccessStaff;
    if (route.startsWith('/customer')) return canAccessCustomer;

    return true;
  };

  // Função para obter rota padrão baseada no role
  const getDefaultRoute = () => {
    try {
      if (!user) return '/login';

      // user.role já normalizado em inglês
      switch (user.role) {
        case UserRole.ADMIN:
          return '/admin/dashboard';
        case UserRole.STAFF:
          return '/staff';
        case UserRole.MANAGER:
          return '/expedicao';
        case UserRole.CUSTOMER:
          return '/customer/dashboard';
        default:
          return '/';
      }
    } catch (error) {
      console.error('Erro em getDefaultRoute:', error);
      return '/';
    }
  };

  // Função para obter rota de login considerando contexto
  const getLoginRedirectRoute = (fromPath?: string) => {
    try {
      if (!user) return '/login';

      // Se veio da página inicial ou carrinho, manter no contexto de compra
      if (fromPath === '/' || fromPath === '/cart') {
        return fromPath;
      }

      // Para outros casos, usar rota padrão baseada no role
      return getDefaultRoute();
    } catch (error) {
      console.error('Erro em getLoginRedirectRoute:', error);
      return '/';
    }
  };

  return {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    
    // Ações principais
    login: loginWithErrorHandling,
    register: registerWithErrorHandling,
    logout: logoutWithCleanup,
    refreshAuth,
    
    // Ações de perfil
    updateProfile: updateProfileWithErrorHandling,
    changePassword: changePasswordWithErrorHandling,
    
    // Ações de estado
    setLoading,
    setError,
    clearError,
    
    // Verificações básicas
    hasPermission,
    hasRole,
    hasMinimumRole,
    
    // Verificações específicas de role
    isAdmin,
    isStaff,
    isManager,
    isClient,
    isStaffOrAdmin,
    
    // Verificações específicas de permissões
    canManageUsers,
    canManageProducts,
    canManageOrders,
    canViewReports,
    canManageSettings,
    canManageCategories,
    
    // Verificações de acesso
    canAccessAdmin,
    canAccessStaff,
    canAccessCustomer,
    
    // Utilitários
    getUserDisplayName,
    getUserInitials,
    getRoleColor,
    getRoleLabel,
    canAccessRoute,
    getDefaultRoute,
    getLoginRedirectRoute,
    
    // Métodos internos (para casos especiais)
    _internal: {
      initializeAuth,
      checkAuthStatus,
    },
  };
};
