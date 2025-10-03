import { useEffect } from 'react';
import { useAuthStoreBackup } from '@/stores/authStoreBackup';
import { UserRole } from '@/types';

/**
 * Hook personalizado para autenticação (versão backup)
 * Fornece acesso ao estado de autenticação e métodos relacionados
 */
export const useApiAuthBackup = () => {
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
  } = useAuthStoreBackup();

  // Inicializar autenticação quando o hook é montado
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Verificar status de autenticação periodicamente
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        checkAuthStatus();
      }, 300000); // 5 minutos

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated, checkAuthStatus]);

  return {
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
  };
};
