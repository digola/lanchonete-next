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
        console.log('🔄 Carregando carrinho do localStorage:', savedCart);
        
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          console.log('📦 Dados parseados do localStorage:', cartData);
          
          // Verificar se há itens para carregar
          if (cartData.items && cartData.items.length > 0) {
            console.log('✅ Itens encontrados, carregando...');
            // Converter strings de data de volta para objetos Date
            const itemsWithDates = cartData.items.map((item: any) => ({
              ...item,
              addedAt: new Date(item.addedAt),
            }));
            console.log('🔄 Enviando LOAD_CART com itens:', itemsWithDates);
            dispatch({ type: 'LOAD_CART', payload: itemsWithDates });
            isInitializedRef.current = true;
          } else {
            console.log('❌ Nenhum item encontrado no localStorage');
            isInitializedRef.current = true;
          }
        } else {
          console.log('❌ Nenhum carrinho salvo no localStorage');
          isInitializedRef.current = true;
        }
      } catch (error) {
        console.error('❌ Erro ao carregar carrinho:', error);
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

    console.log('👤 Verificando mudança de usuário:', {
      currentUserId,
      previousUserId,
      willClear: previousUserId !== null && previousUserId !== currentUserId && currentUserId !== null
    });

    // TEMPORARIAMENTE DESABILITADO PARA DEBUG
    // Só limpar se realmente mudou de um usuário para outro
    // Não limpar na inicialização (previousUserId === null)
    // Não limpar se ambos são null (usuário não logado)
    if (false && previousUserId !== null && previousUserId !== currentUserId && currentUserId !== null) {
      console.log('🧹 Limpando carrinho devido à mudança de usuário');
      dispatch({ type: 'CLEAR_CART' });
      localStorage.removeItem(CART_STORAGE_KEY);
    }

    // Atualizar referência do usuário atual
    previousUserIdRef.current = currentUserId;
  }, [user?.id]);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    try {
      console.log('💾 Salvando carrinho no localStorage:', {
        items: state.items.length,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
        state: state
      });
      
      // Só salvar se já foi inicializado e não for o estado inicial vazio
      if (isInitializedRef.current && (state.items.length > 0 || state.totalItems > 0 || state.totalPrice > 0)) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
        console.log('✅ Carrinho salvo com sucesso no localStorage');
      } else if (!isInitializedRef.current) {
        console.log('⏭️ Pulando salvamento - ainda não inicializado');
      } else {
        console.log('⏭️ Pulando salvamento - estado vazio');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar carrinho:', error);
    }
  }, [state]);

  // Adicionar item ao carrinho
  const addItem = useCallback((product: Product, quantity: number = 1) => {
    console.log('🛒 useCart.addItem chamado:', {
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      isAvailable: product.isAvailable
    });

    if (!product.isAvailable) {
      console.log('❌ Produto indisponível, não adicionando');
      dispatch({ type: 'SET_ERROR', payload: 'Produto indisponível' });
      return;
    }

    console.log('✅ Enviando ADD_ITEM para o reducer');
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
    console.log('Logout detectado, limpando carrinho...');
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Forçar recarregamento do carrinho do localStorage
  const reloadCartFromStorage = useCallback(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      console.log('useCart - Forçando recarregamento:', savedCart);
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
