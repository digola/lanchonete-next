'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApiAuth } from './useApiAuth';

interface QueryDependency {
  key: string;
  condition: boolean;
  data?: any;
}

interface SmartQueryOptions {
  dependencies?: QueryDependency[];
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
  retryCount?: number;
}

/**
 * Hook para queries inteligentes que detectam dependências
 */
export const useSmartQueries = <T = any>(
  queries: Array<{
    key: string;
    url: string | (() => string);
    enabled?: boolean;
    dependencies?: QueryDependency[];
  }>,
  options: SmartQueryOptions = {}
) => {
  const { token } = useApiAuth();
  const [state, setState] = useState<{
    data: Record<string, any>;
    loading: Record<string, boolean>;
    errors: Record<string, string | null>;
    lastFetch: Record<string, number>;
  }>({
    data: {},
    loading: {},
    errors: {},
    lastFetch: {},
  });

  const {
    dependencies = [],
    enabled = true,
    staleTime = 5 * 60 * 1000,
    refetchInterval,
    retryCount = 3,
  } = options;

  // Verificar se uma query deve ser executada
  const shouldExecuteQuery = useCallback((query: typeof queries[0]) => {
    if (!enabled || query.enabled === false) return false;

    // Verificar dependências da query
    if (query.dependencies) {
      return query.dependencies.every(dep => {
        const globalDep = dependencies.find(d => d.key === dep.key);
        return globalDep?.condition && globalDep?.data !== undefined;
      });
    }

    return true;
  }, [enabled, dependencies]);

  // Executar uma query específica
  const executeQuery = useCallback(async (query: typeof queries[0], retry = 0) => {
    const queryKey = query.key;
    
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [queryKey]: true },
      errors: { ...prev.errors, [queryKey]: null },
    }));

    try {
      const url = typeof query.url === 'function' ? query.url() : query.url;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        data: { ...prev.data, [queryKey]: data },
        loading: { ...prev.loading, [queryKey]: false },
        errors: { ...prev.errors, [queryKey]: null },
        lastFetch: { ...prev.lastFetch, [queryKey]: Date.now() },
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Retry logic
      if (retry < retryCount) {
        setTimeout(() => executeQuery(query, retry + 1), 1000 * (retry + 1));
        return;
      }

      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, [queryKey]: false },
        errors: { ...prev.errors, [queryKey]: errorMessage },
      }));

      throw error;
    }
  }, [token, retryCount]);

  // Executar todas as queries elegíveis
  const executeQueries = useCallback(async () => {
    const eligibleQueries = queries.filter(shouldExecuteQuery);
    
    // Executar queries em paralelo
    const promises = eligibleQueries.map(query => executeQuery(query));
    await Promise.allSettled(promises);
  }, [queries, shouldExecuteQuery, executeQuery]);

  // Verificar se os dados estão stale
  const isStale = useCallback((queryKey: string) => {
    const lastFetch = state.lastFetch[queryKey];
    return !lastFetch || Date.now() - lastFetch > staleTime;
  }, [state.lastFetch, staleTime]);

  // Executar queries na inicialização
  useEffect(() => {
    if (enabled) {
      executeQueries();
    }
  }, [enabled]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      executeQueries();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled]);

  // Refetch quando dependências mudam
  useEffect(() => {
    if (enabled) {
      executeQueries();
    }
  }, [dependencies, enabled]);

  // Memoizar resultados
  const results = useMemo(() => {
    const result: Record<string, any> = {};
    
    queries.forEach(query => {
      const queryKey = query.key;
      result[queryKey] = {
        data: state.data[queryKey] || null,
        loading: state.loading[queryKey] || false,
        error: state.errors[queryKey] || null,
        isStale: isStale(queryKey),
        lastFetch: state.lastFetch[queryKey] || 0,
      };
    });

    return result;
  }, [queries, state, isStale]);

  const refetch = useCallback(async (queryKey?: string) => {
    if (queryKey) {
      const query = queries.find(q => q.key === queryKey);
      if (query) {
        await executeQuery(query);
      }
    } else {
      await executeQueries();
    }
  }, [queries, executeQuery, executeQueries]);

  return {
    queries: results,
    refetch,
    isAnyLoading: Object.values(state.loading).some(loading => loading),
    hasAnyError: Object.values(state.errors).some(error => error !== null),
  };
};

/**
 * Hook específico para dados do menu com dependências
 */
export const useMenuSmartQueries = (filters?: {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  const queries = useMemo(() => [
    {
      key: 'categories',
      url: '/api/categories',
      enabled: true,
    },
    {
      key: 'products',
      url: () => {
        const params = new URLSearchParams();
        if (filters?.search) params.set('search', filters.search);
        if (filters?.categoryId) params.set('categoryId', filters.categoryId);
        if (filters?.isAvailable !== undefined) params.set('isAvailable', filters.isAvailable.toString());
        return `/api/products?${params.toString()}`;
      },
      enabled: true,
    },
  ], [filters?.search, filters?.categoryId, filters?.isAvailable]);

  return useSmartQueries(queries, {
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

/**
 * Hook para dados de pedidos com dependências
 */
export const useOrdersSmartQueries = (filters?: {
  status?: string;
  userId?: string;
  tableId?: string;
}) => {
  const queries = useMemo(() => [
    {
      key: 'orders',
      url: () => {
        const params = new URLSearchParams();
        if (filters?.status) params.set('status', filters.status);
        if (filters?.userId) params.set('userId', filters.userId);
        if (filters?.tableId) params.set('tableId', filters.tableId);
        return `/api/orders?${params.toString()}`;
      },
      enabled: true,
    },
    {
      key: 'tables',
      url: '/api/tables',
      enabled: true,
    },
    {
      key: 'users',
      url: '/api/users?limit=50',
      enabled: !!filters?.userId,
    },
  ], [filters?.status, filters?.userId, filters?.tableId]);

  return useSmartQueries(queries, {
    staleTime: 1 * 60 * 1000, // 1 minuto
    refetchInterval: 30 * 1000, // Refetch a cada 30 segundos
  });
};

/**
 * Hook para dados de administração com dependências
 */
export const useAdminSmartQueries = (filters?: {
  includeUsers?: boolean;
  includeProducts?: boolean;
  includeCategories?: boolean;
  includeOrders?: boolean;
  includeTables?: boolean;
}) => {
  const queries = useMemo(() => [
    {
      key: 'users',
      url: '/api/users?limit=50',
      enabled: filters?.includeUsers !== false,
    },
    {
      key: 'products',
      url: '/api/products?limit=50',
      enabled: filters?.includeProducts !== false,
    },
    {
      key: 'categories',
      url: '/api/categories',
      enabled: filters?.includeCategories !== false,
    },
    {
      key: 'orders',
      url: '/api/orders?limit=50',
      enabled: filters?.includeOrders !== false,
    },
    {
      key: 'tables',
      url: '/api/tables',
      enabled: filters?.includeTables !== false,
    },
  ], [
    filters?.includeUsers,
    filters?.includeProducts,
    filters?.includeCategories,
    filters?.includeOrders,
    filters?.includeTables,
  ]);

  return useSmartQueries(queries, {
    staleTime: 3 * 60 * 1000, // 3 minutos
  });
};

/**
 * Hook para invalidar queries específicas
 */
export const useQueryInvalidation = () => {
  const [invalidationKey, setInvalidationKey] = useState(0);

  const invalidate = useCallback((pattern?: string) => {
    setInvalidationKey(prev => prev + 1);
    
    if (pattern) {
      // Invalidar queries que correspondem ao padrão
      window.dispatchEvent(new CustomEvent('invalidate-queries', {
        detail: { pattern, timestamp: Date.now() }
      }));
    }
  }, []);

  const invalidateAll = useCallback(() => {
    invalidate();
  }, [invalidate]);

  return {
    invalidationKey,
    invalidate,
    invalidateAll,
  };
};
