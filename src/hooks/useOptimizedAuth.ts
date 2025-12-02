'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';

/**
 * useOptimizedAuth
 *
 * Versão otimizada do hook de autenticação para reduzir verificações
 * desnecessárias e melhorar performance. Implementa:
 *  - inicialização única da autenticação
 *  - verificação periódica com intervalo maior (5 min) e janela mínima (30s)
 *  - login/logout com limpeza e cache leve para heurísticas locais
 *
 * @returns Estado de auth, ações otimizadas e utilitários
 */
export const useOptimizedAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    login,
    register,
    logout,
    refreshAuth,
    updateProfile,
    changePassword,
    setLoading,
    setError,
    clearError,
    hasPermission,
    hasRole,
    hasMinimumRole,
    initializeAuth,
    checkAuthStatus,
  } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);
  const lastCheckRef = useRef<number>(0);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cache para evitar verificações desnecessárias
  const authCache = useRef<{
    lastCheck: number;
    isValid: boolean;
    user: any;
  }>({
    lastCheck: 0,
    isValid: false,
    user: null,
  });

  // Inicializar autenticação apenas uma vez
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
      setIsInitialized(true);
    }
  }, [initializeAuth, isInitialized]);

  // Verificação otimizada de status de auth
  const checkAuthStatusOptimized = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;
    
    // Só verificar se passou mais de 30 segundos desde a última verificação
    if (timeSinceLastCheck < 30000) {
      return;
    }

    // Se não está autenticado, não precisa verificar
    if (!isAuthenticated || !token) {
      return;
    }

    try {
      lastCheckRef.current = now;
      await checkAuthStatus();
    } catch (error) {
      console.error('Erro ao verificar status de auth:', error);
    }
  }, [isAuthenticated, token, checkAuthStatus]);

  // Verificação periódica otimizada (a cada 5 minutos em vez de constantemente)
  useEffect(() => {
    if (isAuthenticated && token) {
      // Limpar intervalo anterior se existir
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      // Verificar imediatamente
      checkAuthStatusOptimized();

      // Configurar verificação periódica (5 minutos)
      checkIntervalRef.current = setInterval(() => {
        checkAuthStatusOptimized();
      }, 5 * 60 * 1000);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [isAuthenticated, token, checkAuthStatusOptimized]);

  // Função de login otimizada
  const loginOptimized = useCallback(async (credentials: any) => {
    setLoading(true);
    clearError();
    
    try {
      const result = await login(credentials);
      
      if (result.success) {
        // Resetar cache após login bem-sucedido
        authCache.current = {
          lastCheck: Date.now(),
          isValid: true,
          user: user,
        };
      }
      
      return result;
    } catch (error) {
      setError('Erro no login');
      return { success: false, error: 'Erro no login' };
    } finally {
      setLoading(false);
    }
  }, [login, setLoading, clearError, setError, user]);

  // Função de logout otimizada
  const logoutOptimized = useCallback(async () => {
    try {
      // Limpar cache
      authCache.current = {
        lastCheck: 0,
        isValid: false,
        user: null,
      };
      
      // Limpar intervalos
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      
      await logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }, [logout]);

  // Função para obter label de role otimizada
  const getRoleLabel = useCallback(() => {
    if (!user?.role) return 'User';
    const roleLabels: Record<string, string> = {
      ADMIN: 'Admin',
      STAFF: 'Staff',
      MANAGER: 'Manager',
      CUSTOMER: 'Customer',
    };
    return roleLabels[String(user.role).toUpperCase()] || 'User';
  }, [user?.role]);

  return {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    
    // Ações otimizadas
    login: loginOptimized,
    register,
    logout: logoutOptimized,
    refreshAuth,
    updateProfile,
    changePassword,
    
    // Utilitários
    setLoading,
    setError,
    clearError,
    hasPermission,
    hasRole,
    hasMinimumRole,
    getRoleLabel,
    
    // Cache info
    isInitialized,
  };
};
