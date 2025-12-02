'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApiAuth } from '@/hooks/useApiAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Package,
  Link as LinkIcon,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAdicionaisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useApiAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="mb-3">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Adicionais</h1>
          <p className="text-gray-600 mt-1">Configure toppings e complementos dos produtos</p>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 pt-4 border-t border-gray-200">
          <div className="flex space-x-1">
            <Link href="/admin/adicionais">
              <Button
                variant="ghost"
                className="rounded-b-none border-b-2 border-transparent hover:border-blue-600 px-4 py-2"
              >
                <Package className="h-4 w-4 mr-2" />
                Adicionais
              </Button>
            </Link>
            <Link href="/admin/adicionais/produtos">
              <Button
                variant="ghost"
                className="rounded-b-none border-b-2 border-transparent hover:border-blue-600 px-4 py-2"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Associar a Produtos
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50">
        {children}
      </div>
    </div>
  );
}
