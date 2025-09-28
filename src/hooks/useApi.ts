import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiAuth } from './useApiAuth';

// Cache global para requisições
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Debounce para evitar requisições repetitivas
const pendingRequests = new Map<string, Promise<any>>();

interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook genérico para fazer requisições à API
 */
export const useApi = <T = any>(
  url: string,
  options: ApiOptions = {}
) => {
  const { token, isAuthenticated } = useApiAuth();
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { immediate = true, onSuccess, onError } = options;

  const execute = useCallback(async (customUrl?: string, customOptions?: RequestInit) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const requestUrl = customUrl || url;
      const cacheKey = `${requestUrl}-${token || 'no-token'}`;
      
      // Verificar cache primeiro
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setState({
          data: cached.data,
          loading: false,
          error: null,
        });
        onSuccess?.(cached.data);
        return cached.data;
      }

      // Verificar se já existe uma requisição pendente
      if (pendingRequests.has(cacheKey)) {
        const pendingResult = await pendingRequests.get(cacheKey);
        setState({
          data: pendingResult,
          loading: false,
          error: null,
        });
        onSuccess?.(pendingResult);
        return pendingResult;
      }

      const requestOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...customOptions?.headers,
        },
        ...customOptions,
      };

      // Criar promise para requisição pendente
      const requestPromise = (async () => {
        try {
          const response = await fetch(requestUrl, requestOptions);
          
          if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorResult = await response.json();
              errorMessage = errorResult.error || errorResult.message || errorMessage;
            } catch (parseError) {
              // Se não conseguir fazer parse do JSON, usar o status text
              errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
          }

          const result = await response.json();
          return result;
        } finally {
          // Remover da lista de pendentes
          pendingRequests.delete(cacheKey);
        }
      })();

      // Adicionar à lista de pendentes
      pendingRequests.set(cacheKey, requestPromise);
      
      const result = await requestPromise;

      // Cachear resultado por 30 segundos para GET requests
      if (requestOptions.method === 'GET' || !requestOptions.method) {
        requestCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          ttl: 30000, // 30 segundos
        });
      }

      setState({
        data: result,
        loading: false,
        error: null,
      });

      onSuccess?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }, [url, token, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Executar automaticamente se immediate for true
  useEffect(() => {
    if (immediate && url) {
      execute();
    }
  }, [immediate, url]); // Removido execute das dependências

  // Função para limpar cache
  const clearCache = useCallback(() => {
    requestCache.clear();
  }, []);

  return {
    ...state,
    execute,
    reset,
    clearCache,
  };
};

/**
 * Hook para operações POST/PUT/DELETE
 */
export const useApiMutation = <T = any>(url: string) => {
  const { token } = useApiAuth();
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (data?: any, method: string = 'POST') => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...(data && { body: JSON.stringify(data) }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      setState({
        data: result.data,
        loading: false,
        error: null,
      });

      return result.data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [url, token]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
};

/**
 * Hook específico para produtos
 */
export const useProducts = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.categoryId) queryParams.set('categoryId', params.categoryId);
  if (params?.isAvailable !== undefined) queryParams.set('isAvailable', params.isAvailable.toString());

  const url = `/api/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return useApi(url);
};

/**
 * Hook específico para categorias
 */
export const useCategories = (includeProducts?: boolean) => {
  const queryParams = new URLSearchParams();
  if (includeProducts) queryParams.set('includeProducts', 'true');
  
  const url = `/api/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return useApi(url);
};

/**
 * Hook específico para pedidos
 */
export const useOrders = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  deliveryType?: string;
  userId?: string;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.status) queryParams.set('status', params.status);
  if (params?.deliveryType) queryParams.set('deliveryType', params.deliveryType);
  if (params?.userId) queryParams.set('userId', params.userId);

  const url = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return useApi(url);
};

/**
 * Hook específico para mesas
 */
export const useTables = (params?: {
  status?: string;
  assignedTo?: string;
  includeAssignedUser?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.status) queryParams.set('status', params.status);
  if (params?.assignedTo) queryParams.set('assignedTo', params.assignedTo);
  if (params?.includeAssignedUser) queryParams.set('includeAssignedUser', 'true');

  const url = `/api/tables${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return useApi(url);
};

/**
 * Hook específico para usuários
 */
export const useUsers = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.search) queryParams.set('search', params.search);
  if (params?.role) queryParams.set('role', params.role);
  if (params?.isActive !== undefined) queryParams.set('isActive', params.isActive.toString());

  const url = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  return useApi(url);
};
