'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApiAuth } from './useApiAuth';

interface BatchQueryOptions {
  enabled?: boolean;
  staleTime?: number; // Tempo em ms antes de considerar dados "stale"
  refetchOnWindowFocus?: boolean;
}

interface BatchQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para executar múltiplas queries em paralelo
 */
export const useBatchQueries = <T = any>(
  queries: Array<{
    key: string;
    url: string;
    enabled?: boolean;
  }>,
  options: BatchQueryOptions = {}
) => {
  const { token } = useApiAuth();
  const [state, setState] = useState<{
    data: Record<string, any>;
    loading: boolean;
    error: string | null;
    lastFetch: number;
  }>({
    data: {},
    loading: false,
    error: null,
    lastFetch: 0,
  });

  const { enabled = true, staleTime = 5 * 60 * 1000, refetchOnWindowFocus = false } = options;

  const fetchAll = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Filtrar queries habilitadas
      const enabledQueries = queries.filter(query => query.enabled !== false);
      
      // Executar todas as queries em paralelo
      const responses = await Promise.all(
        enabledQueries.map(async ({ key, url }) => {
          try {
            const response = await fetch(url, {
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
              },
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status} para ${key}`);
            }

            const data = await response.json();
            return { key, data, error: null };
          } catch (error) {
            console.error(`Erro na query ${key}:`, error);
            return { 
              key, 
              data: null, 
              error: error instanceof Error ? error.message : 'Erro desconhecido' 
            };
          }
        })
      );

      // Organizar resultados
      const results: Record<string, any> = {};
      let hasError = false;
      let errorMessage = '';

      responses.forEach(({ key, data, error }) => {
        results[key] = data;
        if (error) {
          hasError = true;
          errorMessage += `${key}: ${error}; `;
        }
      });

      setState({
        data: results,
        loading: false,
        error: hasError ? errorMessage : null,
        lastFetch: Date.now(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar dados';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [queries, enabled, token]);

  const refetch = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  // Verificar se os dados estão "stale"
  const isStale = Date.now() - state.lastFetch > staleTime;

  // Executar queries na inicialização
  useEffect(() => {
    if (enabled && (Object.keys(state.data).length === 0 || isStale)) {
      fetchAll();
    }
  }, [enabled, fetchAll, isStale, state.data]);

  // Refetch quando a janela ganha foco (opcional)
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      if (isStale) {
        fetchAll();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, isStale, fetchAll]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
    isStale,
  };
};

/**
 * Hook específico para dados do dashboard
 */
export const useDashboardBatch = () => {
  const { token } = useApiAuth();
  
  const queries = [
    {
      key: 'orders',
      url: '/api/orders?limit=10&sortBy=createdAt&sortOrder=desc',
    },
    {
      key: 'products',
      url: '/api/products?limit=20&isAvailable=true',
    },
    {
      key: 'categories',
      url: '/api/categories',
    },
    {
      key: 'users',
      url: '/api/users?limit=10&isActive=true',
    },
    {
      key: 'tables',
      url: '/api/tables',
    },
  ];

  return useBatchQueries(queries, {
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook específico para dados de produtos e categorias
 */
export const useMenuBatch = (filters?: {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  const queries = [
    {
      key: 'products',
      url: (() => {
        const params = new URLSearchParams();
        if (filters?.search) params.set('search', filters.search);
        if (filters?.categoryId) params.set('categoryId', filters.categoryId);
        if (filters?.isAvailable !== undefined) params.set('isAvailable', filters.isAvailable.toString());
        return `/api/products?${params.toString()}`;
      })(),
    },
    {
      key: 'categories',
      url: '/api/categories',
    },
  ];

  return useBatchQueries(queries, {
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para dados de pedidos com filtros
 */
export const useOrdersBatch = (filters?: {
  status?: string;
  userId?: string;
  limit?: number;
}) => {
  const queries = [
    {
      key: 'orders',
      url: (() => {
        const params = new URLSearchParams();
        if (filters?.status) params.set('status', filters.status);
        if (filters?.userId) params.set('userId', filters.userId);
        if (filters?.limit) params.set('limit', filters.limit.toString());
        return `/api/orders?${params.toString()}`;
      })(),
    },
    {
      key: 'tables',
      url: '/api/tables',
    },
  ];

  return useBatchQueries(queries, {
    staleTime: 1 * 60 * 1000, // 1 minuto para pedidos
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook para dados de administração
 */
export const useAdminBatch = () => {
  const queries = [
    {
      key: 'users',
      url: '/api/users?limit=20',
    },
    {
      key: 'products',
      url: '/api/products?limit=20',
    },
    {
      key: 'categories',
      url: '/api/categories',
    },
    {
      key: 'orders',
      url: '/api/orders?limit=20',
    },
    {
      key: 'tables',
      url: '/api/tables',
    },
  ];

  return useBatchQueries(queries, {
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
};

/**
 * Hook para invalidar cache quando dados são modificados
 */
export const useQueryInvalidation = () => {
  const invalidateAll = useCallback(() => {
    // Forçar refetch de todas as queries
    window.dispatchEvent(new CustomEvent('invalidate-queries'));
  }, []);

  const invalidateByPattern = useCallback((pattern: string) => {
    window.dispatchEvent(new CustomEvent('invalidate-queries', { 
      detail: { pattern } 
    }));
  }, []);

  return {
    invalidateAll,
    invalidateByPattern,
  };
};
