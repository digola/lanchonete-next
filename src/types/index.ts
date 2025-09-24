// Tipos base do sistema conforme documentação

// Enums conforme Prisma schema
export enum UserRole {
  CLIENTE = 'CLIENTE',
  FUNCIONARIO = 'FUNCIONARIO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}

export enum OrderStatus {
  PENDENTE = 'PENDENTE',
  CONFIRMADO = 'CONFIRMADO',
  PREPARANDO = 'PREPARANDO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

export enum TableStatus {
  LIVRE = 'LIVRE',
  OCUPADA = 'OCUPADA',
  RESERVADA = 'RESERVADA',
  MANUTENCAO = 'MANUTENCAO',
}

export enum DeliveryType {
  RETIRADA = 'RETIRADA',
  DELIVERY = 'DELIVERY',
}

export enum PaymentMethod {
  DINHEIRO = 'DINHEIRO',
  CARTAO = 'CARTAO',
  PIX = 'PIX',
}

// Tipos de entidades
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  category?: Category;
  isAvailable: boolean;
  preparationTime: number;
  allergens?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  options: string; // JSON
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  total: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  tableId?: string;
  table?: Table;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  customizations?: string; // JSON
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  assignedTo?: string;
  assignedUser?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string; // JSON
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string; // JSON
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Tipos para formulários
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Tipos para APIs
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: any;
}

// Tipos para autenticação
export interface AuthUser extends User {
  token?: string;
  refreshToken?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Tipos para carrinho
export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: Record<string, any>;
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Tipos para permissões
export type Permission = 
  | 'menu:read'
  | 'menu:write'
  | 'menu:delete'
  | 'orders:read'
  | 'orders:write'
  | 'orders:delete'
  | 'orders:create'
  | 'orders:update'
  | 'products:read'
  | 'products:write'
  | 'products:delete'
  | 'categories:read'
  | 'categories:write'
  | 'categories:delete'
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'reports:read'
  | 'settings:read'
  | 'settings:write'
  | 'profile:read'
  | 'profile:write'
  | 'cart:read'
  | 'cart:write'
  | 'cart:delete';

export interface RolePermissions {
  [UserRole.CLIENTE]: Permission[];
  [UserRole.FUNCIONARIO]: Permission[];
  [UserRole.ADMINISTRADOR]: Permission[];
}

// Tipos para upload
export interface UploadFile {
  file: File;
  preview?: string;
  progress?: number;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Tipos para relatórios
export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    product: Product;
    quantity: number;
    revenue: number;
  }>;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  occupiedTables: number;
  recentOrders: Order[];
}

// Tipos para notificações
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Tipos para configurações
export interface AppConfig {
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  deliveryFee: number;
  minOrderValue: number;
  deliveryTime: number;
  isOpen: boolean;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
}

// Tipos para validação
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Tipos para navegação
export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string | number;
  children?: NavItem[];
  permission?: Permission;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Tipos para filtros
export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterState {
  [key: string]: string | string[] | boolean | number;
}

// Tipos para tabelas
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableState {
  data: any[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters: FilterState;
}

// Tipos para modais
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClose?: () => void;
}

// Tipos para toasts
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tipos para contexto
export interface AppContextType {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
  timezone: string;
  currency: string;
}

// Tipos para hooks
export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseApiReturn<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

// Tipos para utilitários
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Tipos para eventos
export interface OrderEvent {
  type: 'order_created' | 'order_updated' | 'order_cancelled';
  order: Order;
  timestamp: Date;
}

export interface TableEvent {
  type: 'table_occupied' | 'table_freed' | 'table_reserved';
  table: Table;
  timestamp: Date;
}

// Exportar todos os tipos
// export type * from './api';
// export type * from './auth';
// export type * from './cart';
// export type * from './components';
