import { Product } from './index';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number; // Preço no momento da adição
  addedAt: Date;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
}

export type CartAction = 
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_CART'; payload: CartItem[] };

// Função reducer para gerenciar estado do carrinho
export const cartReducer = (state: CartState, action: CartAction): CartState => {
  console.log('🔄 cartReducer - Ação recebida:', action.type, action.payload);
  
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      console.log('➕ ADD_ITEM - Processando:', {
        productId: product.id,
        productName: product.name,
        quantity,
        currentItems: state.items.length
      });
      
      const existingItem = state.items.find(item => item.productId === product.id);
      
      if (existingItem) {
        console.log('🔄 Item já existe, atualizando quantidade');
        // Atualizar quantidade do item existente
        const updatedItems = state.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );

        const newState = {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };
        
        console.log('✅ Estado atualizado (item existente):', {
          totalItems: newState.totalItems,
          totalPrice: newState.totalPrice,
          itemsCount: newState.items.length
        });
        
        return newState;
      } else {
        console.log('➕ Item novo, adicionando ao carrinho');
        // Adicionar novo item
        const newItem: CartItem = {
          id: `cart_${product.id}_${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          price: product.price,
          addedAt: new Date(),
        };

        const updatedItems = [...state.items, newItem];
        const newState = {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };
        
        console.log('✅ Estado atualizado (item novo):', {
          totalItems: newState.totalItems,
          totalPrice: newState.totalPrice,
          itemsCount: newState.items.length
        });
        
        return newState;
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.productId !== action.payload.productId);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item se quantidade for 0 ou negativa
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId } });
      }
      
      const updatedItems = state.items.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      );
      
      return {
        ...state,
        items: updatedItems,
        totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0,
        totalPrice: 0,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'LOAD_CART': {
      const items = action.payload;
      return {
        ...state,
        items,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        isLoading: false,
        error: null,
      };
    }
    
    default:
      return state;
  }
};
