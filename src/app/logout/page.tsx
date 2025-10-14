'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/Card';
import { RefreshCw } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuthStore();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Fazer logout no store
        logout();
        
        // Aguardar um momento para garantir que o logout foi processado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Redirecionar para a página inicial
        router.push('/');
      } catch (error) {
        console.error('Erro durante logout:', error);
        // Mesmo com erro, redirecionar para a página inicial
        router.push('/');
      }
    };

    performLogout();
  }, [logout, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Fazendo logout...
            </h1>
            <p className="text-sm text-gray-600">
              Você será redirecionado em alguns segundos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
