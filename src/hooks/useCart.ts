'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { CartState, CartAction, cartReducer, CartItem } from '@/types/cart';
import { Product } from '@/types';
import { useApiAuth } from './useApiAuth';

const CART_STORAGE_KEY = 'lanchonete-cart-v2';

// Estado inicial do carrinho
const initialCartState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
  isLoading: false,
  error: null,
};

export const useCart = () => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);
  const { isAuthenticated, user, logout } = useApiAuth();
  const previousUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Carregar carrinho do localStorage na inicialização
  useEffect(() => {
    const loadCartFromStorage = () => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        
        if (savedCart && savedCart.trim() !== '') {
          // Verificar se o JSON é válido antes de fazer parse
          if (savedCart.startsWith('{') || savedCart.startsWith('[')) {
            const cartData = JSON.parse(savedCart);
          
            // Verificar se há itens para carregar
            if (cartData.items && cartData.items.length > 0) {
              // Converter strings de data de volta para objetos Date
              const itemsWithDates = cartData.items.map((item: any) => ({
                ...item,
                addedAt: new Date(item.addedAt),
              }));
              dispatch({ type: 'LOAD_CART', payload: itemsWithDates });
              isInitializedRef.current = true;
            } else {
              isInitializedRef.current = true;
            }
          } else {
            localStorage.removeItem(CART_STORAGE_KEY);
            isInitializedRef.current = true;
          }
        } else {
          isInitializedRef.current = true;
        }
      } catch (error) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    };

    // Aguardar um pouco para garantir que não há conflito com outros useEffects
    const timer = setTimeout(() => {
      loadCartFromStorage();
    }, 100);

    return () => clearTimeout(timer);
  }, []);


  // Detectar mudança de usuário e limpar carrinho
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // Só limpar se realmente mudou de um usuário para outro
    // Não limpar na inicialização (previousUserId === null)
    // Não limpar se ambos são null (usuário não logado)
    if (previousUserId !== null && previousUserId !== currentUserId && currentUserId !== null) {
      dispatch({ type: 'CLEAR_CART' });
      localStorage.removeItem(CART_STORAGE_KEY);
    }

    // Atualizar referência do usuário atual
    previousUserIdRef.current = currentUserId;
  }, [user?.id]);

  // Salvar carrinho no localStorage com debounce para evitar muitas escritas
  useEffect(() => {
    const saveToStorage = () => {
      try {
        // Só salvar se já foi inicializado e não for o estado inicial vazio
        if (isInitializedRef.current && (state.items.length > 0 || state.totalItems > 0 || state.totalPrice > 0)) {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
        }
      } catch (error) {
        console.error('❌ Erro ao salvar carrinho:', error);
      }
    };

    // Debounce para evitar muitas escritas no localStorage
    const timeoutId = setTimeout(saveToStorage, 300);
    
    return () => clearTimeout(timeoutId);
  }, [state]);

  // Adicionar item ao carrinho
  const addItem = useCallback((product: Product, quantity: number = 1) => {

    if (!product.isAvailable) {
      dispatch({ type: 'SET_ERROR', payload: 'Produto indisponível' });
      return;
    }

    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
  }, []);

  // Remover item do carrinho
  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId } });
  }, []);

  // Atualizar quantidade de um item
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  }, []);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Limpar carrinho ao fazer logout
  const clearCartOnLogout = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Forçar recarregamento do carrinho do localStorage
  const reloadCartFromStorage = useCallback(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        const itemsWithDates = cartData.items.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        dispatch({ type: 'LOAD_CART', payload: itemsWithDates });
      }
    } catch (error) {
      console.error('Erro ao recarregar carrinho:', error);
    }
  }, []);

  // Verificar se produto está no carrinho
  const isInCart = useCallback((productId: string): boolean => {
    return state.items.some(item => item.productId === productId);
  }, [state.items]);

  // Obter quantidade de um produto no carrinho
  const getItemQuantity = useCallback((productId: string): number => {
    const item = state.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  }, [state.items]);

  // Formatar preço total
  const formatTotalPrice = useCallback((price: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }, []);



  return {
    // Estado
    items: state.items,
    totalItems: state.totalItems,
    totalPrice: state.totalPrice,
    isLoading: state.isLoading,
    error: state.error,
    isEmpty: state.items.length === 0,
    
    // Ações
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    clearCartOnLogout,
    reloadCartFromStorage,
    isInCart,
    getItemQuantity,
    formatTotalPrice,
  };
};
