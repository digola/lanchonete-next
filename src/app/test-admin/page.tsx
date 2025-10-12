'use client';

import RealDataManager from '@/components/RealDataManager';

export default function TestAdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Página de Teste - Admin</h1>
      <p className="text-gray-600 mb-6">
        Use esta página para testar o Gerenciador de Dados Reais sem necessidade de autenticação.
      </p>
      <RealDataManager />
    </div>
  );
}