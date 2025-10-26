'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { UserRole } from '@/types';
import { StaffSidebar } from '@/components/staff/StaffSidebar';
import { StaffHeader } from '@/components/staff/StaffHeader';

interface StaffLayoutClientProps {
  children: ReactNode;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-gray-600">Verificando permissões...</p>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
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
}

export function StaffLayoutClient({ children }: StaffLayoutClientProps) {
  const { isAuthenticated, isLoading, user, hasMinimumRole } = useApiAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/staff');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <LoadingSpinner />;
  }

  if (!hasMinimumRole(UserRole.STAFF)) {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader />
      <div className="flex">
        <StaffSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
