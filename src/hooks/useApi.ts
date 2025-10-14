import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Janela curta para deduplicar auto-fetch em desenvolvimento (React Strict Mode)
  // Evita que o useEffect dispare duas vezes em dev, causando requisições duplicadas
  const AUTO_FETCH_DEDUPE_WINDOW_MS = 1500;
  const lastAutoFetchTsMap: Map<string, number> = (globalThis as any).__lastAutoFetchTsMap__ || new Map();
  (globalThis as any).__lastAutoFetchTsMap__ = lastAutoFetchTsMap;
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { immediate = true, onSuccess, onError } = options;
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (customUrl?: string, customOptions?: RequestInit) => {
    // Cancelar requisição anterior se ainda estiver em andamento
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch {}
    }
    abortRef.current = new AbortController();

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
        signal: abortRef.current.signal,
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
      // Tratar cancelamentos (AbortError) de forma silenciosa: quando cancelamos
      // uma requisição anterior, o fetch rejeita com AbortError. Isso é esperado
      // e não deve ser tratado como erro na UI.
      const isAbortError =
        error instanceof Error &&
        (error.name === 'AbortError' || (error as any).code === 'ABORT_ERR');

      if (isAbortError) {
        // Apenas finalize o estado de loading sem marcar erro
        setState(prev => ({ ...prev, loading: false }));
        return null;
      }

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
      // Deduplicação: se uma auto-requisição para o mesmo recurso ocorreu há pouco tempo,
      // evitar repetir (comum em dev por causa do Strict Mode)
      try {
        const key = `${url}|${token ? 'auth' : 'guest'}`;
        const now = Date.now();
        const lastTs = lastAutoFetchTsMap.get(key) ?? 0;

        if (now - lastTs < AUTO_FETCH_DEDUPE_WINDOW_MS) {
          return; // pular auto-fetch duplicado
        }

        lastAutoFetchTsMap.set(key, now);
      } catch {}

      execute();
    }
  }, [immediate, url, execute, token]);

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