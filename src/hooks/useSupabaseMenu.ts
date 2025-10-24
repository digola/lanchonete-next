'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useApiAuth } from './useApiAuth';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';

// Cache global simples para Supabase
const supabaseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TIME = 2 * 60 * 1000; // 2 minutos

/**
 * Hook para buscar dados da home diretamente do Supabase
 * Usa a API REST do Supabase para buscar categorias e produtos em tempo real
 */
export const useSupabaseMenu = (filters?: {
  search?: string;
  categoryId?: string;
  isAvailable?: boolean;
}) => {
  const auth = useApiAuth();
  const token = auth?.token || null;
  
  // Estados para dados e loading
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState({ categories: false, products: false });
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Debounce para search
  const searchTimerRef = useRef<NodeJS.Timeout>();
  const [debouncedSearch, setDebouncedSearch] = useState(filters?.search || '');

  // Função para buscar categorias do Supabase
  const fetchSupabaseCategories = useCallback(async () => {
    if (!supabase) {
      console.error('❌ Supabase não configurado');
      return [];
    }

    const cacheKey = `supabase:categories`;
    const cached = supabaseCache.get(cacheKey);
    
    // Usar cache se disponível e válido
    if (cached && Date.now() - cached.timestamp < CACHE_TIME * 5) { // 10 minutos para categorias
      return cached.data as Category[];
    }

    try {
      console.log('🔍 Buscando categorias do Supabase...');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('isActive', true)
        .order('name');

      if (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        return [];
      }

      console.log(`✅ ${data?.length || 0} categorias encontradas`);
      
      // Salvar no cache
      supabaseCache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data as Category[];
    } catch (error) {
      console.error('❌ Erro na busca de categorias:', error);
      return [];
    }
  }, []);

  // Função para buscar produtos do Supabase
  const fetchSupabaseProducts = useCallback(async (searchTerm?: string, categoryFilter?: string) => {
    if (!supabase) {
      console.error('❌ Supabase não configurado');
      return [];
    }

    try {
      console.log('🔍 Buscando produtos do Supabase...', { searchTerm, categoryFilter });
      
      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('isAvailable', true);

      // Aplicar filtro de categoria se fornecido
      if (categoryFilter) {
        query = query.eq('categoryId', categoryFilter);
      }

      // Aplicar filtro de busca se fornecido
      if (searchTerm?.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      query = query.order('name');

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        return [];
      }

      console.log(`✅ ${data?.length || 0} produtos encontrados`);
      return data as Product[];
    } catch (error) {
      console.error('❌ Erro na busca de produtos:', error);
      return [];
    }
  }, []);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    setError(null);
    
    try {
      const categoriesData = await fetchSupabaseCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      setError('Erro ao carregar categorias');
      setCategories([]);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  }, [fetchSupabaseCategories]);

  // Carregar produtos
  const loadProducts = useCallback(async () => {
    setLoading(prev => ({ ...prev, products: true }));
    setError(null);
    
    try {
      const productsData = await fetchSupabaseProducts(debouncedSearch, filters?.categoryId);
      setProducts(productsData);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      setError('Erro ao carregar produtos');
      setProducts([]);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
      setIsSearching(false);
    }
  }, [fetchSupabaseProducts, debouncedSearch, filters?.categoryId]);

  // Debounce para search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (filters?.search !== undefined) {
      setIsSearching(true);
      searchTimerRef.current = setTimeout(() => {
        setDebouncedSearch(filters.search || '');
      }, 300);
    }

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [filters?.search]);

  // Carregar dados quando filtros mudam
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Carregar categorias na montagem
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Dados memoizados para evitar re-renders
  const menuData = useMemo(() => ({
    categories,
    products,
    pagination: {
      page: 1,
      limit: products.length,
      total: products.length,
      totalPages: 1,
    },
    loading: loading.categories || loading.products,
    refetch: () => {
      loadCategories();
      loadProducts();
    },
    isSearching,
    error,
  }), [categories, products, loading, isSearching, error, loadCategories, loadProducts]);

  return menuData;
};