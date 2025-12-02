import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import type { Adicional } from '@/types';

/**
 * useAdicionais
 * Hook para buscar adicionais de um produto
 */
export const useAdicionais = (productId?: string) => {
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchAdicionais = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${productId}/adicionais`);
        if (!response.ok) {
          throw new Error('Erro ao buscar adicionais');
        }
        const result = await response.json();
        setAdicionais(result.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar adicionais';
        setError(errorMessage);
        console.error(errorMessage, err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdicionais();
  }, [productId]);

  return { adicionais, loading, error };
};

/**
 * useAllAdicionais
 * Hook para buscar todos os adicionais disponíveis
 */
export const useAllAdicionais = (onlyAvailable = true) => {
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllAdicionais = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = onlyAvailable ? '?isAvailable=true' : '';
        const response = await fetch(`/api/adicionais${query}`);
        if (!response.ok) {
          throw new Error('Erro ao buscar adicionais');
        }
        const result = await response.json();
        setAdicionais(result.data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar adicionais';
        setError(errorMessage);
        console.error(errorMessage, err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAdicionais();
  }, [onlyAvailable]);

  return { adicionais, loading, error };
};
