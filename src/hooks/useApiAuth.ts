import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';

/**
 * Hook personalizado para autenticação
 * Fornece acesso ao estado de autenticação e métodos relacionados
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

  // Inicializar autenticação quando o hook é montado
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Verificar status de autenticação periodicamente (opcional)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        checkAuthStatus();
      }, 5 * 60 * 1000); // Verificar a cada 5 minutos

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

  // Função para logout com limpeza
  const logoutWithCleanup = () => {
    clearError();
    logout();
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
  const isAdmin = hasRole(UserRole.ADMINISTRADOR);
  const isStaff = hasRole(UserRole.FUNCIONARIO);
  const isClient = hasRole(UserRole.CLIENTE);
  const isStaffOrAdmin = hasMinimumRole(UserRole.FUNCIONARIO);

  // Verificações de permissões específicas
  const canManageUsers = hasPermission('users:write');
  const canManageProducts = hasPermission('products:write');
  const canManageOrders = hasPermission('orders:write');
  const canViewReports = hasPermission('reports:read');
  const canManageSettings = hasPermission('settings:write');
  const canManageCategories = hasPermission('categories:write');

  // Verificações de acesso a áreas
  const canAccessAdmin = hasMinimumRole(UserRole.ADMINISTRADOR);
  const canAccessStaff = hasMinimumRole(UserRole.FUNCIONARIO);
  const canAccessCustomer = hasMinimumRole(UserRole.CLIENTE);

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
    
    switch (user.role) {
      case UserRole.ADMINISTRADOR:
        return 'red';
      case UserRole.FUNCIONARIO:
        return 'blue';
      case UserRole.CLIENTE:
        return 'green';
      default:
        return 'gray';
    }
  };

  // Função para obter label do role
  const getRoleLabel = () => {
    if (!user) return '';
    
    switch (user.role) {
      case UserRole.ADMINISTRADOR:
        return 'Administrador';
      case UserRole.FUNCIONARIO:
        return 'Funcionário';
      case UserRole.CLIENTE:
        return 'Cliente';
      default:
        return 'Usuário';
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
    if (!user) return '/login';

    switch (user.role) {
      case UserRole.ADMINISTRADOR:
        return '/admin/dashboard';
      case UserRole.FUNCIONARIO:
        return '/staff/dashboard';
      case UserRole.CLIENTE:
        return '/customer/dashboard';
      default:
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
    
    // Métodos internos (para casos especiais)
    _internal: {
      initializeAuth,
      checkAuthStatus,
    },
  };
};
