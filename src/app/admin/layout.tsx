'use client';

import { ReactNode } from 'react';
import { useApiAuth } from '@/hooks/useApiAuth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading } = useApiAuth();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Verificar se o usuário é algum tipo de administrador (flexível)
  const isAdmin = user && (
    user.role === 'ADMIN' || 
    user.role === 'ADMINISTRADOR' || 
    user.role === 'administrador' ||
    user.role === 'Administrador' ||
    user.role?.toLowerCase() === 'administrador' ||
    user.role?.toLowerCase().includes('admin')
   
  );
   console.log(user);
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Usuário não encontrado</h1>
          <p className="text-gray-600 mb-6">Você precisa fazer login.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">Você precisa ser Administrador.</p>
          
        //  {/* Debug Info */}
          <div className="bg-gray-100 p-4 rounded mb-4 text-left max-w-md mx-auto">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>Role atual: <strong>"{user.role}"</strong></p>
            <p>ID: {user.id}</p>
            <p>Email: {user.email}</p>
            <p>Nome: {user.name}</p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
