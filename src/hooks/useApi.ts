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

/**
 * useApi
 *
 * Hook de GET com suporte a:
 *  - autenticação via useApiAuth
 *  - cancelamento (AbortController) e tratamento silencioso de AbortError
 *  - deduplicação de auto-fetch em desenvolvimento (Strict Mode)
 *  - callbacks onSuccess/onError
 *
 * @param url URL base da requisição
 * @param options Controle de execução imediata e callbacks
 * @returns Estado reativo (data, loading, error), execute(url, options) e reset()
 */
export const useApi = <T = any>(
  url: string,
  options: ApiOptions = {}
) => {
  const { token } = useApiAuth();

  // Janela curta para deduplicar auto-fetch em desenvolvimento (React Strict Mode)
  // Evita que o useEffect dispare duas vezes em dev, causando requisições duplicadas
  const AUTO_FETCH_DEDUPE_WINDOW_MS = 1500;
  const lastAutoFetchRef = useRef<Map<string, number>>((globalThis as any).__lastAutoFetchTsMap__ || new Map());
  (globalThis as any).__lastAutoFetchTsMap__ = lastAutoFetchRef.current;
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

      // Tentar parsear JSON com proteção: lidar com corpo vazio e content-type
      let data: any = null;
      try {
        const contentType = response.headers.get('content-type') || '';
        const isJsonContent = contentType.indexOf('application/json') !== -1;
        const isEmptyResponse = response.status === 204 || response.status === 205;
        
        if (isEmptyResponse) {
          // Resposta vazia (No Content)
          data = null;
        } else if (!isJsonContent) {
          // Não é JSON: tentar ler como texto
          const text = await response.text();
          if (text && text.trim().length > 0) {
            try {
              // Tentar parsear como JSON mesmo sem content-type correto
              data = JSON.parse(text);
            } catch {
              // Se não for JSON válido, retornar como texto
              data = text;
            }
          } else {
            data = null;
          }
        } else {
          // É JSON: fazer parse normalmente
          const text = await response.text();
          if (text && text.trim().length > 0) {
            try {
              data = JSON.parse(text);
            } catch (parseError) {
              console.error('Erro ao fazer parse do JSON:', parseError);
              console.error('Conteúdo recebido:', text.substring(0, 200));
              // Tentar retornar como texto se o parse falhar
              data = text;
            }
          } else {
            data = null;
          }
        }
      } catch (parseErr) {
        console.error('Falha ao processar resposta da API:', parseErr);
        console.error('URL:', requestUrl);
        console.error('Status:', response.status);
        console.error('Content-Type:', response.headers.get('content-type'));
        
        // Não lançar erro fatal, apenas retornar null
        data = null;
      }
      
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
        const lastTs = lastAutoFetchRef.current.get(key) ?? 0;

        if (now - lastTs < AUTO_FETCH_DEDUPE_WINDOW_MS) {
          return; // pular auto-fetch duplicado
        }

        lastAutoFetchRef.current.set(key, now);
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
/**
 * useApiMutation
 *
 * Hook para operações de escrita (POST/PUT/DELETE). Utiliza o token de
 * autenticação quando disponível e retorna estado reativo, além da função
 * mutate(data, method) para executar a mutação.
 *
 * @param url Endpoint de destino
 * @returns Estado reativo (data, loading, error), mutate() e reset()
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