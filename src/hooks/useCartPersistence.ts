import { useState, useEffect, useCallback } from 'react';
import { Product, CartItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

interface CartActions {
  addToCart: (product: Product, quantity?: number, customizations?: Record<string, any>, notes?: string) => void;
  removeFromCart: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  clearCart: () => void;
  setItemCustomizations: (productId: string, customizations: Record<string, any>) => void;
  setItemNotes: (productId: string, notes: string) => void;
  formatTotalPrice: (price: number) => string;
}

type UseCartPersistenceReturn = CartState & CartActions;

const CART_STORAGE_KEY = 'lanchonete-cart';

/**
 * Hook para gerenciar carrinho persistente no localStorage
 */
export const useCartPersistence = (): UseCartPersistenceReturn => {
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });

  // Carregar carrinho do localStorage na inicialização
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCartState(parsedCart);
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho do localStorage:', error);
        // Limpar carrinho corrompido
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    };

    loadCart();
  }, []);

  // Salvar carrinho no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartState));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [cartState]);

  // Calcular totais
  const calculateTotals = useCallback((items: CartItem[]): { totalItems: number; totalPrice: number } => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    return { totalItems, totalPrice };
  }, []);

  // Adicionar produto ao carrinho
  const addToCart = useCallback((
    product: Product,
    quantity: number = 1,
    customizations?: Record<string, any>,
    notes?: string
  ) => {
    setCartState(prevState => {
      const existingItemIndex = prevState.items.findIndex(item => item.product.id === product.id);

      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Produto já existe no carrinho, atualizar quantidade
        newItems = [...prevState.items];
        const existingItem = newItems[existingItemIndex];
        if (existingItem) {
          newItems[existingItemIndex] = {
            product: existingItem.product,
            quantity: existingItem.quantity + quantity,
            ...(customizations && { customizations }),
            ...(notes && { notes }),
          };
        }
      } else {
        // Novo produto no carrinho
        const newItem: CartItem = {
          product,
          quantity,
          ...(customizations && { customizations }),
          ...(notes && { notes }),
        };
        newItems = [...prevState.items, newItem];
      }

      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    });
  }, [calculateTotals]);

  // Remover produto do carrinho
  const removeFromCart = useCallback((productId: string) => {
    setCartState(prevState => {
      const newItems = prevState.items.filter(item => item.product.id !== productId);
      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    });
  }, [calculateTotals]);

  // Atualizar quantidade de um item
  const updateItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartState(prevState => {
      const newItems = prevState.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );
      const { totalItems, totalPrice } = calculateTotals(newItems);

      return {
        items: newItems,
        totalItems,
        totalPrice,
      };
    });
  }, [calculateTotals, removeFromCart]);

  // Obter quantidade de um produto no carrinho
  const getItemQuantity = useCallback((productId: string): number => {
    const item = cartState.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  }, [cartState.items]);

  // Verificar se produto está no carrinho
  const isInCart = useCallback((productId: string): boolean => {
    return cartState.items.some(item => item.product.id === productId);
  }, [cartState.items]);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setCartState({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  }, []);

  // Definir customizações de um item
  const setItemCustomizations = useCallback((productId: string, customizations: Record<string, any>) => {
    setCartState(prevState => {
      const newItems = prevState.items.map(item =>
        item.product.id === productId
          ? { ...item, customizations }
          : item
      );

      return {
        ...prevState,
        items: newItems,
      };
    });
  }, []);

  // Definir observações de um item
  const setItemNotes = useCallback((productId: string, notes: string) => {
    setCartState(prevState => {
      const newItems = prevState.items.map(item =>
        item.product.id === productId
          ? { ...item, notes }
          : item
      );

      return {
        ...prevState,
        items: newItems,
      };
    });
  }, []);

  return {
    // Estado
    ...cartState,
    
    // Ações
    addToCart,
    removeFromCart,
    updateItemQuantity,
    getItemQuantity,
    isInCart,
    clearCart,
    setItemCustomizations,
    setItemNotes,
    
    // Utilitários
    formatTotalPrice: (price: number) => formatCurrency(price),
  };
};

// Hook para obter apenas informações do carrinho (sem ações)
export const useCartInfo = () => {
  const { items, totalItems, totalPrice } = useCartPersistence();
  return { items, totalItems, totalPrice };
};

// Hook para obter apenas ações do carrinho
export const useCartActions = () => {
  const { addToCart, removeFromCart, updateItemQuantity, clearCart, setItemCustomizations, setItemNotes } = useCartPersistence();
  return { addToCart, removeFromCart, updateItemQuantity, clearCart, setItemCustomizations, setItemNotes };
};

// Utilitários para o carrinho
export const cartUtils = {
  // Formatar preço total
  formatTotalPrice: (totalPrice: number): string => formatCurrency(totalPrice),
  
  // Obter resumo do carrinho
  getCartSummary: (items: CartItem[]) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    return {
      totalItems,
      totalPrice,
      formattedTotal: formatCurrency(totalPrice),
      itemsCount: items.length,
    };
  },

  // Validar carrinho
  validateCart: (items: CartItem[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push('Carrinho está vazio');
    }

    // Verificar se todos os produtos ainda estão disponíveis
    items.forEach(item => {
      if (!item.product.isAvailable) {
        errors.push(`${item.product.name} não está mais disponível`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Limpar carrinho corrompido
  clearCorruptedCart: () => {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar carrinho corrompido:', error);
    }
  },

  // Exportar carrinho (para backup)
  exportCart: (items: CartItem[]): string => {
    return JSON.stringify({
      items,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  },

  // Importar carrinho (para restore)
  importCart: (cartData: string): CartItem[] | null => {
    try {
      const parsed = JSON.parse(cartData);
      return parsed.items || null;
    } catch (error) {
      console.error('Erro ao importar carrinho:', error);
      return null;
    }
  },
};
