'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermission?: string;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Componente para proteger rotas baseado em autenticação e permissões
 */
export const ProtectedRoute = ({
  children,
  requiredRole,
  requiredRoles,
  requiredPermission,
  fallback,
  redirectTo,
}: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    hasMinimumRole,
    hasPermission,
    getDefaultRoute,
  } = useApiAuth();
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se ainda está carregando, aguardar
    if (isLoading) return;

    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated || !user) {
      const loginPath = redirectTo || '/login';
      router.push(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Verificar role mínimo se especificado
    if (requiredRole && !hasMinimumRole(requiredRole)) {
      const defaultRoute = getDefaultRoute();
      router.push(defaultRoute);
      return;
    }

    // Verificar múltiplos roles se especificado
    if (requiredRoles && requiredRoles.length > 0) {
      const hasAnyRequiredRole = requiredRoles.some(role => hasMinimumRole(role));
      if (!hasAnyRequiredRole) {
        const defaultRoute = getDefaultRoute();
        router.push(defaultRoute);
        return;
      }
    }

    // Verificar permissão específica se especificada
    if (requiredPermission && !hasPermission(requiredPermission)) {
      const defaultRoute = getDefaultRoute();
      router.push(defaultRoute);
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requiredRole,
    requiredRoles,
    requiredPermission,
    hasMinimumRole,
    hasPermission,
    getDefaultRoute,
    router,
    pathname,
    redirectTo,
  ]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Se não está autenticado, não mostrar nada (será redirecionado)
  if (!isAuthenticated || !user) {
    return fallback || <LoadingSpinner />;
  }

  // Verificar role mínimo
  if (requiredRole && !hasMinimumRole(requiredRole)) {
    return fallback || <AccessDenied />;
  }

  // Verificar múltiplos roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAnyRequiredRole = requiredRoles.some(role => hasMinimumRole(role));
    if (!hasAnyRequiredRole) {
      return fallback || <AccessDenied />;
    }
  }

  // Verificar permissão específica
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <AccessDenied />;
  }

  // Se passou em todas as verificações, mostrar o conteúdo
  return <>{children}</>;
};

/**
 * Componente para rotas que requerem role de administrador
 */
export const AdminRoute = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ProtectedRoute requiredRole={UserRole.ADMIN} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

/**
 * Componente para rotas que requerem role de funcionário ou superior
 */
export const StaffRoute = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ProtectedRoute requiredRole={UserRole.STAFF} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

/**
 * Componente para rotas que requerem role de cliente ou superior
 */
export const CustomerRoute = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ProtectedRoute requiredRole={UserRole.CUSTOMER} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

/**
 * Componente para rotas que requerem permissão específica
 */
export const PermissionRoute = ({ 
  children, 
  permission, 
  fallback 
}: { 
  children: ReactNode; 
  permission: string; 
  fallback?: ReactNode;
}) => (
  <ProtectedRoute requiredPermission={permission} fallback={fallback}>
    {children}
  </ProtectedRoute>
);

/**
 * Componente para rotas que requerem múltiplas permissões
 */
export const MultiPermissionRoute = ({ 
  children, 
  permissions, 
  requireAll = true,
  fallback 
}: { 
  children: ReactNode; 
  permissions: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}) => {
  const { hasPermission, isAuthenticated, isLoading } = useApiAuth();
  
  if (isLoading || !isAuthenticated) {
    return fallback || <LoadingSpinner />;
  }

  const hasRequiredPermissions = requireAll 
    ? permissions.every(permission => hasPermission(permission))
    : permissions.some(permission => hasPermission(permission));

  if (!hasRequiredPermissions) {
    return fallback || <AccessDenied />;
  }

  return <>{children}</>;
};

/**
 * Componente para redirecionar usuários autenticados
 * Útil para páginas como login/registro que não devem ser acessadas por usuários logados
 */
export const GuestRoute = ({ 
  children, 
  redirectTo 
}: { 
  children: ReactNode; 
  redirectTo?: string;
}) => {
  const { isAuthenticated, isLoading, getDefaultRoute } = useApiAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const defaultRoute = redirectTo || getDefaultRoute();
      router.push(defaultRoute);
    }
  }, [isAuthenticated, isLoading, router, pathname, redirectTo, getDefaultRoute]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

/**
 * Componente de loading spinner
 */
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p className="text-gray-600">Verificando permissões...</p>
    </div>
  </div>
);

/**
 * Componente de acesso negado
 */
const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="mb-6">
        <div className="mx-auto h-16 w-16 text-red-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
      <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
      <button 
        onClick={() => window.history.back()}
        className="btn btn-primary"
      >
        Voltar
      </button>
    </div>
  </div>
);

export default ProtectedRoute;
