import { useRouter } from 'next/navigation';
import { useApiAuth } from './useApiAuth';
import { UserRole } from '@/types';

/**
 * Hook para gerenciar redirecionamentos baseados em roles
 */
export const useRoleRedirect = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useApiAuth();

  /**
   * Obter rota padrão baseada no role do usuário
   */
  const getRoleRoute = (role?: UserRole): string => {
    const userRole = role || user?.role;

    switch (userRole) {
      case UserRole.ADMINISTRADOR:
        return '/admin/dashboard';
      case UserRole.FUNCIONARIO:
        return '/staff/dashboard';
      case UserRole.CLIENTE:
        return '/customer/dashboard';
      default:
        return '/';
    }
  };

  /**
   * Redirecionar usuário baseado no seu role
   */
  const redirectByRole = (role?: UserRole, customRoute?: string) => {
    const route = customRoute || getRoleRoute(role);
    router.push(route);
  };

  /**
   * Redirecionar com delay
   */
  const redirectWithDelay = (route: string, delay: number = 2000) => {
    setTimeout(() => {
      router.push(route);
    }, delay);
  };

  /**
   * Verificar se deve redirecionar o usuário
   */
  const shouldRedirect = (currentPath: string): boolean => {
    if (isLoading || !isAuthenticated || !user) {
      return false;
    }

    const expectedRoute = getRoleRoute();

    // Se está na rota correta, não redirecionar
    if (currentPath === expectedRoute) {
      return false;
    }

    // Se está em uma rota específica do seu role, não redirecionar
    const roleRoutes = {
      [UserRole.ADMINISTRADOR]: '/admin',
      [UserRole.FUNCIONARIO]: '/staff',
      [UserRole.CLIENTE]: '/customer',
    };

    const userRoleRoute = roleRoutes[user.role];
    if (userRoleRoute && currentPath.startsWith(userRoleRoute)) {
      return false;
    }

    return true;
  };

  /**
   * Redirecionar para rota de login com redirect de volta
   */
  const redirectToLogin = (currentPath?: string) => {
    const redirectPath = currentPath || window.location.pathname;
    const loginUrl = `/login?redirect=${encodeURIComponent(redirectPath)}`;
    router.push(loginUrl);
  };

  /**
   * Redirecionar para rota de registro
   */
  const redirectToRegister = (currentPath?: string) => {
    const redirectPath = currentPath || window.location.pathname;
    const registerUrl = `/register?redirect=${encodeURIComponent(redirectPath)}`;
    router.push(registerUrl);
  };

  /**
   * Obter rota de logout (página inicial)
   */
  const getLogoutRoute = (): string => {
    return '/';
  };

  /**
   * Verificar se o usuário pode acessar uma rota específica
   */
  const canAccessRoute = (route: string): boolean => {
    if (!user) return false;

    // Rotas públicas
    const publicRoutes = ['/', '/login', '/register'];
    if (publicRoutes.includes(route)) return true;

    // Rotas por role
    if (route.startsWith('/admin')) {
      return user.role === UserRole.ADMINISTRADOR;
    }

    if (route.startsWith('/staff')) {
      return user.role === UserRole.FUNCIONARIO || user.role === UserRole.ADMINISTRADOR;
    }

    if (route.startsWith('/customer')) {
      return user.role === UserRole.CLIENTE || user.role === UserRole.FUNCIONARIO || user.role === UserRole.ADMINISTRADOR;
    }

    return true;
  };

  /**
   * Obter todas as rotas disponíveis para o usuário
   */
  const getAvailableRoutes = (): string[] => {
    if (!user) return ['/login', '/register'];

    const routes = ['/'];

    // Rotas base para cliente
    const customerRoutes = [
      '/customer/dashboard',
      '/customer/orders',
      '/customer/profile',
      '/customer/cart'
    ];

    // Rotas de funcionário (incluem cliente)
    const staffRoutes = [
      '/staff/dashboard',
      '/staff/orders',
      '/staff/tables',
      '/staff/menu',
      ...customerRoutes
    ];

    // Rotas de administrador (incluem funcionário e cliente)
    const adminRoutes = [
      '/admin/dashboard',
      '/admin/users',
      '/admin/products',
      '/admin/categories',
      '/admin/orders',
      '/admin/tables',
      '/admin/reports',
      '/admin/settings',
      ...staffRoutes
    ];

    switch (user.role) {
      case UserRole.ADMINISTRADOR:
        routes.push(...adminRoutes);
        break;
      case UserRole.FUNCIONARIO:
        routes.push(...staffRoutes);
        break;
      case UserRole.CLIENTE:
        routes.push(...customerRoutes);
        break;
    }

    return routes;
  };

  /**
   * Obter breadcrumbs para a rota atual
   */
  const getBreadcrumbs = (currentPath: string): Array<{ label: string; href: string }> => {
    const breadcrumbs = [{ label: 'Início', href: '/' }];

    if (!user) return breadcrumbs;

    // Mapear rotas para labels
    const routeLabels: Record<string, string> = {
      '/admin/dashboard': 'Dashboard',
      '/admin/users': 'Usuários',
      '/admin/products': 'Produtos',
      '/admin/categories': 'Categorias',
      '/admin/orders': 'Pedidos',
      '/admin/tables': 'Mesas',
      '/admin/reports': 'Relatórios',
      '/admin/settings': 'Configurações',
      '/staff/dashboard': 'Dashboard',
      '/staff/orders': 'Pedidos',
      '/staff/tables': 'Mesas',
      '/staff/menu': 'Cardápio',
      '/customer/dashboard': 'Dashboard',
      '/customer/orders': 'Meus Pedidos',
      '/customer/profile': 'Perfil',
      '/customer/cart': 'Carrinho',
    };

    // Adicionar breadcrumb baseado no role
    if (user.role === UserRole.ADMINISTRADOR && currentPath.startsWith('/admin')) {
      breadcrumbs.push({ label: 'Administração', href: '/admin/dashboard' });
    } else if (user.role === UserRole.FUNCIONARIO && currentPath.startsWith('/staff')) {
      breadcrumbs.push({ label: 'Funcionário', href: '/staff/dashboard' });
    } else if (user.role === UserRole.CLIENTE && currentPath.startsWith('/customer')) {
      breadcrumbs.push({ label: 'Área do Cliente', href: '/customer/dashboard' });
    }

    // Adicionar breadcrumb da página atual
    const currentLabel = routeLabels[currentPath];
    if (currentLabel && currentPath !== '/') {
      breadcrumbs.push({ label: currentLabel, href: currentPath });
    }

    return breadcrumbs;
  };

  /**
   * Verificar se deve mostrar navegação por role
   */
  const shouldShowRoleNavigation = (): boolean => {
    if (!user) return false;

    const roleNavigationRoutes = {
      [UserRole.ADMINISTRADOR]: ['/admin'],
      [UserRole.FUNCIONARIO]: ['/staff'],
      [UserRole.CLIENTE]: ['/customer'],
    };

    const currentPath = window.location.pathname;
    const userRoleRoutes = roleNavigationRoutes[user.role];

    return userRoleRoutes?.some(route => currentPath.startsWith(route)) || false;
  };

  return {
    // Funções principais
    redirectByRole,
    getRoleRoute,
    redirectWithDelay,
    shouldRedirect,
    
    // Funções de navegação
    redirectToLogin,
    redirectToRegister,
    getLogoutRoute,
    
    // Funções de verificação
    canAccessRoute,
    getAvailableRoutes,
    shouldShowRoleNavigation,
    
    // Funções utilitárias
    getBreadcrumbs,
    
    // Estado
    user,
    isAuthenticated,
    isLoading,
  };
};
