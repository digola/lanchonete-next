import { useState, useEffect, useCallback } from 'react';
import { useApiAuth } from './useApiAuth';

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

export const useApi = <T = any>(
  url: string,
  options: ApiOptions = {}
) => {
  const { token } = useApiAuth();
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
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...customOptions?.headers,
        },
        ...customOptions,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setState({
        data,
        loading: false,
        error: null,
      });

      onSuccess?.(data);
      return data;

    } catch (error) {
      console.error('Erro na requisição:', error);
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
  }, [immediate, url, execute]);

  return {
    ...state,
    execute,
    reset,
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
        body: data ? JSON.stringify(data) : null,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setState({
        data: result,
        loading: false,
        error: null,
      });

      return result;

    } catch (error) {
      console.error('Erro na mutação:', error);
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