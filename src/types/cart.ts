import { Product } from './index';

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number; // Preço no momento da adição
  notes?: string;
  customizations?: Record<string, any>;
  addedAt: Date;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  error: string | null;
  // Associação opcional de mesa ao carrinho
  tableId?: string | null;
  tableNumber?: number | null;
}

export type CartAction = 
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number; notes?: string; customizations?: Record<string, any> } }
  | { type: 'REMOVE_ITEM'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_CART'; payload: CartItem[] }
  | { type: 'SET_TABLE'; payload: { tableId?: string | null; tableNumber?: number | null } };

// Função reducer para gerenciar estado do carrinho
export const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, notes, customizations } = action.payload;
      const normalizedNotes = (notes || '').trim();
      const normCustom = customizations ? JSON.stringify(customizations) : JSON.stringify({});
      // Itens com mesmas observações e mesmas customizações podem ser mesclados; com diferenças criam linhas separadas
      const existingItem = state.items.find(item => 
        item.productId === product.id && ((item.notes || '').trim() === normalizedNotes) && (JSON.stringify(item.customizations || {}) === normCustom)
      );
      
      if (existingItem) {
        // Atualizar quantidade do item existente (garantindo combinar apenas com mesmas observações)
        const updatedItems = state.items.map(item =>
          item.productId === product.id && ((item.notes || '').trim() === normalizedNotes) && (JSON.stringify(item.customizations || {}) === normCustom)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );

        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };
      } else {
        // Adicionar novo item corretamente como CartItem (não apenas ID)
        const cartItemId = `cart_${product.id}_${Date.now()}`;
        const baseItem = {
          id: cartItemId,
          productId: product.id,
          product,
          quantity,
          price: product.price,
          addedAt: new Date(),
        };
        const newItem: CartItem = normalizedNotes
          ? { ...baseItem, notes: normalizedNotes, ...(customizations ? { customizations } : {}) }
          : { ...baseItem, ...(customizations ? { customizations } : {}) };

        const updatedItems = [...state.items, newItem];
        return {
          ...state,
          items: updatedItems,
          totalItems: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        };
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
    
    case 'SET_TABLE': {
      const { tableId = null, tableNumber = null } = action.payload;
      return {
        ...state,
        tableId,
        tableNumber,
      };
    }
    
    default:
      return state;
  }
};
