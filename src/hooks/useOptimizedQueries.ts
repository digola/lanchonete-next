'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para otimizar queries do banco de dados
 * Evita queries duplicadas e melhora performance
 */
export const useOptimizedQueries = () => {
  const queryCache = useRef<Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>>(new Map());

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para fazer query otimizada
  const executeQuery = useCallback(async (
    key: string,
    queryFn: () => Promise<any>,
    ttl: number = 30000 // 30 segundos por padrão
  ) => {
    const now = Date.now();
    const cached = queryCache.current.get(key);

    // Verificar se há cache válido
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.data;
    }

    // Executar query
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await queryFn();
      
      // Armazenar no cache
      queryCache.current.set(key, {
        data: result,
        timestamp: now,
        ttl,
      });

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na query';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para invalidar cache
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      queryCache.current.delete(key);
    } else {
      queryCache.current.clear();
    }
  }, []);

  // Função para limpar cache expirado
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    for (const [key, cached] of queryCache.current.entries()) {
      if ((now - cached.timestamp) >= cached.ttl) {
        queryCache.current.delete(key);
      }
    }
  }, []);

  // Limpar cache expirado periodicamente
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 60000); // A cada minuto
    return () => clearInterval(interval);
  }, [cleanExpiredCache]);

  return {
    executeQuery,
    invalidateCache,
    isLoading,
    error,
    setError,
  };
};

/**
 * Hook específico para queries de pedidos otimizadas
 */
export const useOptimizedOrders = (customerId?: string) => {
  const { executeQuery, invalidateCache, isLoading, error } = useOptimizedQueries();

  const fetchOrders = useCallback(async () => {
    if (!customerId) return null;

    const cacheKey = `orders:${customerId}`;
    
    return executeQuery(
      cacheKey,
      async () => {
        const response = await fetch(
          `/api/orders?customerId=${customerId}&limit=5&sortBy=createdAt&sortOrder=desc`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
      },
      60000 // Cache por 1 minuto
    );
  }, [customerId, executeQuery]);

  // Invalidar cache quando customerId mudar
  useEffect(() => {
    if (customerId) {
      invalidateCache(`orders:${customerId}`);
    }
  }, [customerId, invalidateCache]);

  return {
    fetchOrders,
    isLoading,
    error,
  };
};

/**
 * Hook para queries de usuário otimizadas
 */
export const useOptimizedUser = () => {
  const { executeQuery, invalidateCache, isLoading, error } = useOptimizedQueries();

  const fetchUser = useCallback(async () => {
    const cacheKey = 'user:me';
    
    return executeQuery(
      cacheKey,
      async () => {
        const response = await fetch('/api/auth/me');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response.json();
      },
      300000 // Cache por 5 minutos
    );
  }, [executeQuery]);

  const invalidateUserCache = useCallback(() => {
    invalidateCache('user:me');
  }, [invalidateCache]);

  return {
    fetchUser,
    invalidateUserCache,
    isLoading,
    error,
  };
};
