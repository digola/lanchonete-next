'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Componente de teste para verificar conexão com Supabase e dados disponíveis
 */
export function SupabaseTestComponent() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSupabaseConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🧪 Testando conexão com Supabase...');
      console.log('📍 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔑 Key existe:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      if (!supabase) {
        throw new Error('Supabase não está configurado');
      }

      // Testar categorias
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .limit(5);

      if (categoriesError) {
        console.error('❌ Erro ao buscar categorias:', categoriesError);
        throw categoriesError;
      }

      console.log('✅ Categorias encontradas:', categories?.length || 0);
      console.log('📋 Primeiras categorias:', categories?.slice(0, 3));

      // Testar produtos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name, color)
        `)
        .eq('isAvailable', true)
        .limit(5);

      if (productsError) {
        console.error('❌ Erro ao buscar produtos:', productsError);
        throw productsError;
      }

      console.log('✅ Produtos encontrados:', products?.length || 0);
      console.log('🍔 Primeiros produtos:', products?.slice(0, 3));

      // Testar contagem total
      const { count: totalCategories } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });

      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const result = {
        categories: {
          found: categories?.length || 0,
          total: totalCategories,
          sample: categories?.slice(0, 2)
        },
        products: {
          found: products?.length || 0,
          total: totalProducts,
          available: products?.filter(p => p.isAvailable).length || 0,
          sample: products?.slice(0, 2)
        },
        connection: '✅ Conectado com sucesso!'
      };

      setTestResult(result);
      console.log('🎉 Teste concluído com sucesso!', result);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('💥 Erro no teste:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🧪 Teste de Conexão Supabase</h3>
        <button
          onClick={testSupabaseConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-red-800 font-medium mb-2">❌ Erro:</h4>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {testResult && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h4 className="text-green-800 font-medium mb-2">{testResult.connection}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">📋 Categorias</h5>
                <p className="text-sm text-gray-600">
                  Encontradas: <span className="font-medium">{testResult.categories.found}</span> / {testResult.categories.total}
                </p>
                {testResult.categories.sample?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Amostras:</p>
                    {testResult.categories.sample.map((cat: any, i: number) => (
                      <div key={i} className="text-xs text-gray-600">
                        • {cat.name} ({cat.isActive ? 'ativa' : 'inativa'})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">🍔 Produtos</h5>
                <p className="text-sm text-gray-600">
                  Disponíveis: <span className="font-medium">{testResult.products.available}</span> / {testResult.products.total}
                </p>
                {testResult.products.sample?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Amostras:</p>
                    {testResult.products.sample.map((prod: any, i: number) => (
                      <div key={i} className="text-xs text-gray-600">
                        • {prod.name} - R$ {prod.price}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!testResult && !error && (
        <div className="text-sm text-gray-600">
          <p>Clique em "Testar Conexão" para verificar se os dados do Supabase estão sendo carregados corretamente.</p>
        </div>
      )}
    </div>
  );
}