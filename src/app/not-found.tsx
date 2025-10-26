'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="text-6xl font-bold text-primary-500 mb-2">404</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Página não encontrada
            </h1>
            <p className="text-gray-600">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>

          <div className="space-y-3">
            <Link href="/">
              <Button variant="primary" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Página Anterior
            </Button>

            <Link href="/">
              <Button variant="ghost" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Explorar Cardápio
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Se você acredita que isso é um erro, entre em contato conosco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
